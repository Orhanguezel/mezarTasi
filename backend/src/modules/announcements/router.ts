// src/modules/announcements/router.ts

import type { FastifyInstance } from "fastify";
import {
  listAnnouncementsPublic,
  getAnnouncementPublic,
} from "./controller";

const BASE = "/announcements";

export async function registerAnnouncements(app: FastifyInstance) {
  app.get(`${BASE}`,     { config: { public: true } }, listAnnouncementsPublic);
  app.get(`${BASE}/:id`, { config: { public: true } }, getAnnouncementPublic);
}
