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
})
// Query’lerde bilinmeyen parametreleri tolere et
.passthrough();

export type SimpleCampaignListQuery = z.infer<typeof simpleCampaignListQuerySchema>;

/** === Tek görsel pattern’i (services ile aynı) === */
/** Görsel bağlama: storage_asset_id XOR image_url (tam olarak biri zorunlu) */
export const attachCampaignImageBodySchema = z
  .object({
    storage_asset_id: z.string().uuid().optional(),
    image_url: z.string().url().optional(),
  })
  .strict() // ← ÖNCE strict
  .refine(
    (v) => (!!v.storage_asset_id) !== (!!v.image_url),
    { message: "Provide exactly one of storage_asset_id or image_url" }
  );

export type AttachCampaignImageBody = z.infer<typeof attachCampaignImageBodySchema>;

/** === Ana kampanya şemaları === */
export const upsertSimpleCampaignBodySchema = z.object({
  title: z.string().min(1).max(255).trim(),
  description: z.string().min(1).max(500).trim(),
  seoKeywords: z.array(z.string().min(1)).min(1),

  // Opsiyonel görsel alanları
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
