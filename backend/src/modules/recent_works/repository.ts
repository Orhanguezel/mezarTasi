// =============================================================
// FILE: src/modules/recent-works/repository.ts
// =============================================================
import { db } from "@/db/client";
import { recentWorks, type NewRecentWorkRow } from "./schema";
import { storageAssets } from "@/modules/storage/schema";
import { and, asc, desc, eq, like, or, sql, type SQL } from "drizzle-orm";
import type { RecentWorkView } from "./schema";
import { env } from "@/core/env";

/** Sadece güvenilir sıralama kolonları */
type Sortable = "created_at" | "updated_at" | "display_order";

export type ListParams = {
  orderParam?: string;
  sort?: Sortable;
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;

  q?: string;
  category?: string;
  material?: string;
  year?: string;     // "2024"
  keyword?: string;  // seo_keywords JSON-string içinde arama
  is_active?: boolean | 0 | 1 | "0" | "1" | "true" | "false";
};

const to01 = (v: ListParams["is_active"]): 0 | 1 | undefined => {
  if (v === true || v === 1 || v === "1" || v === "true") return 1;
  if (v === false || v === 0 || v === "0" || v === "false") return 0;
  return undefined;
};

const parseOrder = (
  orderParam?: string,
  sort?: ListParams["sort"],
  ord?: ListParams["order"],
): { col: Sortable; dir: "asc" | "desc" } | null => {
  if (orderParam) {
    const m = orderParam.match(/^([a-zA-Z0-9_]+)\.(asc|desc)$/);
    const col = m?.[1] as Sortable | undefined;
    const dir = m?.[2] as "asc" | "desc" | undefined;
    if (col && dir && (col === "created_at" || col === "updated_at" || col === "display_order")) {
      return { col, dir };
    }
  }
  if (sort && ord) return { col: sort, dir: ord };
  return null;
};

const parseSeo = (s?: string | null): string[] => {
  try { return s ? (JSON.parse(s) as string[]) : []; } catch { return []; }
};

/** Provider URL varsa onu, yoksa /storage/:bucket/:path üretir */
function publicUrlOf(bucket?: string | null, path?: string | null, providerUrl?: string | null) {
  if (providerUrl) return providerUrl;
  if (!bucket || !path) return null;

  const enc = (p: string) => p.split("/").map(encodeURIComponent).join("/");
  const cdnBase = (env.CDN_PUBLIC_BASE || "").replace(/\/+$/, "");
  if (cdnBase) return `${cdnBase}/${encodeURIComponent(bucket)}/${enc(path)}`;

  const apiBase = (env.PUBLIC_API_BASE || "").replace(/\/+$/, "");
  return `${apiBase || ""}/storage/${encodeURIComponent(bucket)}/${enc(path)}`;
}

function mapToView(row: any): RecentWorkView {
  const r = row.rw ?? row; // select alias
  const eff = publicUrlOf(row.asset_bucket, row.asset_path, row.asset_url0) ?? r.image_url ?? null;
  return {
    id: r.id,
    title: r.title,
    slug: r.slug,
    description: r.description,

    image_url: r.image_url ?? null,
    storage_asset_id: r.storage_asset_id ?? null,
    alt: r.alt ?? null,
    image_effective_url: eff,

    category: r.category,
    seo_keywords: parseSeo(r.seo_keywords),

    date: r.date,
    location: r.location,
    material: r.material,
    price: r.price ?? null,

    details: r.details,

    is_active: !!r.is_active,
    display_order: r.display_order,

    created_at: r.created_at as any,
    updated_at: r.updated_at as any,
  };
}

/** list (JOIN + effective url) */
export async function listRecentWorks(params: ListParams) {
  const filters: SQL[] = [];

  const act = to01(params.is_active);
  if (act !== undefined) filters.push(eq(recentWorks.is_active, act));

  if (params.category?.trim()) filters.push(eq(recentWorks.category, params.category.trim()));
  if (params.material?.trim()) filters.push(eq(recentWorks.material, params.material.trim()));

  if (params.year?.trim()) {
    const s = `%${params.year.trim()}%`;
    filters.push(like(recentWorks.date, s));
  }

  if (params.keyword?.trim()) {
    const s = `%${params.keyword.trim()}%`;
    filters.push(like(recentWorks.seo_keywords, s));
  }

  if (params.q?.trim()) {
    const s = `%${params.q.trim()}%`;
    filters.push(or(
      like(recentWorks.title, s),
      like(recentWorks.description, s),
      like(recentWorks.location, s),
      like(recentWorks.category, s),
      like(recentWorks.material, s),
    ) as SQL);
  }

  const whereExpr: SQL | undefined = filters.length ? (and(...filters) as SQL) : undefined;

  const ord = parseOrder(params.orderParam, params.sort, params.order);
  const orderBy = ord
    ? ord.dir === "asc" ? asc(recentWorks[ord.col]) : desc(recentWorks[ord.col])
    : desc(recentWorks.display_order);

  const take = params.limit && params.limit > 0 ? params.limit : 50;
  const skip = params.offset && params.offset >= 0 ? params.offset : 0;

  const [items, cnt] = await Promise.all([
    db
      .select({
        rw: recentWorks,
        asset_bucket: storageAssets.bucket,
        asset_path: storageAssets.path,
        asset_url0: storageAssets.url,
      })
      .from(recentWorks)
      .leftJoin(storageAssets, eq(recentWorks.storage_asset_id, storageAssets.id))
      .where(whereExpr)
      .orderBy(orderBy)
      .limit(take)
      .offset(skip),
    db.select({ c: sql<number>`COUNT(1)` }).from(recentWorks).where(whereExpr),
  ]);

  const total = cnt[0]?.c ?? 0;
  return { items: items.map(mapToView), total };
}

