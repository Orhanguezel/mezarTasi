import type { RouteHandler } from "fastify";
import { db } from "@/db/client";
import { siteSettings } from "./schema";
import { eq, like, inArray, asc, desc, and } from "drizzle-orm";

function parseDbValue(s: string): unknown {
  try { return JSON.parse(s); } catch { return s; }
}

function rowToDto(r: typeof siteSettings.$inferSelect) {
  return {
    id: r.id,
    key: r.key,
    value: parseDbValue(r.value),
    created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined,
    updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
  };
}

/**
 * GET /site_settings
 * Query:
 * - key: eşitlik
 * - key_in/keys: "a,b,c" -> IN(...)
 * - prefix: LIKE 'prefix%'
 * - order: "updated_at.desc" | "key.asc" (default key.asc)
 * - limit, offset
 */
export const listSiteSettings: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as {
    key?: string;
    key_in?: string;
    keys?: string;
    prefix?: string;
    order?: string;
    limit?: string | number;
    offset?: string | number;
  };

  let qb = db.select().from(siteSettings).$dynamic();
  const conds: any[] = [];

  if (q.prefix) conds.push(like(siteSettings.key, `${q.prefix}%`));
  if (q.key)    conds.push(eq(siteSettings.key, q.key));

  const inParam = q.key_in ?? q.keys;
  if (inParam) {
    const arr = inParam.split(",").map((s) => s.trim()).filter(Boolean);
    if (arr.length) conds.push(inArray(siteSettings.key, arr));
  }

  if (conds.length === 1) qb = qb.where(conds[0]);
  else if (conds.length > 1) qb = qb.where(and(...conds));

  if (q.order) {
    const [col, dir] = q.order.split(".");
    const colRef = (siteSettings as any)[col];
    qb = colRef ? qb.orderBy(dir === "desc" ? desc(colRef) : asc(colRef)) : qb.orderBy(asc(siteSettings.key));
  } else {
    qb = qb.orderBy(asc(siteSettings.key));
  }

  if (q.limit != null && q.limit !== "") {
    const n = Number(q.limit);
    if (!Number.isNaN(n) && n > 0) qb = qb.limit(n);
  }
  if (q.offset != null && q.offset !== "") {
    const m = Number(q.offset);
    if (!Number.isNaN(m) && m >= 0) qb = qb.offset(m);
  }

  const rows = await qb;
  return reply.send(rows.map(rowToDto));
};

/** GET /site_settings/:key */
export const getSiteSettingByKey: RouteHandler = async (req, reply) => {
  const { key } = req.params as { key: string };
  const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(rowToDto(rows[0]));
};
