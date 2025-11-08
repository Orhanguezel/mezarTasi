// src/modules/services/admin.routes.ts
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import {
  serviceAdminListQuerySchema,
  serviceCreateSchema,
  serviceUpdateSchema,
  serviceReorderSchema,
  serviceSetStatusSchema,
  serviceAttachImageSchema,
} from "./validation.js";

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
} from "./admin.controller.js";

// Tipler (controller ile aynı şemalardan derive)
type AdminListQuery = z.infer<typeof serviceAdminListQuerySchema>;
type CreateBody = z.infer<typeof serviceCreateSchema>;
type UpdateBody = z.infer<typeof serviceUpdateSchema>;
type ReorderBody = z.infer<typeof serviceReorderSchema>;
type SetStatusBody = z.infer<typeof serviceSetStatusSchema>;
type AttachImageBody = z.infer<typeof serviceAttachImageSchema>;
type IdParams = { id: string };

// Bu router muhtemelen /admin prefix’iyle register ediliyor.
// O yüzden BASE = "/services" bırakıyoruz → gerçek path: /admin/services
const BASE = "/services";

export async function registerServicesAdmin(fastify: FastifyInstance) {
  // LIST
  fastify.get<{ Querystring: AdminListQuery }>(
    `${BASE}`,
    adminListServices
  );

  // GET BY ID
  fastify.get<{ Params: IdParams }>(
    `${BASE}/:id`,
    adminGetService
  );

  // CREATE
  fastify.post<{ Body: CreateBody }>(
    `${BASE}`,
    adminCreateService
  );

  // UPDATE
  fastify.patch<{ Params: IdParams; Body: UpdateBody }>(
    `${BASE}/:id`,
    adminUpdateService
  );

  // DELETE
  fastify.delete<{ Params: IdParams }>(
    `${BASE}/:id`,
    adminDeleteService
  );

  // REORDER
  fastify.post<{ Body: ReorderBody }>(
    `${BASE}/reorder`,
    adminReorderServices
  );

  // SET STATUS
  fastify.post<{ Params: IdParams; Body: SetStatusBody }>(
    `${BASE}/:id/status`,
    adminSetServiceStatus
  );

  // ATTACH IMAGE
  fastify.post<{ Params: IdParams; Body: AttachImageBody }>(
    `${BASE}/:id/attach-image`,
    adminAttachServiceImage
  );

  // DETACH IMAGE
  fastify.post<{ Params: IdParams }>(
    `${BASE}/:id/detach-image`,
    adminDetachServiceImage
  );
}
