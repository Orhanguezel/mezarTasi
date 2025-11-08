import type { RouteHandler } from "fastify";
import { bulkReorder } from "./repository";
import { z } from "zod";

const reorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export const bulkReorderAdmin: RouteHandler<{ Body: { ids: string[] } }> = async (req, reply) => {
  const parsed = reorderSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_body", details: parsed.error.flatten() } });
  }
  await bulkReorder(parsed.data.ids);
  return reply.code(204).send();
};
