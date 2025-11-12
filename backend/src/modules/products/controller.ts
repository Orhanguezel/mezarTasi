// =============================================================
// FILE: src/modules/products/controller.ts
// =============================================================
import type { RouteHandler } from "fastify";
import type { FastifyRequest, FastifyReply } from "fastify";
import { db } from "@/db/client";
import { and, asc, desc, eq, like, sql } from "drizzle-orm";
import { products, productFaqs, productSpecs } from "./schema";
import { categories } from "@/modules/categories/schema";
import { subCategories } from "@/modules/subcategories/schema";
import { product_reviews } from "@/modules/products/schema";

/* ----------------- helpers ----------------- */
const now = () => new Date();
const toNum = (x: any) =>
  x === null || x === undefined ? x : (Number.isNaN(Number(x)) ? x : Number(x));

const normalizeProduct = (row: any) => {
  if (!row) return row;
  const p = { ...row };
  p.price = toNum(p.price);
  p.rating = toNum(p.rating);
  p.review_count = toNum(p.review_count) ?? 0;
  p.stock_quantity = toNum(p.stock_quantity) ?? 0;

  if (typeof p.images === "string") try { p.images = JSON.parse(p.images); } catch {}
  if (typeof p.tags === "string") try { p.tags = JSON.parse(p.tags); } catch {}
  if (typeof p.specifications === "string") try { p.specifications = JSON.parse(p.specifications); } catch {}

  return p;
};

const toBool = (v: unknown, def = false): boolean => {
  if (v === undefined || v === null || v === "") return def;
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase().trim();
  if (["1", "true", "yes", "y", "on"].includes(s)) return true;
  if (["0", "false", "no", "n", "off"].includes(s)) return false;
  return def;
};
const toInt = (v: unknown, def = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : def;
};
const safeLimit = (v: unknown, def = 100, max = 500): number => {
  const n = toInt(v, def);
  return n > 0 ? Math.min(n, max) : def;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/* ----------------- LIST / GET (PUBLIC) ----------------- */

/** GET /products?category_id=&sub_category_id=&is_active=&q=&limit=&offset=&sort=&order=&slug= */
export const listProducts: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as {
    category_id?: string;
    sub_category_id?: string;
    is_active?: string;
    q?: string;
    limit?: string;
    offset?: string;
    sort?: "price" | "rating" | "created_at";
    order?: "asc" | "desc" | string;
    slug?: string;
    min_price?: string;
    max_price?: string;
  };

  // shortcut: by slug
  if (q.slug) {
    const rows = await db
      .select({
        p: products,
        c: { id: categories.id, name: categories.name, slug: categories.slug },
        s: { id: subCategories.id, name: subCategories.name, slug: subCategories.slug, category_id: subCategories.category_id },
      })
      .from(products)
      .leftJoin(categories, eq(products.category_id, categories.id))
      .leftJoin(subCategories, eq(products.sub_category_id, subCategories.id))
      .where(and(eq(products.slug, q.slug), eq(products.is_active, 1 as any)))
      .limit(1);

    if (!rows.length) return reply.code(404).send({ error: { message: "not_found" } });
    const r = rows[0];
    return reply.send({ ...normalizeProduct(r.p), category: r.c, sub_category: r.s });
  }

  const conds: any[] = [];
  if (q.category_id) conds.push(eq(products.category_id, q.category_id));
  if (q.sub_category_id) conds.push(eq(products.sub_category_id, q.sub_category_id));
  if (q.is_active !== undefined) {
    const v = q.is_active === "1" || q.is_active === "true" ? 1 : 0;
    conds.push(eq(products.is_active, v as any));
  }
  if (q.q) conds.push(like(products.title, `%${q.q}%`));
  if (q.min_price) conds.push(sql`${products.price} >= ${q.min_price}`);
  if (q.max_price) conds.push(sql`${products.price} <= ${q.max_price}`);

  const whereExpr = conds.length ? and(...conds) : undefined;

  const limit = q.limit ? Math.min(parseInt(q.limit, 10) || 50, 100) : 50;
  const offset = q.offset ? Math.max(parseInt(q.offset, 10) || 0, 0) : 0;

  const colMap = {
    price: products.price,
    rating: products.rating,
    created_at: products.created_at,
  } as const;

  let sortKey: keyof typeof colMap = "created_at";
  let dir: "asc" | "desc" = "desc";

  if (q.sort) {
    sortKey = q.sort;
    dir = q.order === "asc" ? "asc" : "desc";
  } else if (q.order && q.order.includes(".")) {
    const [col, d] = String(q.order).split(".");
    sortKey = (["price", "rating", "created_at"] as const).includes(col as any)
      ? (col as keyof typeof colMap)
      : "created_at";
    dir = d?.toLowerCase() === "asc" ? "asc" : "desc";
  }
  const orderExpr = dir === "asc" ? asc(colMap[sortKey]) : desc(colMap[sortKey]);

  const countBase = db.select({ total: sql<number>`COUNT(*)` }).from(products);
  const [{ total }] = await (whereExpr ? countBase.where(whereExpr) : countBase);

  const dataBase = db
    .select({
      p: products,
      c: { id: categories.id, name: categories.name, slug: categories.slug },
      s: { id: subCategories.id, name: subCategories.name, slug: subCategories.slug, category_id: subCategories.category_id },
    })
    .from(products)
    .leftJoin(categories, eq(products.category_id, categories.id))
    .leftJoin(subCategories, eq(products.sub_category_id, subCategories.id));

  const rows = await (whereExpr ? dataBase.where(whereExpr) : dataBase)
    .orderBy(orderExpr)
    .limit(limit)
    .offset(offset);

  const out = rows.map((r) => ({ ...normalizeProduct(r.p), category: r.c, sub_category: r.s }));

  reply.header("x-total-count", String(Number(total || 0)));
  reply.header("content-range", `*/${Number(total || 0)}`);
  reply.header("access-control-expose-headers", "x-total-count, content-range");

  return reply.send(out);
};

