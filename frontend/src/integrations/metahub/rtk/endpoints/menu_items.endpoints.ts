// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/menu_items.endpoints.ts
// =============================================================
import { baseApi } from "../baseApi";
import type { MenuItem } from "@/integrations/metahub/db/types/menu";

type BoolLike = boolean | 0 | 1 | "0" | "1" | "true" | "false";

export type MenuItemsListParams = {
  parent_id?: string | null;
  is_active?: BoolLike;
  limit?: number;
  offset?: number;
  /** "display_order" | "position" | "order_num" | "created_at" | "updated_at" + opsiyonel ".desc" */
  order?: `${"display_order" | "position" | "order_num" | "created_at" | "updated_at"}${"" | ".desc"}`;
};

const toParams = (p?: MenuItemsListParams | void): Record<string, string> | undefined => {
  if (!p) return undefined;
  const q: Record<string, string> = {};
  // NOT: null gönderme ihtiyacı yoksa paramı hiç eklememek daha güvenli
  if (typeof p.parent_id === "string" && p.parent_id) q.parent_id = p.parent_id;
  if (p.is_active !== undefined) q.is_active = String(p.is_active);
  if (p.limit != null) q.limit = String(p.limit);
  if (p.offset != null) q.offset = String(p.offset);
  if (p.order) q.order = p.order;
  return Object.keys(q).length ? q : undefined;
};

const BASE = "/menu_items";

export const menuItemsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listMenuItems: b.query<MenuItem[], MenuItemsListParams | void>({
      query: (args) => {
        const params = toParams(args);
        return params ? { url: BASE, params } : { url: BASE }; // params undefined ise property’yi hiç koyma
      },
      transformResponse: (res: unknown): MenuItem[] =>
        Array.isArray(res) ? (res as MenuItem[]) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((i) => ({ type: "MenuItem" as const, id: i.id })),
              { type: "MenuItem" as const, id: "LIST" },
            ]
          : [{ type: "MenuItem" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getMenuItemById: b.query<MenuItem, string>({
      query: (id) => ({ url: `${BASE}/${id}` }),
      transformResponse: (res: unknown): MenuItem => res as MenuItem,
      providesTags: (_r, _e, id) => [{ type: "MenuItem", id }],
    }),
  }),
  overrideExisting: true,
});

export const { useListMenuItemsQuery, useGetMenuItemByIdQuery } = menuItemsApi;
