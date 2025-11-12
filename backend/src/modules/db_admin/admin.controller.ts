// =============================================================
// FILE: src/routes/admin/admin.controller.ts
// =============================================================
import type { RouteHandler } from "fastify";
import { env } from "@/core/env";
import {
  createPool,
  type Pool,
  type PoolConnection,
  type RowDataPacket,
} from "mysql2/promise";
import { z } from "zod";
import { createReadStream } from "node:fs";
import { extname } from "node:path";
import { createGunzip } from "node:zlib";
import { Buffer } from "node:buffer";
import { runMysqlDumpAll, tmpFilePath, rmSafe } from "./helpers";
// Node 18+ 'fetch' global; Node <18 veya Bun için fallback:
import _fetch from "node-fetch";
const fetchAny: typeof fetch = (globalThis as any).fetch || (_fetch as any);

/* ---------- DB config ---------- */
function DB() {
  return {
    host: env.DB.host,
    port: env.DB.port,
    user: env.DB.user,
    password: env.DB.password,
    database: env.DB.name,
  };
}

/* ---------- mysql2 pool (multipleStatements) ---------- */
let _pool: Pool | null = null;
function pool(): Pool {
  if (_pool) return _pool;
  const cfg = DB();
  _pool = createPool({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    charset: "utf8mb4",
    multipleStatements: true,
  });
  return _pool!;
}

/* ---------- yardımcılar ---------- */
interface TableRow extends RowDataPacket {
  name: string;
}

async function listTables(
  conn: PoolConnection,
  dbName: string
): Promise<string[]> {
  const [rows] = await conn.query<TableRow[]>(
    `SELECT TABLE_NAME AS name
       FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = ?`,
    [dbName]
  );
  return rows.map((r) => r.name);
}

function backtickIdent(name: string) {
  return "`" + String(name).replace(/`/g, "``") + "`";
}

function isGzipContent(
  ct: string | null | undefined,
  ce: string | null | undefined,
  url?: string
) {
  const ctype = (ct || "").toLowerCase();
  const cenc = (ce || "").toLowerCase();
  return (
    cenc.includes("gzip") ||
    ctype.includes("application/gzip") ||
    (url || "").toLowerCase().endsWith(".gz")
  );
}

async function gunzipBuffer(buf: Uint8Array): Promise<Buffer> {
  return new Promise((res, rej) => {
    const chunks: Buffer[] = [];
    const gun = createGunzip();
    gun.on("data", (c: Buffer) => chunks.push(c));
    gun.on("end", () => res(Buffer.concat(chunks)));
    gun.on("error", rej);
    // Uint8Array'i Node Buffer'a çevirip pipe et
    gun.end(Buffer.from(buf));
  });
}

/* ---------- ortak import yürütücüsü ---------- */
const ImportSqlSchema = z.object({
  sql: z.string().min(1),
  dryRun: z.boolean().optional().default(false),
  truncateBefore: z.boolean().optional().default(false),
});

async function runSqlImport({
  sql,
  dryRun,
  truncateBefore,
}: z.infer<typeof ImportSqlSchema>) {
  const cfg = DB();
  const p = pool();
  const conn = await p.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("SET FOREIGN_KEY_CHECKS=0; SET SQL_SAFE_UPDATES=0;");

    if (truncateBefore) {
      const tables = await listTables(conn, cfg.database);
      for (const t of tables) {
        await conn.query(`TRUNCATE TABLE ${backtickIdent(t)};`);
      }
    }

    await conn.query(sql); // multipleStatements: true

    if (dryRun) {
      await conn.rollback();
      return { ok: true as const, dryRun: true as const };
    }

    await conn.commit();
    return { ok: true as const };
  } catch (err: any) {
    try {
      await conn.rollback();
    } catch {}
    return {
      ok: false as const,
      error: err?.message || "SQL import failed",
    };
  } finally {
    try {
      await conn.query("SET FOREIGN_KEY_CHECKS=1;");
    } catch {}
    conn.release();
  }
}

