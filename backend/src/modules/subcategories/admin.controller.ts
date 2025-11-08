// admin.controller.ts
import type { RouteHandler } from 'fastify';
import { db } from '@/db/client';
import { subCategories } from './schema';
import { eq, sql } from 'drizzle-orm';
import {
  subCategoryCreateSchema,
  subCategoryUpdateSchema,
  type SubCategoryCreateInput,
  type SubCategoryUpdateInput,
} from './validation';
import { buildInsertPayload, buildUpdatePayload } from './controller';

// 🔽 Storage tablo şeması (projedeki gerçek yoluna göre düzenli)
import { storageAssets } from '@/modules/storage/schema';

// MySQL yardımcıları
function isDup(err: any) {
  const code = err?.code ?? err?.errno;
  return code === 'ER_DUP_ENTRY' || code === 1062;
}
function isFk(err: any) {
  const code = err?.code ?? err?.errno;
  return code === 'ER_NO_REFERENCED_ROW_2' || code === 1452;
}

// Relatif public path üret (origin’e ihtiyaç yok)
function publicPath(bucket: string, path: string) {
  return `/storage/${encodeURIComponent(bucket)}/${encodeURIComponent(path).replace(/%2F/gi, '/')}`;
}

/** POST /sub-categories (admin) */
export const adminCreateSubCategory: RouteHandler<{ Body: SubCategoryCreateInput }> = async (req, reply) => {
  const parsed = subCategoryCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });
  }

  const payload = buildInsertPayload(parsed.data);

  try {
    await db.insert(subCategories).values(payload);
  } catch (err: any) {
    if (isDup(err)) return reply.code(409).send({ error: { message: 'duplicate_slug_in_category' } });
    if (isFk(err)) return reply.code(400).send({ error: { message: 'invalid_category_id' } });
    return reply.code(500).send({ error: { message: 'db_error', detail: String(err?.message ?? err) } });
  }

  const [row] = await db.select().from(subCategories).where(eq(subCategories.id, payload.id)).limit(1);
  return reply.code(201).send(row);
};

/** PUT /sub-categories/:id (admin) */
export const adminPutSubCategory: RouteHandler<{ Params: { id: string }; Body: SubCategoryUpdateInput }> =
  async (req, reply) => {
    const { id } = req.params;
    const parsed = subCategoryUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });
    }

    const set = buildUpdatePayload(parsed.data);
    try {
      await db.update(subCategories).set(set as any).where(eq(subCategories.id, id));
    } catch (err: any) {
      if (isDup(err)) return reply.code(409).send({ error: { message: 'duplicate_slug_in_category' } });
      if (isFk(err)) return reply.code(400).send({ error: { message: 'invalid_category_id' } });
      return reply.code(500).send({ error: { message: 'db_error', detail: String(err?.message ?? err) } });
    }

    const rows = await db.select().from(subCategories).where(eq(subCategories.id, id)).limit(1);
    if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(rows[0]);
  };

/** PATCH /sub-categories/:id (admin) */
export const adminPatchSubCategory: RouteHandler<{ Params: { id: string }; Body: SubCategoryUpdateInput }> =
  async (req, reply) => {
    const { id } = req.params;
    const parsed = subCategoryUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });
    }

    const set = buildUpdatePayload(parsed.data);
    try {
      await db.update(subCategories).set(set as any).where(eq(subCategories.id, id));
    } catch (err: any) {
      if (isDup(err)) return reply.code(409).send({ error: { message: 'duplicate_slug_in_category' } });
      if (isFk(err)) return reply.code(400).send({ error: { message: 'invalid_category_id' } });
      return reply.code(500).send({ error: { message: 'db_error', detail: String(err?.message ?? err) } });
    }

    const rows = await db.select().from(subCategories).where(eq(subCategories.id, id)).limit(1);
    if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(rows[0]);
  };

/** DELETE /sub-categories/:id (admin) */
export const adminDeleteSubCategory: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const { id } = req.params;
  await db.delete(subCategories).where(eq(subCategories.id, id));
  return reply.code(204).send();
};

/** POST /sub-categories/reorder (admin) */
export const adminReorderSubCategories: RouteHandler<{ Body: { items: Array<{ id: string; display_order: number }> } }> =
  async (req, reply) => {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) return reply.send({ ok: true });

    for (const it of items) {
      const n = Number(it.display_order) || 0;
      await db
        .update(subCategories)
        .set({ display_order: n, updated_at: sql`CURRENT_TIMESTAMP(3)` } as any)
        .where(eq(subCategories.id, it.id));
    }
    return reply.send({ ok: true });
  };

/** PATCH /sub-categories/:id/active (admin) */
export const adminToggleSubActive: RouteHandler<{ Params: { id: string }; Body: { is_active: boolean } }> =
  async (req, reply) => {
    const { id } = req.params;
    const v = !!req.body?.is_active;
    await db
      .update(subCategories)
      .set({ is_active: v, updated_at: sql`CURRENT_TIMESTAMP(3)` } as any)
      .where(eq(subCategories.id, id));

    const rows = await db.select().from(subCategories).where(eq(subCategories.id, id)).limit(1);
    if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(rows[0]);
  };

/** PATCH /sub-categories/:id/featured (admin) */
export const adminToggleSubFeatured: RouteHandler<{ Params: { id: string }; Body: { is_featured: boolean } }> =
  async (req, reply) => {
    const { id } = req.params;
    const v = !!req.body?.is_featured;
    await db
      .update(subCategories)
      .set({ is_featured: v, updated_at: sql`CURRENT_TIMESTAMP(3)` } as any)
      .where(eq(subCategories.id, id));

    const rows = await db.select().from(subCategories).where(eq(subCategories.id, id)).limit(1);
    if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(rows[0]);
  };

/** 🔥 PATCH /sub-categories/:id/image (admin)
 * Body: { asset_id?: string | null; image_url?: string | null }
 * - asset_id varsa storage_assets tablosundan public URL bulunur.
 * - image_url string verilirse doğrudan set edilir.
 * - null ise görsel temizlenir.
 */
export const adminSetSubCategoryImage: RouteHandler<{
  Params: { id: string };
  Body: { asset_id?: string | null; image_url?: string | null };
}> = async (req, reply) => {
  const { id } = req.params;
  const { asset_id, image_url } = req.body ?? {};

  if (asset_id === undefined && image_url === undefined) {
    return reply.code(400).send({ error: { message: 'invalid_body' } });
  }

  let finalUrl: string | null = null;

  if (typeof image_url === 'string') {
    finalUrl = image_url.trim() || null;
  } else if (asset_id === null) {
    finalUrl = null;
  } else if (typeof asset_id === 'string' && asset_id.trim()) {
    const [asset] = await db
      .select()
      .from(storageAssets)
      .where(eq(storageAssets.id, asset_id.trim()))
      .limit(1);

    if (!asset) return reply.code(404).send({ error: { message: 'asset_not_found' } });

    // url varsa onu, yoksa /storage/bucket/path üret
    finalUrl =
      (asset as any).url ??
      ((asset as any).bucket && (asset as any).path
        ? publicPath((asset as any).bucket, (asset as any).path)
        : null);
  }

  await db
    .update(subCategories)
    .set({ image_url: finalUrl, updated_at: sql`CURRENT_TIMESTAMP(3)` } as any)
    .where(eq(subCategories.id, id));

  const rows = await db.select().from(subCategories).where(eq(subCategories.id, id)).limit(1);
  if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(rows[0]);
};
