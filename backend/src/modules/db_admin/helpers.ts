import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { existsSync, unlinkSync, createWriteStream, writeFileSync } from "node:fs";
import { createReadStream } from "node:fs";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import { createGunzip } from "node:zlib";
import { spawn } from "node:child_process";
import { db } from "@/db/client";
import { sql } from "drizzle-orm";

const pump = promisify(pipeline);

export function tmpFilePath(suffix = "") {
  const id = randomBytes(8).toString("hex");
  return join(tmpdir(), `dbdump_${id}${suffix}`);
}

export function rmSafe(p?: string) {
  if (!p) return;
  try { if (existsSync(p)) unlinkSync(p); } catch {}
}

/* ---- Decompress ---- */
export async function gunzipIfNeeded(path: string): Promise<string> {
  if (!/\.gz$/i.test(path)) return path;
  const out = path.replace(/\.gz$/i, "") || path + ".sql";
  await pump(createReadStream(path), createGunzip(), createWriteStream(out));
  return out;
}

/* ---- Introspection ---- */
export async function listTables(database: string): Promise<string[]> {
  const rows = await db.execute<any>(sql`
    SELECT TABLE_NAME as name
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = ${database}
  `);
  return rows.map((r: any) => r.name as string);
}

/* ---- mysqldump & mysql ---- */
type Cfg = { host: string; port: number; user: string; password: string; database: string };

function baseArgs(cfg: Cfg) {
  const args = ["-h", cfg.host, "-P", String(cfg.port), "-u", cfg.user];
  if (cfg.password) args.push(`-p${cfg.password}`);
  return args;
}

type DumpAttempt = {
  bin: string;
  args: string[];
};

/** Sisteminde mevcut dump bin'ini ve en iyi argüman kombinasyonunu dene. */
async function tryDump(bin: string, args: string[], outPath: string): Promise<{ ok: true } | { ok: false; code?: number; stderr: string }> {
  return new Promise((res) => {
    const p = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    const ws = createWriteStream(outPath);
    let stderr = "";
    p.stdout.pipe(ws);
    p.stderr.on("data", (d) => { stderr += String(d || ""); });
    p.on("error", (e) => {
      try { ws.close(); } catch {}
      res({ ok: false, stderr: (e && (e as any).message) || String(e) });
    });
    p.on("close", (code) => {
      if (code === 0) res({ ok: true });
      else {
        try { ws.close(); } catch {}
        res({ ok: false, code: code ?? undefined, stderr });
      }
    });
  });
}

/**
 * Gelişmiş dump:
 *  - Bin autodetect: MYSQLDUMP_BIN env > mysqldump > mariadb-dump
 *  - İlk deneme: routines+triggers+events
 *  - Hata olursa: routines/events/triggers'sız fallback
 *  - Ortak bayraklar: --single-transaction --quick --skip-lock-tables --no-tablespaces --set-gtid-purged=OFF
 */
export async function runMysqlDumpAll(cfg: Cfg, outPath: string): Promise<void> {
  const common = [
    "--single-transaction",
    "--quick",
    "--skip-lock-tables",
    "--no-tablespaces",
    "--set-gtid-purged=OFF",
  ];

  const fullFlags = ["--routines", "--triggers", "--events"];
  const minimalFlags: string[] = []; // fallback: şemayı ve veriyi al, özel objeleri atla

  const bins = [
    process.env.MYSQLDUMP_BIN?.trim(),
    "mysqldump",
    "mariadb-dump",
    "/usr/bin/mysqldump",
    "/usr/bin/mariadb-dump",
  ].filter(Boolean) as string[];

  const attempts: DumpAttempt[] = [];
  for (const bin of bins) {
    attempts.push({ bin, args: [...baseArgs(cfg), ...common, ...fullFlags, cfg.database] });
    attempts.push({ bin, args: [...baseArgs(cfg), ...common, ...minimalFlags, cfg.database] });
  }

  let lastErr = "";
  for (const a of attempts) {
    const r = await tryDump(a.bin, a.args, outPath);
    if (r.ok) return;
    lastErr = `[${a.bin}] exit=${"code" in r ? r.code : "spawn_error"} :: ${r.stderr?.slice(0, 800) || "no-stderr"}`;
  }
  throw new Error(`mysqldump failed (all attempts). ${lastErr}`);
}

export async function runMysqlImport(cfg: Cfg, sqlPath: string): Promise<void> {
  const args = [...baseArgs(cfg), cfg.database];
  await new Promise<void>((res, rej) => {
    const p = spawn("mysql", args);
    createReadStream(sqlPath).pipe(p.stdin);
    p.stderr.on("data", (d) => console.error(String(d)));
    p.on("error", rej);
    p.on("close", (code) => (code === 0 ? res() : rej(new Error(`mysql exit ${code}`))));
  });
}

/* ---- Utils ---- */
export function backtickIdent(name: string) {
  return "`" + name.replace(/`/g, "``") + "`";
}
