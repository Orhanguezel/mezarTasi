// src/modules/services/controller.public.ts (veya controller.ts içinde public bölüm)

import type { FastifyReply, FastifyRequest } from "fastify";
import { servicePublicListQuerySchema } from "./validation";
import {
  repoGetServiceById,
  repoGetServiceBySlug,
  repoListServicesPublic,
} from "./repository";

/** GET /services (public) */
export async function listServicesPublic(req: FastifyRequest, reply: FastifyReply) {
  try {
    const raw = (req as any).query || {};
    const q = servicePublicListQuerySchema.parse(raw);
    // slider patern: sadece aktifleri döndür
    const data = await repoListServicesPublic(q);
    return reply.send(data);
  } catch (err: any) {
    if (err?.issues) {
      return reply.code(400).send({ error: "Bad Request", issues: err.issues });
    }
    req.log.error({ err }, "listServicesPublic failed");
    return reply.code(500).send({ error: "Internal Server Error" });
  }
}

/** GET /services/:id (public) */
export async function getServicePublic(req: FastifyRequest, reply: FastifyReply) {
  const { id } = (req.params as any) || {};
  const row = await repoGetServiceById(String(id || ""));
  // repo booleans 0/1 → truthy check yeterli
  if (!row || !row.svc?.is_active) return reply.code(404).send({ error: "Not found" });
  return reply.send(row);
}

/** GET /services/by-slug/:slug (public) */
export async function getServiceBySlugPublic(req: FastifyRequest, reply: FastifyReply) {
  const { slug } = (req.params as any) || {};
  const row = await repoGetServiceBySlug(String(slug || ""));
  if (!row || !row.svc?.is_active) return reply.code(404).send({ error: "Not found" });
  return reply.send(row);
}
