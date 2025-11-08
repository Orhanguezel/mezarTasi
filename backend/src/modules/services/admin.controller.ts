// src/modules/services/admin.controller.ts
import type { RouteHandler } from "fastify";
import { z } from "zod";

import {
  serviceAdminListQuerySchema,
  serviceCreateSchema,
  serviceUpdateSchema,
  serviceReorderSchema,
  serviceSetStatusSchema,
  serviceAttachImageSchema,
} from "./validation.js";
import {
  repoListServicesAdmin,
  repoGetServiceById,
  repoCreateService,
  repoUpdateService,
  repoDeleteService,
  repoReorderServices,
  repoSetServiceStatus,
  repoAttachServiceImage,
  repoDetachServiceImage,
} from "./repository.js";

import { env } from "@/core/env";
import { db } from "@/db/client";
import { and, eq, like, sql as dsql } from "drizzle-orm";
import { services } from "./schema.js";

/* ---- publicUrlOf: storage ile birebir aynı kurallar ---- */
function publicUrlOf(
  bucket?: string | null,
  path?: string | null,
  providerUrl?: string | null
): string | null {
  if (!bucket || !path) return providerUrl ?? null;
  if (providerUrl) return providerUrl;
  const cdnBase = (env.CDN_PUBLIC_BASE || "").replace(/\/+$/, "");
  if (cdnBase)
    return `${cdnBase}/${encodeURIComponent(bucket)}/${path
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;
  const apiBase = (env.PUBLIC_API_BASE || "").replace(/\/+$/, "");
  return `${apiBase || ""}/storage/${encodeURIComponent(bucket)}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

/* ---- slider ile aynı view alanları ---- */
const toAdminView = (row: any) => {
  const s = row.svc ?? row; // repo bazı yerlerde { svc, ... } döndürüyor olabilir
  const eff =
    row.asset_bucket
      ? publicUrlOf(row.asset_bucket, row.asset_path, row.asset_provider_url)
      : (s.image_url ?? s.featured_image ?? null);

  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    description: s.description ?? null,

    image_url: s.image_url ?? null,
    storage_asset_id: s.storage_asset_id ?? null,
    image_effective_url: eff,

    alt: s.alt ?? null,

    // service-specific
    type: s.type,
    category: s.category,
    material: s.material ?? null,
    price: s.price ?? null,

    featured: !!s.featured,
    is_active: !!s.is_active,
    display_order: s.display_order,

    // extras
    area: s.area ?? null,
    duration: s.duration ?? null,
    maintenance: s.maintenance ?? null,
    season: s.season ?? null,

    soil_type: s.soil_type ?? null,
    thickness: s.thickness ?? null,
    equipment: s.equipment ?? null,

    warranty: s.warranty ?? null,
    includes: s.includes ?? null,

    created_at: s.created_at,
    updated_at: s.updated_at,
  };
};

// Tip yardımcıları (Zod’dan derive)
type AdminListQuery = z.infer<typeof serviceAdminListQuerySchema>;
type CreateBody = z.infer<typeof serviceCreateSchema>;
type UpdateBody = z.infer<typeof serviceUpdateSchema>;
type ReorderBody = z.infer<typeof serviceReorderSchema>;
type SetStatusBody = z.infer<typeof serviceSetStatusSchema>;
type AttachImageBody = z.infer<typeof serviceAttachImageSchema>;

/** GET /admin/services */
export const adminListServices: RouteHandler<{ Querystring: AdminListQuery }> = async (
  req,
  reply
) => {
  const parsed = serviceAdminListQuerySchema.safeParse(req.query);
  if (!parsed.success)
    return reply.code(400).send({
      error: { message: "invalid_query", issues: parsed.error.flatten() },
    });

  const q = parsed.data;

  // toplam sayıyı başlıklarda ver
  const where = and(
    q.is_active === undefined
      ? dsql`1=1`
      : eq(services.is_active, q.is_active ? 1 : (0 as any)),
    q.type ? eq(services.type, q.type) : dsql`1=1`,
    q.category ? eq(services.category, q.category) : dsql`1=1`,
    q.featured === undefined
      ? dsql`1=1`
      : eq(services.featured, q.featured ? 1 : (0 as any)),
    q.q ? like(services.name, `%${q.q}%`) : dsql`1=1`
  );

  const [{ total }] = await db
    .select({ total: dsql<number>`COUNT(*)` })
    .from(services)
    .where(where);

  const rows = await repoListServicesAdmin(q);

  reply.header("x-total-count", String(total));
  reply.header("content-range", `*/${total}`);
  reply.header("access-control-expose-headers", "x-total-count, content-range");

  return rows.map(toAdminView);
};

