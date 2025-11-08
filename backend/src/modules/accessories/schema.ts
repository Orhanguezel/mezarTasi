import {
  mysqlTable,
  int,
  char,
  varchar,
  text,
  tinyint,
  datetime,
  index,
  uniqueIndex,

} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

/**
 * accessories — public modül (id: int AI → FE için numeric)
 * image_url (legacy) + storage_asset_id (yeni ilişki) birlikte tutulur.
 */
// ...
export const accessories = mysqlTable(
  "accessories",
  {
    id: int("id", { unsigned: true }).autoincrement().notNull().primaryKey(),

    uuid: char("uuid", { length: 36 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),

    category: varchar("category", { length: 16 }).notNull(),
    material: varchar("material", { length: 127 }).notNull(),
    price: varchar("price", { length: 127 }).notNull(),

    description: text("description"),

    image_url: text("image_url"),
    storage_asset_id: char("storage_asset_id", { length: 36 }),

    // ❗ mode: "boolean" YOK → 0/1 numeric
    featured: tinyint("featured", { unsigned: true }).notNull().default(0),
    is_active: tinyint("is_active", { unsigned: true }).notNull().default(1),

    dimensions: varchar("dimensions", { length: 127 }),
    weight: varchar("weight", { length: 127 }),
    thickness: varchar("thickness", { length: 127 }),
    finish: varchar("finish", { length: 127 }),
    warranty: varchar("warranty", { length: 127 }),
    installation_time: varchar("installation_time", { length: 127 }),

    display_order: int("display_order", { unsigned: true }).notNull().default(0),

    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => ({
    uniq_slug: uniqueIndex("uniq_accessories_slug").on(t.slug),
    idx_category: index("idx_accessories_category").on(t.category),
    idx_active: index("idx_accessories_active").on(t.is_active),
    idx_order: index("idx_accessories_order").on(t.display_order),
    idx_storage: index("idx_accessories_storage").on(t.storage_asset_id),
    idx_uuid: uniqueIndex("uniq_accessories_uuid").on(t.uuid),
  })
);


export type AccessoryRow = typeof accessories.$inferSelect;
export type NewAccessoryRow = typeof accessories.$inferInsert;
