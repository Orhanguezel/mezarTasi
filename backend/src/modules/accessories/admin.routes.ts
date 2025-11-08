import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import { requireAdmin } from "@/common/middleware/roles";
import {
  adminListAccessories,
  adminGetAccessory,
  adminCreateAccessory,
  adminUpdateAccessory,
  adminDeleteAccessory,
} from "./admin.controller";

const BASE="/accessories";

export async function registerAccessoriesAdmin(app: FastifyInstance) {
  // Querystring explicit (unknown) verelim
  app.get<{ Querystring: unknown }>(
    `${BASE}`,
    { preHandler: [requireAuth, requireAdmin] },
    adminListAccessories
  );

  // Params generikleri ekle
  app.get<{ Params: { id: string } }>(
    `${BASE}/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    adminGetAccessory
  );

  // Body: unknown bırakman yeterli (controller Zod ile parse ediyor)
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

  app.delete<{ Params: { id: string } }>(
    `${BASE}/:id`,
    { preHandler: [requireAuth, requireAdmin] },
    adminDeleteAccessory
  );
}