/** GET /admin/services/:id */
export const adminGetService: RouteHandler<{ Params: { id: string } }> = async (
  req,
  reply
) => {
  const id = String((req.params as any)?.id || "");
  if (!id) return reply.code(400).send({ error: { message: "invalid_params" } });
  const row = await repoGetServiceById(id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return toAdminView(row);
};

/** POST /admin/services */
export const adminCreateService: RouteHandler<{ Body: CreateBody }> = async (
  req,
  reply
) => {
  const b = serviceCreateSchema.safeParse(req.body);
  if (!b.success)
    return reply.code(400).send({
      error: { message: "invalid_body", issues: b.error.flatten() },
    });
  const created = await repoCreateService(b.data);
  return reply.code(201).send(toAdminView(created));
};

/** PATCH /admin/services/:id */
export const adminUpdateService: RouteHandler<{
  Params: { id: string };
  Body: UpdateBody;
}> = async (req, reply) => {
  const id = String((req.params as any)?.id || "");
  if (!id) return reply.code(400).send({ error: { message: "invalid_params" } });
  const b = serviceUpdateSchema.safeParse(req.body);
  if (!b.success)
    return reply.code(400).send({
      error: { message: "invalid_body", issues: b.error.flatten() },
    });
  const updated = await repoUpdateService(id, b.data);
  if (!updated) return reply.code(404).send({ error: { message: "not_found" } });
  return toAdminView(updated);
};

/** DELETE /admin/services/:id */
export const adminDeleteService: RouteHandler<{ Params: { id: string } }> =
  async (req, reply) => {
    const id = String((req.params as any)?.id || "");
    if (!id)
      return reply.code(400).send({ error: { message: "invalid_params" } });
    await repoDeleteService(id);
    return { ok: true };
  };

/** POST /admin/services/reorder */
export const adminReorderServices: RouteHandler<{ Body: ReorderBody }> = async (
  req,
  reply
) => {
  const b = serviceReorderSchema.safeParse(req.body);
  if (!b.success)
    return reply.code(400).send({
      error: { message: "invalid_body", issues: b.error.flatten() },
    });
  await repoReorderServices(b.data.ids);
  return { ok: true };
};

/** POST /admin/services/:id/status */
export const adminSetServiceStatus: RouteHandler<{
  Params: { id: string };
  Body: SetStatusBody;
}> = async (req, reply) => {
  const id = String((req.params as any)?.id || "");
  if (!id) return reply.code(400).send({ error: { message: "invalid_params" } });
  const b = serviceSetStatusSchema.safeParse(req.body);
  if (!b.success)
    return reply.code(400).send({
      error: { message: "invalid_body", issues: b.error.flatten() },
    });
  const updated = await repoSetServiceStatus(id, b.data.is_active);
  if (!updated) return reply.code(404).send({ error: { message: "not_found" } });
  return toAdminView(updated);
};

/** POST /admin/services/:id/attach-image */
export const adminAttachServiceImage: RouteHandler<{
  Params: { id: string };
  Body: AttachImageBody;
}> = async (req, reply) => {
  const id = String((req.params as any)?.id || "");
  if (!id) return reply.code(400).send({ error: { message: "invalid_params" } });
  const b = serviceAttachImageSchema.safeParse(req.body);
  if (!b.success)
    return reply.code(400).send({
      error: { message: "invalid_body", issues: b.error.flatten() },
    });

  // exactOptionalPropertyTypes: undefined ekleme
  const body: { storage_asset_id?: string; image_url?: string } = {};
  if (b.data.storage_asset_id) body.storage_asset_id = b.data.storage_asset_id;
  if (b.data.image_url) body.image_url = b.data.image_url;

  const updated = await repoAttachServiceImage(id, body);
  if (!updated) return reply.code(404).send({ error: { message: "not_found" } });
  return toAdminView(updated);
};

/** POST /admin/services/:id/detach-image */
export const adminDetachServiceImage: RouteHandler<{ Params: { id: string } }> =
  async (req, reply) => {
    const id = String((req.params as any)?.id || "");
    if (!id)
      return reply.code(400).send({ error: { message: "invalid_params" } });
    const updated = await repoDetachServiceImage(id);
    if (!updated) return reply.code(404).send({ error: { message: "not_found" } });
    return toAdminView(updated);
  };
