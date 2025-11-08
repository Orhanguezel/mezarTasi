import { z } from "zod";

export const boolLike = z.union([
  z.boolean(),
  z.literal(0), z.literal(1),
  z.literal("0"), z.literal("1"),
  z.literal("true"), z.literal("false"),
]);

/** LIST query (admin/public aynı) */
export const recentWorkListQuerySchema = z.object({
  order: z.string().optional(),
  sort: z.enum(["created_at", "updated_at", "display_order"]).optional(),
  orderDir: z.enum(["asc", "desc"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),

  q: z.string().optional(),
  category: z.string().optional(),
  material: z.string().optional(),
  year: z.string().optional(),
  keyword: z.string().optional(),
  is_active: boolLike.optional(),
  select: z.string().optional(),
});
export type RecentWorkListQuery = z.infer<typeof recentWorkListQuerySchema>;

/** CREATE / UPSERT body (tek görsel + storage) */
export const upsertRecentWorkBodySchema = z.object({
  title: z.string().min(1).max(255).trim(),
  slug: z.string().min(1).max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug sadece küçük harf, rakam ve tire içermelidir")
    .trim(),

  description: z.string().min(1).max(500),
  category: z.string().min(1).max(255).trim(),
  seoKeywords: z.array(z.string()).default([]),

  // tek görsel alanları opsiyonel (create/update ile birlikte gelebilir)
  image_url: z.string().url().optional().nullable(),
  storage_asset_id: z.string().uuid().optional().nullable(),
  alt: z.string().max(255).optional().nullable(),

  date: z.string().min(1).max(64).trim(),
  location: z.string().min(1).max(255).trim(),
  material: z.string().min(1).max(255).trim(),
  price: z.string().max(255).nullable().optional(),

  details: z.object({
    dimensions: z.string().min(1).max(255),
    workTime: z.string().min(1).max(255),
    specialFeatures: z.array(z.string()).default([]),
    customerReview: z.string().max(1000).nullable().optional(),
  }),

  is_active: boolLike.optional().default(true),
  display_order: z.coerce.number().int().min(0).optional(),

  locale: z.string().max(10).nullable().optional(), // yoksayılacak
});
export type UpsertRecentWorkBody = z.infer<typeof upsertRecentWorkBodySchema>;

/** PATCH body (opsiyonel alanların tümü) */
export const patchRecentWorkBodySchema = upsertRecentWorkBodySchema.partial();
export type PatchRecentWorkBody = z.infer<typeof patchRecentWorkBodySchema>;

/* ===== Görsel uçları (tek görsel attach/detach) ===== */
export const attachRecentWorkImageBodySchema = z.object({
  storage_asset_id: z.string().uuid().optional(),
  image_url: z.string().url().optional(),
  alt: z.string().max(255).nullable().optional(),
}).refine(
  (b) => (b.storage_asset_id ? !b.image_url : !!b.image_url),
  { message: "Sadece bir alan doldurun: storage_asset_id veya image_url." }
);
export type AttachRecentWorkImageBody = z.infer<typeof attachRecentWorkImageBodySchema>;
