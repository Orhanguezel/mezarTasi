import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import {
  listInfoCards,
  getInfoCard,
  createInfoCard,
  updateInfoCard,
  deleteInfoCard,
} from "./repository";
import {
  infoCardListQuerySchema,
  upsertInfoCardBodySchema,
  patchInfoCardBodySchema,
  type InfoCardListQuery,
  type UpsertInfoCardBody,
  type PatchInfoCardBody,
} from "./validation";

/** PUBLIC: LIST */
export const listInfoCardsPublic: RouteHandler<{ Querystring: InfoCardListQuery }> = async (req, reply) => {
  const parsed = infoCardListQuerySchema.safeParse(req.query ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_query", details: parsed.error.flatten() } });
  }
  const q = parsed.data;
  const { items, total } = await listInfoCards({
    q: q.q,
    is_active: typeof q.is_active !== "undefined"
      ? (q.is_active === true || q.is_active === 1 || q.is_active === "1" || q.is_active === "true")
      : true, // public’te default aktifler
    limit: q.limit,
    offset: q.offset,
    sort: q.sort ?? "display_order",
    order: q.order ?? "asc",
  });
  reply.header("x-total-count", String(total ?? 0));
  return reply.send(items);
};

/** PUBLIC: GET BY ID */
export const getInfoCardPublic: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const row = await getInfoCard(req.params.id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};

/** ADMIN: LIST */
export const listInfoCardsAdmin: RouteHandler<{ Querystring: InfoCardListQuery }> = async (req, reply) => {
  const parsed = infoCardListQuerySchema.safeParse(req.query ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_query", details: parsed.error.flatten() } });
  }
  const q = parsed.data;
  const { items, total } = await listInfoCards({
    q: q.q,
    is_active: typeof q.is_active !== "undefined"
      ? (q.is_active === true || q.is_active === 1 || q.is_active === "1" || q.is_active === "true")
      : undefined, // admin’de tümü
    limit: q.limit,
    offset: q.offset,
    sort: q.sort ?? "display_order",
    order: q.order ?? "asc",
  });
  reply.header("x-total-count", String(total ?? 0));
  return reply.send(items);
};

/** ADMIN: GET BY ID */
export const getInfoCardAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const row = await getInfoCard(req.params.id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};

/** ADMIN: CREATE */
export const createInfoCardAdmin: RouteHandler<{ Body: UpsertInfoCardBody }> = async (req, reply) => {
  const parsed = upsertInfoCardBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_body", details: parsed.error.flatten() } });
  }
  const b = parsed.data;

  const row = await createInfoCard({
    id: randomUUID(),
    title: b.title,
    description: b.description,
    icon: b.icon,
    icon_type: b.icon_type,
    lucide_icon: b.lucide_icon ?? null,
    link: b.link,
    bg_color: b.bg_color,
    hover_color: b.hover_color,
    icon_color: b.icon_color,
    text_color: b.text_color,
    border_color: b.border_color,
    is_active: (b.is_active === true || b.is_active === 1 || b.is_active === "1" || b.is_active === "true") ? 1 : 0,
    display_order: b.display_order,
    created_at: new Date(),
    updated_at: new Date(),
  });

  return reply.code(201).send(row);
};

/** ADMIN: PATCH */
export const updateInfoCardAdmin: RouteHandler<{ Params: { id: string }; Body: PatchInfoCardBody }> = async (req, reply) => {
  const parsed = patchInfoCardBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_body", details: parsed.error.flatten() } });
  }
  const b = parsed.data;

  const patched = await updateInfoCard(req.params.id, {
    title: b.title,
    description: b.description,
    icon: b.icon,
    icon_type: b.icon_type,
    lucide_icon: typeof b.lucide_icon !== "undefined" ? (b.lucide_icon ?? null) : undefined,
    link: b.link,
    bg_color: b.bg_color,
    hover_color: b.hover_color,
    icon_color: b.icon_color,
    text_color: b.text_color,
    border_color: b.border_color,
    is_active: typeof b.is_active !== "undefined"
      ? ((b.is_active === true || b.is_active === 1 || b.is_active === "1" || b.is_active === "true") ? 1 : 0)
      : undefined,
    display_order: b.display_order,
  });

  if (!patched) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(patched);
};

/** ADMIN: DELETE */
export const deleteInfoCardAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const affected = await deleteInfoCard(req.params.id);
  if (!affected) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.code(204).send();
};
