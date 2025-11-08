import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { db } from "@/db/client";
import { and, asc, desc, eq, like, sql, inArray } from "drizzle-orm";
import { products, productFaqs, productSpecs } from "./schema";
import { categories } from "@/modules/categories/schema";
import { subCategories } from "@/modules/subcategories/schema";
import {
  productCreateSchema,
  productUpdateSchema,
  productFaqCreateSchema,
  productSpecCreateSchema,
  productSetImagesSchema,
  type ProductSetImagesInput,
} from "./validation";
import { storageAssets } from "@/modules/storage/schema";

const now = () => new Date();

const toNum = (x: any) =>
  x === null || x === undefined
    ? x
    : (Number.isNaN(Number(x)) ? x : Number(x));

const normalizeProduct = (row: any) => {
  if (!row) return row;
  const p = { ...row };
  p.price = toNum(p.price);
  p.rating = toNum(p.rating);
  p.review_count = toNum(p.review_count) ?? 0;
  p.stock_quantity = toNum(p.stock_quantity) ?? 0;

  // JSON alanlar
  if (typeof p.images === "string") try { p.images = JSON.parse(p.images); } catch {}
  if (typeof p.tags === "string") try { p.tags = JSON.parse(p.tags); } catch {}
  if (typeof p.specifications === "string") try { p.specifications = JSON.parse(p.specifications); } catch {}

  return p;
};

/** GET /admin/products */
export const adminListProducts: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as {
    q?: string;
    category_id?: string;
    sub_category_id?: string;
    is_active?: string | boolean;
    min_price?: string;
    max_price?: string;
    limit?: string;
    offset?: string;
    sort?: "created_at" | "price" | "title" | "review_count" | "rating";
    order?: "asc" | "desc" | string;
  };

  const conds: any[] = [];
  if (q.q) conds.push(like(products.title, `%${q.q}%`));
  if (q.category_id) conds.push(eq(products.category_id, q.category_id));
  if (q.sub_category_id) conds.push(eq(products.sub_category_id, q.sub_category_id));
  if (q.is_active !== undefined) {
    const v = typeof q.is_active === "boolean" ? q.is_active : (q.is_active === "1" || q.is_active === "true");
    conds.push(eq(products.is_active, v as any));
  }
  if (q.min_price) conds.push(sql`${products.price} >= ${q.min_price}`);
  if (q.max_price) conds.push(sql`${products.price} <= ${q.max_price}`);

  const whereExpr = conds.length ? and(...conds) : undefined;

  const limit = q.limit ? Math.min(parseInt(q.limit, 10) || 50, 100) : 50;
  const offset = q.offset ? Math.max(parseInt(q.offset, 10) || 0, 0) : 0;

  const colMap = {
    created_at: products.created_at,
    price: products.price,
    title: products.title,
    review_count: products.review_count,
    rating: products.rating,
  } as const;
  const sortKey = (q.sort && colMap[q.sort]) ? q.sort : "created_at";
  const dir: "asc" | "desc" = q.order === "asc" ? "asc" : "desc";
  const orderExpr = dir === "asc" ? asc(colMap[sortKey]) : desc(colMap[sortKey]);

  const countBase = db.select({ total: sql<number>`COUNT(*)` }).from(products);
  const [{ total }] = await (whereExpr ? countBase.where(whereExpr) : countBase);

  const dataBase = db.select().from(products);
  const rows = await (whereExpr ? dataBase.where(whereExpr) : dataBase)
    .orderBy(orderExpr)
    .limit(limit)
    .offset(offset);

  reply.header("x-total-count", String(Number(total || 0)));
  reply.header("content-range", `*/${Number(total || 0)}`);
  reply.header("access-control-expose-headers", "x-total-count, content-range");

  return reply.send(rows.map(normalizeProduct));
};

/** GET /admin/products/:id */
export const adminGetProduct: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(normalizeProduct(rows[0]));
};

