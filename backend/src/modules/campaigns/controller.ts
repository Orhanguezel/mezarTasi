import type { RouteHandler } from "fastify";
import { listSimpleCampaigns, getSimpleCampaign } from "./repository";
import { simpleCampaignListQuerySchema, type SimpleCampaignListQuery } from "./validation";

/** helper: bool normalize → tinyint */
function toTinyInt(v: unknown): 0 | 1 | undefined {
  if (v === undefined) return undefined;
  return (v === true || v === 1 || v === "1" || v === "true") ? 1 : 0;
}

/** PUBLIC: LIST (default aktifler) */
export const listSimpleCampaignsPublic: RouteHandler<{ Querystring: SimpleCampaignListQuery }> = async (req, reply) => {
  const parsed = simpleCampaignListQuerySchema.safeParse(req.query ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_query", details: parsed.error.flatten() } });
  }
  const q = parsed.data;

  const { items, total } = await listSimpleCampaigns({
    q: q.q,
    is_active: typeof q.is_active !== "undefined" ? (toTinyInt(q.is_active) === 1) : true,
    limit: q.limit,
    offset: q.offset,
    sort: q.sort ?? "updated_at",
    order: q.order ?? "desc",
  });

  reply.header("x-total-count", String(total ?? 0));
  return reply.send(items);
};

/** PUBLIC: GET BY ID */
export const getSimpleCampaignPublic: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const row = await getSimpleCampaign(req.params.id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};
