// =============================================================
// FILE: src/modules/services/admin.routes.ts   (ADMIN ROUTES)
// =============================================================
import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import { requireAdmin } from "@/common/middleware/roles";

import type {
  ServiceAdminListQuery,
  ServiceCreateBody,
  ServiceUpdateBody,
  ServiceSetImageBody,
} from "./validation";

import {
  adminListServices,
  adminGetService,
  adminCreateService,
  adminUpdateService,
  adminDeleteService,
  adminReorderServices,
  adminSetServiceStatus,
  adminSetServiceImage,
} from "./admin.controller";

export async function registerServicesAdmin(app: FastifyInstance) {
  const BASE = "/services";

  // LIST
  app.get<{ Querystring: ServiceAdminListQuery }>(
    `${BASE}`,
    { preHandler: [requireAuth, requireAdmin] },
    adminListServices
  );

  // GET BY ID
  app.get<{ Params: { id: string } }>(
    `${BASE}/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    adminGetService
  );

  // CREATE
  app.post<{ Body: ServiceCreateBody }>(
    `${BASE}`,
    { preHandler: [requireAuth, requireAdmin] },
    adminCreateService
  );

  // UPDATE
  app.patch<{ Params: { id: string }; Body: ServiceUpdateBody }>(
    `${BASE}/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    adminUpdateService
  );

  // DELETE
  app.delete<{ Params: { id: string } }>(
    `${BASE}/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    adminDeleteService
  );

  // REORDER
  app.post<{ Body: { ids: string[] } }>(
    `${BASE}/reorder`,
    { preHandler: [requireAuth, requireAdmin] },
    adminReorderServices
  );

  // SET STATUS
  app.post<{ Params: { id: string }; Body: { is_active: boolean } }>(
    `${BASE}/:id/status`,
    { preHandler: [requireAuth, requireAdmin] },
    adminSetServiceStatus
  );

  // ✅ SET IMAGE (storage ile birebir sözleşme)
  app.patch<{ Params: { id: string }; Body: ServiceSetImageBody }>(
    `${BASE}/:id/image`,
    { preHandler: [requireAuth, requireAdmin] },
    adminSetServiceImage
  );
}
