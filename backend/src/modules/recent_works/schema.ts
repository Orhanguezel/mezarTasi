import {
  mysqlTable, char, varchar, tinyint, datetime, uniqueIndex, longtext, index, int, json,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export type RecentWorkDetails = {
  dimensions: string;
  workTime: string;
  specialFeatures: string[];
  customerReview?: string | null;
};

export const recentWorks = mysqlTable(
  "recent_works",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),

    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),

    // kısa açıklama (varchar 500)
    description: varchar("description", { length: 500 }).notNull(),

    // Tek görsel (campaign/services pattern)
    image_url: varchar("image_url", { length: 500 }),
    storage_asset_id: char("storage_asset_id", { length: 36 }),
    alt: varchar("alt", { length: 255 }),

    category: varchar("category", { length: 255 }).notNull(),

    // SEO: JSON-string string[]
    seo_keywords: longtext("seo_keywords").notNull(),

    date: varchar("date", { length: 64 }).notNull(), // "2024"
    location: varchar("location", { length: 255 }).notNull(),
    material: varchar("material", { length: 255 }).notNull(),
    price: varchar("price", { length: 255 }),

    details: json("details").$type<RecentWorkDetails>().notNull(),

    is_active: tinyint("is_active").notNull().default(1),
    display_order: int("display_order").notNull().default(0),

    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 }).notNull()
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    uniqueIndex("ux_recent_works_slug").on(t.slug),
    index("recent_works_category_idx").on(t.category),
    index("recent_works_active_idx").on(t.is_active),
    index("recent_works_updated_idx").on(t.updated_at),
    index("recent_works_display_idx").on(t.display_order),
    index("recent_works_asset_idx").on(t.storage_asset_id),
  ],
);

export type RecentWorkRow = typeof recentWorks.$inferSelect;
export type NewRecentWorkRow = typeof recentWorks.$inferInsert;

export type RecentWorkView = {
  id: string;
  title: string;
  slug: string;
  description: string;

  image_url?: string | null;
  storage_asset_id?: string | null;
  alt?: string | null;
  image_effective_url?: string | null;

  category: string;
  seo_keywords: string[];

  date: string;
  location: string;
  material: string;
  price: string | null;

  details: RecentWorkDetails;

  is_active: boolean;
  display_order: number;

  created_at?: string;
  updated_at?: string;
};
