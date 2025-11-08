import type { FastifyInstance } from "fastify";
import {
  listPagesAdmin,
  getPageAdmin,
  getPageBySlugAdmin,
  createPageAdmin,
  updatePageAdmin,
  removePageAdmin,
  setFeaturedImageAdmin, // 👈 EKLENDİ
} from "./admin.controller";

const BASE = "/custom_pages";

export async function registerCustomPagesAdmin(app: FastifyInstance) {
  app.get(`${BASE}`,               { config: { auth: true } }, listPagesAdmin);
  app.get(`${BASE}/:id`,           { config: { auth: true } }, getPageAdmin);
  app.get(`${BASE}/by-slug/:slug`, { config: { auth: true } }, getPageBySlugAdmin);

  app.post(`${BASE}`,              { config: { auth: true } }, createPageAdmin);
  app.patch(`${BASE}/:id`,         { config: { auth: true } }, updatePageAdmin);
  app.patch(`${BASE}/:id/featured-image`, { config: { auth: true } }, setFeaturedImageAdmin); // 👈 YENİ
  app.delete(`${BASE}/:id`,        { config: { auth: true } }, removePageAdmin);
}
