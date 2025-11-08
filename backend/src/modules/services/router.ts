// src/modules/services/routes.public.ts (veya routes.ts içinde public bölüm)

import type { FastifyInstance } from "fastify";
import {
  listServicesPublic,
  getServicePublic,
  getServiceBySlugPublic,
} from "./controller";

const BASE = "/services";

export async function registerServices(app: FastifyInstance) {
  app.get(`${BASE}`,               { config: { public: true } }, listServicesPublic);
  app.get(`${BASE}/:id`,           { config: { public: true } }, getServicePublic);
  app.get(`${BASE}/by-slug/:slug`, { config: { public: true } }, getServiceBySlugPublic);
}
