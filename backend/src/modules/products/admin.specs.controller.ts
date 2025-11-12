// =============================================================
// FILE: src/modules/products/admin.specs.controller.ts  (YENİ)
// =============================================================
import type { RouteHandler } from "fastify";
import { db } from "@/db/client";
import { and, asc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { products, productSpecs } from "./schema";
import {
  productSpecCreateSchema,
  productSpecUpdateSchema,
} from "./validation";

const now = () => new Date();

export const adminListProductSpecs: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const rows = await db
    .select()
    .from(productSpecs)
    .where(eq(productSpecs.product_id, id))
    .orderBy(asc(productSpecs.order_num));
  return reply.send(rows);
};

export const adminCreateProductSpec: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const [p] = await db.select({ id: products.id }).from(products).where(eq(products.id, id)).limit(1);
    if (!p) return reply.code(404).send({ error: { message: "product_not_found" } });

    const body = productSpecCreateSchema.parse({ ...(req.body || {}), product_id: id });
    const row = { ...body, id: body.id ?? randomUUID(), created_at: now(), updated_at: now() } as any;
    await db.insert(productSpecs).values(row);
    return reply.code(201).send(row);
  } catch (e: any) {
    if (e?.name === "ZodError") return reply.code(422).send({ error: { message: "validation_error", details: e.issues } });
    req.log.error(e); return reply.code(500).send({ error: { message: "internal_error" } });
  }
};

export const adminUpdateProductSpec: RouteHandler = async (req, reply) => {
  const { id, specId } = req.params as { id: string; specId: string };
  try {
    const patch = productSpecUpdateSchema.parse({ ...(req.body || {}), product_id: id });
    await db
      .update(productSpecs)
      .set({ ...patch, updated_at: now() } as any)
      .where(and(eq(productSpecs.id, specId), eq(productSpecs.product_id, id)));
    const [row] = await db.select().from(productSpecs).where(eq(productSpecs.id, specId)).limit(1);
    if (!row) return reply.code(404).send({ error: { message: "not_found" } });
    return reply.send(row);
  } catch (e: any) {
    if (e?.name === "ZodError") return reply.code(422).send({ error: { message: "validation_error", details: e.issues } });
    req.log.error(e); return reply.code(500).send({ error: { message: "internal_error" } });
  }
};

export const adminDeleteProductSpec: RouteHandler = async (req, reply) => {
  const { id, specId } = req.params as { id: string; specId: string };
  await db.delete(productSpecs).where(and(eq(productSpecs.id, specId), eq(productSpecs.product_id, id)));
  return reply.send({ ok: true });
};

/** REPLACE uç (mevcudu koruyarak yeni dosyaya taşındı) */
export const adminReplaceSpecs: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const items = Array.isArray((req.body as any)?.specs) ? (req.body as any).specs
              : Array.isArray((req.body as any)?.items) ? (req.body as any).items
              : [];
  await db.delete(productSpecs).where(eq(productSpecs.product_id, id));
  for (const it of items) {
    const v = productSpecCreateSchema.parse({ ...it, product_id: id });
    await db.insert(productSpecs).values({ ...v, id: v.id ?? randomUUID(), created_at: now(), updated_at: now() } as any);
  }
  const rows = await db.select().from(productSpecs).where(eq(productSpecs.product_id, id)).orderBy(asc(productSpecs.order_num));
  return reply.send(rows);
};
