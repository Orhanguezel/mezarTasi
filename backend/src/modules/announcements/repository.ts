// =============================================================
// FILE: src/modules/announcements/repository.ts
// =============================================================
import { db } from "@/db/client";
import { announcements, type NewAnnouncementRow } from "./schema";
import { storageAssets } from "@/modules/storage/schema";
import { env } from "@/core/env";
import { and, asc, desc, eq, like, sql, or, type SQL } from "drizzle-orm";

export function packContent(html: string) {
  return JSON.stringify({ html });
}
export function unpackContent(content: string | null | undefined): string {
  if (!content) return "";
  try {
    const o = JSON.parse(content);
    if (o && typeof o.html === "string") return o.html;
  } catch {}
  return "";
}

type ListParams = {
  is_active?: boolean;
  is_published?: boolean;
  include_expired?: boolean;
  q?: string;
  limit?: number;
  offset?: number;
  order?: "asc" | "desc";
  sort?: "display_order" | "created_at" | "updated_at";
};

/** Drizzle'ın union’ını bertaraf eden garanti-SQL helper */
function andSQL(...conds: Array<SQL | undefined | null | false | true>): SQL {
  const filtered = conds.filter(Boolean) as SQL[];
  return and(sql`1=1`, ...filtered) as SQL;
}

/* ===== Public URL yardımcıları (storage ile aynı) ===== */
function encSeg(s: string) { return encodeURIComponent(s); }
function encPath(p: string) { return p.split("/").map(encSeg).join("/"); }

function publicUrlFromAsset(bucket: string, path: string, providerUrl?: string | null) {
  if (providerUrl) return providerUrl;
  const cdnBase = (env.CDN_PUBLIC_BASE || "").replace(/\/+$/, "");
  if (cdnBase) return `${cdnBase}/${encSeg(bucket)}/${encPath(path)}`;
  const apiBase = (env.PUBLIC_API_BASE || "").replace(/\/+$/, "");
  const base = apiBase || "";
  return `${base}/storage/${encSeg(bucket)}/${encPath(path)}`;
}

async function resolveAssetEffectiveUrl(assetId?: string | null): Promise<string | null> {
  if (!assetId) return null;
  const [a] = await db
    .select({
      bucket: storageAssets.bucket,
      path: storageAssets.path,
      url: storageAssets.url,
    })
    .from(storageAssets)
    .where(eq(storageAssets.id, assetId))
    .limit(1);
  if (!a) return null;
  return publicUrlFromAsset(a.bucket, a.path, a.url ?? null);
}

export async function listAnnouncements(params: ListParams = {}) {
  const conds: Array<SQL | undefined> = [];

  if (typeof params.is_active === "boolean") {
    conds.push(eq(announcements.is_active, params.is_active ? 1 : 0));
  }
  if (typeof params.is_published === "boolean") {
    conds.push(eq(announcements.is_published, params.is_published ? 1 : 0));
  }
  if (!params.include_expired) {
    // expires_at IS NULL OR expires_at > NOW()
    conds.push(sql`(${announcements.expires_at} IS NULL OR ${announcements.expires_at} > NOW())`);
  }
  if (params.q?.trim()) {
    const q = `%${params.q.trim()}%`;
    conds.push(or(like(announcements.title, q), like(announcements.description, q)));
  }

  const whereExpr = andSQL(...conds);

  const orderBy =
    params.sort === "created_at"
      ? (params.order === "desc" ? desc(announcements.created_at) : asc(announcements.created_at))
      : params.sort === "updated_at"
      ? (params.order === "desc" ? desc(announcements.updated_at) : asc(announcements.updated_at))
      : (params.order === "desc" ? desc(announcements.display_order) : asc(announcements.display_order));

  const items = await db
    .select()
    .from(announcements)
    .where(whereExpr)
    .orderBy(orderBy)
    .limit(params.limit ?? 50)
    .offset(params.offset ?? 0);

  const [{ cnt }] = await db
    .select({ cnt: sql<number>`COUNT(*)`.as("cnt") })
    .from(announcements)
    .where(whereExpr);

  return { items, total: Number(cnt ?? 0) };
}

export async function getAnnouncement(id: string) {
  const r = await db
    .select()
    .from(announcements)
    .where(andSQL(eq(announcements.id, id)))
    .limit(1);
  return r[0] ?? null;
}

export async function getNextDisplayOrder(): Promise<number> {
  const rows = await db
    .select({ maxOrder: sql<number>`MAX(${announcements.display_order})` })
    .from(announcements);
  const maxOrder = Number(rows?.[0]?.maxOrder ?? 0);
  return (maxOrder || 0) + 1;
}

export async function createAnnouncement(v: NewAnnouncementRow) {
  const withOrder = {
    ...v,
    display_order: v.display_order ?? (await getNextDisplayOrder()),
  };
  await db.insert(announcements).values(withOrder);
  return getAnnouncement(v.id!);
}

export async function updateAnnouncement(id: string, patch: Partial<NewAnnouncementRow>) {
  await db
    .update(announcements)
    .set({ ...patch, updated_at: new Date() }) // ✅ updated_at güncelle
    .where(andSQL(eq(announcements.id, id)));
  return getAnnouncement(id);
}

export async function deleteAnnouncement(id: string) {
  const res = await db.delete(announcements).where(andSQL(eq(announcements.id, id))).execute();
  return (res as any)?.affectedRows ?? 0;
}

export async function bulkReorder(ids: string[]) {
  let order = 1;
  for (const id of ids) {
    await db
      .update(announcements)
      .set({ display_order: order++ })
      .where(andSQL(eq(announcements.id, id)));
  }
}

/* ===== ✅ Tek uç: SET IMAGE (storage patern) ===== */
export async function setAnnouncementImage(id: string, args: {
  storage_asset_id?: string | null;
  image_url?: string | null;
  alt?: string | null;
}) {
  // Temizle
  if (args.storage_asset_id === null || (args.image_url === null && args.storage_asset_id === undefined)) {
    await db.update(announcements)
      .set({ storage_asset_id: null, image_url: null, alt: args.alt ?? null, updated_at: new Date() })
      .where(eq(announcements.id, id));
    return getAnnouncement(id);
  }

  // Direkt URL set
  if (typeof args.image_url === "string") {
    await db.update(announcements)
      .set({ storage_asset_id: null, image_url: args.image_url, alt: args.alt ?? null, updated_at: new Date() })
      .where(eq(announcements.id, id));
    return getAnnouncement(id);
  }

  // Asset set
  if (typeof args.storage_asset_id === "string" && args.storage_asset_id.trim()) {
    const effective = await resolveAssetEffectiveUrl(args.storage_asset_id);
    if (!effective) return null;
    await db.update(announcements)
      .set({
        storage_asset_id: args.storage_asset_id,
        image_url: effective,          // 👈 effective public URL
        alt: args.alt ?? null,
        updated_at: new Date(),
      })
      .where(eq(announcements.id, id));
    return getAnnouncement(id);
  }

  // Sadece alt güncelle
  if (typeof args.alt !== "undefined") {
    await db.update(announcements)
      .set({ alt: args.alt, updated_at: new Date() })
      .where(eq(announcements.id, id));
  }
  return getAnnouncement(id);
}
