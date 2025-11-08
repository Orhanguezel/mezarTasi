import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import {
  listCustomPages,
  getCustomPageById,
  getCustomPageBySlug,
} from "./repository";

type ListQuery = {
  order?: string;
  sort?: "created_at" | "updated_at";
  orderDir?: "asc" | "desc";
  limit?: string;
  offset?: string;
  is_published?: "0" | "1" | "true" | "false";
  q?: string;
  slug?: string;
  select?: string;
};

export const listPages: RouteHandler<{ Querystring: ListQuery }> = async (req, reply) => {
  try {
    const { select: _select, ...q } = req.query ?? {};
    const limitNum  = q.limit  ? Number(q.limit)  : undefined;
    const offsetNum = q.offset ? Number(q.offset) : undefined;

    const { items, total } = await listCustomPages({
      orderParam: typeof q.order === "string" ? q.order : undefined,
      sort: q.sort,
      order: q.orderDir,
      limit: Number.isFinite(limitNum as number) ? (limitNum as number) : undefined,
      offset: Number.isFinite(offsetNum as number) ? (offsetNum as number) : undefined,
      is_published: q.is_published,
      q: q.q,
      slug: q.slug,
    });

    reply.header("x-total-count", String(total ?? 0));
    return reply.send(items);
  } catch (err) {
    req.log.error({ err }, "custom_pages_list_failed");
    return reply.code(500).send({ error: { message: "custom_pages_list_failed" } });
  }
};

/** GET BY ID */
export const getPage: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const row = await getCustomPageById(req.params.id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};

/** GET BY SLUG (public) */
export const getPageBySlug: RouteHandler<{ Params: { slug: string } }> = async (req, reply) => {
  const row = await getCustomPageBySlug(req.params.slug);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};