// src/integrations/metahub/db/types/services.types.ts

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

  image_url: string | null;
  storage_asset_id: string | null;
  alt: string | null;
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

  created_at: string;
  updated_at: string;
};

export type ServiceListParams = {
  /** FE → BE: search -> q */
  search?: string;

  /** FE → BE: type (tek değer veya çoklu) */
  type?: ServiceType | ServiceType[];  // ✅ array destekle

  /** NOT: public endpoint şu an category/featured/active almaz; admin tarafında var. */
  category?: string;
  featured?: boolean;
  /** FE → BE: active -> is_active (public’te BE zaten 1 filtreliyor) */
  active?: boolean;

  limit?: number;
  offset?: number;

  /** FE → BE: orderBy -> sort */
  orderBy?: "created_at" | "updated_at" | "display_order" | "name";
  order?: "asc" | "desc";
};

/** CREATE/UPDATE tipleri (değişmedi) */
export type ServiceCreateInput = { /* ... mevcut içeriğin aynı ... */ };
export type ServiceUpdateInput = Partial<ServiceCreateInput>;

export interface ServiceAttachImageBody { storage_asset_id?: string; image_url?: string; }
export interface ServiceReorderBody { ids: string[]; }
export interface ServiceStatusBody { is_active: boolean; }
