// -------------------------------------------------------------
// FILE: src/integrations/metahub/db/types/slider.ts
// -------------------------------------------------------------

/** Public model (FE'nin beklediği minimal yapı) */
export interface SliderPublic {
  id: number;
  title: string;
  description: string;
  image: string;                // effective url (storage → url | image_url)
  alt?: string | null;
  buttonText?: string | null;
  buttonLink?: string | null;

  // opsiyoneller (public list için gerekmez ama ileride kullanışlı)
  featured?: boolean;
  isActive?: boolean;
  order?: number;
}

/** DB satırı tipini yansıtan raw model (admin controller {...sl} döndürüyor) */
export interface SliderRow {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description: string | null;

  image_url: string | null;
  storage_asset_id: string | null;
  alt: string | null;
  buttonText: string | null;
  buttonLink: string | null;

  featured: number;     // 0 | 1
  is_active: number;    // 0 | 1
  display_order: number;

  created_at: string;
  updated_at: string;
}

/** Admin list/get yanıtında eklenen alan */
export interface SliderAdminRow extends SliderRow {
  image_effective_url: string | null;
}

/** Admin UI için normalize edilmiş görünüm (booleans) */
export interface SliderAdminView {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description: string | null;

  image_url: string | null;
  storage_asset_id: string | null;
  image_effective_url: string | null;

  alt: string | null;
  buttonText: string | null;
  buttonLink: string | null;

  featured: boolean;
  is_active: boolean;
  display_order: number;

  created_at: string;
  updated_at: string;
}

/** Public list query */
export interface SliderListParams {
  q?: string;
  limit?: number;
  offset?: number;
  sort?: "display_order" | "name" | "created_at" | "updated_at";
  order?: "asc" | "desc";
}

/** Admin list query (is_active opsiyonel) */
export interface SliderAdminListParams extends SliderListParams {
  is_active?: boolean;
}

/** Create / Update inputları (controller zod ile parse ediyor) */
export interface SliderCreateInput {
  name: string;
  slug?: string;
  description?: string;

  image_url?: string | null;
  storage_asset_id?: string | null;
  alt?: string | null;
  buttonText?: string | null;
  buttonLink?: string | null;

  featured?: boolean;
  is_active?: boolean;
  display_order?: number;
}

export interface SliderUpdateInput {
  name?: string;
  slug?: string;
  description?: string | null;

  image_url?: string | null;
  storage_asset_id?: string | null;
  alt?: string | null;
  buttonText?: string | null;
  buttonLink?: string | null;

  featured?: boolean;
  is_active?: boolean;
  display_order?: number;
}

/** Yardımcı: status body */
export interface SliderStatusBody {
  is_active: boolean;
}

/** Yardımcı: reorder body */
export interface SliderReorderBody {
  ids: number[];
}

/** Yardımcı: görsel bağlama body */
export interface SliderAttachImageBody {
  storage_asset_id?: string;
  image_url?: string;
}
