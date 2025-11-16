// =============================================================
// FILE: src/modules/products/admin.controller.ts
// =============================================================
import type { RouteHandler } from "fastify";
import { db } from "@/db/client";
import { and, asc, desc, eq, inArray, like, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { products } from "./schema";
import { storageAssets } from "@/modules/storage/schema";
import {
  productCreateSchema,
  productUpdateSchema,
  productSetImagesSchema,
  type ProductSetImagesInput,
} from "./validation";
import { env } from "@/core/env";

/* ----------------- helpers ----------------- */

const toNum = (x: any) =>
  x === null || x === undefined ? x : (Number.isNaN(Number(x)) ? x : Number(x));

function normalizeProduct(row: any) {
  if (!row) return row;
  const p: any = { ...row };

  // sayısal
  p.price = toNum(p.price);
  p.rating = toNum(p.rating);
  p.review_count = toNum(p.review_count) ?? 0;
  p.stock_quantity = toNum(p.stock_quantity) ?? 0;

  // JSON kolonları string geliyorsa parse et
  if (typeof p.storage_image_ids === "string") {
  try {
    p.storage_image_ids = JSON.parse(p.storage_image_ids);
  } catch {
    /* noop */
  }
}
if (!Array.isArray(p.storage_image_ids)) {
  p.storage_image_ids = [];
}


  if (typeof p.tags === "string") {
    try {
      p.tags = JSON.parse(p.tags);
    } catch {
      /* noop */
    }
  }
  if (!Array.isArray(p.tags)) p.tags = [];

  if (typeof p.specifications === "string") {
    try {
      p.specifications = JSON.parse(p.specifications);
    } catch {
      /* noop */
    }
  }

  // 🔴 ÖNEMLİ: storage_image_ids de JSON kolon → string ise parse
  if (typeof p.storage_image_ids === "string") {
    try {
      p.storage_image_ids = JSON.parse(p.storage_image_ids);
    } catch {
      /* noop */
    }
  }
  if (!Array.isArray(p.storage_image_ids)) {
    p.storage_image_ids = [];
  }

  return p;
}

function publicUrlOf(bucket: string, path: string, providerUrl?: string | null) {
  if (providerUrl) return providerUrl;
  const encSeg = (s: string) => encodeURIComponent(s);
  const encPath = (p: string) => p.split("/").map(encSeg).join("/");
  const cdnBase = (env.CDN_PUBLIC_BASE || "").replace(/\/+$/, "");
  if (cdnBase) return `${cdnBase}/${encSeg(bucket)}/${encPath(path)}`;
  const apiBase = (env.PUBLIC_API_BASE || "").replace(/\/+$/, "");
  return `${apiBase || ""}/storage/${encSeg(bucket)}/${encPath(path)}`;
}

async function urlsForAssets(ids: string[]) {
  if (!ids.length) return {};
  const rows = await db
    .select({
      id: storageAssets.id,
      bucket: storageAssets.bucket,
      path: storageAssets.path,
      url: storageAssets.url,
    })
    .from(storageAssets)
    .where(inArray(storageAssets.id, ids));

  const map: Record<string, string> = {};
  for (const a of rows) {
    map[a.id] = publicUrlOf(a.bucket, a.path, a.url ?? null);
  }
  return map;
}

/* ----------------- LIST / GET ----------------- */

export const adminListProducts: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as {
    q?: string;
    category_id?: string;
    sub_category_id?: string;
    is_active?: string | number | boolean;
    limit?: string | number;
    offset?: string | number;
    sort?: "price" | "rating" | "created_at";
    order?: "asc" | "desc";
  };

  const conds: any[] = [];
  if (q.q) conds.push(like(products.title, `%${q.q}%`));
  if (q.category_id) conds.push(eq(products.category_id, q.category_id));
  if (q.sub_category_id)
    conds.push(eq(products.sub_category_id, q.sub_category_id));
  if (q.is_active !== undefined) {
    const v = String(q.is_active).toLowerCase();
    conds.push(eq(products.is_active, (v === "1" || v === "true") as any));
  }
  const whereExpr = conds.length ? and(...conds) : undefined;

  const limit = Math.min(Number(q.limit ?? 50) || 50, 100);
  const offset = Math.max(Number(q.offset ?? 0) || 0, 0);

  const colMap = {
    price: products.price,
    rating: products.rating,
    created_at: products.created_at,
  } as const;
  const sortKey = (q.sort && q.sort in colMap ? q.sort : "created_at") as keyof typeof colMap;
  const dir = q.order === "asc" ? "asc" : "desc";
  const orderExpr = dir === "asc" ? asc(colMap[sortKey]) : desc(colMap[sortKey]);

  const countBase = db.select({ total: sql<number>`COUNT(*)` }).from(products);
  const [{ total }] = await (whereExpr ? countBase.where(whereExpr) : countBase);

  const rows = await (whereExpr
    ? db.select().from(products).where(whereExpr)
    : db.select().from(products)
  )
    .orderBy(orderExpr)
    .limit(limit)
    .offset(offset);

  reply.header("x-total-count", String(Number(total || 0)));
  reply.header("content-range", `*/${Number(total || 0)}`);
  reply.header("access-control-expose-headers", "x-total-count, content-range");

  return reply.send(rows.map(normalizeProduct));
};

