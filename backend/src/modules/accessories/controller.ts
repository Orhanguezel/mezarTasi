import type { RouteHandler } from "fastify";
import {
  listQuerySchema,
  type ListQuery,
  idOrSlugParamSchema,
} from "./validation";
import { repoGetBySlug, repoListPublic } from "./repository";

/* FE’nin beklediği minimal AccessoryModel struct */
type PublicAccessory = {
  id: number;
  name: string;
  category: "suluk" | "sutun" | "vazo" | "aksesuar";
  material: string;
  price: string;
  image: string;
  description: string;
  featured?: boolean;
  dimensions?: string;
  weight?: string;
  thickness?: string;
  finish?: string;
  warranty?: string;
  installationTime?: string;
};

function rowToPublic(row: any): PublicAccessory {
  const a = row.acc;
  const url = row.asset_url ?? a.image_url ?? "";
  return {
    id: a.id,
    name: a.name,
    category: a.category as PublicAccessory["category"], // ← cast
    material: a.material,
    price: a.price,
    image: url,
    description: a.description || "",
    featured: !!a.featured,
    dimensions: a.dimensions || undefined,
    weight: a.weight || undefined,
    thickness: a.thickness || undefined,
    finish: a.finish || undefined,
    warranty: a.warranty || undefined,
    installationTime: a.installation_time || undefined,
  };
}

/** GET /accessories (public list, only active) */
export const listPublicAccessories: RouteHandler<{ Querystring: unknown }> = async (req, reply) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_query", issues: parsed.error.flatten() } });
  }
  const q = parsed.data as ListQuery;
  const rows = await repoListPublic(q);
  return rows.map(rowToPublic);
};

/** GET /accessories/:idOrSlug (public detail; id veya slug) */
export const getPublicAccessory: RouteHandler<{ Params: { idOrSlug: string } }> = async (req, reply) => {
  const v = idOrSlugParamSchema.safeParse(req.params);
  if (!v.success) return reply.code(400).send({ error: { message: "invalid_params" } });

  const arg = v.data.idOrSlug;
  // public detail'i slug üstünden veriyoruz (id desteklemek istersen repoGetById ekleyebilirsin)
  const row = await repoGetBySlug(arg, true);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });

  return rowToPublic(row);
};
