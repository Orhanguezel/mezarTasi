import { mysqlTable, char, varchar, int, tinyint, datetime, index } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const infoCards = mysqlTable("info_cards", {
  id: char("id", { length: 36 }).primaryKey().notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  icon: varchar("icon", { length: 32 }).notNull(),
  icon_type: varchar("icon_type", { length: 10 }).notNull(), // 'emoji' | 'lucide'
  lucide_icon: varchar("lucide_icon", { length: 64 }),
  link: varchar("link", { length: 255 }).notNull(),

  bg_color: varchar("bg_color", { length: 64 }).notNull(),
  hover_color: varchar("hover_color", { length: 64 }).notNull(),
  icon_color: varchar("icon_color", { length: 64 }).notNull(),
  text_color: varchar("text_color", { length: 64 }).notNull(),
  border_color: varchar("border_color", { length: 64 }).notNull(),

  is_active: tinyint("is_active").notNull().default(1),
  display_order: int("display_order").notNull().default(1),

  created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updated_at: datetime("updated_at", { fsp: 3 }).notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
}, (t) => [
  index("info_cards_active_idx").on(t.is_active),
  index("info_cards_order_idx").on(t.display_order),
]);

export type InfoCardRow = typeof infoCards.$inferSelect;
export type NewInfoCardRow = typeof infoCards.$inferInsert;
