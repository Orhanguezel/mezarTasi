// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/slider.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type {
  SliderPublic,
  SliderRow,
  SliderAdminRow,
  SliderAdminView,
  SliderCreateInput,
  SliderUpdateInput,
  SliderListParams,
  SliderAdminListParams,
  SliderStatusBody,
  SliderReorderBody,
  SliderAttachImageBody,
} from "@/integrations/metahub/db/types/slider";

// ---- helpers ----
const BASE = "/sliders";
const ADMIN_BASE = "/admin/sliders";

const buildParams = (
  params?: SliderListParams | SliderAdminListParams
): Record<string, string | number | boolean> | undefined => {
  if (!params) return undefined;
  const p: Record<string, string | number | boolean> = {};
  if (params.q) p.q = params.q;
  if (params.limit !== undefined) p.limit = params.limit;
  if (params.offset !== undefined) p.offset = params.offset;
  if (params.sort) p.sort = params.sort;
  if (params.order) p.order = params.order;

  // admin için gelebilir
  const anyParams = params as SliderAdminListParams;
  if (anyParams.is_active !== undefined) p.is_active = anyParams.is_active ? 1 : 0;

  return Object.keys(p).length ? p : undefined;
};

const toBool = (v: unknown) => {
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return Number(v) !== 0;
  return !!v;
};

const toAdminView = (r: SliderAdminRow): SliderAdminView => ({
  id: r.id,
  uuid: r.uuid,
  name: r.name,
  slug: r.slug,
  description: r.description,

  image_url: r.image_url,
  storage_asset_id: r.storage_asset_id,
  image_effective_url: r.image_effective_url,

  alt: r.alt,
  buttonText: r.buttonText,
  buttonLink: r.buttonLink,

  featured: toBool(r.featured),
  is_active: toBool(r.is_active),
  display_order: r.display_order,

  created_at: r.created_at,
  updated_at: r.updated_at,
});

