// =============================================================
// FILE: src/modules/announcements/admin.controller.ts
// =============================================================
import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import {
  announcementListQuerySchema,
  upsertAnnouncementBodySchema,
  patchAnnouncementBodySchema,
  reorderBodySchema,
  setAnnouncementImageBodySchema, // ✅
  toBool,
} from "./validation";
import {
  listAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  packContent,
  unpackContent,
  bulkReorder,
  setAnnouncementImage, // ✅
} from "./repository";

/** LIST (admin) */
export const listAdmin: RouteHandler = async (req, reply) => {
  const parse = announcementListQuerySchema.safeParse(req.query);
  if (!parse.success) {
    return reply.code(400).send({ error: { message: "invalid_query", issues: parse.error.flatten() } });
  }
  const q = parse.data;

  try {
    const { items, total } = await listAnnouncements({
      is_active: toBool(q.is_active),
      is_published: toBool(q.is_published),
      include_expired: toBool(q.include_expired) ?? true, // admin default: tümünü getir
      q: q.q,
      limit: q.limit,
      offset: q.offset,
      order: q.order,
      sort: q.sort,
    });
    reply.header("x-total-count", String(total ?? 0));
    const mapped = items.map((r) => ({ ...r, content: unpackContent(r.content) }));
    return reply.send(mapped);
  } catch (err) {
    req.log.error({ err }, "announcements_admin_list_failed");
    return reply.code(500).send({ error: { message: "announcements_admin_list_failed" } });
  }
};

/** GET by id (admin) */
export const getAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const row = await getAnnouncement(req.params.id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send({ ...row, content: unpackContent(row.content) });
};

/** CREATE (admin) */
export const createAdmin: RouteHandler = async (req, reply) => {
  const parsed = upsertAnnouncementBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_body", issues: parsed.error.flatten() } });
  }
  const b = parsed.data;

  const row = await createAnnouncement({
    id: randomUUID(),
    title: b.title,
    description: b.description,
    content: packContent(b.content),

    icon: b.icon,
    icon_type: b.icon_type,
    lucide_icon: b.lucide_icon ?? null,
    link: b.link,

    bg_color: b.bg_color,
    hover_color: b.hover_color,
    icon_color: b.icon_color,
    text_color: b.text_color,
    border_color: b.border_color,

    badge_text: b.badge_text ?? null,
    badge_color: b.badge_color ?? null,
    button_text: b.button_text ?? null,
    button_color: b.button_color ?? null,

    /** ✅ Görsel opsiyonelleri (varsa set) */
    image_url: typeof b.image_url !== "undefined" ? (b.image_url ?? null) : undefined,
    storage_asset_id: typeof b.storage_asset_id !== "undefined" ? (b.storage_asset_id ?? null) : undefined,
    alt: typeof b.alt !== "undefined" ? (b.alt ?? null) : undefined,

    is_active: (toBool(b.is_active) ?? true) ? 1 : 0,
    is_published: (toBool(b.is_published) ?? true) ? 1 : 0,
    display_order: b.display_order,

    published_at: b.published_at ?? null,
    expires_at: b.expires_at ?? null,

    meta_title: b.meta_title ?? null,
    meta_description: b.meta_description ?? null,

    created_at: new Date(),
    updated_at: new Date(),
  });

  return reply.code(201).send(row ? { ...row, content: unpackContent(row.content) } : row);
};

/** PATCH (admin) */
export const patchAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const parsed = patchAnnouncementBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_body", issues: parsed.error.flatten() } });
  }
  const b = parsed.data;

  const patched = await updateAnnouncement(req.params.id, {
    title: b.title,
    description: b.description,
    content: typeof b.content === "string" ? packContent(b.content) : undefined,

    icon: b.icon,
    icon_type: b.icon_type,
    lucide_icon: typeof b.lucide_icon !== "undefined" ? (b.lucide_icon ?? null) : undefined,
    link: b.link,

    bg_color: b.bg_color,
    hover_color: b.hover_color,
    icon_color: b.icon_color,
    text_color: b.text_color,
    border_color: b.border_color,

    badge_text: typeof b.badge_text !== "undefined" ? (b.badge_text ?? null) : undefined,
    badge_color: typeof b.badge_color !== "undefined" ? (b.badge_color ?? null) : undefined,
    button_text: typeof b.button_text !== "undefined" ? (b.button_text ?? null) : undefined,
    button_color: typeof b.button_color !== "undefined" ? (b.button_color ?? null) : undefined,

    /** ✅ Görsel alanları */
    image_url: typeof b.image_url !== "undefined" ? (b.image_url ?? null) : undefined,
    storage_asset_id: typeof b.storage_asset_id !== "undefined" ? (b.storage_asset_id ?? null) : undefined,
    alt: typeof b.alt !== "undefined" ? (b.alt ?? null) : undefined,

    is_active: typeof b.is_active !== "undefined" ? ((toBool(b.is_active) ?? true) ? 1 : 0) : undefined,
    is_published: typeof b.is_published !== "undefined" ? ((toBool(b.is_published) ?? true) ? 1 : 0) : undefined,
    display_order: b.display_order,

    published_at: typeof b.published_at !== "undefined" ? (b.published_at ?? null) : undefined,
    expires_at: typeof b.expires_at !== "undefined" ? (b.expires_at ?? null) : undefined,

    meta_title: typeof b.meta_title !== "undefined" ? (b.meta_title ?? null) : undefined,
    meta_description: typeof b.meta_description !== "undefined" ? (b.meta_description ?? null) : undefined,
  });

  if (!patched) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send({ ...patched, content: unpackContent(patched.content) });
};

/** DELETE (admin) */
export const removeAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const affected = await deleteAnnouncement(req.params.id);
  if (!affected) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.code(204).send();
};

/** POST /admin/announcements/reorder */
export const reorderAdmin: RouteHandler = async (req, reply) => {
  const parsed = reorderBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_body", issues: parsed.error.flatten() } });
  }
  await bulkReorder(parsed.data.ids);
  return reply.code(204).send();
};

/** ✅ PATCH /admin/announcements/:id/image */
export const setImageAdmin: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const parsed = setAnnouncementImageBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_body", issues: parsed.error.flatten() } });
  }
  const updated = await setAnnouncementImage(req.params.id, parsed.data);
  if (!updated) return reply.code(404).send({ error: { message: "not_found_or_asset_missing" } });
  return reply.send(updated);
};
