import type { FastifyInstance } from "fastify";
import {
  listCemeteriesPublic,
  getCemeteryPublic,
  getCemeteryBySlugPublic,
  listDistrictsPublic,
  listTypesPublic,
} from "./controller";

const BASE = "/cemeteries";

export async function registerCemeteries(app: FastifyInstance) {
  app.get(`${BASE}`,                 { config: { public: true } }, listCemeteriesPublic);
  app.get(`${BASE}/:id`,             { config: { public: true } }, getCemeteryPublic);
  app.get(`${BASE}/by-slug/:slug`,   { config: { public: true } }, getCemeteryBySlugPublic);
  app.get(`${BASE}/_meta/districts`, { config: { public: true } }, listDistrictsPublic);
  app.get(`${BASE}/_meta/types`,     { config: { public: true } }, listTypesPublic);
}
