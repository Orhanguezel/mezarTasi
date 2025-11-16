// =============================================================
// FILE: src/modules/accessories/admin.controller.ts
// =============================================================
import type { RouteHandler } from "fastify";
import {
  listQuerySchema,
  idParamSchema,
  createAccessorySchema,
  updateAccessorySchema,
  accessorySetImageSchema,  // ✅
  type AccessorySetImageInput, // ✅
} from "./validation";
import { repoCreate, repoDelete, repoGetById, repoListAdmin, repoUpdate } from "./repository";
import { env } from "@/core/env";
import { db } from "@/db/client";
import { accessories } from "./schema";
import { storageAssets } from "@/modules/storage/schema";
import { eq, sql } from "drizzle-orm";

function encSeg(s: string) { return encodeURIComponent(s); }
function encPath(p: string) { return p.split("/").map(encSeg).join("/"); }
function effectiveUrl(asset_url?: string | null, bucket?: string | null, path?: string | null, legacy?: string | null) {
  if (asset_url) return asset_url;
  if (bucket && path) {
    const cdnBase = (env.CDN_PUBLIC_BASE || "").replace(/\/+$/, "");
    if (cdnBase) return `${cdnBase}/${encSeg(bucket)}/${encPath(path)}`;
    const apiBase = (env.PUBLIC_API_BASE || "").replace(/\/+$/, "");
    return `${apiBase || ""}/storage/${encSeg(bucket)}/${encPath(path)}`;
  }
  return legacy ?? null;
}

/** GET /admin/accessories */
export const adminListAccessories: RouteHandler<{ Querystring: unknown }> = async (req, reply) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_query", issues: parsed.error.flatten() } });
  }
  const rows = await repoListAdmin(parsed.data);
  return rows.map((r) => ({
    ...r.acc,
    image_effective_url: effectiveUrl(r.asset_url, r.asset_bucket, r.asset_path, r.acc.image_url),
  }));
};

/** GET /admin/accessories/:id */
export const adminGetAccessory: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const p = idParamSchema.safeParse({ id: req.params.id });
  if (!p.success) return reply.code(400).send({ error: { message: "invalid_id" } });

  const row = await repoGetById(p.data.id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });

  return {
    ...row.acc,
    image_effective_url: effectiveUrl(row.asset_url, row.asset_bucket, row.asset_path, row.acc.image_url),
  };
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


/** ✅ PATCH /admin/accessories/:id/image (asset_id + alt) */
export const adminSetAccessoryImage: RouteHandler<{
  Params: { id: string };
  Body: AccessorySetImageInput;
}> = async (req, reply) => {
  const pid = idParamSchema.safeParse({ id: req.params.id });
  if (!pid.success) return reply.code(400).send({ error: { message: "invalid_id" } });

  const body = accessorySetImageSchema.safeParse(req.body ?? {});
  if (!body.success) {
    return reply.code(400).send({ error: { message: "invalid_body", issues: body.error.flatten() } });
  }

  const id = pid.data.id;
  const assetId = body.data.asset_id ?? null;
  const alt = body.data.alt; // undefined ⇒ dokunma, null ⇒ temizle

  // kaldır
  if (!assetId) {
    const patch: Record<string, unknown> = {
      image_url: null,
      storage_asset_id: null,
      updated_at: sql`CURRENT_TIMESTAMP(3)`,
    };
    if (alt !== undefined) patch.alt = alt as string | null;

    await db.update(accessories).set(patch as any).where(eq(accessories.id, id));
  } else {
    // asset'ten public URL üret
    const [asset] = await db
      .select({ bucket: storageAssets.bucket, path: storageAssets.path, url: storageAssets.url })
      .from(storageAssets)
      .where(eq(storageAssets.id, assetId))
      .limit(1);

    if (!asset) return reply.code(404).send({ error: { message: "asset_not_found" } });

    const encSeg = (s: string) => encodeURIComponent(s);
    const encPath = (p: string) => p.split("/").map(encSeg).join("/");
    const cdnBase = (env.CDN_PUBLIC_BASE || "").replace(/\/+$/, "");
    const apiBase = (env.PUBLIC_API_BASE || "").replace(/\/+$/, "");
    const publicUrl = asset.url
      ? asset.url
      : cdnBase
        ? `${cdnBase}/${encSeg(asset.bucket)}/${encPath(asset.path)}`
        : `${apiBase || ""}/storage/${encSeg(asset.bucket)}/${encPath(asset.path)}`;

    const patch: Record<string, unknown> = {
      image_url: publicUrl,
      storage_asset_id: assetId,
      updated_at: sql`CURRENT_TIMESTAMP(3)`,
    };
    if (alt !== undefined) patch.alt = alt as string | null;

    await db.update(accessories).set(patch as any).where(eq(accessories.id, id));
  }

  // geri dön
  const row = await repoGetById(id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return {
    ...row.acc,
    image_effective_url: effectiveUrl(row.asset_url, row.asset_bucket, row.asset_path, row.acc.image_url),
  };
};