export const adminGetProduct: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!rows.length) {
    return reply.code(404).send({ error: { message: "not_found" } });
  }

  return reply.send(normalizeProduct(rows[0]));
};

/* ----------------- CREATE / UPDATE / DELETE ----------------- */

export const adminCreateProduct: RouteHandler = async (req, reply) => {
  try {
    const input = productCreateSchema.parse(req.body ?? {});
    const id = input.id ?? randomUUID();

    // Storage id → URL çöz (oluşturma anında genelde boş, ama API’dan direkt çağıranlar için destek)
    const coverId = input.storage_asset_id ?? null;
    const galleryIds = input.storage_image_ids ?? [];
    const urlMap = await urlsForAssets([
      ...(coverId ? [coverId] : []),
      ...galleryIds,
    ]);

    const image_url = coverId
      ? urlMap[coverId] ?? input.image_url ?? null
      : input.image_url ?? null;

    const images = galleryIds
      .map((aid) => urlMap[aid])
      .filter(Boolean) as string[];

    await db.insert(products).values({
      ...input,
      id,
      image_url,
      images,
      created_at: new Date(),
      updated_at: new Date(),
    } as any);

    const [row] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    return reply.code(201).send(normalizeProduct(row));
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return reply
        .code(422)
        .send({
          error: { message: "validation_error", details: e.issues },
        });
    }
    req.log.error(e);
    return reply
      .code(500)
      .send({ error: { message: "internal_error" } });
  }
};

export const adminUpdateProduct: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const patch = productUpdateSchema.parse(req.body ?? {});
    const [cur] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!cur) {
      return reply.code(404).send({ error: { message: "not_found" } });
    }

    const curNorm = normalizeProduct(cur);

    const coverId =
      patch.storage_asset_id ?? curNorm.storage_asset_id ?? null;
    const galleryIds =
      patch.storage_image_ids ?? (curNorm.storage_image_ids as string[] ?? []);
    const urlMap = await urlsForAssets([
      ...(coverId ? [coverId] : []),
      ...galleryIds,
    ]);

    const image_url =
      patch.storage_asset_id !== undefined || patch.image_url !== undefined
        ? coverId
          ? urlMap[coverId] ?? patch.image_url ?? null
          : patch.image_url ?? null
        : curNorm.image_url;

    const images =
      patch.storage_image_ids !== undefined || patch.images !== undefined
        ? (galleryIds.map((aid: string) => urlMap[aid]).filter(Boolean) as string[])
        : (curNorm.images as string[]);

    await db
      .update(products)
      .set({
        ...patch,
        image_url,
        images,
        updated_at: new Date(),
      } as any)
      .where(eq(products.id, id));

    const [row] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    return reply.send(normalizeProduct(row));
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return reply
        .code(422)
        .send({
          error: { message: "validation_error", details: e.issues },
        });
    }
    req.log.error(e);
    return reply
      .code(500)
      .send({ error: { message: "internal_error" } });
  }
};

export const adminDeleteProduct: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  await db.delete(products).where(eq(products.id, id));
  return reply.code(204).send();
};

/* ----------------- IMAGES: REPLACE (storage uyumlu) ----------------- */

export const adminSetProductImages: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };

  const parsed = productSetImagesSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply
      .code(400)
      .send({
        error: {
          message: "invalid_body",
          issues: parsed.error.flatten(),
        },
      });
  }

  const body: ProductSetImagesInput = parsed.data;
  const galleryIds = body.image_ids ?? [];
  const coverId = body.cover_id ?? null;

  const urlMap = await urlsForAssets([
  ...(coverId ? [coverId] : []),
  ...galleryIds,
]);

const coverUrl = coverId ? urlMap[coverId] ?? null : null;
const images = galleryIds
  .map((aid) => urlMap[aid])
  .filter(Boolean) as string[];

const patch: Record<string, unknown> = {
  storage_asset_id: coverId,
  image_url: coverUrl,
  storage_image_ids: galleryIds,
  images,
  updated_at: new Date(),
};

  if (body.alt !== undefined) {
    patch.alt = body.alt as string | null;
  }

  await db.update(products).set(patch as any).where(eq(products.id, id));

  const [row] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!row) {
    return reply.code(404).send({ error: { message: "not_found" } });
  }

  return reply.send(normalizeProduct(row));
};
