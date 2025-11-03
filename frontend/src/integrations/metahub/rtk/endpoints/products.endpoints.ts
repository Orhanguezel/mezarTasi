// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/products.endpoints.ts
// =============================================================
import { baseApi } from "../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type {
  Product as ProductRow,
  Product as Product,
  Faq,
  Review,
  ProductOption,
  Stock,
  Spec as ProductSpecRow,
} from "@/integrations/metahub/db/types/products.rows";

const BASE = "/products";

// ---- helpers ----
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
    } catch {
      /* CSV fallback */
    }
    return s.split(",").map((x) => x.trim()).filter(Boolean);
  }
  return null;
};

// ---- gevşek giriş (BE bazı sayısalları string dönebilir) ----
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

// ---- normalize (çıktı tam DB şeması ile eş) ----
const normalizeProduct = (p: ApiProductInput): Product => {
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
    // specifications JSON'u olduğu gibi bırakıyoruz (UI katmanında yorumlanacak)
  };
};

// =============================================================
// RTK endpoints
// =============================================================
export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ---------------------------------------------------------
    // GET /products (liste)
    // ---------------------------------------------------------
    listProducts: builder.query<
      Product[],
      {
        category_id?: string;
        sub_category_id?: string;
        is_active?: boolean | 0 | 1;
        q?: string;
        limit?: number;
        offset?: number;
        sort?: "price" | "rating" | "created_at";
        order?: "asc" | "desc";
        slug?: string; // bazı BE implementasyonları slug ile tekil de döndürebilir
      } | void
    >({
      query: (params): FetchArgs => {
        const p = params ?? {};
        return {
          url: BASE,
          params: {
            ...p,
            is_active: p.is_active === undefined ? undefined : (p.is_active ? 1 : 0),
          },
        };
      },
      transformResponse: (res: unknown): Product[] => {
        if (Array.isArray(res)) return (res as ApiProductInput[]).map(normalizeProduct);
        if (res && typeof res === "object") return [normalizeProduct(res as ApiProductInput)];
        return [];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: "Product" as const, id: p.id })),
              { type: "Products" as const, id: "LIST" },
            ]
          : [{ type: "Products" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    // ---------------------------------------------------------
    // GET /products/:idOrSlug (birleşik detay)
    // ---------------------------------------------------------
    getProduct: builder.query<Product, string>({
      query: (idOrSlug): FetchArgs => ({ url: `${BASE}/${encodeURIComponent(idOrSlug)}` }),
      transformResponse: (res: unknown): Product => normalizeProduct(res as ApiProductInput),
      providesTags: (r) => (r ? [{ type: "Product", id: r.id }] : [{ type: "Products", id: "LIST" }]),
    }),

    // Geri uyum rotaları (opsiyonel)
    getProductById: builder.query<Product, string>({
      query: (id): FetchArgs => ({ url: `${BASE}/id/${encodeURIComponent(id)}` }),
      transformResponse: (res: unknown): Product => normalizeProduct(res as ApiProductInput),
      providesTags: (_r, _e, id) => [{ type: "Product", id }],
    }),
    getProductBySlug: builder.query<Product, string>({
      query: (slug): FetchArgs => ({ url: `${BASE}/by-slug/${encodeURIComponent(slug)}` }),
      transformResponse: (res: unknown): Product => normalizeProduct(res as ApiProductInput),
      providesTags: (r) => (r ? [{ type: "Product", id: r.id }] : [{ type: "Products", id: "LIST" }]),
    }),

    // ---------------------------------------------------------
    // Public lists
    // ---------------------------------------------------------
    listProductFaqs: builder.query<Faq[], { product_id: string; only_active?: boolean | 0 | 1 }>({
      query: ({ product_id, only_active = true }): FetchArgs => ({
        url: "/product_faqs",
        params: { product_id, only_active: only_active ? 1 : 0 },
      }),
      providesTags: (_r, _e, arg) => [{ type: "Faqs", id: arg.product_id }],
    }),

    listProductSpecs: builder.query<ProductSpecRow[], { product_id: string }>({
      query: ({ product_id }): FetchArgs => ({ url: "/product_specs", params: { product_id } }),
      transformResponse: (res: unknown): ProductSpecRow[] => {
        const arr = Array.isArray(res) ? (res as ProductSpecRow[]) : [];
        return arr.slice().sort((a, b) => a.order_num - b.order_num);
      },
      providesTags: (_r, _e, arg) => [{ type: "Specs", id: arg.product_id }],
    }),

    listProductReviews: builder.query<Review[], { product_id: string; only_active?: boolean | 0 | 1 }>({
      query: ({ product_id, only_active = true }): FetchArgs => ({
        url: "/product_reviews",
        params: { product_id, only_active: only_active ? 1 : 0 },
      }),
      providesTags: (_r, _e, arg) => [{ type: "Reviews", id: arg.product_id }],
    }),

    listProductOptions: builder.query<ProductOption[], { product_id: string }>({
      query: ({ product_id }): FetchArgs => ({ url: "/product_options", params: { product_id } }),
      transformResponse: (res: unknown): ProductOption[] => {
        const arr = Array.isArray(res) ? (res as ProductOption[]) : [];
        return arr.map((o) => ({
          ...o,
          option_values: Array.isArray(o.option_values)
            ? o.option_values.map(String)
            : parseArr(o as any)?.filter(Boolean) ?? [],
        }));
      },
      providesTags: (_r, _e, arg) => [{ type: "Options", id: arg.product_id }],
    }),

    listProductStock: builder.query<Stock[], { product_id: string; is_used?: boolean | 0 | 1 }>({
      query: ({ product_id, is_used }): FetchArgs => ({
        url: "/product_stock",
        params: { product_id, ...(is_used === undefined ? {} : { is_used: is_used ? 1 : 0 }) },
      }),
      providesTags: (_r, _e, arg) => [{ type: "Stock", id: arg.product_id }],
    }),

    // ---------------------------------------------------------
    // Optional product CRUD (auth: requireAuth)
    // ---------------------------------------------------------
    createProduct: builder.mutation<Product, Partial<ProductRow>>({
      query: (body): FetchArgs => ({ url: BASE, method: "POST", body }),
      transformResponse: (res: unknown): Product => normalizeProduct(res as ApiProductInput),
      invalidatesTags: [{ type: "Products", id: "LIST" }],
    }),

    updateProduct: builder.mutation<Product, { id: string; body: Partial<ProductRow> }>({
      query: ({ id, body }): FetchArgs => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: "PATCH", body }),
      transformResponse: (res: unknown): Product => normalizeProduct(res as ApiProductInput),
      invalidatesTags: (_r, _e, arg) => [{ type: "Product", id: arg.id }, { type: "Products", id: "LIST" }],
    }),

    deleteProduct: builder.mutation<{ ok: true }, string>({
      query: (id): FetchArgs => ({ url: `${BASE}/${encodeURIComponent(id)}`, method: "DELETE" }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, id) => [{ type: "Product", id }, { type: "Products", id: "LIST" }],
    }),

    // ---------------------------------------------------------
    // Optional FAQ CRUD (auth)
    // ---------------------------------------------------------
    createProductFaq: builder.mutation<Faq, Omit<Faq, "id" | "created_at" | "updated_at">>({
      query: (body): FetchArgs => ({ url: "/product_faqs", method: "POST", body }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Faqs", id: arg.product_id }],
    }),
    updateProductFaq: builder.mutation<Faq, { id: string; body: Partial<Faq> }>({
      query: ({ id, body }): FetchArgs => ({ url: `/product_faqs/${encodeURIComponent(id)}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Faqs", id: arg.body.product_id ?? "LIST" }],
    }),
    deleteProductFaq: builder.mutation<{ ok: true }, { id: string; product_id: string }>({
      query: ({ id }): FetchArgs => ({ url: `/product_faqs/${encodeURIComponent(id)}`, method: "DELETE" }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Faqs", id: arg.product_id }],
    }),

    // ---------------------------------------------------------
    // Optional Spec CRUD (auth)
    // ---------------------------------------------------------
    createProductSpec: builder.mutation<ProductSpecRow, Omit<ProductSpecRow, "id" | "created_at" | "updated_at">>({
      query: (body): FetchArgs => ({ url: "/product_specs", method: "POST", body }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Specs", id: arg.product_id }],
    }),
    updateProductSpec: builder.mutation<ProductSpecRow, { id: string; body: Partial<ProductSpecRow> }>({
      query: ({ id, body }): FetchArgs => ({ url: `/product_specs/${encodeURIComponent(id)}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Specs", id: arg.body.product_id ?? "LIST" }],
    }),
    deleteProductSpec: builder.mutation<{ ok: true }, { id: string; product_id: string }>({
      query: ({ id }): FetchArgs => ({ url: `/product_specs/${encodeURIComponent(id)}`, method: "DELETE" }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Specs", id: arg.product_id }],
    }),
  }),
  overrideExisting: true,
});

// Hooks
export const {
  // Queries
  useListProductsQuery,
  useGetProductQuery,
  useGetProductByIdQuery,
  useGetProductBySlugQuery,
  useListProductFaqsQuery,
  useListProductSpecsQuery,
  useListProductReviewsQuery,
  useListProductOptionsQuery,
  useListProductStockQuery,
  // Mutations
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useCreateProductFaqMutation,
  useUpdateProductFaqMutation,
  useDeleteProductFaqMutation,
  useCreateProductSpecMutation,
  useUpdateProductSpecMutation,
  useDeleteProductSpecMutation,
} = productsApi;
