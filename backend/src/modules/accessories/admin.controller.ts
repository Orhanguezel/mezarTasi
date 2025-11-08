import type { RouteHandler } from "fastify";
import {
  listQuerySchema,
  idParamSchema,
  createAccessorySchema,
  updateAccessorySchema,
} from "./validation";
import { repoCreate, repoDelete, repoGetById, repoListAdmin, repoUpdate } from "./repository";

/** GET /admin/accessories */
export const adminListAccessories: RouteHandler<{ Querystring: unknown }> = async (req, reply) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_query", issues: parsed.error.flatten() } });
  }
  const rows = await repoListAdmin(parsed.data);
  return rows.map((r) => ({
    ...r.acc,
    image_effective_url: r.asset_url ?? r.acc.image_url ?? null,
  }));
};

/** GET /admin/accessories/:id */
export const adminGetAccessory: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const p = idParamSchema.safeParse({ id: req.params.id });
  if (!p.success) return reply.code(400).send({ error: { message: "invalid_id" } });

  const row = await repoGetById(p.data.id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });

  return { ...row.acc, image_effective_url: row.asset_url ?? row.acc.image_url ?? null };
};

/** POST /admin/accessories */
export const adminCreateAccessory: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const body = createAccessorySchema.safeParse(req.body);
  if (!body.success) {
    return reply.code(400).send({ error: { message: "invalid_body", issues: body.error.flatten() } });
  }
  const created = await repoCreate(body.data);
  return reply.code(201).send(created?.acc ?? null);
};

/** PATCH /admin/accessories/:id */
export const adminUpdateAccessory: RouteHandler<{ Params: { id: string }; Body: unknown }> = async (req, reply) => {
  const pid = idParamSchema.safeParse({ id: req.params.id });
  if (!pid.success) return reply.code(400).send({ error: { message: "invalid_id" } });

  const body = updateAccessorySchema.safeParse(req.body);
  if (!body.success) {
    return reply.code(400).send({ error: { message: "invalid_body", issues: body.error.flatten() } });
  }

  const updated = await repoUpdate(pid.data.id, body.data);
  if (!updated) return reply.code(404).send({ error: { message: "not_found" } });
  return updated.acc;
};

/** DELETE /admin/accessories/:id */
export const adminDeleteAccessory: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const pid = idParamSchema.safeParse({ id: req.params.id });
  if (!pid.success) return reply.code(400).send({ error: { message: "invalid_id" } });

  await repoDelete(pid.data.id);
  return reply.code(204).send();
};
