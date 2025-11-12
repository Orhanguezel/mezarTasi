// =============================================================
// FILE: src/modules/products/helpers.categoryLists.ts  (YENİ - ufak ayrım)
// =============================================================
import type { RouteHandler } from "fastify";
import { db } from "@/db/client";
import { asc, eq } from "drizzle-orm";
import { categories } from "@/modules/categories/schema";
import { subCategories } from "@/modules/subcategories/schema";

export const adminListCategories: RouteHandler = async (_req, reply) => {
  const rows = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .orderBy(asc(categories.name));
  return reply.send(rows);
};

export const adminListSubcategories: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as { category_id?: string };
  const base = db
    .select({ id: subCategories.id, name: subCategories.name, slug: subCategories.slug, category_id: subCategories.category_id })
    .from(subCategories);
  const rows = q.category_id ? await base.where(eq(subCategories.category_id, q.category_id)) : await base;
  return reply.send(rows);
};