/** GET /products/:idOrSlug */
export const getProductByIdOrSlug: RouteHandler = async (req, reply) => {
  const { idOrSlug } = req.params as { idOrSlug: string };
  const isUuid = UUID_RE.test(idOrSlug);

  const whereExpr = isUuid
    ? eq(products.id, idOrSlug)
    : and(eq(products.slug, idOrSlug), eq(products.is_active, 1 as any));

  const rows = await db
    .select({
      p: products,
      c: { id: categories.id, name: categories.name, slug: categories.slug },
      s: { id: subCategories.id, name: subCategories.name, slug: subCategories.slug, category_id: subCategories.category_id },
    })
    .from(products)
    .leftJoin(categories, eq(products.category_id, categories.id))
    .leftJoin(subCategories, eq(products.sub_category_id, subCategories.id))
    .where(whereExpr)
    .limit(1);

  if (!rows.length) return reply.code(404).send({ error: { message: "not_found" } });
  const r = rows[0];
  return reply.send({ ...normalizeProduct(r.p), category: r.c, sub_category: r.s });
};

/** GET /products/id/:id */
export const getProductById: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const rows = await db
    .select({
      p: products,
      c: { id: categories.id, name: categories.name, slug: categories.slug },
      s: { id: subCategories.id, name: subCategories.name, slug: subCategories.slug, category_id: subCategories.category_id },
    })
    .from(products)
    .leftJoin(categories, eq(products.category_id, categories.id))
    .leftJoin(subCategories, eq(products.sub_category_id, subCategories.id))
    .where(eq(products.id, id))
    .limit(1);

  if (!rows.length) return reply.code(404).send({ error: { message: "not_found" } });
  const r = rows[0];
  return reply.send({ ...normalizeProduct(r.p), category: r.c, sub_category: r.s });
};

/** GET /products/by-slug/:slug */
export const getProductBySlug: RouteHandler = async (req, reply) => {
  const { slug } = req.params as { slug: string };
  const rows = await db
    .select({
      p: products,
      c: { id: categories.id, name: categories.name, slug: categories.slug },
      s: { id: subCategories.id, name: subCategories.name, slug: subCategories.slug, category_id: subCategories.category_id },
    })
    .from(products)
    .leftJoin(categories, eq(products.category_id, categories.id))
    .leftJoin(subCategories, eq(products.sub_category_id, subCategories.id))
    .where(and(eq(products.slug, slug), eq(products.is_active, 1 as any)))
    .limit(1);

  if (!rows.length) return reply.code(404).send({ error: { message: "not_found" } });
  const r = rows[0];
  return reply.send({ ...normalizeProduct(r.p), category: r.c, sub_category: r.s });
};

/* ===================== */
/* FAQ & SPECS & REVIEWS */
/* ===================== */

/** GET /product_faqs?product_id=&only_active=1 */
export const listProductFaqs: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as { product_id?: string; only_active?: string };
  const conds: any[] = [];
  if (q.product_id) conds.push(eq(productFaqs.product_id, q.product_id));
  if (q.only_active === "1" || q.only_active === "true")
    conds.push(eq(productFaqs.is_active, 1 as any));
  const whereExpr = conds.length ? and(...conds) : undefined;

  const base = db.select().from(productFaqs);
  const rows = await (whereExpr ? base.where(whereExpr as any) : base).orderBy(productFaqs.display_order);
  return reply.send(rows);
};

/** GET /product_specs?product_id= */
export const listProductSpecs: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as { product_id?: string };
  const base = db.select().from(productSpecs);
  const rows = await (q.product_id ? base.where(eq(productSpecs.product_id, q.product_id)) : base)
    .orderBy(asc(productSpecs.order_num));
  return reply.send(rows);
};

/** GET /product_reviews?product_id=&only_active=&limit=&offset= */
export async function listProductReviews(req: FastifyRequest, reply: FastifyReply) {
  try {
    const q = req.query as {
      product_id?: string;
      only_active?: string | number | boolean;
      limit?: string | number;
      offset?: string | number;
    };

    if (!q.product_id) {
      return reply.code(400).send({ error: "product_id zorunludur" });
    }

    const filters = [eq(product_reviews.product_id, q.product_id)];
    if (toBool(q.only_active, true)) {
      // tinyint(1) uyumu
      // @ts-expect-error drizzle tinyint boolean union
      filters.push(eq(product_reviews.is_active, 1));
    }

    const rows = await db
      .select()
      .from(product_reviews)
      .where(and(...filters))
      .orderBy(desc(product_reviews.review_date), desc(product_reviews.created_at))
      .limit(safeLimit(q.limit))
      .offset(Math.max(0, toInt(q.offset, 0)));

    return reply.send(rows);
  } catch (err) {
    req.log.error({ err }, "listProductReviews failed");
    return reply.code(500).send({ error: "İç sunucu hatası" });
  }
}