// -------------------------------------------------------------
// API
// -------------------------------------------------------------
export const sliderApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // ---------------- PUBLIC ----------------
    listSlidesPublic: b.query<SliderPublic[], void | SliderListParams>({
      query: (params): FetchArgs | string => {
        const p = buildParams(params as SliderListParams | undefined);
        // Public'te auth atla
        return p
          ? { url: BASE, params: p, headers: { "x-skip-auth": "1" } }
          : { url: BASE, headers: { "x-skip-auth": "1" } };
      },
      // public controller FE modelini (SliderPublic) döndürüyor → transform gerekmez
      providesTags: (result) =>
        result
          ? [
              ...result.map((s) => ({ type: "Slider" as const, id: s.id })),
              { type: "Slider" as const, id: "PUBLIC_LIST" },
            ]
          : [{ type: "Slider" as const, id: "PUBLIC_LIST" }],
      keepUnusedDataFor: 60,
    }),

    getSlidePublic: b.query<SliderPublic, string>({
      query: (idOrSlug): FetchArgs | string => ({
        url: `${BASE}/${encodeURIComponent(idOrSlug)}`,
        headers: { "x-skip-auth": "1" },
      }),
      providesTags: (r) =>
        r ? [{ type: "Slider" as const, id: r.id }] : [{ type: "Slider" as const, id: "PUBLIC_LIST" }],
      keepUnusedDataFor: 60,
    }),

    // ---------------- ADMIN ----------------
    adminListSlides: b.query<SliderAdminView[], void | SliderAdminListParams>({
      query: (params): FetchArgs | string => {
        const p = buildParams(params as SliderAdminListParams | undefined);
        return p ? { url: ADMIN_BASE, params: p } : ADMIN_BASE;
      },
      transformResponse: (res: unknown): SliderAdminView[] => {
        const arr = Array.isArray(res) ? (res as SliderAdminRow[]) : [];
        return arr.map(toAdminView);
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((s) => ({ type: "Slider" as const, id: s.id })),
              { type: "Slider" as const, id: "ADMIN_LIST" },
            ]
          : [{ type: "Slider" as const, id: "ADMIN_LIST" }],
      keepUnusedDataFor: 60,
    }),

    adminGetSlide: b.query<SliderAdminView, string>({
      query: (id): FetchArgs | string => `${ADMIN_BASE}/${encodeURIComponent(id)}`,
      transformResponse: (res: unknown): SliderAdminView => toAdminView(res as SliderAdminRow),
      providesTags: (_r, _e, id) => [{ type: "Slider" as const, id }],
      keepUnusedDataFor: 60,
    }),

    adminCreateSlide: b.mutation<SliderAdminView, SliderCreateInput>({
      query: (body): FetchArgs => ({ url: ADMIN_BASE, method: "POST", body }),
      transformResponse: (res: unknown): SliderAdminView => {
        // controller create 201'de { ...row.sl, image_effective_url } döndürüyor olabilir
        const row = res as SliderRow | (SliderRow & { image_effective_url?: string | null });
        const withUrl: SliderAdminRow = {
          ...(row as SliderRow),
          image_effective_url: (row as any).image_effective_url ?? (row as any).asset_url ?? (row as any).image_url ?? null,
        };
        return toAdminView(withUrl);
      },
      invalidatesTags: [{ type: "Slider" as const, id: "ADMIN_LIST" }],
    }),

    adminUpdateSlide: b.mutation<SliderAdminView, { id: string; body: SliderUpdateInput }>({
      query: ({ id, body }): FetchArgs => ({ url: `${ADMIN_BASE}/${encodeURIComponent(id)}`, method: "PATCH", body }),
      transformResponse: (res: unknown): SliderAdminView => {
        const row = res as SliderRow | (SliderRow & { image_effective_url?: string | null });
        const withUrl: SliderAdminRow = {
          ...(row as SliderRow),
          image_effective_url: (row as any).image_effective_url ?? (row as any).asset_url ?? (row as any).image_url ?? null,
        };
        return toAdminView(withUrl);
      },
      invalidatesTags: (_r, _e, arg) => [
        { type: "Slider" as const, id: arg.id },
        { type: "Slider" as const, id: "ADMIN_LIST" },
      ],
    }),

    adminDeleteSlide: b.mutation<{ ok: true }, string>({
      query: (id): FetchArgs => ({ url: `${ADMIN_BASE}/${encodeURIComponent(id)}`, method: "DELETE" }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Slider" as const, id },
        { type: "Slider" as const, id: "ADMIN_LIST" },
      ],
    }),

    // ---- reorder
    adminReorderSlides: b.mutation<{ ok: true }, SliderReorderBody>({
      query: (body): FetchArgs => ({ url: `${ADMIN_BASE}/reorder`, method: "POST", body }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: [{ type: "Slider" as const, id: "ADMIN_LIST" }],
    }),

    // ---- status set
    adminSetSlideStatus: b.mutation<SliderAdminView, { id: string; body: SliderStatusBody }>({
      query: ({ id, body }): FetchArgs => ({
        url: `${ADMIN_BASE}/${encodeURIComponent(id)}/status`,
        method: "POST",
        body,
      }),
      transformResponse: (res: unknown): SliderAdminView => {
        const row = res as SliderRow | (SliderRow & { image_effective_url?: string | null });
        const withUrl: SliderAdminRow = {
          ...(row as SliderRow),
          image_effective_url: (row as any).image_effective_url ?? (row as any).asset_url ?? (row as any).image_url ?? null,
        };
        return toAdminView(withUrl);
      },
      invalidatesTags: (_r, _e, arg) => [
        { type: "Slider" as const, id: arg.id },
        { type: "Slider" as const, id: "ADMIN_LIST" },
      ],
    }),

    // ---- attach image (storage destekli)
    adminAttachSlideImage: b.mutation<SliderAdminView, { id: string; body: SliderAttachImageBody }>({
      query: ({ id, body }): FetchArgs => ({
        url: `${ADMIN_BASE}/${encodeURIComponent(id)}/attach-image`,
        method: "POST",
        body,
      }),
      transformResponse: (res: unknown): SliderAdminView => {
        const row = res as SliderRow | (SliderRow & { image_effective_url?: string | null });
        const withUrl: SliderAdminRow = {
          ...(row as SliderRow),
          image_effective_url: (row as any).image_effective_url ?? (row as any).asset_url ?? (row as any).image_url ?? null,
        };
        return toAdminView(withUrl);
      },
      invalidatesTags: (_r, _e, arg) => [
        { type: "Slider" as const, id: arg.id },
        { type: "Slider" as const, id: "ADMIN_LIST" },
      ],
    }),

    // ---- detach image
    adminDetachSlideImage: b.mutation<SliderAdminView, string>({
      query: (id): FetchArgs => ({
        url: `${ADMIN_BASE}/${encodeURIComponent(id)}/detach-image`,
        method: "POST",
      }),
      transformResponse: (res: unknown): SliderAdminView => {
        const row = res as SliderRow | (SliderRow & { image_effective_url?: string | null });
        const withUrl: SliderAdminRow = {
          ...(row as SliderRow),
          image_effective_url: (row as any).image_effective_url ?? (row as any).asset_url ?? (row as any).image_url ?? null,
        };
        return toAdminView(withUrl);
      },
      invalidatesTags: (_r, _e, id) => [
        { type: "Slider" as const, id },
        { type: "Slider" as const, id: "ADMIN_LIST" },
      ],
    }),
  }),
  overrideExisting: true,
});

// Hooks
export const {
  // public
  useListSlidesPublicQuery,
  useGetSlidePublicQuery,
  // admin
  useAdminListSlidesQuery,
  useAdminGetSlideQuery,
  useAdminCreateSlideMutation,
  useAdminUpdateSlideMutation,
  useAdminDeleteSlideMutation,
  useAdminReorderSlidesMutation,
  useAdminSetSlideStatusMutation,
  useAdminAttachSlideImageMutation,
  useAdminDetachSlideImageMutation,
} = sliderApi;

// Tipleri re-export et (kullanım kolaylığı)
export type {
  SliderPublic,
  SliderAdminView,
  SliderCreateInput,
  SliderUpdateInput,
  SliderListParams,
  SliderAdminListParams,
  SliderStatusBody,
  SliderReorderBody,
  SliderAttachImageBody,
};
