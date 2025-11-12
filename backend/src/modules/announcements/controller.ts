// =============================================================
// FILE: src/modules/announcements/controller.ts (PUBLIC)
// =============================================================
import type { RouteHandler } from "fastify";
import { announcementListQuerySchema, toBool } from "./validation";
import { listAnnouncements, getAnnouncement, unpackContent } from "./repository";

/** GET /announcements */
export const listAnnouncementsPublic: RouteHandler = async (req, reply) => {
  const parse = announcementListQuerySchema.safeParse(req.query);
  if (!parse.success) {
    return reply.code(400).send({ error: { message: "invalid_query", issues: parse.error.flatten() } });
  }
  const q = parse.data;

  // Public default: sadece aktif + yayınlanmış + süresi dolmamış
  const params = {
    is_active: typeof q.is_active !== "undefined" ? toBool(q.is_active) : true,
    is_published: typeof q.is_published !== "undefined" ? toBool(q.is_published) : true,
    include_expired: toBool(q.include_expired) ?? false,
    q: q.q,
    limit: q.limit,
    offset: q.offset,
    order: q.order,
    sort: q.sort,
  } as const;

  try {
    const { items, total } = await listAnnouncements(params);
    reply.header("x-total-count", String(total ?? 0));
    const mapped = items.map((r) => ({ ...r, content: unpackContent(r.content) }));
    return reply.send(mapped);
  } catch (err) {
    req.log.error({ err }, "announcements_list_failed");
    return reply.code(500).send({ error: { message: "announcements_list_failed" } });
  }
};

/** GET /announcements/:id */
export const getAnnouncementPublic: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const row = await getAnnouncement(req.params.id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send({ ...row, content: unpackContent(row.content) });
};
