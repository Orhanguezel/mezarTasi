// =============================================================
// FILE: src/modules/campaigns/admin.controller.ts
// =============================================================
import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import {
  listSimpleCampaigns,
  getSimpleCampaign,
  createSimpleCampaign,
  updateSimpleCampaign,
  deleteSimpleCampaign,
  packSeoKeywords,
  setSimpleCampaignImage,
  bulkSetActive,
} from "./repository";
import {
  simpleCampaignListQuerySchema,
  upsertSimpleCampaignBodySchema,
  patchSimpleCampaignBodySchema,
  bulkActiveSchema,
  setCampaignImageBodySchema,
  type SimpleCampaignListQuery,
  type UpsertSimpleCampaignBody,
  type PatchSimpleCampaignBody,
  type SetCampaignImageBody,
} from "./validation";

/** helpers */
const toBool = (v: unknown): boolean =>
  v === true || v === 1 || v === "1" || v === "true";
const toTinyInt = (v: unknown): 0 | 1 | undefined =>
  v === undefined ? undefined : (toBool(v) ? 1 : 0);

/* LIST */
export const listSimpleCampaignsAdmin: RouteHandler<{ Querystring: SimpleCampaignListQuery }> = async (req, reply) => {
  const parsed = simpleCampaignListQuerySchema.safeParse(req.query ?? {});
  if (!parsed.success) return reply.code(400).send({ error: { message: "invalid_query", details: parsed.error.flatten() } });

  const q = parsed.data;
  const { items, total } = await listSimpleCampaigns({
    q: q.q,
    is_active: typeof q.is_active !== "undefined" ? (toTinyInt(q.is_active) === 1) : undefined,
    limit: q.limit,
    offset: q.offset,
    sort: q.sort ?? "updated_at",
    order: q.order ?? "desc",
  });

  reply.header("x-total-count", String(total ?? 0));
  reply.header("content-range", `*/${total ?? 0}`);
  reply.header("access-control-expose-headers", "x-total-count, content-range");
  return reply.send(items);
};

/* GET BY ID */
export const getSimpleCampaignAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const view = await getSimpleCampaign(req.params.id);
  if (!view) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(view);
};

/* CREATE */
export const createSimpleCampaignAdmin: RouteHandler<{ Body: UpsertSimpleCampaignBody }> = async (req, reply) => {
  const parsed = upsertSimpleCampaignBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) return reply.code(400).send({ error: { message: "invalid_body", details: parsed.error.flatten() } });

  const b = parsed.data;
  const id = randomUUID();

  const base = {
    id,
    title: b.title,
    description: b.description,
    seo_keywords: packSeoKeywords(b.seoKeywords),
    is_active: toTinyInt(b.is_active) ?? 1,
    created_at: new Date(),
    updated_at: new Date(),
  } as const;

  const withImage: any = { ...base };
  if ("image_url" in b) withImage.image_url = b.image_url ?? null;
  if ("storage_asset_id" in b) withImage.storage_asset_id = b.storage_asset_id ?? null;
  if ("alt" in b) withImage.alt = b.alt ?? null;

  await createSimpleCampaign(withImage);
  const view = await getSimpleCampaign(id);
  return reply.code(201).send(view);
};

/* PATCH */
export const updateSimpleCampaignAdmin: RouteHandler<{ Params: { id: string }; Body: PatchSimpleCampaignBody }> = async (req, reply) => {
  const parsed = patchSimpleCampaignBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) return reply.code(400).send({ error: { message: "invalid_body", details: parsed.error.flatten() } });

  const b = parsed.data;
  const patched = await updateSimpleCampaign(req.params.id, {
    title: typeof b.title !== "undefined" ? b.title : undefined,
    description: typeof b.description !== "undefined" ? b.description : undefined,
    image_url: typeof b.image_url !== "undefined" ? (b.image_url ?? null) : undefined,
    storage_asset_id: typeof b.storage_asset_id !== "undefined" ? (b.storage_asset_id ?? null) : undefined,
    alt: typeof b.alt !== "undefined" ? (b.alt ?? null) : undefined,
    seo_keywords: Array.isArray(b.seoKeywords) ? packSeoKeywords(b.seoKeywords) : undefined,
    is_active: typeof b.is_active !== "undefined" ? (toTinyInt(b.is_active) ?? 0) : undefined,
  });

  if (!patched) return reply.code(404).send({ error: { message: "not_found" } });
  const view = await getSimpleCampaign(req.params.id);
  return reply.send(view);
};

/* DELETE */
export const deleteSimpleCampaignAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const affected = await deleteSimpleCampaign(req.params.id);
  if (!affected) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.code(204).send();
};

/* BULK ACTIVE */
export const bulkActiveAdmin: RouteHandler<{ Body: { ids: string[]; is_active: any } }> = async (req, reply) => {
  const parsed = bulkActiveSchema.safeParse(req.body ?? {});
  if (!parsed.success) return reply.code(400).send({ error: { message: "invalid_body", details: parsed.error.flatten() } });

  const { ids, is_active } = parsed.data;
  await bulkSetActive(ids, toBool(is_active));
  return reply.code(204).send();
};

/* === Tek uç: SET IMAGE === */
export const adminSetCampaignImage: RouteHandler<{ Params: { id: string }; Body: SetCampaignImageBody }> =
  async (req, reply) => {
    const parsed = setCampaignImageBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: "invalid_body", details: parsed.error.flatten() } });
    }
    const updated = await setSimpleCampaignImage(req.params.id, parsed.data);
    if (!updated) return reply.code(404).send({ error: { message: "not_found_or_asset_missing" } });
    return reply.send(updated);
  };

/* === Detach (temizle) === */
export const adminUnsetCampaignImage: RouteHandler<{ Params: { id: string } }> =
  async (req, reply) => {
    const updated = await setSimpleCampaignImage(req.params.id, { storage_asset_id: null, image_url: null });
    if (!updated) return reply.code(404).send({ error: { message: "not_found" } });
    return reply.send(updated);
  };

