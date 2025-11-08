// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/accessories.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type {
  AccessoryPublic,
  AccessoryRow,
  AccessoryAdminRow,
  AccessoryAdminView,
  AccessoryCreateInput,
  AccessoryUpdateInput,
  AccessoriesListParams,
  AccessoriesAdminListParams,
} from "@/integrations/metahub/db/types/accessories";

// ---- helpers ----
const BASE = "/accessories";
const ADMIN_BASE = "/admin/accessories";

const buildParams = (
  params?:
    | AccessoriesListParams
    | AccessoriesAdminListParams
): Record<string, string | number | boolean> | undefined => {
  if (!params) return undefined;
  const p: Record<string, string | number | boolean> = {};
  if (params.q) p.q = params.q;
  if (params.category) p.category = params.category;
  if (params.limit !== undefined) p.limit = params.limit;
  if (params.offset !== undefined) p.offset = params.offset;
  if (params.sort) p.sort = params.sort;
  if (params.order) p.order = params.order;

  // admin için gelebilir
  const anyParams = params as AccessoriesAdminListParams;
  if (anyParams.is_active !== undefined) p.is_active = anyParams.is_active ? 1 : 0;

  return Object.keys(p).length ? p : undefined;
};

const toBool = (v: unknown) => {
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return Number(v) !== 0;
  return !!v;
};

const toAdminView = (r: AccessoryAdminRow): AccessoryAdminView => ({
  id: r.id,
  uuid: r.uuid,
  name: r.name,
  slug: r.slug,
  category: r.category,
  material: r.material,
  price: r.price,

  description: r.description,

  image_url: r.image_url,
  storage_asset_id: r.storage_asset_id,
  image_effective_url: r.image_effective_url,

  featured: toBool(r.featured),
  is_active: toBool(r.is_active),

  dimensions: r.dimensions,
  weight: r.weight,
  thickness: r.thickness,
  finish: r.finish,
  warranty: r.warranty,
  installation_time: r.installation_time,

  display_order: r.display_order,

  created_at: r.created_at,
  updated_at: r.updated_at,
});

// -------------------------------------------------------------
// API
// -------------------------------------------------------------
export const accessoriesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // ---------------- PUBLIC ----------------
    listAccessoriesPublic: b.query<AccessoryPublic[], void | AccessoriesListParams>({
      query: (params): FetchArgs | string => {
        const p = buildParams(params as AccessoriesListParams | undefined);
        return p ? { url: BASE, params: p, headers: { "x-skip-auth": "1" } } : { url: BASE, headers: { "x-skip-auth": "1" } };
      },
      // public controller zaten FE modeli döndürüyor → transform gerekmez
      providesTags: (result) =>
        result
          ? [
              ...result.map((a) => ({ type: "Accessories" as const, id: a.id })),
              { type: "Accessories" as const, id: "PUBLIC_LIST" },
            ]
          : [{ type: "Accessories" as const, id: "PUBLIC_LIST" }],
      keepUnusedDataFor: 60,
    }),

    getAccessoryPublic: b.query<AccessoryPublic, string>({
      query: (idOrSlug): FetchArgs | string => ({
        url: `${BASE}/${encodeURIComponent(idOrSlug)}`,
        headers: { "x-skip-auth": "1" },
      }),
      providesTags: (r) =>
        r ? [{ type: "Accessories" as const, id: r.id }] : [{ type: "Accessories" as const, id: "PUBLIC_LIST" }],
      keepUnusedDataFor: 60,
    }),

    // ---------------- ADMIN ----------------
    adminListAccessories: b.query<AccessoryAdminView[], void | AccessoriesAdminListParams>({
      query: (params): FetchArgs | string => {
        const p = buildParams(params as AccessoriesAdminListParams | undefined);
        return p ? { url: ADMIN_BASE, params: p } : ADMIN_BASE;
      },
      transformResponse: (res: unknown): AccessoryAdminView[] => {
        const arr = Array.isArray(res) ? (res as AccessoryAdminRow[]) : [];
        return arr.map(toAdminView);
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((a) => ({ type: "Accessory" as const, id: a.id })),
              { type: "Accessories" as const, id: "ADMIN_LIST" },
            ]
          : [{ type: "Accessories" as const, id: "ADMIN_LIST" }],
      keepUnusedDataFor: 60,
    }),

    adminGetAccessory: b.query<AccessoryAdminView, string>({
      query: (id): FetchArgs | string => `${ADMIN_BASE}/${encodeURIComponent(id)}`,
      transformResponse: (res: unknown): AccessoryAdminView => toAdminView(res as AccessoryAdminRow),
      providesTags: (_r, _e, id) => [{ type: "Accessory" as const, id }],
      keepUnusedDataFor: 60,
    }),

    adminCreateAccessory: b.mutation<AccessoryAdminView, AccessoryCreateInput>({
      query: (body): FetchArgs => ({ url: ADMIN_BASE, method: "POST", body }),
      transformResponse: (res: unknown): AccessoryAdminView => {
        // controller create 201'de { ...row.acc } döndürüyor (image_effective_url yok olabilir)
        const row = res as AccessoryRow | (AccessoryRow & { image_effective_url?: string | null });
        const withUrl: AccessoryAdminRow = {
          ...(row as AccessoryRow),
          image_effective_url: (row as any).image_effective_url ?? row.image_url ?? null,
        };
        return toAdminView(withUrl);
      },
      invalidatesTags: [{ type: "Accessories" as const, id: "ADMIN_LIST" }],
    }),

    adminUpdateAccessory: b.mutation<AccessoryAdminView, { id: string; body: AccessoryUpdateInput }>({
      query: ({ id, body }): FetchArgs => ({ url: `${ADMIN_BASE}/${encodeURIComponent(id)}`, method: "PATCH", body }),
      transformResponse: (res: unknown): AccessoryAdminView => {
        const row = res as AccessoryRow | (AccessoryRow & { image_effective_url?: string | null });
        const withUrl: AccessoryAdminRow = {
          ...(row as AccessoryRow),
          image_effective_url: (row as any).image_effective_url ?? row.image_url ?? null,
        };
        return toAdminView(withUrl);
      },
      invalidatesTags: (_r, _e, arg) => [
        { type: "Accessory" as const, id: arg.id },
        { type: "Accessories" as const, id: "ADMIN_LIST" },
      ],
    }),

    adminDeleteAccessory: b.mutation<{ ok: true }, string>({
      query: (id): FetchArgs => ({ url: `${ADMIN_BASE}/${encodeURIComponent(id)}`, method: "DELETE" }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Accessory" as const, id },
        { type: "Accessories" as const, id: "ADMIN_LIST" },
      ],
    }),
  }),
  overrideExisting: true,
});

// Hooks
export const {
  // public
  useListAccessoriesPublicQuery,
  useGetAccessoryPublicQuery,
  // admin
  useAdminListAccessoriesQuery,
  useAdminGetAccessoryQuery,
  useAdminCreateAccessoryMutation,
  useAdminUpdateAccessoryMutation,
  useAdminDeleteAccessoryMutation,
} = accessoriesApi;

// Tipleri re-export et (kullanım kolaylığı)
export type {
  AccessoryPublic,
  AccessoryAdminView,
  AccessoryCreateInput,
  AccessoryUpdateInput,
  AccessoriesListParams,
  AccessoriesAdminListParams,
};
