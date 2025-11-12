// =============================================================
// FILE: src/modules/products/validation.ts  (GÜNCEL)
// =============================================================
import { z } from "zod";

/* ----------------- helpers ----------------- */
export const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === "" ? null : v), schema);

export const boolLike = z.union([
  z.boolean(), z.literal(0), z.literal(1),
  z.literal("0"), z.literal("1"),
  z.literal("true"), z.literal("false"),
]);

/* ----------------- PRODUCT ----------------- */
export const productCreateSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  price: z.coerce.number().nonnegative(),
  description: emptyToNull(z.string().optional().nullable()),
  category_id: z.string().uuid(),
  sub_category_id: emptyToNull(z.string().uuid().optional().nullable()),

  image_url: emptyToNull(z.string().url().optional().nullable()),
  alt: emptyToNull(z.string().max(255).optional().nullable()),
  images: z.array(z.string().url()).optional().default([]),

  storage_asset_id: emptyToNull(z.string().uuid().optional().nullable()),
  storage_image_ids: z.array(z.string().uuid()).optional().default([]),

  is_active: boolLike.optional(),
  is_featured: boolLike.optional(),

  tags: z.array(z.string()).optional().default([]),

  specifications: z.object({
    dimensions: z.string().optional(),
    weight: z.string().optional(),
    thickness: z.string().optional(),
    surfaceFinish: z.string().optional(),
    warranty: z.string().optional(),
    installationTime: z.string().optional(),
  }).partial().optional(),

  product_code: emptyToNull(z.string().max(64).optional().nullable()),
  stock_quantity: z.coerce.number().int().min(0).optional().default(0),
  rating: z.coerce.number().min(0).max(5).optional(),
  review_count: z.coerce.number().int().min(0).optional(),

  meta_title: emptyToNull(z.string().max(255).optional().nullable()),
  meta_description: emptyToNull(z.string().max(500).optional().nullable()),
});
export const productUpdateSchema = productCreateSchema.partial();

/* ------------ Images ------------ */
export const productSetImagesSchema = z.object({
  cover_id: z.string().uuid().nullable().optional(),
  image_ids: z.array(z.string().uuid()).min(0),
  alt: emptyToNull(z.string().max(255).optional().nullable()),
});
export type ProductSetImagesInput = z.infer<typeof productSetImagesSchema>;

/* ----------------- FAQ ----------------- */
export const productFaqCreateSchema = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid(),
  question: z.string().min(1).max(500),
  answer: z.string().min(1),
  display_order: z.coerce.number().int().min(0).optional().default(0),
  is_active: boolLike.optional(),
});
export const productFaqUpdateSchema = productFaqCreateSchema.partial();
export type ProductFaqCreateInput = z.infer<typeof productFaqCreateSchema>;
export type ProductFaqUpdateInput = z.infer<typeof productFaqUpdateSchema>;

/* ----------------- SPEC ----------------- */
export const productSpecCreateSchema = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  value: z.string().min(1),
  category: z.enum(["physical", "material", "service", "custom"]).default("custom"),
  order_num: z.coerce.number().int().min(0).optional().default(0),
});
export const productSpecUpdateSchema = productSpecCreateSchema.partial();
export type ProductSpecCreateInput = z.infer<typeof productSpecCreateSchema>;
export type ProductSpecUpdateInput = z.infer<typeof productSpecUpdateSchema>;

/* ----------------- REVIEW (YENİ) ----------------- */
export const productReviewCreateSchema = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid(),
  user_id: emptyToNull(z.string().uuid().optional().nullable()),
  rating: z.coerce.number().int().min(1).max(5),
  comment: emptyToNull(z.string().optional().nullable()),
  is_active: boolLike.optional(),
  customer_name: emptyToNull(z.string().max(255).optional().nullable()),
  review_date: emptyToNull(z.string().datetime().optional().nullable()),
});
export const productReviewUpdateSchema = productReviewCreateSchema.partial();
export type ProductReviewCreateInput = z.infer<typeof productReviewCreateSchema>;
export type ProductReviewUpdateInput = z.infer<typeof productReviewUpdateSchema>;
