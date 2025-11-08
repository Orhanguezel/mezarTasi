import { z } from "zod";

/* ---- ortak enum ---- */
export const ServiceTypeEnum = z.enum(["gardening", "soil", "other"]);

/* ---- LIST QUERIES (slider ile aynı isimleşme) ---- */
export const servicePublicListQuerySchema = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().int().min(0).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(["display_order", "name", "created_at", "updated_at"]).default("display_order"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export const serviceAdminListQuerySchema = servicePublicListQuerySchema.extend({
  is_active: z.coerce.boolean().optional(),
  type: z.enum(["gardening", "soil", "other"]).optional(),
  category: z.string().optional(),
  featured: z.coerce.boolean().optional(),
});

/* ---- CREATE / UPDATE (slider ile isim hizası) ---- */
export const serviceCreateSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),

  type: ServiceTypeEnum.optional().default("other"),
  category: z.string().min(1).max(64).optional().default("general"),

  material: z.string().max(255).optional().nullable(),
  price: z.string().max(128).optional().nullable(),
  description: z.string().optional().nullable(),

  // image fields → slider ile aynı isimler
  image_url: z.string().url().max(500).optional().nullable(),
  storage_asset_id: z.string().uuid().optional().nullable(),
  alt: z.string().max(255).optional(), // image_alt → alt

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

  // legacy alan kalsın (effective url coalesce’de son tercih)
  featured_image: z.string().url().max(500).optional().nullable(),
});

export const serviceUpdateSchema = serviceCreateSchema.partial();

/* ---- REORDER / STATUS ---- */
export const serviceReorderSchema = z.object({
  // services.id: UUID (char(36))
  ids: z.array(z.string().uuid()).min(1),
});

export const serviceSetStatusSchema = z.object({
  is_active: z.coerce.boolean(),
});

/* ---- ATTACH / DETACH IMAGE ---- */
export const serviceAttachImageSchema = z
  .object({
    storage_asset_id: z.string().uuid().optional(),
    image_url: z.string().url().max(500).optional(),
  })
  .refine((v) => !!v.storage_asset_id || !!v.image_url, {
    message: "storage_asset_id veya image_url zorunlu (en az biri)",
  });

export type ServicePublicListQuery = z.infer<typeof servicePublicListQuerySchema>;
export type ServiceAdminListQuery  = z.infer<typeof serviceAdminListQuerySchema>;
export type ServiceCreateBody      = z.infer<typeof serviceCreateSchema>;
export type ServiceUpdateBody      = z.infer<typeof serviceUpdateSchema>;
