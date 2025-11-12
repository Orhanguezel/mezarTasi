// =============================================================
// FILE: src/modules/campaigns/validation.ts
// =============================================================
import { z } from "zod";

export const boolLike = z.union([
  z.boolean(),
  z.literal(0), z.literal(1),
  z.literal("0"), z.literal("1"),
  z.literal("true"), z.literal("false"),
]);

/** LIST query (public & admin) */
export const simpleCampaignListQuerySchema = z.object({
  q: z.string().optional(),
  is_active: boolLike.optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  sort: z.enum(["updated_at", "created_at", "title"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
}).passthrough();
export type SimpleCampaignListQuery = z.infer<typeof simpleCampaignListQuerySchema>;

/** === Tek görsel: storage ile birebir “SET IMAGE” şeması ===
 *  - Temizle: { storage_asset_id: null } veya { image_url: null }
 *  - URL set: { image_url: "https://..." }
 *  - Asset set: { storage_asset_id: "<uuid>" }
 *  - Sadece alt güncelle: { alt: "..." }
 */
export const setCampaignImageBodySchema = z.object({
  storage_asset_id: z.string().uuid().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  alt: z.string().max(255).nullable().optional(),
}).strict();
export type SetCampaignImageBody = z.infer<typeof setCampaignImageBodySchema>;

/** === Ana kampanya şemaları === */
export const upsertSimpleCampaignBodySchema = z.object({
  title: z.string().min(1).max(255).trim(),
  description: z.string().min(1).max(500).trim(),
  seoKeywords: z.array(z.string().min(1)).min(1),

  image_url: z.string().url().nullable().optional(),
  storage_asset_id: z.string().uuid().nullable().optional(),
  alt: z.string().max(255).nullable().optional(),

  is_active: boolLike.optional().default(true),
}).strict();
export type UpsertSimpleCampaignBody = z.infer<typeof upsertSimpleCampaignBodySchema>;

export const patchSimpleCampaignBodySchema = upsertSimpleCampaignBodySchema.partial();
export type PatchSimpleCampaignBody = z.infer<typeof patchSimpleCampaignBodySchema>;

/** === BULK ACTIVE (admin) === */
export const bulkActiveSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  is_active: boolLike,
}).strict();
export type BulkActiveBody = z.infer<typeof bulkActiveSchema>;