/** POST /admin/products */
export const adminCreateProduct: RouteHandler = async (req, reply) => {
  const parsed = productCreateSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(422).send({ error: { message: "validation_error", details: parsed.error.flatten() } });
  }
  const input = parsed.data;

  // FK guard: category
  const [cat] = await db.select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, input.category_id))
    .limit(1);
  if (!cat) return reply.code(409).send({ error: { message: "category_not_found", details: input.category_id } });

  // FK guard: sub_category (varsa)
  if (input.sub_category_id) {
    const [sc] = await db.select({ id: subCategories.id })
      .from(subCategories)
      .where(eq(subCategories.id, input.sub_category_id))
      .limit(1);
    if (!sc) return reply.code(409).send({ error: { message: "sub_category_not_found", details: input.sub_category_id } });
  }

  const id = input.id ?? randomUUID();
  await (db.insert(products) as any).values({
    ...input,
    id,
    created_at: now(),
    updated_at: now(),
  });

  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return reply.code(201).send(normalizeProduct(row));
};

/** PATCH /admin/products/:id */
export const adminUpdateProduct: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const parsed = productUpdateSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(422).send({ error: { message: "validation_error", details: parsed.error.flatten() } });
  }
  const patch = parsed.data;

  if (patch.category_id) {
    const [cat] = await db.select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, patch.category_id))
      .limit(1);
    if (!cat) return reply.code(409).send({ error: { message: "category_not_found", details: patch.category_id } });
  }
  if (patch.sub_category_id) {
    const [sc] = await db.select({ id: subCategories.id })
      .from(subCategories)
      .where(eq(subCategories.id, patch.sub_category_id))
      .limit(1);
    if (!sc) return reply.code(409).send({ error: { message: "sub_category_not_found", details: patch.sub_category_id } });
  }

  await (db.update(products) as any)
    .set({ ...patch, updated_at: now() })
    .where(eq(products.id, id));

  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(normalizeProduct(rows[0]));
};

/** DELETE /admin/products/:id */
export const adminDeleteProduct: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  await (db.delete(products) as any).where(eq(products.id, id));
  return reply.code(204).send();
};

/** POST /admin/products/bulk/active */
export const adminBulkSetActive: RouteHandler = async (req, reply) => {
  const body = (req.body || {}) as { ids?: string[]; is_active?: boolean };
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return reply.code(400).send({ error: { message: "ids_required" } });
  }
  const v = !!body.is_active;
  await (db.update(products) as any)
    .set({ is_active: v as any, updated_at: now() })
    .where(inArray(products.id, body.ids));
  return reply.send({ ok: true as const });
};

/** NO-OP: display_order kolonu yok */
export const adminReorderProducts: RouteHandler = async (_req, reply) => {
  return reply.send({ ok: true as const });
};

/** PATCH /admin/products/:id/active */
export const adminToggleActive: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const { is_active } = (req.body || {}) as { is_active: boolean };
  await (db.update(products) as any)
    .set({ is_active: !!is_active as any, updated_at: now() })
    .where(eq(products.id, id));
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return reply.send(normalizeProduct(row));
};

/** PATCH /admin/products/:id/homepage => is_featured */
export const adminToggleHomepage: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const { show_on_homepage } = (req.body || {}) as { show_on_homepage: boolean };
  await (db.update(products) as any)
    .set({ is_featured: !!show_on_homepage as any, updated_at: now() })
    .where(eq(products.id, id));
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return reply.send(normalizeProduct(row));
};

/* ======= REPLACE MODELLERİ ======= */

/** PUT /admin/products/:id/faqs  -> önce sil, sonra ekle */
export const adminReplaceFaqs: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = (req.body || {}) as { faqs?: any[] };
  const items = Array.isArray(body.faqs) ? body.faqs : [];

  const rowsToInsert = items.map((raw, i) => {
    const parsed = productFaqCreateSchema.partial().parse(raw);
    return {
      id: parsed.id ?? randomUUID(),
      product_id: id,
      question: parsed.question ?? "",
      answer: parsed.answer ?? "",
      display_order: toNum(parsed.display_order ?? i) ?? i,
      is_active: (parsed.is_active ?? true) as any,
      created_at: now(),
      updated_at: now(),
    };
  });

  await (db.delete(productFaqs) as any).where(eq(productFaqs.product_id, id));
  if (rowsToInsert.length) {
    await (db.insert(productFaqs) as any).values(rowsToInsert);
  }
  return reply.send({ ok: true as const });
};

