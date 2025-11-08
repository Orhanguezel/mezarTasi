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
    } catch { /* CSV fallback */ }
    return s.split(",").map((x) => x.trim()).filter(Boolean);
  }
  return null;
};

// payload içinde dizi nerede olursa olsun çıkar
function takeRows(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.rows)) return payload.rows;
  if (payload.data) return takeRows(payload.data);
  if (payload.result) return takeRows(payload.result);
  return [];
}

// -- helper: undefined/null değerleri params'a hiç koyma + FetchArgs oluştur
export type AdminProductListParams = {
  q?: string;
  is_active?: boolean | 0 | 1;
  category_id?: string;
  sub_category_id?: string;
  limit?: number;
  offset?: number;
  sort?: "price" | "rating" | "created_at" | "title" | "review_count";
  order?: "asc" | "desc";
};

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

function args(url: string, params?: AdminProductListParams): FetchArgs {
  const p = buildAdminListParams(params);
  // exactOptionalPropertyTypes ile uyumlu: undefined ise hiç eklemiyoruz
  return p ? { url, params: p as Record<string, any> } : { url };
}

// -------------------------------------------------------------
// Types
// -------------------------------------------------------------
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

// -------------------------------------------------------------
// Endpoints
// -------------------------------------------------------------
const ADMIN_BASE = "/admin/products";

type AdminSetProductImagesBody = {
  cover_id?: string;
  image_ids: string[];
};

