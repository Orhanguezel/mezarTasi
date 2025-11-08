// src/modules/cemeteries/admin.controller.ts
import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import {
  listCemeteries,
  getCemeteryById,
  getCemeteryBySlug,
  createCemetery,
  updateCemetery,
  deleteCemetery,
} from "./repository";
import {
  cemeteryListQuerySchema,
  upsertCemeteryBodySchema,
  patchCemeteryBodySchema,
  type CemeteryListQuery,
  type UpsertCemeteryBody,
  type PatchCemeteryBody,
} from "./validation";

const toBool = (v: unknown): boolean =>
  v === true || v === 1 || v === "1" || v === "true";

// DECIMAL(10,6) alanlarına string yazmak için normalize
const dec6 = (v: number | string): string => {
  if (typeof v === "number") return v.toFixed(6);
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(6) : String(v);
};

/** LIST (admin) */
export const listCemeteriesAdmin: RouteHandler<{ Querystring: CemeteryListQuery }> = async (req, reply) => {
  const parsed = cemeteryListQuerySchema.safeParse(req.query ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_query", issues: parsed.error.issues } });
  }
  const q = parsed.data;

  try {
    const { items, total } = await listCemeteries({
      orderParam: typeof q.order === "string" ? q.order : undefined,
      sort: q.sort,
      order: q.orderDir,
      limit: q.limit,
      offset: q.offset,
      is_active: q.is_active,
      q: q.q,
      district: q.district,
      type: q.type,
      slug: q.slug,
    });

    reply.header("x-total-count", String(total ?? 0));
    return reply.send(items);
  } catch (err) {
    req.log.error({ err }, "cemeteries_list_failed");
    return reply.code(500).send({ error: { message: "cemeteries_list_failed" } });
  }
};

/** GET BY ID (admin) */
export const getCemeteryAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const row = await getCemeteryById(req.params.id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};

/** GET BY SLUG (admin) */
export const getCemeteryBySlugAdmin: RouteHandler<{ Params: { slug: string } }> = async (req, reply) => {
  const row = await getCemeteryBySlug(req.params.slug);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};

/** CREATE (admin) */
export const createCemeteryAdmin: RouteHandler<{ Body: UpsertCemeteryBody }> = async (req, reply) => {
  const parsed = upsertCemeteryBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_body", issues: parsed.error.issues } });
  }
  const b = parsed.data;

  try {
    const row = await createCemetery({
      id: randomUUID(),
      name: b.name.trim(),
      slug: b.slug.trim(),
      type: b.type.trim(),
      address: b.address.trim(),
      district: b.district.trim(),
      phone: b.phone.trim(),
      fax: typeof b.fax === "string" ? b.fax.trim() : b.fax ?? null,
      lat: dec6(b.coordinates.lat),
      lng: dec6(b.coordinates.lng),
      services: Array.isArray(b.services) ? b.services : [],
      working_hours: b.working_hours.trim(),
      description: b.description,
      accessibility: typeof b.accessibility === "string" ? b.accessibility.trim() : b.accessibility ?? null,
      transportation: typeof b.transportation === "string" ? b.transportation.trim() : b.transportation ?? null,
      is_active: toBool(b.is_active) ? 1 : 0,
      display_order: typeof b.display_order === "number" ? b.display_order : 0,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return reply.code(201).send(row);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "ER_DUP_ENTRY") {
      return reply.code(409).send({ error: { message: "slug_already_exists" } });
    }
    req.log.error({ err }, "cemeteries_create_failed");
    return reply.code(500).send({ error: { message: "cemeteries_create_failed" } });
  }
};

/** UPDATE (admin, partial) */
export const updateCemeteryAdmin: RouteHandler<{ Params: { id: string }; Body: PatchCemeteryBody }> = async (req, reply) => {
  const parsed = patchCemeteryBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_body", issues: parsed.error.issues } });
  }
  const b = parsed.data;

  try {
    const patched = await updateCemetery(req.params.id, {
      name: typeof b.name === "string" ? b.name.trim() : undefined,
      slug: typeof b.slug === "string" ? b.slug.trim() : undefined,
      type: typeof b.type === "string" ? b.type.trim() : undefined,
      address: typeof b.address === "string" ? b.address.trim() : undefined,
      district: typeof b.district === "string" ? b.district.trim() : undefined,
      phone: typeof b.phone === "string" ? b.phone.trim() : undefined,
      fax: typeof b.fax !== "undefined" ? (b.fax ?? null) : undefined,
      lat: typeof b.coordinates?.lat !== "undefined" ? dec6(b.coordinates.lat) : undefined,
      lng: typeof b.coordinates?.lng !== "undefined" ? dec6(b.coordinates.lng) : undefined,
      services: Array.isArray(b.services) ? b.services : undefined,
      working_hours: typeof b.working_hours === "string" ? b.working_hours.trim() : undefined,
      description: typeof b.description === "string" ? b.description : undefined,
      accessibility: typeof b.accessibility !== "undefined" ? (b.accessibility ?? null) : undefined,
      transportation: typeof b.transportation !== "undefined" ? (b.transportation ?? null) : undefined,
      is_active: typeof b.is_active !== "undefined" ? (toBool(b.is_active) ? 1 : 0) : undefined,
      display_order: typeof b.display_order === "number" ? b.display_order : undefined,
    });

    if (!patched) return reply.code(404).send({ error: { message: "not_found" } });
    return reply.send(patched);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "ER_DUP_ENTRY") {
      return reply.code(409).send({ error: { message: "slug_already_exists" } });
    }
    req.log.error({ err }, "cemeteries_update_failed");
    return reply.code(500).send({ error: { message: "cemeteries_update_failed" } });
  }
};

/** DELETE (admin) */
export const removeCemeteryAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const affected = await deleteCemetery(req.params.id);
  if (!affected) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.code(204).send();
};