/* =======================================================================
 * EXPORT: GET /admin/db/export
 * ======================================================================= */
export const adminExportSql: RouteHandler = async (req, reply) => {
  const cfg = DB();
  const stamp = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const filename = `dump_${stamp.getFullYear()}${pad(
    stamp.getMonth() + 1
  )}${pad(stamp.getDate())}_${pad(stamp.getHours())}${pad(
    stamp.getMinutes()
  )}.sql`;

  try {
    const tmpOut = tmpFilePath(".sql");
    await runMysqlDumpAll(cfg, tmpOut);

    reply
      .header("Content-Type", "application/sql")
      .header("Content-Disposition", `attachment; filename="${filename}"`)
      .header("X-Export-Scope", "all");

    const stream = createReadStream(tmpOut);
    stream.on("close", () => rmSafe(tmpOut));
    stream.on("error", () => rmSafe(tmpOut));

    return reply.send(stream);
  } catch (err) {
    req.log.error(err);
    return reply.code(500).send({ error: { message: "export_failed" } });
  }
};

/* =======================================================================
 * IMPORT (JSON): POST /admin/db/import-sql
 * ======================================================================= */
export const adminImportSqlText: RouteHandler = async (req, reply) => {
  const body = ImportSqlSchema.parse(req.body || {});
  const res = await runSqlImport(body);
  if (!res.ok) return reply.code(400).send(res);
  return reply.send(res);
};

/* =======================================================================
 * IMPORT (URL): POST /admin/db/import-url
 *  - gzip destekli
 * ======================================================================= */
const UrlBody = z.object({
  url: z.string().url(),
  dryRun: z.boolean().optional().default(false),
  truncateBefore: z.boolean().optional().default(false),
});

export const adminImportSqlFromUrl: RouteHandler = async (req, reply) => {
  const { url, dryRun, truncateBefore } = UrlBody.parse(req.body || {});
  const r = await fetchAny(url);
  if (!r.ok) return reply.code(400).send({ ok: false, error: "URL fetch failed" });

  const ct = r.headers.get("content-type");
  const ce = r.headers.get("content-encoding");

  const arr = await r.arrayBuffer();
  let u8 = new Uint8Array(arr);

  if (isGzipContent(ct, ce, url)) {
    try {
      u8 = new Uint8Array(await gunzipBuffer(u8));
    } catch {
      return reply.code(400).send({ ok: false, error: "Gzip decompress failed" });
    }
  }

  const sql = Buffer.from(u8).toString("utf8");
  const res = await runSqlImport({ sql, dryRun, truncateBefore });
  if (!res.ok) return reply.code(400).send(res);
  return reply.send(res);
};

/* =======================================================================
 * IMPORT (FILE): POST /admin/db/import-file
 *  - multipart: file(.sql|.gz) + fields: truncate_before_import? / truncateBefore?
 *  - gzip destekli
 * ======================================================================= */
export const adminImportSqlFromFile: RouteHandler = async (req, reply) => {
  const mp: any = await (req as any).file?.();
  if (!mp) return reply.code(400).send({ ok: false, error: "No file" });

  const ext = extname(mp.filename || "").toLowerCase();
  const isGz = ext === ".gz";

  const buf: Buffer = await mp.toBuffer();
  let u8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);

  if (isGz) {
    try {
      u8 = new Uint8Array(await gunzipBuffer(u8));
    } catch {
      return reply.code(400).send({ ok: false, error: "Gzip decompress failed" });
    }
  }

  const sql = Buffer.from(u8).toString("utf8");

  const fields: Record<string, any> = (mp as any).fields || {};
  const truncateBefore =
    typeof fields.truncateBefore !== "undefined"
      ? String(fields.truncateBefore).toLowerCase() === "true"
      : String(fields.truncate_before_import ?? "").toLowerCase() === "true";

  const res = await runSqlImport({ sql, dryRun: false, truncateBefore });
  if (!res.ok) return reply.code(400).send(res);
  return reply.send(res);
};
