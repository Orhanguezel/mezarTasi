import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import { requireAdmin } from "@/common/middleware/roles";
import {
  adminListAccessories,
  adminGetAccessory,
  adminCreateAccessory,
  adminUpdateAccessory,
  adminDeleteAccessory,
  adminSetAccessoryImage, // ✅ yeni
} from "./admin.controller";
import type { AccessorySetImageInput } from "./validation";

const BASE = "/accessories";

export async function registerAccessoriesAdmin(app: FastifyInstance) {
  // ✅ LIST ⇒ /list
  app.get<{ Querystring: unknown }>(
    `${BASE}/list`,
    { preHandler: [requireAuth, requireAdmin] },
    adminListAccessories
  );

  app.get<{ Params: { id: string } }>(
    `${BASE}/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    adminGetAccessory
  );

  app.post<{ Body: unknown }>(
    `${BASE}`,
    { preHandler: [requireAuth, requireAdmin] },
    adminCreateAccessory
  );

  app.patch<{ Params: { id: string }; Body: unknown }>(
    `${BASE}/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    adminUpdateAccessory
  );

  // ✅ Kapak görseli (asset_id + alt)
  app.patch<{ Params: { id: string }; Body: AccessorySetImageInput }>(
    `${BASE}/:id/image`,
    { preHandler: [requireAuth, requireAdmin] },
    adminSetAccessoryImage
  );

  app.delete<{ Params: { id: string } }>(
    `${BASE}/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    adminDeleteAccessory
  );
}
