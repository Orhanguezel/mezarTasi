// =============================================================
// FILE: src/modules/contact/controller.ts (PUBLIC)
// =============================================================
import type { FastifyRequest, FastifyReply } from "fastify";
import { ContactCreateSchema } from "./validation";
import { repoCreateContact } from "./repository";

type CreateReq = FastifyRequest<{ Body: unknown }>;

export async function createContactPublic(req: CreateReq, reply: FastifyReply) {
  const parsed = ContactCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: "INVALID_BODY", details: parsed.error.flatten() });
  }

  // Basit honeypot: website doluysa sessizce kabul et ve bırak (spam düşer)
  if (parsed.data.website && parsed.data.website.trim().length > 0) {
    return reply.code(200).send({ ok: true });
  }

  // IP tespiti: fastify({ trustProxy: true }) ise req.ip güvenilirdir.
  const ip =
    (req as any).ip ||
    (typeof req.headers["x-forwarded-for"] === "string"
      ? req.headers["x-forwarded-for"].split(",")[0]?.trim()
      : null) ||
    (req.socket?.remoteAddress as string | null) ||
    null;

  const ua = (req.headers["user-agent"] as string) || null;

  const created = await repoCreateContact(req.server, { ...parsed.data, ip, user_agent: ua });

  // Public endpoint'te tüm kaydı döndürmeyelim; sadece onay + id yeterli
  return reply.code(201).send({ ok: true, id: created.id });
}
