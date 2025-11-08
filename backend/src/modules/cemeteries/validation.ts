import { z } from "zod";

export const boolLike = z.union([
  z.boolean(),
  z.literal(0), z.literal(1),
  z.literal("0"), z.literal("1"),
  z.literal("true"), z.literal("false"),
]);

/** LIST query (admin/public aynı) */
export const cemeteryListQuerySchema = z.object({
  order: z.string().optional(),
  sort: z.enum(["created_at", "updated_at"]).optional(),
  orderDir: z.enum(["asc", "desc"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),

  /** filtreler */
  is_active: boolLike.optional(),
  q: z.string().optional(),
  slug: z.string().optional(),
  district: z.string().optional(),
  type: z.string().optional(),

  /** kolon seçimi (şimdilik yoksayılacak) */
  select: z.string().optional(),
});
export type CemeteryListQuery = z.infer<typeof cemeteryListQuerySchema>;

/** CREATE / UPSERT body */
export const upsertCemeteryBodySchema = z.object({
  name: z.string().min(2).max(255).trim(),
  slug: z
    .string()
    .min(1).max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug sadece küçük harf, rakam ve tire içermelidir")
    .trim(),
  type: z.string().min(2).max(255).trim(),
  address: z.string().min(2).max(500).trim(),
  district: z.string().min(1).max(255).trim(),
  phone: z.string().min(3).max(64).trim(),
  fax: z.string().max(64).nullable().optional(),

  coordinates: z.object({
    lat: z.number().finite(),
    lng: z.number().finite(),
  }),

  services: z.array(z.string().min(1).trim()).default([]),
  working_hours: z.string().min(1).max(255).trim(),
  description: z.string().min(1).trim(),

  accessibility: z.string().max(255).nullable().optional(),
  transportation: z.string().max(255).nullable().optional(),
  is_active: boolLike.optional().default(true),
  display_order: z.coerce.number().int().min(0).optional().default(0),
});
export type UpsertCemeteryBody = z.infer<typeof upsertCemeteryBodySchema>;

/** PATCH body (hepsi opsiyonel) */
export const patchCemeteryBodySchema = upsertCemeteryBodySchema.partial();
export type PatchCemeteryBody = z.infer<typeof patchCemeteryBodySchema>;