export const productsAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /* =========================================================
       LIST (sadece /admin/products)
    ========================================================= */
    adminListProducts: builder.query<ProductRow[], AdminProductListParams | undefined>({
      query: (params): FetchArgs => args(ADMIN_BASE, params),
      transformResponse: (res: unknown): ProductRow[] =>
        (takeRows(res) as ApiProductInput[]).map(normalizeProduct),
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: "Product" as const, id: p.id })),
              { type: "Products" as const, id: "ADMIN_LIST" },
            ]
          : [{ type: "Products" as const, id: "ADMIN_LIST" }],
      keepUnusedDataFor: 60,
    }),

    /* =========================================================
       DETAIL
    ========================================================= */
    adminGetProduct: builder.query<ProductRow, string>({
      query: (id): FetchArgs => ({ url: `${ADMIN_BASE}/${encodeURIComponent(id)}` }),
      transformResponse: (res: unknown): ProductRow => normalizeProduct(res as ApiProductInput),
      providesTags: (r) =>
        r ? [{ type: "Product", id: r.id }] : [{ type: "Products", id: "ADMIN_LIST" }],
    }),

    /* =========================================================
       CREATE / UPDATE / DELETE
    ========================================================= */
    adminCreateProduct: builder.mutation<ProductRow, AdminProductUpsert>({
      query: (body): FetchArgs => ({ url: ADMIN_BASE, method: "POST", body }),
      transformResponse: (res: unknown): ProductRow => normalizeProduct(res as ApiProductInput),
      invalidatesTags: (r) =>
        r
          ? [{ type: "Products", id: "ADMIN_LIST" }, { type: "Product", id: r.id }]
          : [{ type: "Products", id: "ADMIN_LIST" }],
    }),

    adminUpdateProduct: builder.mutation<ProductRow, { id: string; body: AdminProductUpsert }>({
      query: ({ id, body }): FetchArgs => ({
        url: `${ADMIN_BASE}/${encodeURIComponent(id)}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: unknown): ProductRow => normalizeProduct(res as ApiProductInput),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Product", id: arg.id },
        { type: "Products", id: "ADMIN_LIST" },
      ],
    }),

    adminDeleteProduct: builder.mutation<{ ok: true }, string>({
      query: (id): FetchArgs => ({ url: `${ADMIN_BASE}/${encodeURIComponent(id)}`, method: "DELETE" }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Product", id },
        { type: "Products", id: "ADMIN_LIST" },
      ],
    }),

    /* =========================================================
       BULK / TOGGLES / REORDER
    ========================================================= */
    adminBulkSetActive: builder.mutation<{ ok: true }, { ids: string[]; is_active: boolean | 0 | 1 }>({
      query: ({ ids, is_active }): FetchArgs => ({
        url: `${ADMIN_BASE}/bulk/active`,
        method: "POST",
        body: { ids, is_active: !!is_active },
      }),
      invalidatesTags: (_r, _e, arg) => [
        ...arg.ids.map((id) => ({ type: "Product" as const, id })),
        { type: "Products", id: "ADMIN_LIST" },
      ],
    }),

    adminReorderProducts: builder.mutation<{ ok: true }, { orders: Array<{ id: string; display_order: number }>}>({
      query: (body): FetchArgs => ({
        url: `${ADMIN_BASE}/bulk/reorder`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Products", id: "ADMIN_LIST" }],
    }),

    adminToggleActive: builder.mutation<{ ok: true }, { id: string; is_active: boolean | 0 | 1 }>({
      query: ({ id, is_active }): FetchArgs => ({
        url: `${ADMIN_BASE}/${encodeURIComponent(id)}/active`,
        method: "PATCH",
        body: { is_active: !!is_active },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Product", id: arg.id },
        { type: "Products", id: "ADMIN_LIST" },
      ],
    }),

    adminToggleHomepage: builder.mutation<{ ok: true }, { id: string; show_on_homepage: boolean | 0 | 1 }>({
      query: ({ id, show_on_homepage }): FetchArgs => ({
        url: `${ADMIN_BASE}/${encodeURIComponent(id)}/homepage`,
        method: "PATCH",
        body: { show_on_homepage: !!show_on_homepage },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Product", id: arg.id },
        { type: "Products", id: "ADMIN_LIST" },
      ],
    }),

    adminReplaceFaqs: builder.mutation<{ replaced?: number; ok?: true }, { id: string; items: AdminFaqReplaceBody }>({
      query: ({ id, items }): FetchArgs => ({
        url: `${ADMIN_BASE}/${encodeURIComponent(id)}/faqs`,
        method: "PUT",
        body: { faqs: items },
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Faqs", id: arg.id }],
    }),

    adminReplaceSpecs: builder.mutation<{ replaced?: number; ok?: true }, { id: string; items: AdminSpecReplaceBody }>({
      query: ({ id, items }): FetchArgs => ({
        url: `${ADMIN_BASE}/${encodeURIComponent(id)}/specs`,
        method: "PUT",
        body: { specs: items },
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Specs", id: arg.id }],
    }),

    adminSetProductImages: builder.mutation<ProductRow, { id: string; body: AdminSetProductImagesBody }>({
      query: ({ id, body }): FetchArgs => ({
        url: `${ADMIN_BASE}/${encodeURIComponent(id)}/images`,
        method: "PUT",
        body,
      }),
      transformResponse: (res: unknown): ProductRow => normalizeProduct(res as ApiProductInput),
      invalidatesTags: (_r, _e, arg) => [
        { type: "Product", id: arg.id },
        { type: "Products", id: "ADMIN_LIST" },
      ],
    }),

    /* =========================================================
       ADMIN CATEGORIES (sadece /admin/categories)
    ========================================================= */
    adminListCategories: builder.query<AdminCategoryListItem[], void>({
      query: (): FetchArgs => ({ url: "/admin/categories" }),
      transformResponse: (res: unknown): AdminCategoryListItem[] => {
        const rows = takeRows(res);
        return Array.isArray(rows) ? (rows as AdminCategoryListItem[]) : [];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: "Category" as const, id: c.id })),
              { type: "Category" as const, id: "LIST" },
            ]
          : [{ type: "Category" as const, id: "LIST" }],
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
  useAdminSetProductImagesMutation,
  useAdminListCategoriesQuery,
} = productsAdminApi;
