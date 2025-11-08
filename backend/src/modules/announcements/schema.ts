// src/modules/announcements/schema.ts

import { mysqlTable, char, varchar, longtext, tinyint, int, datetime, index } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const announcements = mysqlTable("announcements", {
  id: char("id", { length: 36 }).primaryKey().notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  /** JSON-string: {"html":"..."} */
  content: longtext("content").notNull(),
  icon: varchar("icon", { length: 32 }).notNull(),
  icon_type: varchar("icon_type", { length: 10 }).notNull(), // 'emoji' | 'lucide'
  lucide_icon: varchar("lucide_icon", { length: 64 }),
  link: varchar("link", { length: 255 }).notNull(),

  bg_color: varchar("bg_color", { length: 64 }).notNull(),
  hover_color: varchar("hover_color", { length: 64 }).notNull(),
  icon_color: varchar("icon_color", { length: 64 }).notNull(),
  text_color: varchar("text_color", { length: 64 }).notNull(),
  border_color: varchar("border_color", { length: 64 }).notNull(),

  badge_text: varchar("badge_text", { length: 64 }),
  badge_color: varchar("badge_color", { length: 64 }),
  button_text: varchar("button_text", { length: 64 }),
  button_color: varchar("button_color", { length: 64 }),

  is_active: tinyint("is_active").notNull().default(1),
  is_published: tinyint("is_published").notNull().default(1),
  display_order: int("display_order").notNull().default(1),

  created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updated_at: datetime("updated_at", { fsp: 3 }).notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
  published_at: datetime("published_at", { fsp: 3 }),
  expires_at: datetime("expires_at", { fsp: 3 }),

  meta_title: varchar("meta_title", { length: 255 }),
  meta_description: varchar("meta_description", { length: 500 }),
}, (t) => [
  index("announcements_active_idx").on(t.is_active, t.is_published),
  index("announcements_order_idx").on(t.display_order),
  index("announcements_expires_idx").on(t.expires_at),
]);

export type AnnouncementRow = typeof announcements.$inferSelect;
export type NewAnnouncementRow = typeof announcements.$inferInsert;
