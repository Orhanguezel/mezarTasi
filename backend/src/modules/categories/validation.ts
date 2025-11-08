import { z } from 'zod';

const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === '' ? null : v), schema);

export const boolLike = z.union([
  z.boolean(),
  z.literal(0), z.literal(1),
  z.literal('0'), z.literal('1'),
  z.literal('true'), z.literal('false'),
]);

/**
 * Kategoriler yalnızca ÜST seviye.
 * parent_id bu modülde desteklenmez (sub_categories ayrı tabloda).
 */
const baseCategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),

  description: emptyToNull(z.string().optional().nullable()),
  image_url: emptyToNull(z.string().url().max(500).optional().nullable()),
  icon: emptyToNull(z.string().max(100).optional().nullable()),

  is_active: boolLike.optional(),
  is_featured: boolLike.optional(),
  display_order: z.coerce.number().int().min(0).optional(),

  // DB kolonu olmayan ama FE’den gelebilecek alanları tolere et
  seo_title: emptyToNull(z.string().max(255).optional().nullable()),
  seo_description: emptyToNull(z.string().max(500).optional().nullable()),
}).passthrough();

/** CREATE */
export const categoryCreateSchema = baseCategorySchema.superRefine(
  (data: z.infer<typeof baseCategorySchema>, ctx: z.RefinementCtx) => {
    if ('parent_id' in (data as Record<string, unknown>)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'parent_id_not_supported_on_categories',
        path: ['parent_id'],
      });
    }
  }
);

/** UPDATE (partial) */
export const categoryUpdateSchema = baseCategorySchema
  .partial()
  .superRefine(
    (data: Partial<z.infer<typeof baseCategorySchema>>, ctx: z.RefinementCtx) => {
      if (Object.keys(data).length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'no_fields_to_update',
        });
      }
      if ('parent_id' in (data as Record<string, unknown>)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'parent_id_not_supported_on_categories',
          path: ['parent_id'],
        });
      }
    }
  );

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;

/** ✅ Yeni: Storage asset ile kategori görselini ayarlama/silme */
export const categorySetImageSchema = z.object({
  /** null/undefined ⇒ görseli kaldır */
  asset_id: z.string().uuid().nullable().optional(),
}).strict();

export type CategorySetImageInput = z.infer<typeof categorySetImageSchema>;
