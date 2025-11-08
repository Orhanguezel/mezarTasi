import type { FastifyInstance } from "fastify";
import {
  adminListServices,
  adminGetService,
  adminCreateService,
  adminUpdateService,
  adminDeleteService,
  adminReorderServices,
  adminSetServiceStatus,
  adminAttachServiceImage,
  adminDetachServiceImage,
} from "./admin.controller";
import { requireAuth } from "@/common/middleware/auth";
import { requireAdmin } from "@/common/middleware/roles";

// Slider’da olduğu gibi tek bir ADMIN_BASE kullanıyoruz
const ADMIN_BASE = "/services";

export async function registerServicesAdmin(app: FastifyInstance) {
  // List / Get
  app.get<{ Querystring: unknown }>(
    `${ADMIN_BASE}`,
    { preHandler: [requireAuth, requireAdmin] },
    adminListServices
  );

  app.get<{ Params: { id: string } }>(
    `${ADMIN_BASE}/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    adminGetService
  );

  // CRUD
  app.post(
    `${ADMIN_BASE}`,
    { preHandler: [requireAuth, requireAdmin] },
    adminCreateService
  );

  app.patch<{ Params: { id: string } }>(
    `${ADMIN_BASE}/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    adminUpdateService
  );

  app.delete<{ Params: { id: string } }>(
    `${ADMIN_BASE}/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    adminDeleteService
  );

  // Ek işlemler (slider ile aynı pattern)
  app.post(
    `${ADMIN_BASE}/reorder`,
    { preHandler: [requireAuth, requireAdmin] },
    adminReorderServices
  );

  app.post<{ Params: { id: string } }>(
    `${ADMIN_BASE}/:id/status`,
    { preHandler: [requireAuth, requireAdmin] },
    adminSetServiceStatus
  );

  app.post<{ Params: { id: string } }>(
    `${ADMIN_BASE}/:id/attach-image`,
    { preHandler: [requireAuth, requireAdmin] },
    adminAttachServiceImage
  );

  app.post<{ Params: { id: string } }>(
    `${ADMIN_BASE}/:id/detach-image`,
    { preHandler: [requireAuth, requireAdmin] },
    adminDetachServiceImage
  );
}
