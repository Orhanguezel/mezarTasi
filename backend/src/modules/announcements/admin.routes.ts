// src/modules/announcements/admin.routes.ts

import type { FastifyInstance } from "fastify";
import {
  listAdmin,
  getAdmin,
  createAdmin,
  patchAdmin,
  removeAdmin,
  reorderAdmin,
} from "./admin.controller";

const BASE = "/announcements";

export async function registerAnnouncementsAdmin(app: FastifyInstance) {
  app.get(`${BASE}`,        { config: { auth: true } }, listAdmin);
  app.get(`${BASE}/:id`,    { config: { auth: true } }, getAdmin);
  app.post(`${BASE}`,       { config: { auth: true } }, createAdmin);
  app.patch(`${BASE}/:id`,  { config: { auth: true } }, patchAdmin);
  app.delete(`${BASE}/:id`, { config: { auth: true } }, removeAdmin);

  // Sıralama
  app.post(`${BASE}/reorder`, { config: { auth: true } }, reorderAdmin);
}
