// =============================================================
// FILE: src/modules/recent-works/admin.routes.ts
// =============================================================
import type { FastifyInstance } from "fastify";
import {
  listRecentWorksAdmin,
  getRecentWorkAdmin,
  getRecentWorkBySlugAdmin,
  createRecentWorkAdmin,
  updateRecentWorkAdmin,
  removeRecentWorkAdmin,
  // 👇 yeni:
  attachImageAdmin,
  detachImageAdmin,
  // (opsiyonel ileri kullanım) adminSetRecentWorkImage,
} from "./admin.controller";

const BASE = "/recent_works";

export async function registerRecentWorksAdmin(app: FastifyInstance) {
  app.get(`${BASE}`,               { config: { auth: true } }, listRecentWorksAdmin);
  app.get(`${BASE}/:id`,           { config: { auth: true } }, getRecentWorkAdmin);
  app.get(`${BASE}/by-slug/:slug`, { config: { auth: true } }, getRecentWorkBySlugAdmin);

  app.post(`${BASE}`,              { config: { auth: true } }, createRecentWorkAdmin);
  app.patch(`${BASE}/:id`,         { config: { auth: true } }, updateRecentWorkAdmin);
  app.delete(`${BASE}/:id`,        { config: { auth: true } }, removeRecentWorkAdmin);

  // ✅ Tek görsel patern — FE’nin RTK’sına birebir uyum
  app.post(`${BASE}/:id/image`,    { config: { auth: true } }, attachImageAdmin);
  app.delete(`${BASE}/:id/image`,  { config: { auth: true } }, detachImageAdmin);
}
