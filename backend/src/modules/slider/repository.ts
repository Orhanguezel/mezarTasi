// src/modules/slider/repository.ts
import { db } from "@/db/client";
import { sql, and, desc, asc, like, eq } from "drizzle-orm";
import { slider } from "./schema";
import { storageAssets } from "@/modules/storage/schema";
import type { CreateBody, UpdateBody, PublicListQuery, AdminListQuery } from "./validation";

/* Yardımcılar */
const slugify = (s: string) =>
  s.toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const sortMap = {
  display_order: (dir: "asc" | "desc") => (dir === "asc" ? asc(slider.display_order) : desc(slider.display_order)),
  name:          (dir: "asc" | "desc") => (dir === "asc" ? asc(slider.name)          : desc(slider.name)),
  created_at:    (dir: "asc" | "desc") => (dir === "asc" ? asc(slider.created_at)    : desc(slider.created_at)),
  updated_at:    (dir: "asc" | "desc") => (dir === "asc" ? asc(slider.updated_at)    : desc(slider.updated_at)),
} as const;

/** PUBLIC: aktif slider’lar (image_effective_url birlikte) */
export async function repoListPublic(q: PublicListQuery) {
  const where = and(
    eq(slider.is_active, 1 as any),
    q.q ? like(slider.name, `%${q.q}%`) : undefined
  );
  const orderBy = sortMap[q.sort](q.order);

  const rows = await db
    .select({
      sl: slider,
      asset_url: sql<string | null>`COALESCE(${storageAssets.url}, ${slider.image_url})`,
    })
    .from(slider)
    .leftJoin(storageAssets, eq(slider.storage_asset_id, storageAssets.id))
    .where(where)
    .orderBy(orderBy)
    .limit(q.limit)
    .offset(q.offset);

  return rows;
}

/** ADMIN: liste */
export async function repoListAdmin(q: AdminListQuery) {
  const where = and(
    q.is_active === undefined ? undefined : eq(slider.is_active, q.is_active ? 1 as any : 0 as any),
    q.q ? like(slider.name, `%${q.q}%`) : undefined
  );
  const orderBy = sortMap[q.sort](q.order);

  const rows = await db
    .select({
      sl: slider,
      asset_url: sql<string | null>`COALESCE(${storageAssets.url}, ${slider.image_url})`,
    })
    .from(slider)
    .leftJoin(storageAssets, eq(slider.storage_asset_id, storageAssets.id))
    .where(where)
    .orderBy(orderBy)
    .limit(q.limit)
    .offset(q.offset);

  return rows;
}

export async function repoGetById(id: number) {
  const [row] = await db
    .select({
      sl: slider,
      asset_url: sql<string | null>`COALESCE(${storageAssets.url}, ${slider.image_url})`,
    })
    .from(slider)
    .leftJoin(storageAssets, eq(slider.storage_asset_id, storageAssets.id))
    .where(eq(slider.id, id))
    .limit(1);
  return row ?? null;
}

export async function repoGetBySlug(slugStr: string) {
  const [row] = await db
    .select({
      sl: slider,
      asset_url: sql<string | null>`COALESCE(${storageAssets.url}, ${slider.image_url})`,
    })
    .from(slider)
    .leftJoin(storageAssets, eq(slider.storage_asset_id, storageAssets.id))
    .where(eq(slider.slug, slugStr))
    .limit(1);
  return row ?? null;
}

/** max(display_order) */
async function repoMaxOrder(): Promise<number> {
  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number>`COALESCE(MAX(${slider.display_order}), 0)` })
    .from(slider);
  return Number(maxOrder || 0);
}

export async function repoCreate(body: CreateBody) {
  const display_order = body.display_order ?? (await repoMaxOrder()) + 1;
  const slug = body.slug ? body.slug : slugify(body.name);

  // MySQL: returning() yok → $returningId() kullan
  const insertedIdAny: any = await db
    .insert(slider)
    .values({
      uuid: crypto.randomUUID(),
      name: body.name,
      slug,
      description: body.description ?? null,
      image_url: body.image_url ?? null,
      storage_asset_id: body.storage_asset_id ?? null,
      alt: body.alt,
      buttonText: body.buttonText,
      buttonLink: body.buttonLink,
      featured: body.featured ? 1 : 0,
      is_active: body.is_active ? 1 : 0,
      display_order,
    })
    .$returningId();

  // Farklı sürücüler için güvenli ID çıkarımı
  const newId =
    typeof insertedIdAny === "number"
      ? insertedIdAny
      : (Array.isArray(insertedIdAny) && insertedIdAny.length && (insertedIdAny[0]?.id ?? insertedIdAny[0])) ||
        insertedIdAny?.id ||
        insertedIdAny?.insertId;

  return repoGetById(Number(newId));
}

export async function repoUpdate(id: number, patch: UpdateBody) {
  const values: Partial<typeof slider.$inferInsert> = {};
  if (patch.name !== undefined) values.name = patch.name;
  if (patch.slug !== undefined) values.slug = patch.slug || slugify(values.name ?? "");
  if (patch.description !== undefined) values.description = patch.description ?? null;

  if (patch.image_url !== undefined) values.image_url = patch.image_url ?? null;
  if (patch.storage_asset_id !== undefined) values.storage_asset_id = patch.storage_asset_id ?? null;
  if (patch.alt !== undefined) values.alt = patch.alt;
  if (patch.buttonText !== undefined) values.buttonText = patch.buttonText;
  if (patch.buttonLink !== undefined) values.buttonLink = patch.buttonLink;

  if (patch.featured !== undefined) values.featured = patch.featured ? 1 : 0;
  if (patch.is_active !== undefined) values.is_active = patch.is_active ? 1 : 0;
  if (patch.display_order !== undefined) values.display_order = patch.display_order;

  if (Object.keys(values).length === 0) return repoGetById(id);

  await db.update(slider).set(values).where(eq(slider.id, id));
  return repoGetById(id);
}

export async function repoDelete(id: number) {
  await db.delete(slider).where(eq(slider.id, id));
  return { ok: true as const };
}

export async function repoReorder(ids: number[]) {
  await db.transaction(async (trx) => {
    for (let i = 0; i < ids.length; i++) {
      await trx.update(slider)
        .set({ display_order: i + 1 })
        .where(eq(slider.id, ids[i]));
    }
  });
  return { ok: true as const };
}

export async function repoSetStatus(id: number, isActive: boolean) {
  await db.update(slider).set({ is_active: isActive ? 1 : 0 }).where(eq(slider.id, id));
  return repoGetById(id);
}

/** Görsel bağlama: storage_asset_id veya image_url set edilir */
export async function repoAttachImage(id: number, opts: { storage_asset_id?: string; image_url?: string }) {
  const set: Partial<typeof slider.$inferInsert> = {};
  if (opts.storage_asset_id) set.storage_asset_id = opts.storage_asset_id;
  if (opts.image_url) set.image_url = opts.image_url;
  if (Object.keys(set).length === 0) return repoGetById(id);
  await db.update(slider).set(set).where(eq(slider.id, id));
  return repoGetById(id);
}

/** Görseli kopar (her iki alanı da null’la) */
export async function repoDetachImage(id: number) {
  await db.update(slider)
    .set({ storage_asset_id: null, image_url: null })
    .where(eq(slider.id, id));
  return repoGetById(id);
}