/** PUT /admin/products/:id/specs  -> önce sil, sonra ekle */
export const adminReplaceSpecs: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = (req.body || {}) as { specs?: any[] };
  const items = Array.isArray(body.specs) ? body.specs : [];

  const rowsToInsert = items.map((raw, i) => {
    const parsed = productSpecCreateSchema.partial().parse(raw);
    return {
      id: parsed.id ?? randomUUID(),
      product_id: id,
      name: parsed.name ?? "",
      value: parsed.value ?? "",
      category: parsed.category ?? "custom",
      order_num: toNum(parsed.order_num ?? i) ?? i,
      created_at: now(),
      updated_at: now(),
    };
  });

  await (db.delete(productSpecs) as any).where(eq(productSpecs.product_id, id));
  if (rowsToInsert.length) {
    await (db.insert(productSpecs) as any).values(rowsToInsert);
  }
  return reply.send({ ok: true as const });
};

/* ====== KATEGORİ LİST ====== */

/** GET /admin/categories */
export const adminListCategories: RouteHandler = async (_req, reply) => {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      is_featured: categories.is_featured,
    })
    .from(categories)
    .orderBy(asc(categories.name));
  return reply.send(rows);
};

/* ====== NEW: STORAGE İLE RESİM EŞLEME ====== */
/** PUT /admin/products/:id/images
 * Body: { cover_id?: string; image_ids: string[] }
 * - image_ids sırası → products.images sırası
 * - cover_id varsa → products.image_url = cover.url (cover_id ayrıca image_ids içinde olabilir)
 */
/** PUT /admin/products/:id/images
 * Body: { cover_id?: string; image_ids: string[] }
 * Davranış: MERGE — eski URL'ler korunur, yeni gelen asset ID'lerinden üretilen URL'ler sona eklenir.
 */
export const adminSetProductImages: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const parsed = productSetImagesSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply
      .code(422)
      .send({ error: { message: "validation_error", details: parsed.error.flatten() } });
  }
  const body: ProductSetImagesInput = parsed.data;

  // Ürün var mı + mevcut görselleri al
  const [prod] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!prod) return reply.code(404).send({ error: { message: "product_not_found" } });

  // Mevcut URL listesi (array değilse parse etmeyi dene)
  let prevUrls: string[] = [];
  if (Array.isArray((prod as any).images)) prevUrls = (prod as any).images as string[];
  else if (typeof (prod as any).images === "string") {
    try { prevUrls = JSON.parse((prod as any).images as unknown as string) || []; } catch { prevUrls = []; }
  }

  // ID → Storage row çevir (sıra korunacak)
  const ids = Array.isArray(body.image_ids) ? body.image_ids.filter(Boolean) : [];
  const rows = ids.length
    ? await db
        .select({
          id: storageAssets.id,
          url: storageAssets.url,
          bucket: storageAssets.bucket,
          path: storageAssets.path,
        })
        .from(storageAssets)
        .where(inArray(storageAssets.id, ids))
    : [];

  const byId = new Map(rows.map((r) => [r.id, r]));
  const toUrl = (r: { url: string | null; bucket: string; path: string }) =>
    r.url || `/storage/${encodeURIComponent(r.bucket)}/${encodeURIComponent(r.path).replaceAll("%2F", "/")}`;

  const newUrlsInOrder = ids
    .map((i) => byId.get(i))
    .filter(Boolean)
    .map((r) => toUrl(r!));

  // MERGE: önce mevcutlar, sonra yeniler (URL bazlı uniq)
  const merged: string[] = [];
  const pushUniq = (u: string) => {
    if (!u) return;
    if (!merged.includes(u)) merged.push(u);
  };
  prevUrls.forEach(pushUniq);
  newUrlsInOrder.forEach(pushUniq);

  // Kapak: cover_id varsa onu kullan, yoksa mevcut kapak korunur; o da yoksa ilk
  const prevCover = (prod as any).image_url as string | null | undefined;
  let coverUrl: string | null = null;

  if (body.cover_id) {
    const cv = byId.get(body.cover_id);
    if (cv) coverUrl = toUrl(cv);
  }
  if (!coverUrl && prevCover && merged.includes(prevCover)) {
    coverUrl = prevCover;
  }
  if (!coverUrl) coverUrl = merged[0] ?? null;

  await (db.update(products) as any)
    .set({
      image_url: coverUrl,
      images: merged as any, // JSON column
      updated_at: now(),
    })
    .where(eq(products.id, id));

  const [updated] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return reply.send(normalizeProduct(updated));
};
