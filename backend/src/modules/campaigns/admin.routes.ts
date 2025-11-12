import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import { requireAdmin } from "@/common/middleware/roles";
import {
  listSimpleCampaignsAdmin,
  getSimpleCampaignAdmin,
  createSimpleCampaignAdmin,
  updateSimpleCampaignAdmin,
  deleteSimpleCampaignAdmin,
  bulkActiveAdmin,
  adminSetCampaignImage,      // 👈 EKLENDİ
  adminUnsetCampaignImage,    // 👈 EKLENDİ
} from "./admin.controller";

import type {
  SimpleCampaignListQuery,
  UpsertSimpleCampaignBody,
  PatchSimpleCampaignBody,
  SetCampaignImageBody,
} from "./validation";

const BASE = "/campaigns";

export async function registerCampaignsAdmin(app: FastifyInstance) {
  app.get<{ Querystring: SimpleCampaignListQuery }>(
    `${BASE}`, { preHandler: [requireAuth, requireAdmin] }, listSimpleCampaignsAdmin
  );

  app.get<{ Params: { id: string } }>(
    `${BASE}/:id`, { preHandler: [requireAuth, requireAdmin] }, getSimpleCampaignAdmin
  );

  app.post<{ Body: UpsertSimpleCampaignBody }>(
    `${BASE}`, { preHandler: [requireAuth, requireAdmin] }, createSimpleCampaignAdmin
  );

  app.patch<{ Params: { id: string }; Body: PatchSimpleCampaignBody }>(
    `${BASE}/:id`, { preHandler: [requireAuth, requireAdmin] }, updateSimpleCampaignAdmin
  );

  app.delete<{ Params: { id: string } }>(
    `${BASE}/:id`, { preHandler: [requireAuth, requireAdmin] }, deleteSimpleCampaignAdmin
  );

  app.post<{ Body: { ids: string[]; is_active: any } }>(
    `${BASE}/bulk-active`, { preHandler: [requireAuth, requireAdmin] }, bulkActiveAdmin
  );

  app.post<{ Params: { id: string }; Body: SetCampaignImageBody }>(
  `${BASE}/:id/image`,
  { preHandler: [requireAuth, requireAdmin] },
  adminSetCampaignImage
);

  app.delete<{ Params: { id: string } }>(
    `${BASE}/:id/image`, { preHandler: [requireAuth, requireAdmin] }, adminUnsetCampaignImage
  );
}
