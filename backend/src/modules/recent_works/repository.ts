import { db } from "@/db/client";
import { recentWorks, type RecentWorkRow, type NewRecentWorkRow } from "./schema";
import { and, asc, desc, eq, like, or, sql, type SQL } from "drizzle-orm";

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
  year?: string;     // "2024" gibi
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

export function rowToView(r: RecentWorkRow) {
  return {
    id: r.id,
    title: r.title,
    slug: r.slug,
    description: r.description,

    image_url: r.image_url ?? null,
    storage_asset_id: r.storage_asset_id ?? null,
    alt: r.alt ?? null,
    // Basit effective URL (gerekirse storage join ile genişletilir)
    image_effective_url: r.image_url ?? null,

    category: r.category,
    seo_keywords: parseSeo((r as any).seo_keywords),

    date: r.date,
    location: r.location,
    material: r.material,
    price: r.price ?? null,

    details: r.details,

    is_active: r.is_active === 1,
    display_order: r.display_order,

    created_at: r.created_at as any,
    updated_at: r.updated_at as any,
  };
}

/** list */
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
    // seo_keywords JSON-string içinde LIKE
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
    db.select().from(recentWorks).where(whereExpr).orderBy(orderBy).limit(take).offset(skip),
    db.select({ c: sql<number>`COUNT(1)` }).from(recentWorks).where(whereExpr),
  ]);

  const total = cnt[0]?.c ?? 0;
  return { items: items.map(rowToView), total };
}

/** get by id */
export async function getRecentWorkById(id: string) {
  const rows = await db.select().from(recentWorks).where(eq(recentWorks.id, id)).limit(1);
  return rows[0] ? rowToView(rows[0]) : null;
}

/** get by slug */
export async function getRecentWorkBySlug(slug: string) {
  const rows = await db.select().from(recentWorks).where(eq(recentWorks.slug, slug)).limit(1);
  return rows[0] ? rowToView(rows[0]) : null;
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

/* ===== Tek görsel attach/detach ===== */

export async function attachRecentWorkImage(id: string, opts: {
  storage_asset_id?: string;
  image_url?: string;
  alt?: string | null;
}) {
  const update: Partial<NewRecentWorkRow> = {
    image_url: opts.image_url ?? null,
    storage_asset_id: opts.storage_asset_id ?? null,
  };
  if (typeof opts.alt !== "undefined") update.alt = opts.alt;

  await db.update(recentWorks)
    .set({ ...update, updated_at: new Date() })
    .where(eq(recentWorks.id, id));

  return getRecentWorkById(id);
}

export async function detachRecentWorkImage(id: string) {
  await db.update(recentWorks)
    .set({ image_url: null, storage_asset_id: null, alt: null, updated_at: new Date() })
    .where(eq(recentWorks.id, id));
  return getRecentWorkById(id);
}

/** delete (hard) – kaç satır etkilendiğini döndürür */
export async function deleteRecentWork(id: string) {
  const res = await db.delete(recentWorks).where(eq(recentWorks.id, id)).execute();

  // MySQL OkPacket uyumluluğu
  const affected =
    typeof (res as unknown as { affectedRows?: number }).affectedRows === "number"
      ? (res as unknown as { affectedRows: number }).affectedRows
      : 0;

  return affected;
}
