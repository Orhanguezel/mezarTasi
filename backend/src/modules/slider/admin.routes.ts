// src/modules/slider/admin.routes.ts
import type { FastifyInstance } from "fastify";
import {
  adminListSlides,
  adminGetSlide,
  adminCreateSlide,
  adminUpdateSlide,
  adminDeleteSlide,
  adminReorderSlides,
  adminSetStatus,
  adminAttachImage,
  adminDetachImage,
} from "./admin.controller";

export async function registerSliderAdmin(app: FastifyInstance) {
  const base = "/sliders";

  app.get(base, {}, adminListSlides);
  app.get(`${base}/:id`, {}, adminGetSlide);
  app.post(base, {}, adminCreateSlide);
  app.patch(`${base}/:id`, {}, adminUpdateSlide);
  app.delete(`${base}/:id`, {}, adminDeleteSlide);

  app.post(`${base}/reorder`, {}, adminReorderSlides);
  app.post(`${base}/:id/status`, {}, adminSetStatus);

  // Storage destekli görsel işlemleri
  app.post(`${base}/:id/attach-image`, {}, adminAttachImage);
  app.post(`${base}/:id/detach-image`, {}, adminDetachImage);
}
