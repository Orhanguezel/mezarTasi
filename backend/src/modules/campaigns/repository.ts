// =============================================================
// FILE: src/modules/campaigns/repository.ts
// =============================================================
import { db } from "@/db/client";
import { simpleCampaigns, type NewSimpleCampaignRow } from "./schema";
import { and, asc, desc, eq, inArray, like, or, sql, type SQL } from "drizzle-orm";
import { storageAssets, type StorageAsset } from "@/modules/storage/schema";
import { env } from "@/core/env";
// üst importlara ekle
import type { SetCampaignImageBody } from "./validation";


/* ===== SEO JSON yardımcıları ===== */
export function packSeoKeywords(arr: string[]) { return JSON.stringify(arr); }
export function unpackSeoKeywords(json: string | null | undefined): string[] {
  if (!json) return [];
  try { const v = JSON.parse(json); return Array.isArray(v) ? v : []; } catch { return []; }
}

function andSQL(...conds: Array<SQL | undefined | null | false | true>): SQL {
  const filtered = conds.filter(Boolean) as SQL[];
  return and(sql`1=1`, ...filtered) as SQL;
}

/* ===== Public URL yardımcıları (storage ile aynı) ===== */
function encSeg(s: string) { return encodeURIComponent(s); }
function encPath(p: string) { return p.split("/").map(encSeg).join("/"); }

function publicUrlFromAsset(a: Pick<StorageAsset, "bucket" | "path" | "url">): string {
  if (a.url) return a.url;
  const cdnBase = (env.CDN_PUBLIC_BASE || "").replace(/\/+$/, "");
  if (cdnBase) return `${cdnBase}/${encSeg(a.bucket)}/${encPath(a.path)}`;
  const apiBase = (env.PUBLIC_API_BASE || "").replace(/\/+$/, "");
  const base = apiBase || "";
  return `${base}/storage/${encSeg(a.bucket)}/${encPath(a.path)}`;
}

async function resolveAssetUrl(assetId?: string | null): Promise<string | null> {
  if (!assetId) return null;
  const [a] = await db
    .select({ bucket: storageAssets.bucket, path: storageAssets.path, url: storageAssets.url })
    .from(storageAssets)
    .where(eq(storageAssets.id, assetId))
    .limit(1);
  return a ? publicUrlFromAsset(a) : null;
}

/* ===== Ana CRUD ===== */
type ListParams = {
  q?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  sort?: "updated_at" | "created_at" | "title";
  order?: "asc" | "desc";
};

export async function listSimpleCampaigns(params: ListParams = {}) {
  const conds: Array<SQL | undefined> = [];

  if (typeof params.is_active === "boolean") {
    conds.push(eq(simpleCampaigns.is_active, params.is_active ? 1 : 0));
  }
  if (params.q?.trim()) {
    const q = `%${params.q.trim()}%`;
    conds.push(or(like(simpleCampaigns.title, q), like(simpleCampaigns.description, q)));
  }

  const whereExpr = andSQL(...conds);

  const orderBy =
    params.sort === "created_at"
      ? (params.order === "desc" ? desc(simpleCampaigns.created_at) : asc(simpleCampaigns.created_at))
      : params.sort === "title"
      ? (params.order === "desc" ? desc(simpleCampaigns.title) : asc(simpleCampaigns.title))
      : (params.order === "asc" ? asc(simpleCampaigns.updated_at) : desc(simpleCampaigns.updated_at)); // default updated_at desc

  const items = await db
    .select()
    .from(simpleCampaigns)
    .where(whereExpr)
    .orderBy(orderBy)
    .limit(params.limit ?? 50)
    .offset(params.offset ?? 0);

  const [{ cnt }] = await db
    .select({ cnt: sql<number>`COUNT(*)`.as("cnt") })
    .from(simpleCampaigns)
    .where(whereExpr);

  return { items, total: Number(cnt ?? 0) };
}

export async function getSimpleCampaign(id: string) {
  const r = await db.select().from(simpleCampaigns).where(eq(simpleCampaigns.id, id)).limit(1);
  return r[0] ?? null;
}

export async function createSimpleCampaign(v: NewSimpleCampaignRow) {
  await db.insert(simpleCampaigns).values(v);
  return getSimpleCampaign(v.id!);
}

export async function updateSimpleCampaign(id: string, patch: Partial<NewSimpleCampaignRow>) {
  await db.update(simpleCampaigns).set({ ...patch, updated_at: new Date() })
    .where(eq(simpleCampaigns.id, id));
  return getSimpleCampaign(id);
}

export async function deleteSimpleCampaign(id: string) {
  const res = await db.delete(simpleCampaigns).where(eq(simpleCampaigns.id, id)).execute();
  return (res as any)?.affectedRows ?? 0;
}

/* ===== Tek uç: SET IMAGE (storage patern) ===== */
export async function setSimpleCampaignImage(id: string, body: SetCampaignImageBody) {
  const patch: Partial<typeof simpleCampaigns.$inferInsert> = {};
  // storage verildiyse aktif: URL'i sıfırla
  if (typeof body.storage_asset_id !== "undefined") {
    patch.storage_asset_id = body.storage_asset_id ?? null;
    if (body.storage_asset_id) patch.image_url = null;
  }
  // URL verildiyse aktif: storage’ı sıfırla (set edilmediyse)
  if (typeof body.image_url !== "undefined") {
    patch.image_url = body.image_url; // null veya string
    if (body.image_url && typeof patch.storage_asset_id === "undefined") {
      patch.storage_asset_id = null;
    }
  }
  // alt
  if (typeof (body as any).alt !== "undefined") {
    patch.alt = (body as any).alt;
  }
  patch.updated_at = new Date();

  const res = await db.update(simpleCampaigns).set(patch).where(eq(simpleCampaigns.id, id));
  // @ts-ignore drizzle returns info
  if (!res || (res as any).affectedRows === 0) return null;
  return await getSimpleCampaign(id);
}

/** Opsiyonel toplu aktif/pasif */
export async function bulkSetActive(ids: string[], isActive: boolean) {
  if (!ids.length) return;
  await db.update(simpleCampaigns)
    .set({ is_active: isActive ? 1 : 0, updated_at: new Date() })
    .where(inArray(simpleCampaigns.id, ids));
}
