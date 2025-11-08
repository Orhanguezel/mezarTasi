// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/admin/custom_pages_admin.endpoints.ts
// =============================================================
import { baseApi } from "../../baseApi";
import type { CustomPageRow, CustomPageView } from "@/integrations/metahub/db/types/customPages";

const toBool = (x: unknown): boolean =>
  x === true || x === 1 || x === "1" || x === "true";

function extractHtml(rawField: unknown): string {
  if (typeof rawField === "string") {
    try {
      const parsed = JSON.parse(rawField) as unknown;
      if (parsed && typeof parsed === "object" && typeof (parsed as Record<string, unknown>).html === "string") {
        return (parsed as Record<string, unknown>).html as string;
      }
      return rawField;
    } catch {
      return rawField;
    }
  }
  if (rawField && typeof rawField === "object" && typeof (rawField as Record<string, unknown>).html === "string") {
    return (rawField as Record<string, unknown>).html as string;
  }
  return "";
}

/** row→view */
const toView = (row: unknown): CustomPageView => {
  const r = (row ?? {}) as Record<string, unknown>;
  const raw = r["content_html"] ?? r["content"];

  const base: Omit<CustomPageView, "created_at" | "updated_at"> = {
    id: String(r["id"] ?? ""),
    title: String(r["title"] ?? ""),
    slug: String(r["slug"] ?? ""),
    content: extractHtml(raw),

    featured_image:
      (typeof r["featured_image"] === "string" ? (r["featured_image"] as string) : null) ?? null,
    featured_image_alt:
      (typeof r["featured_image_alt"] === "string" ? (r["featured_image_alt"] as string) : null) ?? null,

    meta_title: (typeof r["meta_title"] === "string" ? (r["meta_title"] as string) : null) ?? null,
    meta_description:
      (typeof r["meta_description"] === "string" ? (r["meta_description"] as string) : null) ?? null,
    is_published: toBool(r["is_published"]),
  };

  return {
    ...base,
    ...(typeof r["created_at"] === "string" ? { created_at: r["created_at"] as string } : {}),
    ...(typeof r["updated_at"] === "string" ? { updated_at: r["updated_at"] as string } : {}),
  };
};

/** create/update body (FE) */
export type UpsertCustomPageBody = {
  title: string;
  slug: string;
  content: string; // HTML
  meta_title?: string | null;
  meta_description?: string | null;
  is_published?: boolean;
  locale?: string | null;

  // 👇 Görsel alanları (opsiyonel — istersen PATCH /featured-image ile ayrı set edebilirsin)
  featured_image?: string | null;
  featured_image_alt?: string | null;
  featured_image_asset_id?: string | null;
};

const toApiBody = (b: UpsertCustomPageBody) => {
  const title = (b.title ?? "").trim();
  const slug = (b.slug ?? "").trim();
  const html = b.content ?? "";
  const is_published = toBool(b.is_published);

  return {
    title,
    slug,
    // BE content bekliyor (JSON-string): {"html": "..."}
    content: JSON.stringify({ html }),

    meta_title: b.meta_title ?? null,
    meta_description: b.meta_description ?? null,
    is_published,

    // Görsel alanları (opsiyonel)
    featured_image: typeof b.featured_image !== "undefined" ? b.featured_image : undefined,
    featured_image_alt: typeof b.featured_image_alt !== "undefined" ? b.featured_image_alt : undefined,
    featured_image_asset_id: typeof b.featured_image_asset_id !== "undefined" ? b.featured_image_asset_id : undefined,

    locale: b.locale ?? null,
  };
};

const BASE = "/admin/custom_pages";

export const customPagesAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listCustomPagesAdmin: b.query<CustomPageView[], { locale?: string; limit?: number; offset?: number } | void>({
      query: () => ({ url: `${BASE}` }),
      transformResponse: (res: unknown): CustomPageView[] =>
        Array.isArray(res) ? (res as CustomPageRow[]).map(toView) : [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: "CustomPages" as const, id: p.id })),
              { type: "CustomPages" as const, id: "LIST" },
            ]
          : [{ type: "CustomPages" as const, id: "LIST" }],
    }),

    getCustomPageAdminById: b.query<CustomPageView, string>({
      query: (id) => ({ url: `${BASE}/${id}` }),
      transformResponse: (res: unknown): CustomPageView => toView(res),
      providesTags: (_r, _e, id) => [{ type: "CustomPages", id }],
    }),

    createCustomPageAdmin: b.mutation<CustomPageView, UpsertCustomPageBody>({
      query: (body) => ({ url: `${BASE}`, method: "POST", body: toApiBody(body) }),
      transformResponse: (res: unknown): CustomPageView => toView(res),
      invalidatesTags: [{ type: "CustomPages", id: "LIST" }],
    }),

    updateCustomPageAdmin: b.mutation<CustomPageView, { id: string; body: UpsertCustomPageBody }>({
      query: ({ id, body }) => ({ url: `${BASE}/${id}`, method: "PATCH", body: toApiBody(body) }),
      transformResponse: (res: unknown): CustomPageView => toView(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: "CustomPages", id: arg.id },
        { type: "CustomPages", id: "LIST" },
      ],
    }),

    deleteCustomPageAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `${BASE}/${id}`, method: "DELETE" }),
      transformResponse: (): { ok: true } => ({ ok: true }),
      invalidatesTags: (_r, _e, id) => [
        { type: "CustomPages", id },
        { type: "CustomPages", id: "LIST" },
      ],
    }),

    /** 👇 Sadece featured image’i bağla/kaldır (asset_id + opsiyonel url/alt) */
    setCustomPageFeaturedImageAdmin: b.mutation<
      CustomPageView,
      { id: string; body: { asset_id: string | null; image_url?: string | null; alt?: string | null } }
    >({
      query: ({ id, body }) => ({
        url: `${BASE}/${id}/featured-image`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: unknown): CustomPageView => toView(res),
      invalidatesTags: (_r, _e, arg) => [
        { type: "CustomPages", id: arg.id },
        { type: "CustomPages", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListCustomPagesAdminQuery,
  useGetCustomPageAdminByIdQuery,
  useCreateCustomPageAdminMutation,
  useUpdateCustomPageAdminMutation,
  useDeleteCustomPageAdminMutation,
  useSetCustomPageFeaturedImageAdminMutation, // 👈 export
} = customPagesAdminApi;
