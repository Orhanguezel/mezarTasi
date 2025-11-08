// src/modules/announcements/validation.ts

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

export const upsertAnnouncementBodySchema = z.object({
  title: z.string().min(1).max(255).trim(),
  description: z.string().min(1).max(500).trim(),
  /** düz HTML — repo.packContent ile {"html": "..."} olarak saklanır */
  content: z.string().min(1),

  icon: z.string().min(1).max(32),
  icon_type: z.enum(["emoji", "lucide"]),
  lucide_icon: z.string().max(64).nullable().optional(),
  link: z.string().min(1).max(255),

  bg_color: z.string().min(1).max(64),
  hover_color: z.string().min(1).max(64),
  icon_color: z.string().min(1).max(64),
  text_color: z.string().min(1).max(64),
  border_color: z.string().min(1).max(64),

  badge_text: z.string().max(64).nullable().optional(),
  badge_color: z.string().max(64).nullable().optional(),
  button_text: z.string().max(64).nullable().optional(),
  button_color: z.string().max(64).nullable().optional(),

  is_active: boolLike.optional().default(true),
  is_published: boolLike.optional().default(true),
  display_order: z.coerce.number().int().min(1).optional(),

  published_at: z.coerce.date().nullable().optional(),
  expires_at: z.coerce.date().nullable().optional(),

  meta_title: z.string().max(255).nullable().optional(),
  meta_description: z.string().max(500).nullable().optional(),
});
export type UpsertAnnouncementBody = z.infer<typeof upsertAnnouncementBodySchema>;

export const patchAnnouncementBodySchema = upsertAnnouncementBodySchema.partial();
export type PatchAnnouncementBody = z.infer<typeof patchAnnouncementBodySchema>;

export const reorderBodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});
export type ReorderBody = z.infer<typeof reorderBodySchema>;