/** get by id (JOIN) */
export async function getRecentWorkById(id: string) {
  const rows = await db
    .select({
      rw: recentWorks,
      asset_bucket: storageAssets.bucket,
      asset_path: storageAssets.path,
      asset_url0: storageAssets.url,
    })
    .from(recentWorks)
    .leftJoin(storageAssets, eq(recentWorks.storage_asset_id, storageAssets.id))
    .where(eq(recentWorks.id, id))
    .limit(1);
  return rows[0] ? mapToView(rows[0]) : null;
}

/** get by slug (JOIN) */
export async function getRecentWorkBySlug(slug: string) {
  const rows = await db
    .select({
      rw: recentWorks,
      asset_bucket: storageAssets.bucket,
      asset_path: storageAssets.path,
      asset_url0: storageAssets.url,
    })
    .from(recentWorks)
    .leftJoin(storageAssets, eq(recentWorks.storage_asset_id, storageAssets.id))
    .where(eq(recentWorks.slug, slug))
    .limit(1);
  return rows[0] ? mapToView(rows[0]) : null;
}

/** create */
export async function createRecentWork(values: NewRecentWorkRow) {
  await db.insert(recentWorks).values(values);
  return getRecentWorkById(values.id);
}

/** update */
export async function updateRecentWork(id: string, patch: Partial<NewRecentWorkRow>) {
  await db
    .update(recentWorks)
    .set({ ...patch, updated_at: new Date() })
    .where(eq(recentWorks.id, id));
  return getRecentWorkById(id);
}

/** ✅ SET IMAGE (tek uç – storage ile birebir patern) */
export async function repoSetRecentWorkImage(
  id: string,
  body: { asset_id?: string | null; image_url?: string | null; alt?: string | null }
) {
  // Clear
  if (body.asset_id === null || (body.image_url === null && body.asset_id === undefined)) {
    await db.update(recentWorks)
      .set({ image_url: null, storage_asset_id: null, alt: body.alt ?? null, updated_at: new Date() })
      .where(eq(recentWorks.id, id));
    return getRecentWorkById(id);
  }

  // Set via image_url (direct)
  if (typeof body.image_url === "string") {
    await db.update(recentWorks)
      .set({
        image_url: body.image_url,
        storage_asset_id: null,
        alt: body.alt ?? null,
        updated_at: new Date(),
      })
      .where(eq(recentWorks.id, id));
    return getRecentWorkById(id);
  }

  // Set via asset_id
  if (typeof body.asset_id === "string" && body.asset_id.trim()) {
    const [asset] = await db
      .select({ bucket: storageAssets.bucket, path: storageAssets.path, url: storageAssets.url })
      .from(storageAssets)
      .where(eq(storageAssets.id, body.asset_id))
      .limit(1);

    if (!asset) return null;

    const url = publicUrlOf(asset.bucket, asset.path, asset.url ?? null);

    await db.update(recentWorks)
      .set({
        image_url: url,
        storage_asset_id: body.asset_id,
        alt: body.alt ?? null,
        updated_at: new Date(),
      })
      .where(eq(recentWorks.id, id));

    return getRecentWorkById(id);
  }

  // only alt update
  if (body.alt !== undefined) {
    await db.update(recentWorks)
      .set({ alt: body.alt, updated_at: new Date() })
      .where(eq(recentWorks.id, id));
    return getRecentWorkById(id);
  }

  return getRecentWorkById(id);
}

/* ===== Geriye dönük uyum (eski attach/detach uçlarını kullanan FE için) ===== */
export async function attachRecentWorkImage(id: string, opts: {
  storage_asset_id?: string;
  image_url?: string;
  alt?: string | null;
}) {
  return repoSetRecentWorkImage(id, {
    asset_id: opts.storage_asset_id,
    image_url: opts.image_url,
    alt: opts.alt ?? null,
  });
}

export async function detachRecentWorkImage(id: string) {
  return repoSetRecentWorkImage(id, { asset_id: null, image_url: null, alt: null });
}

/** delete (hard) */
export async function deleteRecentWork(id: string) {
  const res = await db.delete(recentWorks).where(eq(recentWorks.id, id)).execute();
  const affected =
    typeof (res as unknown as { affectedRows?: number }).affectedRows === "number"
      ? (res as unknown as { affectedRows: number }).affectedRows
      : 0;
  return affected;
}
