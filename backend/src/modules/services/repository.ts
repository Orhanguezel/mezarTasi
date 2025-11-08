import { db } from "@/db/client";
import { and, asc, desc, eq, like, sql } from "drizzle-orm";
import { services, type NewServiceRow } from "./schema";
import { storageAssets } from "@/modules/storage/schema";
import {
  type ServiceAdminListQuery,
  type ServicePublicListQuery,
  type ServiceCreateBody,
  type ServiceUpdateBody,
} from "./validation";
import { randomUUID } from "node:crypto";

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

/** Storage ile uyumlu seçilim: asset bucket/path/provider_url */
const selectWithAsset = {
  svc: services,
  asset_bucket: storageAssets.bucket,
  asset_path: storageAssets.path,
  asset_provider_url: storageAssets.url,
};

/* ---- PUBLIC LIST (aktifler) ---- */
export async function repoListServicesPublic(q: ServicePublicListQuery) {
  const where = and(
    eq(services.is_active, 1 as any),
    q.q ? like(services.name, `%${q.q}%`) : sql`1=1`
  );
  const orderBy = sortMap[q.sort](q.order);

  return db
    .select(selectWithAsset)
    .from(services)
    .leftJoin(storageAssets, eq(services.storage_asset_id, storageAssets.id))
    .where(where)
    .orderBy(orderBy)
    .limit(q.limit)
    .offset(q.offset);
}

/* ---- ADMIN LIST ---- */
export async function repoListServicesAdmin(q: ServiceAdminListQuery) {
  const where = and(
    q.is_active === undefined
      ? sql`1=1`
      : eq(services.is_active, q.is_active ? 1 : (0 as any)),
    q.type ? eq(services.type, q.type) : sql`1=1`,
    q.category ? eq(services.category, q.category) : sql`1=1`,
    q.featured === undefined
      ? sql`1=1`
      : eq(services.featured, q.featured ? 1 : (0 as any)),
    q.q ? like(services.name, `%${q.q}%`) : sql`1=1`
  );
  const orderBy = sortMap[q.sort](q.order);

  return db
    .select(selectWithAsset)
    .from(services)
    .leftJoin(storageAssets, eq(services.storage_asset_id, storageAssets.id))
    .where(where)
    .orderBy(orderBy)
    .limit(q.limit)
    .offset(q.offset);
}

export async function repoGetServiceById(id: string) {
  const [row] = await db
    .select(selectWithAsset)
    .from(services)
    .leftJoin(storageAssets, eq(services.storage_asset_id, storageAssets.id))
    .where(eq(services.id, id))
    .limit(1);
  return row ?? null;
}

export async function repoGetServiceBySlug(slugStr: string) {
  const [row] = await db
    .select(selectWithAsset)
    .from(services)
    .leftJoin(storageAssets, eq(services.storage_asset_id, storageAssets.id))
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
    storage_asset_id: body.storage_asset_id ?? null,
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
  if (patch.storage_asset_id !== undefined) values.storage_asset_id = patch.storage_asset_id ?? null;
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

/* ---- Görsel attach/detach (slider patern) ---- */
export async function repoAttachServiceImage(
  id: string,
  opts: { storage_asset_id?: string; image_url?: string }
) {
  const set: Partial<NewServiceRow> = {};
  if (opts.storage_asset_id) set.storage_asset_id = opts.storage_asset_id;
  if (opts.image_url) set.image_url = opts.image_url;
  if (Object.keys(set).length === 0) return repoGetServiceById(id);
  await db.update(services).set(set).where(eq(services.id, id));
  return repoGetServiceById(id);
}

export async function repoDetachServiceImage(id: string) {
  await db
    .update(services)
    .set({ storage_asset_id: null, image_url: null })
    .where(eq(services.id, id));
  return repoGetServiceById(id);
}
