import {
  mysqlTable,
  char,
  varchar,
  text,
  tinyint,
  int,
  datetime,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const services = mysqlTable(
  "services",
  {
    // UUID PK (mevcut yapıyı koruyoruz)
    id: char("id", { length: 36 }).primaryKey().notNull(),

    slug: varchar("slug", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),

    type: varchar("type", { length: 32 }).notNull().default("other"),
    category: varchar("category", { length: 64 }).notNull().default("general"),

    material: varchar("material", { length: 255 }),
    price: varchar("price", { length: 128 }),
    description: text("description"),

    // slider ile hizalı: tinyint(1) 0/1
    featured: tinyint("featured", { unsigned: true }).notNull().default(0),
    is_active: tinyint("is_active", { unsigned: true }).notNull().default(1),

    display_order: int("display_order", { unsigned: true }).notNull().default(1),

    // Görsel alanları
    image_url: varchar("image_url", { length: 500 }),
    storage_asset_id: char("storage_asset_id", { length: 36 }),
    alt: varchar("alt", { length: 255 }),

    // legacy
    featured_image: varchar("featured_image", { length: 500 }),

    // Gardening
    area: varchar("area", { length: 64 }),
    duration: varchar("duration", { length: 64 }),
    maintenance: varchar("maintenance", { length: 64 }),
    season: varchar("season", { length: 64 }),

    // Soil
    soil_type: varchar("soil_type", { length: 128 }),
    thickness: varchar("thickness", { length: 64 }),
    equipment: varchar("equipment", { length: 128 }),

    // Common
    warranty: varchar("warranty", { length: 128 }),
    includes: varchar("includes", { length: 255 }),

    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => ({
    uxSlug: uniqueIndex("ux_services_slug").on(t.slug),
    idxActive: index("services_active_idx").on(t.is_active),
    idxOrder: index("services_order_idx").on(t.display_order),
    idxType: index("services_type_idx").on(t.type),
    idxCategory: index("services_category_idx").on(t.category),
    idxAsset: index("services_asset_idx").on(t.storage_asset_id),
    idxCreated: index("services_created_idx").on(t.created_at), // ← migration ile hizalı
    idxUpdated: index("services_updated_idx").on(t.updated_at),
  })
);

export type ServiceRow = typeof services.$inferSelect;
export type NewServiceRow = typeof services.$inferInsert;
