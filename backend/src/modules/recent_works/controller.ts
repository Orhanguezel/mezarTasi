import type { RouteHandler } from "fastify";
import {
  listRecentWorks,
  getRecentWorkById,
  getRecentWorkBySlug,
} from "./repository";
import { recentWorkListQuerySchema, type RecentWorkListQuery } from "./validation";

/** LIST (public) – sadece aktif kayıtlar */
export const listRecentWorksPublic: RouteHandler<{ Querystring: RecentWorkListQuery }> = async (req, reply) => {
  const parsed = recentWorkListQuerySchema.safeParse(req.query ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_query", issues: parsed.error.issues } });
  }
  const q = parsed.data;

  const { items, total } = await listRecentWorks({
    orderParam: typeof q.order === "string" ? q.order : undefined,
    sort: q.sort,
    order: q.orderDir,
    limit: q.limit,
    offset: q.offset,
    q: q.q,
    category: q.category,
    material: q.material,
    year: q.year,
    keyword: q.keyword,
    is_active: 1,
  });

  reply.header("x-total-count", String(total ?? 0));
  return reply.send(items);
};

/** GET BY ID (public) */
export const getRecentWorkPublic: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const row = await getRecentWorkById(req.params.id);
  if (!row || !row.is_active) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};

/** GET BY SLUG (public) */
export const getRecentWorkBySlugPublic: RouteHandler<{ Params: { slug: string } }> = async (req, reply) => {
  const row = await getRecentWorkBySlug(req.params.slug);
  if (!row || !row.is_active) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};

/** META: categories */
export const listCategoriesPublic: RouteHandler = async (_req, reply) => {
  const { items } = await listRecentWorks({ limit: 1000, offset: 0, is_active: 1 });
  const set = Array.from(new Set(items.map(i => i.category))).filter(Boolean);
  return reply.send(set);
};

/** META: years */
export const listYearsPublic: RouteHandler = async (_req, reply) => {
  const { items } = await listRecentWorks({ limit: 1000, offset: 0, is_active: 1 });
  const set = Array.from(new Set(items.map(i => i.date))).filter(Boolean);
  return reply.send(set);
};
