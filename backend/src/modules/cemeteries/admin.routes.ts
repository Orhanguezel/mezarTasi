import type { FastifyInstance } from "fastify";
import {
  listCemeteriesAdmin,
  getCemeteryAdmin,
  getCemeteryBySlugAdmin,
  createCemeteryAdmin,
  updateCemeteryAdmin,
  removeCemeteryAdmin,
} from "./admin.controller";

const BASE = "/cemeteries";

export async function registerCemeteriesAdmin(app: FastifyInstance) {
  app.get(`${BASE}`,               { config: { auth: true } }, listCemeteriesAdmin);
  app.get(`${BASE}/:id`,           { config: { auth: true } }, getCemeteryAdmin);
  app.get(`${BASE}/by-slug/:slug`, { config: { auth: true } }, getCemeteryBySlugAdmin);

  app.post(`${BASE}`,              { config: { auth: true } }, createCemeteryAdmin);
  app.patch(`${BASE}/:id`,         { config: { auth: true } }, updateCemeteryAdmin);
  app.delete(`${BASE}/:id`, { config: { auth: true } }, removeCemeteryAdmin);


}
