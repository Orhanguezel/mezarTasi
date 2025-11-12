// =============================================================
// FILE: src/modules/campaigns/router.ts (PUBLIC ROUTER – değişmedi)
// =============================================================
import type { FastifyInstance } from "fastify";
import { listSimpleCampaignsPublic, getSimpleCampaignPublic } from "./controller";

const BASE = "/campaigns";

export async function registerSimpleCampaigns(app: FastifyInstance) {
  app.get(`${BASE}`,     { config: { public: true } }, listSimpleCampaignsPublic);
  app.get(`${BASE}/:id`, { config: { public: true } }, getSimpleCampaignPublic);
}
