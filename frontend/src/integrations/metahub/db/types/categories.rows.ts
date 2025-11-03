// =============================================================
// FILE: src/integrations/metahub/db/types/categories.rows.ts
// =============================================================

export type DbBool = 0 | 1 | boolean;

export type Category = {
  id: string;
  name: string;           // <-- BE 'name'
  slug: string;
  description: string | null;
  image_url: string | null;
  icon: string | null;

  is_active: DbBool;
  is_featured: DbBool;
  display_order: number;

  created_at: string; // DATETIME(3) ISO string bekliyoruz
  updated_at: string; // DATETIME(3)
};
