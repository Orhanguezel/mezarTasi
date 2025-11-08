import type { FastifyInstance } from "fastify";
import { listSimpleCampaignsPublic, getSimpleCampaignPublic } from "./controller";

const BASE = "/campaigns";

export async function registerSimpleCampaigns(app: FastifyInstance) {
  app.get<{ Querystring: any }>(
    `${BASE}`,
    { config: { public: true } },
    listSimpleCampaignsPublic
  );
  app.get<{ Params: { id: string } }>(
    `${BASE}/:id`,
    { config: { public: true } },
    getSimpleCampaignPublic
  );
}
