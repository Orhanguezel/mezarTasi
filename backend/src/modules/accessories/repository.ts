// =============================================================
// FILE: src/modules/accessories/repository.ts
// =============================================================
import { and, asc, desc, eq, like, or, sql as dsql } from "drizzle-orm";
import { db } from "@/db/client";
import { accessories, type NewAccessoryRow } from "./schema";
import { storageAssets } from "@/modules/storage/schema";
import type { ListQuery, CreateAccessoryInput, UpdateAccessoryInput } from "./validation";
import { env } from "@/core/env";
import { randomUUID } from "crypto";

/* ---- helpers ---- */
const ORDER_COL = {
  display_order: accessories.display_order,
  name: accessories.name,
  created_at: accessories.created_at,
  updated_at: accessories.updated_at,
} as const;

function parseOrder(q: ListQuery) {
  const col = ORDER_COL[q.sort ?? "display_order"] ?? accessories.display_order;
  return q.order === "desc" ? desc(col) : asc(col);
}

/** boolean/0/1 → 0|1 */
function toTinyint(v: unknown, def = 0): 0 | 1 {
  if (v === 1 || v === "1" || v === true) return 1;
  if (v === 0 || v === "0" || v === false) return 0;
  return def as 0 | 1;
}

/* ---- effective public URL (storage patern) ---- */
function encSeg(s: string) { return encodeURIComponent(s); }
function encPath(p: string) { return p.split("/").map(encSeg).join("/"); }
function effectiveUrl(opts: { asset_url?: string | null; bucket?: string | null; path?: string | null; legacy?: string | null }) {
  if (opts.asset_url) return opts.asset_url;
  if (opts.bucket && opts.path) {
    const cdnBase = (env.CDN_PUBLIC_BASE || "").replace(/\/+$/, "");
    if (cdnBase) return `${cdnBase}/${encSeg(opts.bucket)}/${encPath(opts.path)}`;
    const apiBase = (env.PUBLIC_API_BASE || "").replace(/\/+$/, "");
    return `${apiBase || ""}/storage/${encSeg(opts.bucket)}/${encPath(opts.path)}`;
  }
  return opts.legacy ?? null;
}

/* ---- public list (yalnız aktifler) ---- */
export async function repoListPublic(q: ListQuery) {
  const where = and(
    eq(accessories.is_active, 1),
    q.category ? eq(accessories.category, q.category) : dsql`1=1`,
    q.q
      ? or(
          like(accessories.name, `%${q.q}%`),
          like(accessories.material, `%${q.q}%`),
          like(accessories.description, `%${q.q}%`)
        )
      : dsql`1=1`
  );

  const rows = await db
    .select({
      acc: accessories,
      asset_url: storageAssets.url,
      asset_bucket: storageAssets.bucket,
      asset_path: storageAssets.path,
    })
    .from(accessories)
    .leftJoin(storageAssets, eq(accessories.storage_asset_id, storageAssets.id))
    .where(where)
    .orderBy(parseOrder(q), desc(accessories.created_at))
    .limit(q.limit ?? 50)
    .offset(q.offset ?? 0);

  return rows;
}

/* ---- admin list ---- */
export async function repoListAdmin(q: ListQuery) {
  const where = and(
    q.is_active !== undefined ? eq(accessories.is_active, toTinyint(q.is_active)) : dsql`1=1`,
    q.category ? eq(accessories.category, q.category) : dsql`1=1`,
    q.q
      ? or(
          like(accessories.name, `%${q.q}%`),
          like(accessories.material, `%${q.q}%`),
          like(accessories.description, `%${q.q}%`)
        )
      : dsql`1=1`
  );

  const rows = await db
    .select({
      acc: accessories,
      asset_url: storageAssets.url,
      asset_bucket: storageAssets.bucket,
      asset_path: storageAssets.path,
    })
    .from(accessories)
    .leftJoin(storageAssets, eq(accessories.storage_asset_id, storageAssets.id))
    .where(where)
    .orderBy(parseOrder(q), desc(accessories.created_at))
    .limit(q.limit ?? 50)
    .offset(q.offset ?? 0);

  return rows;
}

