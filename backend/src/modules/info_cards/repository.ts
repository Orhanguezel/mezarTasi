import { db } from "@/db/client";
import { infoCards, type NewInfoCardRow } from "./schema";
import { and, asc, desc, eq, like, sql, or, type SQL } from "drizzle-orm";

function andSQL(...conds: Array<SQL | undefined | null | false | true>): SQL {
  const filtered = conds.filter(Boolean) as SQL[];
  return and(sql`1=1`, ...filtered) as SQL;
}

type ListParams = {
  q?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  sort?: "display_order" | "created_at" | "updated_at";
  order?: "asc" | "desc";
};

export async function listInfoCards(params: ListParams = {}) {
  const conds: Array<SQL | undefined> = [];

  if (typeof params.is_active === "boolean") {
    conds.push(eq(infoCards.is_active, params.is_active ? 1 : 0));
  }
  if (params.q?.trim()) {
    const q = `%${params.q.trim()}%`;
    conds.push(or(like(infoCards.title, q), like(infoCards.description, q)));
  }

  const whereExpr = andSQL(...conds);

  const orderBy =
    params.sort === "created_at"
      ? (params.order === "desc" ? desc(infoCards.created_at) : asc(infoCards.created_at))
      : params.sort === "updated_at"
      ? (params.order === "desc" ? desc(infoCards.updated_at) : asc(infoCards.updated_at))
      : (params.order === "desc" ? desc(infoCards.display_order) : asc(infoCards.display_order));

  const items = await db
    .select()
    .from(infoCards)
    .where(whereExpr)
    .orderBy(orderBy)
    .limit(params.limit ?? 50)
    .offset(params.offset ?? 0);

  const [{ cnt }] = await db
    .select({ cnt: sql<number>`COUNT(*)`.as("cnt") })
    .from(infoCards)
    .where(whereExpr);

  return { items, total: Number(cnt ?? 0) };
}

export async function getInfoCard(id: string) {
  const r = await db.select().from(infoCards).where(andSQL(eq(infoCards.id, id))).limit(1);
  return r[0] ?? null;
}

export async function getNextDisplayOrder(): Promise<number> {
  const rows = await db
    .select({ maxOrder: sql<number>`MAX(${infoCards.display_order})` })
    .from(infoCards);
  const maxOrder = Number(rows?.[0]?.maxOrder ?? 0);
  return (maxOrder || 0) + 1;
}

export async function createInfoCard(v: NewInfoCardRow) {
  const withOrder = {
    ...v,
    display_order: v.display_order ?? (await getNextDisplayOrder()),
  };
  await db.insert(infoCards).values(withOrder);
  return getInfoCard(v.id!);
}

export async function updateInfoCard(id: string, patch: Partial<NewInfoCardRow>) {
  await db.update(infoCards).set({ ...patch }).where(andSQL(eq(infoCards.id, id)));
  return getInfoCard(id);
}

export async function deleteInfoCard(id: string) {
  const res = await db.delete(infoCards).where(andSQL(eq(infoCards.id, id))).execute();
  return (res as any)?.affectedRows ?? 0;
}

export async function bulkReorder(ids: string[]) {
  let order = 1;
  for (const id of ids) {
    await db.update(infoCards).set({ display_order: order++ }).where(andSQL(eq(infoCards.id, id)));
  }
}
