// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/admin/products_admin.endpoints.ts
// =============================================================
import { baseApi } from "../../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type {
  Product as ProductRow,
  Faq,
  Spec as ProductSpecRow,
} from "@/integrations/metahub/db/types/products.rows";

// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------
type NumericLike = number | string | null | undefined;

const asNumber = (v: NumericLike, fallback = 0): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
  if (typeof v === "string") {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
};
const toInt = (v: NumericLike, fallback = 0): number => Math.trunc(asNumber(v, fallback));
const parseArr = (v: unknown): string[] | null => {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {/* CSV fallback */}
    return s.split(",").map((x) => x.trim()).filter(Boolean);
  }
  return null;
};

// -------------------------------------------------------------
// Types
// -------------------------------------------------------------
export type AdminProductListParams = {
  q?: string;
  is_active?: boolean | 0 | 1;
  category_id?: string;
  sub_category_id?: string;
  limit?: number;
  offset?: number;
  sort?: "price" | "rating" | "created_at";
  order?: "asc" | "desc";
};

export type AdminProductUpsert = Partial<
  Pick<
    ProductRow,
    | "title"
    | "slug"
    | "price"
    | "description"
    | "category_id"
    | "sub_category_id"
    | "image_url"
    | "images"
    | "is_active"
    | "is_featured"
    | "tags"
    | "specifications"
    | "product_code"
    | "stock_quantity"
    | "meta_title"
    | "meta_description"
  >
> & { id?: string };

export type AdminFaqReplaceBody = Array<
  Pick<Faq, "question" | "answer" | "display_order"> & { is_active?: boolean | 0 | 1; id?: string }
>;

export type AdminSpecReplaceBody = Array<
  Pick<ProductSpecRow, "name" | "value" | "category" | "order_num"> & { id?: string }
>;

// BE: /admin/categories => { id, name, is_featured }[]
export type AdminCategoryListItem = {
  id: string;
  name: string;
  is_featured: boolean | 0 | 1;
};

type ApiProductInput = Omit<
  ProductRow,
  "price" | "rating" | "review_count" | "stock_quantity" | "images" | "tags"
> & {
  price: NumericLike;
  rating?: NumericLike;
  review_count?: NumericLike;
  stock_quantity?: NumericLike;
  images?: unknown;
  tags?: unknown;
  specifications?: unknown;
};

const normalizeProduct = (p: ApiProductInput): ProductRow => {
  const images = parseArr(p.images ?? null);
  const tags = parseArr(p.tags ?? null);
  return {
    ...p,
    price: asNumber(p.price, 0),
    rating: asNumber(p.rating, 5),
    review_count: toInt(p.review_count, 0),
    stock_quantity: toInt(p.stock_quantity, 0),
    images: images ?? null,
    tags: tags ?? null,
  };
};

// -- helper: undefined/null değerleri params'a hiç koyma
function buildAdminListParams(params?: AdminProductListParams) {
  if (!params) return undefined as undefined | Record<string, string | number>;
  const p: Record<string, string | number> = {};

  if (params.q) p.q = params.q;
  if (params.category_id) p.category_id = params.category_id;
  if (params.sub_category_id) p.sub_category_id = params.sub_category_id;

  if (typeof params.limit === "number") p.limit = params.limit;
  if (typeof params.offset === "number") p.offset = params.offset;

  if (params.sort) p.sort = params.sort;
  if (params.order) p.order = params.order;

  if (typeof params.is_active !== "undefined") p.is_active = params.is_active ? 1 : 0;

  return p;
}

// `params`'ı kesin olarak ya içeren ya da hiç içermeyen FetchArgs döndür
function qArgsList(params?: AdminProductListParams): FetchArgs {
  const p = buildAdminListParams(params);
  return p ? { url: BASE, params: p } : { url: BASE };
}

// -------------------------------------------------------------
// Endpoints
// -------------------------------------------------------------
const BASE = "/admin/products";

