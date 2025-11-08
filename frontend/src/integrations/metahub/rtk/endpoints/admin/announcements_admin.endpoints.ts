// ---------------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/admin/announcements_admin.endpoints.ts
// ---------------------------------------------------------------------
import { baseApi } from "../../baseApi";
import type { AnnouncementRow, AnnouncementView } from "../../../db/types/announcements";

const toBool = (x: any) => x === true || x === 1 || x === "1" || x === "true";

// BE (admin) tarafı content'i HTML string olarak DÖNER.
// Yine de geriye dönük bir güvenlik için JSON gelirse html'i çekiyoruz.
function extractHtmlAdmin(content?: unknown): string {
  if (typeof content === "string") {
    // çoğunlukla düz HTML
    try {
      // nadiren {"html": "..."} gelirse
      const maybe = JSON.parse(content);
      if (maybe && typeof (maybe as any).html === "string") return (maybe as any).html;
    } catch {
      // düz HTML ise parse hata verir → olduğu gibi kullan
    }
    return content;
  }
  if (content && typeof content === "object" && typeof (content as any).html === "string") {
    return (content as any).html;
  }
  return "";
}

const toView = (r: AnnouncementRow): AnnouncementView => ({
  ...r,
  is_active: toBool(r.is_active),
  is_published: toBool(r.is_published),
  html: extractHtmlAdmin(r.content),
});

export type AdminAnnouncementsListQuery = Partial<{
  q: string;
  is_active: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  is_published: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  include_expired: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  limit: number;
  offset: number;
  sort: "display_order" | "created_at" | "updated_at";
  order: "asc" | "desc";
}>;

// Admin create/update için BE'nin beklediği gövde:
//   content: string (HTML)
// Diğer alanlar opsiyonel patch olabilir.
export type AnnouncementAdminUpsertInput = Partial<
  Pick<
    AnnouncementRow,
    | "title"
    | "description"
    | "icon"
    | "icon_type"
    | "lucide_icon"
    | "link"
    | "bg_color"
    | "hover_color"
    | "icon_color"
    | "text_color"
    | "border_color"
    | "badge_text"
    | "badge_color"
    | "button_text"
    | "button_color"
    | "display_order"
    | "meta_title"
    | "meta_description"
  >
> & {
  content?: string; // DÜZ HTML (BE böyle istiyor)
  is_active?: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  is_published?: boolean | 0 | 1 | "0" | "1" | "true" | "false";
  published_at?: string | null;
  expires_at?: string | null;
};

export const adminAnnouncementsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listAnnouncementsAdmin: b.query<AnnouncementView[], AdminAnnouncementsListQuery | void>({
      query: (args) => ({ url: "/admin/announcements", params: args ?? {} }),
      transformResponse: (res: unknown): AnnouncementView[] =>
        Array.isArray(res) ? (res as AnnouncementRow[]).map(toView) : [],
      providesTags: () => [{ type: "Announcements" as const, id: "ADMIN_LIST" }],
    }),

    getAnnouncementAdminById: b.query<AnnouncementView, string>({
      query: (id) => ({ url: `/admin/announcements/${id}` }),
      transformResponse: (res: unknown): AnnouncementView => toView(res as AnnouncementRow),
      providesTags: (_r, _e, id) => [{ type: "Announcement" as const, id }],
    }),

    createAnnouncementAdmin: b.mutation<AnnouncementView, AnnouncementAdminUpsertInput>({
      // BE doğrudan { ...fields, content: "<p>...</p>" } bekler
      query: (payload) => ({
        url: "/admin/announcements",
        method: "POST",
        body: payload,
      }),
      transformResponse: (res: unknown): AnnouncementView => toView(res as AnnouncementRow),
      invalidatesTags: [{ type: "Announcements" as const, id: "ADMIN_LIST" }],
    }),

    updateAnnouncementAdmin: b.mutation<
      AnnouncementView,
      { id: string; patch: AnnouncementAdminUpsertInput }
    >({
      query: ({ id, patch }) => ({
        url: `/admin/announcements/${id}`,
        method: "PATCH",
        body: patch,
      }),
      transformResponse: (res: unknown): AnnouncementView => toView(res as AnnouncementRow),
      invalidatesTags: (r, e, args) => [
        { type: "Announcements" as const, id: "ADMIN_LIST" },
        { type: "Announcement" as const, id: args.id },
      ],
    }),

    deleteAnnouncementAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/admin/announcements/${id}`, method: "DELETE" }),
      transformResponse: () => ({ ok: true }),
      invalidatesTags: [{ type: "Announcements" as const, id: "ADMIN_LIST" }],
    }),

    reorderAnnouncementsAdmin: b.mutation<{ ok: true }, { ids: string[] }>({
      query: (body) => ({ url: "/admin/announcements/reorder", method: "POST", body }),
      transformResponse: () => ({ ok: true }),
      invalidatesTags: [{ type: "Announcements" as const, id: "ADMIN_LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListAnnouncementsAdminQuery,
  useGetAnnouncementAdminByIdQuery,
  useCreateAnnouncementAdminMutation,
  useUpdateAnnouncementAdminMutation,
  useDeleteAnnouncementAdminMutation,
  useReorderAnnouncementsAdminMutation,
} = adminAnnouncementsApi;