/* ---- get by id (numeric) ---- */
export async function repoGetById(id: number) {
  const rows = await db
    .select({
      acc: accessories,
      asset_url: storageAssets.url,
      asset_bucket: storageAssets.bucket,
      asset_path: storageAssets.path,
    })
    .from(accessories)
    .leftJoin(storageAssets, eq(accessories.storage_asset_id, storageAssets.id))
    .where(eq(accessories.id, id))
    .limit(1);

  return rows[0] ?? null;
}

/* ---- get by slug ---- */
export async function repoGetBySlug(slug: string, onlyActive = true) {
  const rows = await db
    .select({
      acc: accessories,
      asset_url: storageAssets.url,
      asset_bucket: storageAssets.bucket,
      asset_path: storageAssets.path,
    })
    .from(accessories)
    .leftJoin(storageAssets, eq(accessories.storage_asset_id, storageAssets.id))
    .where(
      and(
        eq(accessories.slug, slug),
        onlyActive ? eq(accessories.is_active, 1) : dsql`1=1`
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

/* ---- create ---- */
export async function repoCreate(input: CreateAccessoryInput) {
  const rec: NewAccessoryRow = {
    uuid: randomUUID(),
    name: input.name,
    slug: slugifyUnicode(input.name),
    category: input.category,
    material: input.material,
    price: input.price,
    description: input.description ?? "",
    featured: toTinyint(input.featured, 0),

    // ✅ storage pattern alanları
    image_url: input.image_url ?? null,
    storage_asset_id: input.storage_asset_id ?? null,
    alt: input.alt ?? null,

    dimensions: input.dimensions ?? null,
    weight: input.weight ?? null,
    thickness: input.thickness ?? null,
    finish: input.finish ?? null,
    warranty: input.warranty ?? null,
    installation_time: input.installation_time ?? null,
    display_order: input.display_order ?? 0,
    is_active: toTinyint(input.is_active, 1),
  };

  const res = await db.insert(accessories).values(rec);
  const id = (res as any).insertId as number;
  return repoGetById(id);
}

/* ---- update ---- */
export async function repoUpdate(id: number, patch: UpdateAccessoryInput) {
  const sets: Partial<NewAccessoryRow> = {};

  if (patch.name !== undefined) {
    sets.name = patch.name;
    sets.slug = slugifyUnicode(patch.name);
  }
  if (patch.category !== undefined) sets.category = patch.category;
  if (patch.material !== undefined) sets.material = patch.material;
  if (patch.price !== undefined) sets.price = patch.price;
  if (patch.description !== undefined) sets.description = patch.description;

  // ✅ storage pattern alanları
  if (patch.image_url !== undefined) sets.image_url = patch.image_url ?? null;
  if (patch.storage_asset_id !== undefined) sets.storage_asset_id = patch.storage_asset_id ?? null;
  if (patch.alt !== undefined) sets.alt = patch.alt ?? null;

  if (patch.featured !== undefined) sets.featured = toTinyint(patch.featured, 0);
  if (patch.dimensions !== undefined) sets.dimensions = patch.dimensions ?? null;
  if (patch.weight !== undefined) sets.weight = patch.weight ?? null;
  if (patch.thickness !== undefined) sets.thickness = patch.thickness ?? null;
  if (patch.finish !== undefined) sets.finish = patch.finish ?? null;
  if (patch.warranty !== undefined) sets.warranty = patch.warranty ?? null;
  if (patch.installation_time !== undefined) sets.installation_time = patch.installation_time ?? null;

  if (patch.display_order !== undefined) sets.display_order = patch.display_order;
  if (patch.is_active !== undefined) sets.is_active = toTinyint(patch.is_active, 1);

  await db.update(accessories).set(sets).where(eq(accessories.id, id));
  return repoGetById(id);
}

/* ---- delete ---- */
export async function repoDelete(id: number) {
  await db.delete(accessories).where(eq(accessories.id, id));
  return { ok: true as const };
}

/* ---- utils ---- */
function slugifyUnicode(s: string) {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
