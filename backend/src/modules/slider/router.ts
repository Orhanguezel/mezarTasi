// src/modules/slider/router.ts
import type { FastifyInstance } from "fastify";
import { listPublicSlides, getPublicSlide } from "./controller";

export async function registerSlider(app: FastifyInstance) {
  app.get<{ Querystring: unknown }>(
    "/slider",
    { config: { public: true } },
    listPublicSlides
  );

  // detail gerekiyorsa (slug ile)
  app.get<{ Params: { idOrSlug: string } }>(
    "/slider/:idOrSlug",
    { config: { public: true } },
    getPublicSlide
  );
}
