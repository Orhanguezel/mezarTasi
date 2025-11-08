// src/integrations/metahub/db/types/services.types.ts

// Tipler tek yerde
export type ServiceType = "gardening" | "soil" | "other";

type NullableString = string | null | undefined;

/** Backend admin.view -> Frontend */
export type ServiceView = {
  id: string;
  slug: string;
  name: string;

  type: ServiceType;
  category: string;

  material: string | null;
  price: string | null;
  description: string | null;

  featured: boolean;
  is_active: boolean;
  display_order: number;

  // Görsel alanları (storage ile hizalı)
  image_url: string | null;
  storage_asset_id: string | null;
  alt: string | null;

  /** Backend'in hesapladığı tek gösterim alanı */
  image_effective_url: string | null;

  // Gardening
  area: string | null;
  duration: string | null;
  maintenance: string | null;
  season: string | null;

  // Soil
  soil_type: string | null;
  thickness: string | null;
  equipment: string | null;

  // Common
  warranty: string | null;
  includes: string | null;

  created_at: string; // ISO
  updated_at: string; // ISO
};

export type ServiceListParams = {
  /** FE → BE: search -> q */
  search?: string;
  type?: ServiceType;
  category?: string;
  featured?: boolean;
  /** FE → BE: active -> is_active */
  active?: boolean;
  limit?: number;
  offset?: number;
  /** FE → BE: orderBy -> sort (display_order | name | created_at | updated_at) */
  orderBy?: "created_at" | "updated_at" | "display_order" | "name";
  order?: "asc" | "desc";
};

/** CREATE — sunucuda null kabul edildiği için FE'de string|null|undefined */
export type ServiceCreateInput = {
  slug?: string;
  name: string;
  type?: ServiceType;
  category?: string;

  material?: NullableString;
  price?: NullableString;
  description?: NullableString;

  featured?: boolean;
  is_active?: boolean;
  display_order?: number;

  // Görsel girişleri
  image_url?: NullableString;
  storage_asset_id?: string | null;
  alt?: NullableString;

  // Gardening
  area?: NullableString;
  duration?: NullableString;
  maintenance?: NullableString;
  season?: NullableString;

  // Soil
  soil_type?: NullableString;
  thickness?: NullableString;
  equipment?: NullableString;

  // Common
  warranty?: NullableString;
  includes?: NullableString;

  /** Opsiyonel legacy kolon */
  featured_image?: NullableString;
};

export type ServiceUpdateInput = Partial<ServiceCreateInput>;

/** Admin image ops body tipleri (backend schema ile birebir) */
export interface ServiceAttachImageBody { storage_asset_id?: string; image_url?: string; }
export interface ServiceReorderBody { ids: string[]; }
export interface ServiceStatusBody { is_active: boolean; }
