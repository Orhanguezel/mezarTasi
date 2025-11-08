// Public endpoints (aktif kayıtlar; BE public query schema: q, limit, offset, sort, order)
import { baseApi } from "@/integrations/metahub/rtk/baseApi";
import type { ServiceListParams, ServiceView } from "@/integrations/metahub/db/types/services.types";

/** QueryString helper (boolean → "true"/"false") */
function qs(params?: Record<string, unknown>) {
  if (!params) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    if (typeof v === "boolean") sp.set(k, v ? "true" : "false");
    else sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/** FE -> BE public list param eşlemesi (sadece BE'nin kabul ettikleri) */
function toPublicQuery(p: ServiceListParams | void | undefined): Record<string, unknown> | undefined {
  if (!p) return undefined;
  const q: Record<string, unknown> = {};
  if (p.search !== undefined)  q.q = p.search;
  if (p.limit !== undefined)   q.limit = p.limit;
  if (p.offset !== undefined)  q.offset = p.offset;
  if (p.orderBy !== undefined) q.sort = p.orderBy;
  if (p.order !== undefined)   q.order = p.order;
  // NOT: type/active/featured/category public şemada yok → gönderme
  return q;
}

const PUBLIC_BASE = "/services";

export const servicesPublicApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** LIST (public) — BE otomatik is_active=1 filtreliyor */
    listServicesPublic: builder.query<ServiceView[], ServiceListParams | void>({
      query: (params) => `${PUBLIC_BASE}${qs(toPublicQuery(params))}`,
      providesTags: (result) =>
        result
          ? [
              { type: "Services", id: "PUBLIC_LIST" },
              ...result.map((s) => ({ type: "Services" as const, id: `pub:${s.id}` })),
            ]
          : [{ type: "Services", id: "PUBLIC_LIST" }],
    }),

    /** GET BY ID (public) */
    getServicePublicById: builder.query<ServiceView, string>({
      query: (id) => `${PUBLIC_BASE}/${encodeURIComponent(id)}`,
      providesTags: (_res, _err, id) => [{ type: "Services", id: `pub:${id}` }],
    }),

    /** GET BY SLUG (public) */
    getServicePublicBySlug: builder.query<ServiceView, string>({
      query: (slug) => `${PUBLIC_BASE}/by-slug/${encodeURIComponent(slug)}`,
      providesTags: (_res, _err, slug) => [{ type: "Services", id: `pub:slug:${slug}` }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListServicesPublicQuery,
  useGetServicePublicByIdQuery,
  useGetServicePublicBySlugQuery,
} = servicesPublicApi;
