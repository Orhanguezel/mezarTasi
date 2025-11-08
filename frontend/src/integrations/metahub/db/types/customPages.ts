// =============================================================
// FILE: src/integrations/metahub/db/types/customPages.ts
// =============================================================

/** ───── Custom Pages (RAW + VIEW) ───── */

// Row (BE’den gelen ham)
export type CustomPageRow = {
  id: string;
  title: string;
  slug: string;
  content: string | { html: string };

  featured_image: string | null;
  featured_image_asset_id: string | null;
  featured_image_alt: string | null;

  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  created_at?: string;
  updated_at?: string;
};

// View (FE’nin kullandığı normalize görünüm)
export type CustomPageView = {
  id: string;
  title: string;
  slug: string;
  content: string; // düz HTML

  featured_image: string | null;
  featured_image_alt: string | null;

  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
};


/** create/update body (FE) — düz HTML gönderilir (BE {"html": "..."} yapar) */
export type UpsertCustomPageBody = {
  title: string;
  slug: string;
  content: string; // düz HTML (JSON'a çevirmeyin!)

  /** Görsel alanları */
  featured_image?: string | null;
  featured_image_asset_id?: string | null;
  featured_image_alt?: string | null;

  meta_title?: string | null;
  meta_description?: string | null;
  is_published?: boolean;
  locale?: string | null;
};