export const productsAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // LIST
    adminListProducts: builder.query<ProductRow[], AdminProductListParams | undefined>({
      query: (params): FetchArgs => qArgsList(params),
      transformResponse: (res: unknown): ProductRow[] => {
        const arr = Array.isArray(res) ? (res as ApiProductInput[]) : [];
        return arr.map(normalizeProduct);
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: "Product" as const, id: p.id })),
              { type: "Products" as const, id: "ADMIN_LIST" },
            ]
          : [{ type: "Products" as const, id: "ADMIN_LIST" }],
      keepUnusedDataFor: 60,
    }),

    // DETAIL
    adminGetProduct: builder.query<ProductRow, string>({
      query: (id): FetchArgs => ({ url: `${BASE}/${encodeURIComponent(id)}` }),
      transformResponse: (res: unknown): ProductRow => normalizeProduct(res as ApiProductInput),
      providesTags: (r) =>
        r ? [{ type: "Product", id: r.id }] : [{ type: "Products", id: "ADMIN_LIST" }],
    }),

    // CREATE
    adminCreateProduct: builder.mutation<ProductRow, AdminProductUpsert>({
      query: (body): FetchArgs => ({ url: BASE, method: "POST", body }),
      transformResponse: (res: unknown): ProductRow => normalizeProduct(res as ApiProductInput),
      invalidatesTags: (r) =>
        r
          ? [{ type: "Products", id: "ADMIN_LIST" }, { type: "Product", id: r.id }]
          : [{ type: "Products", id: "ADMIN_LIST" }],
    }),

    // UPDATE
    adminUpdateProduct: builder.mutation<ProductRow, { id: string; body: AdminProductUpsert }>({
      query: ({ id, body }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: unknown): ProductRow => normalizeProduct(res as ApiProductInput),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Product", id: arg.id },
        { type: "Products", id: "ADMIN_LIST" },
      ],
    }),

    // DELETE (204 no content)
    adminDeleteProduct: builder.mutation<{ ok: true }, string>({
      query: (id): FetchArgs => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: "DELETE" }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Product", id },
        { type: "Products", id: "ADMIN_LIST" },
      ],
    }),

    // BULK ACTIVE (boolean gönder)
    adminBulkSetActive: builder.mutation<{ ok: true }, { ids: string[]; is_active: boolean | 0 | 1 }>({
      query: ({ ids, is_active }): FetchArgs => ({
        url: `${BASE}/bulk/active`,
        method: "POST",
        body: { ids, is_active: !!is_active },
      }),
      invalidatesTags: (_r, _e, arg) => [
        ...arg.ids.map((id) => ({ type: "Product" as const, id })),
        { type: "Products", id: "ADMIN_LIST" },
      ],
    }),

    // REORDER (display_order yok — BE no-op)
    adminReorderProducts: builder.mutation<{ ok: true }, { orders: Array<{ id: string; display_order: number }>}>({
      query: (body): FetchArgs => ({
        url: `${BASE}/bulk/reorder`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Products", id: "ADMIN_LIST" }],
    }),

    // TOGGLE ACTIVE (boolean gönder)
    adminToggleActive: builder.mutation<{ ok: true }, { id: string; is_active: boolean | 0 | 1 }>({
      query: ({ id, is_active }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/active`,
        method: "PATCH",
        body: { is_active: !!is_active },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Product", id: arg.id },
        { type: "Products", id: "ADMIN_LIST" },
      ],
    }),

    // TOGGLE HOMEPAGE (BE: { show_on_homepage: boolean })
    adminToggleHomepage: builder.mutation<{ ok: true }, { id: string; show_on_homepage: boolean | 0 | 1 }>({
      query: ({ id, show_on_homepage }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/homepage`,
        method: "PATCH",
        body: { show_on_homepage: !!show_on_homepage },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Product", id: arg.id },
        { type: "Products", id: "ADMIN_LIST" },
      ],
    }),

    // REPLACE FAQS (BE: { faqs: [...] })
    adminReplaceFaqs: builder.mutation<{ replaced?: number; ok?: true }, { id: string; items: AdminFaqReplaceBody }>({
      query: ({ id, items }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/faqs`,
        method: "PUT",
        body: { faqs: items },
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Faqs", id: arg.id }],
    }),

    // REPLACE SPECS (BE: { specs: [...] })
    adminReplaceSpecs: builder.mutation<{ replaced?: number; ok?: true }, { id: string; items: AdminSpecReplaceBody }>({
      query: ({ id, items }): FetchArgs => ({
        url: `${BASE}/${encodeURIComponent(id)}/specs`,
        method: "PUT",
        body: { specs: items },
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Specs", id: arg.id }],
    }),

    // ADMIN CATEGORIES (minimal liste)
    adminListCategories: builder.query<AdminCategoryListItem[], void>({
      query: (): FetchArgs => ({ url: "/admin/categories" }),
    }),
  }),
  overrideExisting: true,
});

// Hooks
export const {
  useAdminListProductsQuery,
  useAdminGetProductQuery,
  useAdminCreateProductMutation,
  useAdminUpdateProductMutation,
  useAdminDeleteProductMutation,
  useAdminBulkSetActiveMutation,
  useAdminReorderProductsMutation,
  useAdminToggleActiveMutation,
  useAdminToggleHomepageMutation,
  useAdminReplaceFaqsMutation,
  useAdminReplaceSpecsMutation,
  useAdminListCategoriesQuery,
} = productsAdminApi;
