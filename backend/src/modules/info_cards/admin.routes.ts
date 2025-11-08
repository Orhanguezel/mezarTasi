import type { FastifyInstance } from "fastify";
import {
  listInfoCardsAdmin,
  getInfoCardAdmin,
  createInfoCardAdmin,
  updateInfoCardAdmin,
  deleteInfoCardAdmin,
} from "./controller";
import { bulkReorderAdmin } from "./admin.controller";

const BASE = "/admin/info_cards";

export async function registerInfoCardsAdmin(app: FastifyInstance) {
  app.get(`${BASE}`,       { config: { auth: true } }, listInfoCardsAdmin);
  app.get(`${BASE}/:id`,   { config: { auth: true } }, getInfoCardAdmin);

  app.post(`${BASE}`,      { config: { auth: true } }, createInfoCardAdmin);
  app.patch(`${BASE}/:id`, { config: { auth: true } }, updateInfoCardAdmin);
  app.delete(`${BASE}/:id`,{ config: { auth: true } }, deleteInfoCardAdmin);

  // sıralama
  app.post(`${BASE}/reorder`, { config: { auth: true } }, bulkReorderAdmin);
}
