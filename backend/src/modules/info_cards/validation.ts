import { z } from "zod";

export const boolLike = z.union([
  z.boolean(),
  z.literal(0), z.literal(1),
  z.literal("0"), z.literal("1"),
  z.literal("true"), z.literal("false"),
]);

/** LIST query (public & admin) */
export const infoCardListQuerySchema = z.object({
  q: z.string().optional(),
  is_active: boolLike.optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  sort: z.enum(["display_order", "created_at", "updated_at"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});
export type InfoCardListQuery = z.infer<typeof infoCardListQuerySchema>;

/** CREATE / UPSERT body */
export const upsertInfoCardBodySchema = z.object({
  title: z.string().min(1).max(255).trim(),
  description: z.string().min(1).max(500).trim(),
  icon: z.string().min(1).max(32).trim(),
  icon_type: z.enum(["emoji", "lucide"]),
  lucide_icon: z.string().max(64).trim().nullable().optional(),
  link: z.string().min(1).max(255).trim(),

  bg_color: z.string().min(1).max(64).trim(),
  hover_color: z.string().min(1).max(64).trim(),
  icon_color: z.string().min(1).max(64).trim(),
  text_color: z.string().min(1).max(64).trim(),
  border_color: z.string().min(1).max(64).trim(),

  is_active: boolLike.optional().default(true),
  display_order: z.coerce.number().int().min(1).optional(),
});
export type UpsertInfoCardBody = z.infer<typeof upsertInfoCardBodySchema>;

/** PATCH body (hepsi opsiyonel) */
export const patchInfoCardBodySchema = upsertInfoCardBodySchema.partial();
export type PatchInfoCardBody = z.infer<typeof patchInfoCardBodySchema>;
