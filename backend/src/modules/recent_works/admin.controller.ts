// =============================================================
// FILE: src/modules/recent-works/admin.controller.ts
// =============================================================
import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import {
  listRecentWorks,
  getRecentWorkById,
  getRecentWorkBySlug,
  createRecentWork,
  updateRecentWork,
  deleteRecentWork,
  repoSetRecentWorkImage,
  attachRecentWorkImage, 
  detachRecentWorkImage 
} from "./repository";
import {
  recentWorkListQuerySchema,
  upsertRecentWorkBodySchema,
  patchRecentWorkBodySchema,
  setRecentWorkImageBodySchema,
  type RecentWorkListQuery,
  type UpsertRecentWorkBody,
  type PatchRecentWorkBody,
  type SetRecentWorkImageBody,
} from "./validation";


const toBool = (v: unknown): boolean =>
  v === true || v === 1 || v === "1" || v === "true";

/** LIST (admin) */
export const listRecentWorksAdmin: RouteHandler<{ Querystring: RecentWorkListQuery }> = async (req, reply) => {
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
    is_active: q.is_active,
  });

  reply.header("x-total-count", String(total ?? 0));
  return reply.send(items);
};

/** GET BY ID (admin) */
export const getRecentWorkAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const row = await getRecentWorkById(req.params.id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};

/** GET BY SLUG (admin) */
export const getRecentWorkBySlugAdmin: RouteHandler<{ Params: { slug: string } }> = async (req, reply) => {
  const row = await getRecentWorkBySlug(req.params.slug);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};

/** CREATE (admin) */
export const createRecentWorkAdmin: RouteHandler<{ Body: UpsertRecentWorkBody }> = async (req, reply) => {
  const parsed = upsertRecentWorkBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_body", issues: parsed.error.issues } });
  }
  const b = parsed.data;

  try {
    const row = await createRecentWork({
      id: randomUUID(),
      title: b.title.trim(),
      slug: b.slug.trim(),
      description: b.description,

      image_url: b.image_url ?? null,
      storage_asset_id: b.storage_asset_id ?? null,
      alt: typeof b.alt === "string" ? b.alt : b.alt ?? null,

      category: b.category.trim(),
      seo_keywords: JSON.stringify(Array.isArray(b.seoKeywords) ? b.seoKeywords : []),

      date: b.date.trim(),
      location: b.location.trim(),
      material: b.material.trim(),
      price: typeof b.price === "string" ? b.price.trim() : b.price ?? null,

      details: {
        dimensions: b.details.dimensions,
        workTime: b.details.workTime,
        specialFeatures: Array.isArray(b.details.specialFeatures) ? b.details.specialFeatures : [],
        customerReview: typeof b.details.customerReview === "string" ? b.details.customerReview : null,
      },

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
    req.log.error({ err }, "recent_works_create_failed");
    return reply.code(500).send({ error: { message: "recent_works_create_failed" } });
  }
};

/** UPDATE (admin, partial) */
export const updateRecentWorkAdmin: RouteHandler<{ Params: { id: string }; Body: PatchRecentWorkBody }> = async (req, reply) => {
  const parsed = patchRecentWorkBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_body", issues: parsed.error.issues } });
  }
  const b = parsed.data;

  try {
    const patched = await updateRecentWork(req.params.id, {
      title: typeof b.title === "string" ? b.title.trim() : undefined,
      slug: typeof b.slug === "string" ? b.slug.trim() : undefined,
      description: typeof b.description === "string" ? b.description : undefined,

      image_url: typeof b.image_url !== "undefined" ? (b.image_url ?? null) : undefined,
      storage_asset_id: typeof b.storage_asset_id !== "undefined" ? (b.storage_asset_id ?? null) : undefined,
      alt: typeof b.alt !== "undefined" ? (b.alt ?? null) : undefined,

      category: typeof b.category === "string" ? b.category.trim() : undefined,
      seo_keywords: Array.isArray(b.seoKeywords) ? JSON.stringify(b.seoKeywords) : undefined,

      date: typeof b.date === "string" ? b.date.trim() : undefined,
      location: typeof b.location === "string" ? b.location.trim() : undefined,
      material: typeof b.material === "string" ? b.material.trim() : undefined,
      price: typeof b.price !== "undefined" ? (typeof b.price === "string" ? b.price.trim() : b.price) : undefined,

      details: typeof b.details !== "undefined" ? {
        dimensions: typeof b.details?.dimensions === "string" ? b.details.dimensions : undefined as any,
        workTime: typeof b.details?.workTime === "string" ? b.details.workTime : undefined as any,
        specialFeatures: Array.isArray(b.details?.specialFeatures) ? b.details.specialFeatures : undefined as any,
        customerReview: typeof b.details?.customerReview !== "undefined"
          ? (b.details?.customerReview ?? null)
          : undefined as any,
      } : undefined,

      is_active: typeof b.is_active !== "undefined" ? (toBool(b.is_active) ? 1 : 0) : undefined,
      display_order: typeof b.display_order === "number" ? b.display_order : undefined,
    } as any);

    if (!patched) return reply.code(404).send({ error: { message: "not_found" } });
    return reply.send(patched);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "ER_DUP_ENTRY") {
      return reply.code(409).send({ error: { message: "slug_already_exists" } });
    }
    req.log.error({ err }, "recent_works_update_failed");
    return reply.code(500).send({ error: { message: "recent_works_update_failed" } });
  }
};

/** DELETE (admin) */
export const removeRecentWorkAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const res = await deleteRecentWork(req.params.id);
  if (!res) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.code(204).send();
};

/** ✅ SET IMAGE (admin) – tek uç */
export const adminSetRecentWorkImage: RouteHandler<{ Params: { id: string }; Body: SetRecentWorkImageBody }> =
  async (req, reply) => {
    const b = setRecentWorkImageBodySchema.safeParse(req.body ?? {});
    if (!b.success) {
      return reply.code(400).send({ error: { message: "invalid_body", issues: b.error.issues } });
    }
    const updated = await repoSetRecentWorkImage(req.params.id, b.data);
    if (!updated) return reply.code(404).send({ error: { message: "not_found_or_asset_missing" } });
    return reply.send(updated);
  };



// repo’daki geri uyum fonksiyonları

// Body: storage_asset_id? / image_url? / alt?  (FE RTK ile birebir)
export const attachImageAdmin: RouteHandler<{ Params: { id: string }; Body: { storage_asset_id?: string; image_url?: string; alt?: string | null } }> =
  async (req, reply) => {
    const row = await attachRecentWorkImage(req.params.id, {
      storage_asset_id: req.body?.storage_asset_id,
      image_url: req.body?.image_url,
      alt: typeof req.body?.alt === "string" ? req.body.alt : req.body?.alt ?? null,
    });
    if (!row) return reply.code(404).send({ error: { message: "not_found_or_asset_missing" } });
    return reply.send(row);
  };

export const detachImageAdmin: RouteHandler<{ Params: { id: string } }> =
  async (req, reply) => {
    const row = await detachRecentWorkImage(req.params.id);
    if (!row) return reply.code(404).send({ error: { message: "not_found" } });
    return reply.send(row);
  };