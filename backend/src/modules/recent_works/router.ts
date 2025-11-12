// =============================================================
// FILE: src/modules/recent-works/router.ts  (PUBLIC ROUTES)
// =============================================================
import type { FastifyInstance } from "fastify";
import {
  listRecentWorksPublic,
  getRecentWorkPublic,
  getRecentWorkBySlugPublic,
  listCategoriesPublic,
  listYearsPublic,
} from "./controller";

const BASE = "/recent_works";

export async function registerRecentWorks(app: FastifyInstance) {
  app.get(`${BASE}`,               { config: { public: true } }, listRecentWorksPublic);
  app.get(`${BASE}/:id`,           { config: { public: true } }, getRecentWorkPublic);
  app.get(`${BASE}/by-slug/:slug`, { config: { public: true } }, getRecentWorkBySlugPublic);

  app.get(`${BASE}/_meta/categories`, { config: { public: true } }, listCategoriesPublic);
  app.get(`${BASE}/_meta/years`,      { config: { public: true } }, listYearsPublic);
}
