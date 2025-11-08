import { baseApi } from "../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import {
  SimpleCampaignRow,
  SimpleCampaignView,
  PublicListParams,
} from "@/integrations/metahub/db/types/campaigns";

const toBool = (x: any) => x === true || x === 1 || x === "1" || x === "true";
const parseArr = (s?: string) => { try { return s ? (JSON.parse(s) as string[]) : []; } catch { return []; } };

const toView = (r: SimpleCampaignRow): SimpleCampaignView => {
  const keywords = parseArr(r.seo_keywords);
  const eff = (r as any).image_effective_url ?? r.image_url ?? null;
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    seo_keywords: keywords,
    is_active: toBool(r.is_active),
    images: eff ? [eff] : [],
    image_url: r.image_url ?? null,
    storage_asset_id: r.storage_asset_id ?? null,
    alt: r.alt ?? null,
    image_effective_url: (r as any).image_effective_url ?? null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
};

// undefined paramları at
function sanitizeParams(p?: PublicListParams): Record<string, any> | undefined {
  if (!p) return undefined;
  const out: Record<string, any> = {};
  if (typeof p.q === "string" && p.q.trim()) out.q = p.q.trim();
  if (typeof p.is_active === "boolean") out.is_active = p.is_active;
  if (typeof p.limit === "number") out.limit = p.limit;
  if (typeof p.offset === "number") out.offset = p.offset;
  if (p.sort) out.sort = p.sort;
  if (p.order) out.order = p.order;
  return out;
}

export const simpleCampaignsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({

    listSimpleCampaigns: b.query<SimpleCampaignView[], PublicListParams | void>({
      query: (params) => {
        const args: FetchArgs = { url: "/campaigns" };
        const clean = sanitizeParams(params as PublicListParams | undefined);
        if (clean) args.params = clean;
        return args;
      },
      transformResponse: (res: unknown): SimpleCampaignView[] =>
        Array.isArray(res) ? (res as SimpleCampaignRow[]).map(toView) : [],
      providesTags: [{ type: "SimpleCampaignsPublic" as const, id: "LIST" }],
      keepUnusedDataFor: 120,
    }),

    getSimpleCampaignById: b.query<SimpleCampaignView, string>({
      query: (id) => ({ url: `/campaigns/${encodeURIComponent(id)}` }),
      transformResponse: (res: unknown): SimpleCampaignView => toView(res as SimpleCampaignRow),
      providesTags: (_r, _e, id) => [{ type: "SimpleCampaignPublic" as const, id }],
      keepUnusedDataFor: 300,
    }),

  }),
  overrideExisting: true,
});

export const {
  useListSimpleCampaignsQuery,
  useGetSimpleCampaignByIdQuery,
} = simpleCampaignsApi;
