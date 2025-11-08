import type { RouteHandler } from "fastify";
import {
  listCemeteries,
  getCemeteryById,
  getCemeteryBySlug,
  listDistricts,
  listTypes,
} from "./repository";
import { cemeteryListQuerySchema, type CemeteryListQuery } from "./validation";

/** LIST (public) */
export const listCemeteriesPublic: RouteHandler<{ Querystring: CemeteryListQuery }> = async (req, reply) => {
  const parsed = cemeteryListQuerySchema.safeParse(req.query ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_query", issues: parsed.error.issues } });
  }
  const q = parsed.data;

  const { items, total } = await listCemeteries({
    orderParam: typeof q.order === "string" ? q.order : undefined,
    sort: q.sort,
    order: q.orderDir,
    limit: q.limit,
    offset: q.offset,
    is_active: q.is_active,
    q: q.q,
    slug: q.slug,
    district: q.district,
    type: q.type,
  });

  reply.header("x-total-count", String(total ?? 0));
  return reply.send(items);
};

/** GET BY ID (public) */
export const getCemeteryPublic: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const row = await getCemeteryById(req.params.id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};

/** GET BY SLUG (public) */
export const getCemeteryBySlugPublic: RouteHandler<{ Params: { slug: string } }> = async (req, reply) => {
  const row = await getCemeteryBySlug(req.params.slug);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};

/** META: districts */
export const listDistrictsPublic: RouteHandler = async (_req, reply) => {
  const arr = await listDistricts();
  return reply.send(arr);
};

/** META: types */
export const listTypesPublic: RouteHandler = async (_req, reply) => {
  const arr = await listTypes();
  return reply.send(arr);
};
