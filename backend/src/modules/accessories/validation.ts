// =============================================================
// FILE: src/modules/accessories/validation.ts
// =============================================================
import { z } from "zod";

/* ---------- ortak enum & tipler ---------- */
export const accessoryKeyEnum = z.enum(["suluk", "sutun", "vazo", "aksesuar"]);
export type AccessoryKey = z.infer<typeof accessoryKeyEnum>;

/* ---------- LIST query (public & admin) ---------- */
export const listQuerySchema = z
  .object({
    q: z.string().optional(),
    category: accessoryKeyEnum.optional(),
    is_active: z
      .union([z.coerce.boolean(), z.literal(0), z.literal(1)])
      .transform((v) =>
        typeof v === "number" ? v === 1 : typeof v === "boolean" ? v : undefined
      )
      .optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    offset: z.coerce.number().int().min(0).default(0),
    sort: z.enum(["display_order", "name", "created_at", "updated_at"]).default("display_order"),
    order: z.enum(["asc", "desc"]).default("asc"),
  })
  .strict()
  .passthrough();
export type ListQuery = z.infer<typeof listQuerySchema>;

/* ---------- CREATE / UPDATE body ---------- */
export const createAccessorySchema = z
  .object({
    name: z.string().min(1).max(255),
    category: accessoryKeyEnum,
    material: z.string().min(1).max(127),
    price: z.string().min(1).max(127),
    description: z.string().max(2000).optional().default(""),
    featured: z.coerce.boolean().optional().default(false),

    // ✅ storage pattern terimleri
    image_url: z.string().url().nullable().optional(),
    storage_asset_id: z.string().length(36).nullable().optional(),
    alt: z.string().max(255).nullable().optional(),

    dimensions: z.string().max(127).optional(),
    weight: z.string().max(127).optional(),
    thickness: z.string().max(127).optional(),
    finish: z.string().max(127).optional(),
    warranty: z.string().max(127).optional(),
    installation_time: z.string().max(127).optional(),

    display_order: z.coerce.number().int().min(0).max(9999).optional().default(0),
    is_active: z.coerce.boolean().optional().default(true),
  })
  .strict();

export type CreateAccessoryInput = z.infer<typeof createAccessorySchema>;


/* ✅ Kapak görseli ayarla/kaldır (asset_id + alt) */
export const accessorySetImageSchema = z.object({
  /** null/undefined ⇒ görseli kaldır */
  asset_id: z.string().uuid().nullable().optional(),
  /** alt verildiyse güncellenir; ""/null ⇒ temizlenir */
  alt: z.preprocess((v) => (v === "" ? null : v), z.string().max(255).nullable().optional()),
}).strict();

export type AccessorySetImageInput = z.infer<typeof accessorySetImageSchema>;




export const updateAccessorySchema = createAccessorySchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "no_fields_to_update" });

export type UpdateAccessoryInput = z.infer<typeof updateAccessorySchema>;

/* ---------- Param şemaları ---------- */
export const idParamSchema = z.object({ id: z.coerce.number().int().min(1) }).strict();
export type IdParam = z.infer<typeof idParamSchema>;

export const idOrSlugParamSchema = z.object({ idOrSlug: z.string().min(1) }).strict();
export type IdOrSlugParam = z.infer<typeof idOrSlugParamSchema>;
