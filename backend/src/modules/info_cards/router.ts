import type { FastifyInstance } from "fastify";
import { listInfoCardsPublic, getInfoCardPublic } from "./controller";

export async function registerInfoCards(app: FastifyInstance) {
  app.get("/info_cards",               { config: { public: true } }, listInfoCardsPublic);
  app.get("/info_cards/:id",           { config: { public: true } }, getInfoCardPublic);
}
