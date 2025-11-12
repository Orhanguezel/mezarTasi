// =============================================================
// FILE: src/modules/services/repository.ts
// =============================================================
import { db } from "@/db/client";
import { and, asc, desc, eq, like, sql, inArray } from "drizzle-orm";
import { services, type NewServiceRow } from "./schema";
import { storageAssets } from "@/modules/storage/schema";
import {
  type ServiceAdminListQuery,
  type ServicePublicListQuery,
  type ServiceCreateBody,
  type ServiceUpdateBody,
  type ServiceSetImageBody,
} from "./validation";
import { randomUUID } from "node:crypto";
import { env } from "@/core/env";

/* ---- helpers ---- */
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const sortMap = {
  display_order: (dir: "asc" | "desc") =>
    dir === "asc" ? asc(services.display_order) : desc(services.display_order),
  name: (dir: "asc" | "desc") =>
    dir === "asc" ? asc(services.name) : desc(services.name),
  created_at: (dir: "asc" | "desc") =>
    dir === "asc" ? asc(services.created_at) : desc(services.created_at),
  updated_at: (dir: "asc" | "desc") =>
    dir === "asc" ? asc(services.updated_at) : desc(services.updated_at),
} as const;

/** Provider URL varsa onu, yoksa /storage/:bucket/:path */
function publicUrlOf(bucket?: string | null, path?: string | null, providerUrl?: string | null) {
  if (providerUrl) return providerUrl;
  if (!bucket || !path) return null;

  const encSeg = (s: string) => encodeURIComponent(s);
  const encPath = path.split("/").map(encSeg).join("/");

  const cdnBase = (env.CDN_PUBLIC_BASE || "").replace(/\/+$/, "");
  if (cdnBase) return `${cdnBase}/${encSeg(bucket)}/${encPath}`;

  const apiBase = (env.PUBLIC_API_BASE || "").replace(/\/+$/, "");
  return `${apiBase || ""}/storage/${encSeg(bucket)}/${encPath}`;
}

/** Storage ile uyumlu seçilim: asset bucket/path/provider_url */
const selectWithAsset = {
  svc: services,
  asset_bucket: storageAssets.bucket,
  asset_path: storageAssets.path,
  asset_provider_url: storageAssets.url,
};

/* ---- PUBLIC LIST (aktifler) ---- */
export async function repoListServicesPublic(q: ServicePublicListQuery) {
  const sorts = {
    created_at: services.created_at,
    updated_at: services.updated_at,
    name: services.name,
    display_order: services.display_order,
  } as const;

  const whereParts = [eq(services.is_active, 1)];
  if (q.type && q.type.length) {
    whereParts.push(inArray(services.type, q.type));
  }

  const rows = await db
    .select({
      id: services.id,
      slug: services.slug,
      name: services.name,
      type: services.type,
      category: services.category,
      material: services.material,
      price: services.price,
      description: services.description,
      featured: services.featured,
      is_active: services.is_active,
      display_order: services.display_order,
      image_url: services.image_url,
      image_asset_id: services.image_asset_id, // ✅ isim uyumlu
      alt: services.alt,
      featured_image: services.featured_image,
      area: services.area,
      duration: services.duration,
      maintenance: services.maintenance,
      season: services.season,
      soil_type: services.soil_type,
      thickness: services.thickness,
      equipment: services.equipment,
      warranty: services.warranty,
      includes: services.includes,
      created_at: services.created_at,
      updated_at: services.updated_at,
    })
    .from(services)
    .where(and(...whereParts))
    .orderBy(q.order === "desc" ? desc(sorts[q.sort]) : asc(sorts[q.sort]))
    .limit(q.limit)
    .offset(q.offset);

  return rows;
}

/* ---- ADMIN LIST ---- */
export async function repoListServicesAdmin(q: ServiceAdminListQuery) {
  const where = and(
    q.is_active === undefined ? sql`1=1` : eq(services.is_active, q.is_active ? 1 : (0 as any)),
    q.type ? eq(services.type, q.type) : sql`1=1`,
    q.category ? eq(services.category, q.category) : sql`1=1`,
    q.featured === undefined ? sql`1=1` : eq(services.featured, q.featured ? 1 : (0 as any)),
    q.q ? like(services.name, `%${q.q}%`) : sql`1=1`
  );
  const orderBy = sortMap[q.sort](q.order);

  return db
    .select(selectWithAsset)
    .from(services)
    .leftJoin(storageAssets, eq(services.image_asset_id, storageAssets.id)) // ✅
    .where(where)
    .orderBy(orderBy)
    .limit(q.limit)
    .offset(q.offset);
}

export async function repoGetServiceById(id: string) {
  const [row] = await db
    .select(selectWithAsset)
    .from(services)
    .leftJoin(storageAssets, eq(services.image_asset_id, storageAssets.id)) // ✅
    .where(eq(services.id, id))
    .limit(1);
  return row ?? null;
}

export async function repoGetServiceBySlug(slugStr: string) {
  const [row] = await db
    .select(selectWithAsset)
    .from(services)
    .leftJoin(storageAssets, eq(services.image_asset_id, storageAssets.id)) // ✅
    .where(eq(services.slug, slugStr))
    .limit(1);
  return row ?? null;
}

