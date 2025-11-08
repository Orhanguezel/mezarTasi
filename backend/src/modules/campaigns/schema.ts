// src/modules/campaigns/schema.ts
import {
  mysqlTable,
  char,
  varchar,
  longtext,
  tinyint,
  datetime,
  index,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const simpleCampaigns = mysqlTable(
  "simple_campaigns",
  {
    // UUID PK
    id: char("id", { length: 36 }).primaryKey().notNull(),

    title: varchar("title", { length: 255 }).notNull(),
    // services standardına sadık kalarak: kısa açıklama (varchar 500)
    description: varchar("description", { length: 500 }).notNull(),

    // Görsel alanları — services ile aynı pattern
    image_url: varchar("image_url", { length: 500 }),
    storage_asset_id: char("storage_asset_id", { length: 36 }),
    alt: varchar("alt", { length: 255 }),

    // SEO: JSON-string string[]
    seo_keywords: longtext("seo_keywords").notNull(),

    // tinyint(1) unsigned → 0/1
    is_active: tinyint("is_active", { unsigned: true }).notNull().default(1),

    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => ({
    idxActive: index("simple_campaigns_active_idx").on(t.is_active),
    idxAsset: index("simple_campaigns_asset_idx").on(t.storage_asset_id),
    idxCreated: index("simple_campaigns_created_idx").on(t.created_at),
    idxUpdated: index("simple_campaigns_updated_idx").on(t.updated_at),
  })
);

export type SimpleCampaignRow = typeof simpleCampaigns.$inferSelect;
export type NewSimpleCampaignRow = typeof simpleCampaigns.$inferInsert;
