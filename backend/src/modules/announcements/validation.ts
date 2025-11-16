// =============================================================
// FILE: src/modules/announcements/validation.ts
// =============================================================
import { z } from "zod";

export const boolLike = z.union([
  z.boolean(),
  z.literal(0), z.literal(1),
  z.literal("0"), z.literal("1"),
  z.literal("true"), z.literal("false"),
]);

export function toBool(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  if (v === 1 || v === "1" || v === "true") return true;
  if (v === 0 || v === "0" || v === "false") return false;
  return undefined;
}

/** LIST (public/admin ortak) */
export const announcementListQuerySchema = z.object({
  order: z.enum(["asc", "desc"]).optional().default("asc"),
  sort: z.enum(["display_order", "created_at", "updated_at"]).optional().default("display_order"),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  is_active: boolLike.optional(),
  is_published: boolLike.optional(),
  include_expired: boolLike.optional(),
  q: z.string().max(200).optional(),
});
export type AnnouncementListQuery = z.infer<typeof announcementListQuerySchema>;

/** CREATE / UPSERT body (ikon alanları kaldırıldı) */
export const upsertAnnouncementBodySchema = z.object({
  title: z.string().min(1).max(255).trim(),
  description: z.string().min(1).max(500).trim(),
  /** düz HTML — repo.packContent ile {"html": "..."} olarak saklanır */
  content: z.string().min(1),
  link: z.string().min(1).max(255),

  // Renkler (BE default’ları da var; alan gelmezse defaults devreye girer)
  bg_color: z.string().min(1).max(64).optional().default("#F8FAFC"),
  hover_color: z.string().min(1).max(64).optional().default("#EFF6FF"),
  icon_color: z.string().min(1).max(64).optional().default("#0EA5E9"),
  text_color: z.string().min(1).max(64).optional().default("#0F172A"),
  border_color: z.string().min(1).max(64).optional().default("#E2E8F0"),

  badge_text: z.string().max(64).nullable().optional(),
  badge_color: z.string().max(64).nullable().optional(),
  button_text: z.string().max(64).nullable().optional(),
  button_color: z.string().max(64).nullable().optional(),

  /** ✅ Görsel alanları (storage patern) */
  image_url: z.string().url().nullable().optional(),
  storage_asset_id: z.string().uuid().nullable().optional(),
  alt: z.string().max(255).nullable().optional(),

  is_active: boolLike.optional().default(true),
  is_published: boolLike.optional().default(true),
  display_order: z.coerce.number().int().min(1).optional(),

  published_at: z.coerce.date().nullable().optional(),
  expires_at: z.coerce.date().nullable().optional(),

  meta_title: z.string().max(255).nullable().optional(),
  meta_description: z.string().max(500).nullable().optional(),
});
export type UpsertAnnouncementBody = z.infer<typeof upsertAnnouncementBodySchema>;

/** PATCH body (hepsi opsiyonel) */
export const patchAnnouncementBodySchema = upsertAnnouncementBodySchema.partial();
export type PatchAnnouncementBody = z.infer<typeof patchAnnouncementBodySchema>;

export const reorderBodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});
export type ReorderBody = z.infer<typeof reorderBodySchema>;

/** ✅ Tek uç: SET IMAGE (storage ile birebir) */
export const setAnnouncementImageBodySchema = z.object({
  /** Temizlemek için null verilebilir */
  storage_asset_id: z.string().uuid().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  alt: z.string().max(255).nullable().optional(),
}).strict();
export type SetAnnouncementImageBody = z.infer<typeof setAnnouncementImageBodySchema>;
