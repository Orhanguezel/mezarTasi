import { db } from "@/db/client";
import { cemeteries, type CemeteryRow, type NewCemeteryRow } from "./schema";
import { and, asc, desc, eq, like, or, sql, type SQL } from "drizzle-orm";
import { rowToView, type CemeteryView } from "./schema";

/** Sadece güvenilir sıralama kolonları */
type Sortable = "created_at" | "updated_at";

export type ListParams = {
  orderParam?: string;
  sort?: Sortable;
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;

  is_active?: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  q?: string;
  slug?: string;
  district?: string;
  type?: string;
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
    if (col && dir && (col === "created_at" || col === "updated_at")) {
      return { col, dir };
    }
  }
  if (sort && ord) return { col: sort, dir: ord };
  return null;
};

/** list */
export async function listCemeteries(params: ListParams) {
  const filters: SQL[] = [];

  const act = to01(params.is_active);
  if (act !== undefined) filters.push(eq(cemeteries.is_active, act));

  if (params.slug && params.slug.trim()) {
    filters.push(eq(cemeteries.slug, params.slug.trim()));
  }
  if (params.district && params.district.trim()) {
    filters.push(eq(cemeteries.district, params.district.trim()));
  }
  if (params.type && params.type.trim()) {
    filters.push(eq(cemeteries.type, params.type.trim()));
  }
  if (params.q && params.q.trim()) {
    const s = `%${params.q.trim()}%`;
    const nameLike = like(cemeteries.name, s);
    const addrLike = like(cemeteries.address, s);
    const distLike = like(cemeteries.district, s);
    const typeLike = like(cemeteries.type, s);
    filters.push(or(nameLike, addrLike, distLike, typeLike) as SQL);
  }

  const whereExpr: SQL | undefined = filters.length ? (and(...filters) as SQL) : undefined;

  const ord = parseOrder(params.orderParam, params.sort, params.order);
  const orderBy = ord
    ? ord.dir === "asc" ? asc(cemeteries[ord.col]) : desc(cemeteries[ord.col])
    : asc(cemeteries.display_order);

  const take = params.limit && params.limit > 0 ? params.limit : 100;
  const skip = params.offset && params.offset >= 0 ? params.offset : 0;

  const [rows, cnt] = await Promise.all([
    db.select().from(cemeteries).where(whereExpr).orderBy(orderBy).limit(take).offset(skip),
    db.select({ c: sql<number>`COUNT(1)` }).from(cemeteries).where(whereExpr),
  ]);

  const items: CemeteryView[] = rows.map(rowToView);
  const total = cnt[0]?.c ?? 0;
  return { items, total };
}

/** get by id */
export async function getCemeteryById(id: string) {
  const rows = await db.select().from(cemeteries).where(eq(cemeteries.id, id)).limit(1);
  return rows[0] ? rowToView(rows[0]) : null;
}

/** get by slug */
export async function getCemeteryBySlug(slug: string) {
  const rows = await db.select().from(cemeteries).where(eq(cemeteries.slug, slug)).limit(1);
  return rows[0] ? rowToView(rows[0]) : null;
}

/** create */
export async function createCemetery(values: NewCemeteryRow) {
  await db.insert(cemeteries).values(values);
  return getCemeteryById(values.id);
}

/** update (partial) */
export async function updateCemetery(id: string, patch: Partial<NewCemeteryRow>) {
  await db
    .update(cemeteries)
    .set({ ...patch, updated_at: new Date() })
    .where(eq(cemeteries.id, id));
  return getCemeteryById(id);
}

/** delete (hard) */
export async function deleteCemetery(id: string) {
  const res = await db.delete(cemeteries).where(eq(cemeteries.id, id)).execute();
  const affected =
    typeof (res as unknown as { affectedRows?: number }).affectedRows === "number"
      ? (res as unknown as { affectedRows: number }).affectedRows
      : 0;
  return affected;
}

/** meta: distinct districts */
export async function listDistricts(): Promise<string[]> {
  const rows = await db.select({ d: cemeteries.district }).from(cemeteries).groupBy(cemeteries.district).orderBy(asc(cemeteries.district));
  return rows.map((r) => r.d);
}

/** meta: distinct types */
export async function listTypes(): Promise<string[]> {
  const rows = await db.select({ t: cemeteries.type }).from(cemeteries).groupBy(cemeteries.type).orderBy(asc(cemeteries.type));
  return rows.map((r) => r.t);
}