/** max(display_order) */
async function repoMaxOrder(): Promise<number> {
  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number>`COALESCE(MAX(${services.display_order}), 0)` })
    .from(services);
  return Number(maxOrder || 0);
}

export async function repoCreateService(body: ServiceCreateBody) {
  const display_order = body.display_order ?? (await repoMaxOrder()) + 1;
  const slug = body.slug ? body.slug : slugify(body.name);
  const newId = randomUUID();

  await db.insert(services).values({
    id: newId,
    slug,
    name: body.name,

    type: body.type ?? "other",
    category: body.category ?? "general",
    material: body.material ?? null,
    price: body.price ?? null,
    description: body.description ?? null,

    featured: body.featured ? 1 : 0,
    is_active: body.is_active ? 1 : 0,
    display_order,

    image_url: body.image_url ?? null,
    image_asset_id: body.image_asset_id ?? null, // ✅
    alt: body.alt ?? null,

    featured_image: body.featured_image ?? null,

    area: body.area ?? null,
    duration: body.duration ?? null,
    maintenance: body.maintenance ?? null,
    season: body.season ?? null,

    soil_type: body.soil_type ?? null,
    thickness: body.thickness ?? null,
    equipment: body.equipment ?? null,

    warranty: body.warranty ?? null,
    includes: body.includes ?? null,
  } as NewServiceRow);

  return repoGetServiceById(newId);
}

export async function repoUpdateService(id: string, patch: ServiceUpdateBody) {
  const values: Partial<NewServiceRow> = {};

  if (patch.name !== undefined) values.name = patch.name;
  if (patch.slug !== undefined) values.slug = patch.slug || slugify(values.name ?? "");
  if (patch.type !== undefined) values.type = patch.type ?? "other";
  if (patch.category !== undefined) values.category = patch.category ?? "general";

  if (patch.material !== undefined) values.material = patch.material ?? null;
  if (patch.price !== undefined) values.price = patch.price ?? null;
  if (patch.description !== undefined) values.description = patch.description ?? null;

  if (patch.image_url !== undefined) values.image_url = patch.image_url ?? null;
  if (patch.image_asset_id !== undefined) values.image_asset_id = patch.image_asset_id ?? null; // ✅
  if (patch.alt !== undefined) values.alt = patch.alt ?? null;

  if (patch.featured_image !== undefined) values.featured_image = patch.featured_image ?? null;

  if (patch.featured !== undefined) values.featured = patch.featured ? 1 : 0;
  if (patch.is_active !== undefined) values.is_active = patch.is_active ? 1 : 0;
  if (patch.display_order !== undefined) values.display_order = patch.display_order;

  if (patch.area !== undefined) values.area = patch.area ?? null;
  if (patch.duration !== undefined) values.duration = patch.duration ?? null;
  if (patch.maintenance !== undefined) values.maintenance = patch.maintenance ?? null;
  if (patch.season !== undefined) values.season = patch.season ?? null;

  if (patch.soil_type !== undefined) values.soil_type = patch.soil_type ?? null;
  if (patch.thickness !== undefined) values.thickness = patch.thickness ?? null;
  if (patch.equipment !== undefined) values.equipment = patch.equipment ?? null;

  if (patch.warranty !== undefined) values.warranty = patch.warranty ?? null;
  if (patch.includes !== undefined) values.includes = patch.includes ?? null;

  if (Object.keys(values).length === 0) return repoGetServiceById(id);

  await db.update(services).set(values).where(eq(services.id, id));
  return repoGetServiceById(id);
}

export async function repoDeleteService(id: string) {
  await db.delete(services).where(eq(services.id, id));
  return { ok: true as const };
}

export async function repoReorderServices(ids: string[]) {
  await db.transaction(async (trx) => {
    for (let i = 0; i < ids.length; i++) {
      await trx
        .update(services)
        .set({ display_order: i + 1 })
        .where(eq(services.id, ids[i]));
    }
  });
  return { ok: true as const };
}

export async function repoSetServiceStatus(id: string, isActive: boolean) {
  await db
    .update(services)
    .set({ is_active: isActive ? 1 : 0 })
    .where(eq(services.id, id));
  return repoGetServiceById(id);
}

/** ✅ SET IMAGE (kategori/slider ile aynı davranış)
 * Body: { asset_id?: string | null }
 * - asset_id verilirse → storage_assets’tan public URL bulunur ve image_asset_id + image_url set edilir
 * - null/undefined ise → image_asset_id = NULL, image_url = NULL
 */
export async function repoSetServiceImage(id: string, body: ServiceSetImageBody) {
  const assetId = body.asset_id ?? null;

  if (!assetId) {
    await db
      .update(services)
      .set({ image_url: null, image_asset_id: null } as Partial<NewServiceRow>)
      .where(eq(services.id, id));
    return repoGetServiceById(id);
  }

  const [asset] = await db
    .select({ bucket: storageAssets.bucket, path: storageAssets.path, url: storageAssets.url })
    .from(storageAssets)
    .where(eq(storageAssets.id, assetId))
    .limit(1);

  if (!asset) return null;

  const finalUrl = publicUrlOf(asset.bucket, asset.path, asset.url ?? null);

  await db
    .update(services)
    .set({ image_url: finalUrl, image_asset_id: assetId } as Partial<NewServiceRow>)
    .where(eq(services.id, id));

  return repoGetServiceById(id);
}
