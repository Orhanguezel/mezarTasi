import { z } from "zod";

const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === "" ? null : v), schema);

const boolLike = z.union([
  z.boolean(),
  z.literal(0), z.literal(1),
  z.literal("0"), z.literal("1"),
  z.literal("true"), z.literal("false"),
]);

const toBool = z.preprocess((v) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  const s = String(v ?? "").toLowerCase();
  return s === "1" || s === "true";
}, z.boolean());

/**
 * Yeni PRODUCTS şemasına uyum:
 * - title, slug, price, description
 * - category_id (required), sub_category_id (optional)
 * - image_url, images: string[]
 * - is_active/is_featured (boolean kabul eder)
 * - tags: string[]
 * - specifications: structured JSON
 * - product_code, stock_quantity, rating, review_count
 * - meta_title/meta_description
 */
export const productCreateSchema = z.object({
  id: z.string().uuid().optional(),

  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),

  price: z.coerce.number().nonnegative(),
  description: emptyToNull(z.string().optional().nullable()),

  category_id: z.string().uuid(),
  sub_category_id: emptyToNull(z.string().uuid().optional().nullable()),

  image_url: emptyToNull(z.string().max(500).optional().nullable()),
  images: z.array(z.string()).optional().default([]),

  is_active: boolLike.optional().transform((v) => (v === undefined ? true : (String(v).toLowerCase() === "true" || Number(v) === 1))),
  is_featured: boolLike.optional().transform((v) => (v === undefined ? false : (String(v).toLowerCase() === "true" || Number(v) === 1))),

  tags: z.array(z.string()).optional().default([]),

  specifications: z.object({
    dimensions: z.string().optional(),
    weight: z.string().optional(),
    thickness: z.string().optional(),
    surfaceFinish: z.string().optional(),
    warranty: z.string().optional(),
    installationTime: z.string().optional(),
  }).partial().optional(),

  product_code: z.string().max(64).optional().nullable(),
  stock_quantity: z.coerce.number().int().min(0).optional().default(0),
  rating: z.coerce.number().min(0).max(5).optional(),
  review_count: z.coerce.number().int().min(0).optional(),

  meta_title: emptyToNull(z.string().max(255).optional().nullable()),
  meta_description: emptyToNull(z.string().max(500).optional().nullable()),
});

export const productUpdateSchema = productCreateSchema.partial();

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

/** product_faqs */
export const productFaqCreateSchema = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid(),
  question: z.string().min(1).max(500),
  answer: z.string().min(1),
  display_order: z.coerce.number().int().min(0).optional().default(0),
  is_active: boolLike.optional().transform((v) => v === undefined ? true : (String(v).toLowerCase() === "true" || Number(v) === 1)),
});
export const productFaqUpdateSchema = productFaqCreateSchema.partial();
export type ProductFaqCreateInput = z.infer<typeof productFaqCreateSchema>;
export type ProductFaqUpdateInput = z.infer<typeof productFaqUpdateSchema>;

/** product_specs (CatalogProduct.technicalSpecs) */
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
