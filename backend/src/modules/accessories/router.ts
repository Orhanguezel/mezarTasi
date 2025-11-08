import type { FastifyInstance } from "fastify";
import { listPublicAccessories, getPublicAccessory } from "./controller";

export async function registerAccessories(app: FastifyInstance) {
  app.get<{ Querystring: unknown }>(
    "/accessories",
    { config: { public: true } },
    listPublicAccessories
  );

  app.get<{ Params: { idOrSlug: string } }>(
    "/accessories/:idOrSlug",
    { config: { public: true } },
    getPublicAccessory
  );
}
