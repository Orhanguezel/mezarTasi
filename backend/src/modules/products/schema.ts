// =============================================================
// FILE: src/modules/products/schema.ts
// =============================================================
import {
  mysqlTable,
  char,
  varchar,
  text,
  longtext,
  int,
  tinyint,
  decimal,
  datetime,
  json,
  index,
  uniqueIndex,
  foreignKey,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { categories } from "../categories/schema";
import { subCategories } from "../subcategories/schema";

export const products = mysqlTable(
  "products",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),

    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),

    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    description: text("description"),

    category_id: char("category_id", { length: 36 }).notNull(),
    sub_category_id: char("sub_category_id", { length: 36 }),

    // ✅ Görseller (tekil kapak + çoklu galeri)
    image_url: longtext("image_url"),
    storage_asset_id: char("storage_asset_id", { length: 36 }),
    alt: varchar("alt", { length: 255 }),
    images: json("images").$type<string[]>().default(sql`JSON_ARRAY()`),
    storage_image_ids: json("storage_image_ids").$type<string[]>().default(sql`JSON_ARRAY()`),

    is_active: tinyint("is_active").notNull().default(1).$type<boolean>(),
    is_featured: tinyint("is_featured").notNull().default(0).$type<boolean>(),

    tags: json("tags").$type<string[]>().default(sql`JSON_ARRAY()`),

    specifications: json("specifications").$type<{
      dimensions?: string;
      weight?: string;
      thickness?: string;
      surfaceFinish?: string;
      warranty?: string;
      installationTime?: string;
    }>(),

    product_code: varchar("product_code", { length: 64 }),
    stock_quantity: int("stock_quantity").notNull().default(0),
    rating: decimal("rating", { precision: 3, scale: 2 }).notNull().default("5.00"),
    review_count: int("review_count").notNull().default(0),

    meta_title: varchar("meta_title", { length: 255 }),
    meta_description: varchar("meta_description", { length: 500 }),

    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("products_slug_uq").on(t.slug),
    uniqueIndex("products_code_uq").on(t.product_code),

    index("products_category_id_idx").on(t.category_id),
    index("products_sub_category_id_idx").on(t.sub_category_id),
    index("products_active_idx").on(t.is_active),
    index("products_asset_idx").on(t.storage_asset_id),

    foreignKey({
      columns: [t.category_id],
      foreignColumns: [categories.id],
      name: "fk_products_category",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),

    foreignKey({
      columns: [t.sub_category_id],
      foreignColumns: [subCategories.id],
      name: "fk_products_subcategory",
    })
      .onDelete("set null")
      .onUpdate("cascade"),
  ]
);

// ========== SPECS / FAQS / REVIEWS / OPTIONS / STOCK ==========

export const productSpecs = mysqlTable(
  "product_specs",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    product_id: char("product_id", { length: 36 }).notNull(),

    name: varchar("name", { length: 255 }).notNull(),
    value: text("value").notNull(),
    category: mysqlEnum("category", ["physical", "material", "service", "custom"])
      .notNull()
      .default("custom"),
    order_num: int("order_num").notNull().default(0),

    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("product_specs_product_id_idx").on(t.product_id),
    foreignKey({
      columns: [t.product_id],
      foreignColumns: [products.id],
      name: "fk_product_specs_product",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

export const productFaqs = mysqlTable(
  "product_faqs",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    product_id: char("product_id", { length: 36 }).notNull(),
    question: varchar("question", { length: 500 }).notNull(),
    answer: text("answer").notNull(),
    display_order: int("display_order").notNull().default(0),
    is_active: tinyint("is_active").notNull().default(1).$type<boolean>(),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("product_faqs_product_id_idx").on(t.product_id),
    index("product_faqs_order_idx").on(t.display_order),
    foreignKey({
      columns: [t.product_id],
      foreignColumns: [products.id],
      name: "fk_product_faqs_product",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

export const productReviews = mysqlTable(
  "product_reviews",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    product_id: char("product_id", { length: 36 }).notNull(),
    user_id: char("user_id", { length: 36 }),
    rating: int("rating").notNull(),
    comment: text("comment"),
    is_active: tinyint("is_active").notNull().default(1).$type<boolean>(),
    customer_name: varchar("customer_name", { length: 255 }),
    review_date: datetime("review_date", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("product_reviews_product_id_idx").on(t.product_id),
    index("product_reviews_approved_idx").on(t.product_id, t.is_active),
    index("product_reviews_rating_idx").on(t.rating),
    foreignKey({
      columns: [t.product_id],
      foreignColumns: [products.id],
      name: "fk_product_reviews_product",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

export const productOptions = mysqlTable(
  "product_options",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    product_id: char("product_id", { length: 36 }).notNull(),
    option_name: varchar("option_name", { length: 100 }).notNull(),
    option_values: json("option_values").$type<string[]>().notNull(),
    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("product_options_product_id_idx").on(t.product_id),
    foreignKey({
      columns: [t.product_id],
      foreignColumns: [products.id],
      name: "fk_product_options_product",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

export const productStock = mysqlTable(
  "product_stock",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    product_id: char("product_id", { length: 36 }).notNull(),
    stock_content: varchar("stock_content", { length: 255 }).notNull(),
    is_used: tinyint("is_used").notNull().default(0).$type<boolean>(),
    used_at: datetime("used_at", { fsp: 3 }),
    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    order_item_id: char("order_item_id", { length: 36 }),
  },
  (t) => [
    index("product_stock_product_id_idx").on(t.product_id),
    index("product_stock_is_used_idx").on(t.product_id, t.is_used),
    index("product_stock_order_item_id_idx").on(t.order_item_id),
    foreignKey({
      columns: [t.product_id],
      foreignColumns: [products.id],
      name: "fk_product_stock_product",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

// Alias
export { productReviews as product_reviews };
export { productOptions as product_options };
export { productStock as product_stock };

// Types
export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;
export type ProductSpecRow = typeof productSpecs.$inferSelect;
export type NewProductSpecRow = typeof productSpecs.$inferInsert;
export type ProductFaqRow = typeof productFaqs.$inferSelect;
export type NewProductFaqRow = typeof productFaqs.$inferInsert;
export type ProductReviewRow = typeof productReviews.$inferSelect;
export type NewProductReviewRow = typeof productReviews.$inferInsert;
export type ProductOptionRow = typeof productOptions.$inferSelect;
export type NewProductOptionRow = typeof productOptions.$inferInsert;
export type ProductStockRow = typeof productStock.$inferSelect;
export type NewProductStockRow = typeof productStock.$inferInsert;
