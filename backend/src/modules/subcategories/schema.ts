import {
  mysqlTable,
  char,
  varchar,
  text,
  int,
  tinyint,
  datetime,
  index,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { categories } from "../categories/schema";

/**
 * SUB CATEGORIES
 * - Her alt kategori bir ÜST kategoriye bağlıdır (category_id).
 * - FE tarafındaki SubCategory { value: slug, label: name } ile hizalıdır.
 */
export const subCategories = mysqlTable(
  "sub_categories",
  {
    id: char("id", { length: 36 }).notNull().primaryKey(),

    /** Parent category FK */
    category_id: char("category_id", { length: 36 }).notNull(),

    /** FE SubCategory.label */
    name: varchar("name", { length: 255 }).notNull(),
    /** FE SubCategory.value — slug kullanıyoruz */
    slug: varchar("slug", { length: 255 }).notNull(),

    description: text("description"),
    image_url: varchar("image_url", { length: 500 }),
    icon: varchar("icon", { length: 100 }),

    is_active: tinyint("is_active").notNull().default(1).$type<boolean>(),
    is_featured: tinyint("is_featured").notNull().default(0).$type<boolean>(),
    display_order: int("display_order").notNull().default(0),

    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    /** Aynı parent içinde slug benzersiz */
    uniqueIndex("sub_categories_parent_slug_uq").on(t.category_id, t.slug),
    index("sub_categories_category_id_idx").on(t.category_id),
    index("sub_categories_active_idx").on(t.is_active),
    index("sub_categories_order_idx").on(t.display_order),

    foreignKey({
      columns: [t.category_id],
      foreignColumns: [categories.id],
      name: "fk_sub_categories_category",
    })
      // İstediğin davranışa göre değiştir: "restrict" veya "cascade"
      .onDelete("restrict")
      .onUpdate("cascade"),
  ]
);

export type SubCategoryRow = typeof subCategories.$inferSelect;
export type NewSubCategoryRow = typeof subCategories.$inferInsert;
