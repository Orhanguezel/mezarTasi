import {
  mysqlTable,
  char,
  varchar,
  tinyint,
  datetime,
  uniqueIndex,
  index,
  int,
  decimal,
  json,
  text,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const cemeteries = mysqlTable(
  "cemeteries",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),

    type: varchar("type", { length: 255 }).notNull(),
    address: varchar("address", { length: 500 }).notNull(),
    district: varchar("district", { length: 255 }).notNull(),

    phone: varchar("phone", { length: 64 }).notNull(),
    fax: varchar("fax", { length: 64 }),

    // ⬇️ Drizzle DECIMAL varsayılanı string; bunu TS’e açıkça bildiriyoruz
    lat: decimal("lat", { precision: 10, scale: 6 }).$type<string>().notNull(),
    lng: decimal("lng", { precision: 10, scale: 6 }).$type<string>().notNull(),

    services: json("services").$type<string[]>().notNull().default(sql`(JSON_ARRAY())`),
    working_hours: varchar("working_hours", { length: 255 }).notNull(),
    description: text("description").notNull(),

    accessibility: varchar("accessibility", { length: 255 }),
    transportation: varchar("transportation", { length: 255 }),

    is_active: tinyint("is_active").notNull().default(1),
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
    uniqueIndex("ux_cemeteries_slug").on(t.slug),
    index("cemeteries_created_idx").on(t.created_at),
    index("cemeteries_updated_idx").on(t.updated_at),
    index("cemeteries_is_active_idx").on(t.is_active),
    index("cemeteries_district_idx").on(t.district),
    index("cemeteries_type_idx").on(t.type),
  ],
);

export type CemeteryRow = typeof cemeteries.$inferSelect;   // lat/lng: string
export type NewCemeteryRow = typeof cemeteries.$inferInsert; // lat/lng: string

// ... (rowToView aynen kalabilir)
const toNum = (v: unknown): number => (typeof v === "string" ? Number(v) : (v as number));
export function rowToView(r: CemeteryRow) {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    type: r.type,
    address: r.address,
    district: r.district,
    phone: r.phone,
    fax: r.fax ?? null,
    coordinates: { lat: toNum(r.lat), lng: toNum(r.lng) },
    services: Array.isArray(r.services) ? r.services : [],
    workingHours: r.working_hours,
    description: r.description,
    accessibility: r.accessibility ?? null,
    transportation: r.transportation ?? null,
    is_active: r.is_active === 1,
    display_order: r.display_order,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

export type CemeteryView = ReturnType<typeof rowToView>;

