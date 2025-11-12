// =============================================================
// FILE: src/modules/services/validation.ts
// =============================================================
import { z } from "zod";

/* ---- ortak enum ---- */
export const ServiceTypeEnum = z.enum(["gardening", "soil", "other"]);

/* ---- LIST QUERIES (slider ile aynı isimleşme) ---- */
export const servicePublicListQuerySchema = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(["created_at","updated_at","name","display_order"]).default("display_order"),
  order: z.enum(["asc","desc"]).default("asc"),
  // ✅ tek string, CSV veya string[] destekle
  type: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => {
      if (!v) return [];
      if (Array.isArray(v)) return v.filter(Boolean).map(s => s.toLowerCase().trim());
      return String(v).split(",").map(s => s.toLowerCase().trim()).filter(Boolean);
    }),
});

export const serviceAdminListQuerySchema = servicePublicListQuerySchema.extend({
  is_active: z.coerce.boolean().optional(),
  type: z.enum(["gardening", "soil", "other"]).optional(),
  category: z.string().optional(),
  featured: z.coerce.boolean().optional(),
});

/* ---- CREATE / UPDATE (slider/kategori ile hizalı) ---- */
export const serviceCreateSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),

  type: ServiceTypeEnum.optional().default("other"),
  category: z.string().min(1).max(64).optional().default("general"),

  material: z.string().max(255).optional().nullable(),
  price: z.string().max(128).optional().nullable(),
  description: z.string().optional().nullable(),

  // ✅ image alanları (isim standardı)
  image_url: z.string().url().max(500).optional().nullable(),
  image_asset_id: z.string().uuid().optional().nullable(),
  alt: z.string().max(255).optional(),

  featured: z.coerce.boolean().optional().default(false),
  is_active: z.coerce.boolean().optional().default(true),
  display_order: z.coerce.number().int().min(0).optional(),

  // gardening
  area: z.string().max(64).optional().nullable(),
  duration: z.string().max(64).optional().nullable(),
  maintenance: z.string().max(64).optional().nullable(),
  season: z.string().max(64).optional().nullable(),

  // soil
  soil_type: z.string().max(128).optional().nullable(),
  thickness: z.string().max(64).optional().nullable(),
  equipment: z.string().max(128).optional().nullable(),

  // common
  warranty: z.string().max(128).optional().nullable(),
  includes: z.string().max(255).optional().nullable(),

  // legacy (effective url coalesce’de son tercih)
  featured_image: z.string().url().max(500).optional().nullable(),
});

export const serviceUpdateSchema = serviceCreateSchema.partial();

/* ---- REORDER / STATUS ---- */
export const serviceReorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1), // services.id: UUID
});

export const serviceSetStatusSchema = z.object({
  is_active: z.coerce.boolean(),
});

/* ---- ✅ SET IMAGE (kategori/slider ile aynı sözleşme) ---- */
export const serviceSetImageSchema = z.object({
  /** null/undefined ⇒ görseli kaldır */
  asset_id: z.string().uuid().nullable().optional(),
}).strict();

export type ServicePublicListQuery = z.infer<typeof servicePublicListQuerySchema>;
export type ServiceAdminListQuery  = z.infer<typeof serviceAdminListQuerySchema>;
export type ServiceCreateBody      = z.infer<typeof serviceCreateSchema>;
export type ServiceUpdateBody      = z.infer<typeof serviceUpdateSchema>;
export type ServiceSetImageBody    = z.infer<typeof serviceSetImageSchema>;
