import { baseApi } from "../baseApi";
import type { AnnouncementRow, AnnouncementView } from "../../db/types/announcements";

const toBool = (x: any) => x === true || x === 1 || x === "1" || x === "true";

const extractHtml = (content?: unknown): string => {
  if (!content) return "";
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed.html === "string") return parsed.html;
      return content; // düz HTML string olabilir
    } catch {
      return content; // JSON değilse düz HTML olarak kullan
    }
  }
  if (typeof content === "object" && content) {
    const o = content as any;
    if (typeof o.html === "string") return o.html;
  }
  return "";
};

const toView = (r: AnnouncementRow): AnnouncementView => {
  // BE bazı kayıtlarda `html` alanını doğrudan veriyor, bazılarında `content` içinde.
  const html =
    (typeof (r as any).html === "string" && (r as any).html.trim())
      ? (r as any).html
      : extractHtml((r as any).content);

  return {
    ...r,
    is_active: toBool((r as any).is_active),
    is_published: toBool((r as any).is_published),
    html,
  } as AnnouncementView;
};

function pickRow(res: unknown): AnnouncementRow | null {
  if (!res) return null;
  // { data: {...} }
  if (typeof res === "object" && res !== null && "data" in (res as any)) {
    return ((res as any).data ?? null) as AnnouncementRow | null;
  }
  // [{...}]
  if (Array.isArray(res)) {
    return (res[0] ?? null) as AnnouncementRow | null;
  }
  // {...}
  return res as AnnouncementRow;
}

function pickRows(res: unknown): AnnouncementRow[] {
  if (!res) return [];
  if (Array.isArray(res)) return res as AnnouncementRow[];
  if (typeof res === "object" && res !== null && "data" in (res as any)) {
    const d = (res as any).data;
    return Array.isArray(d) ? (d as AnnouncementRow[]) : [];
  }
  return [];
}

export const announcementsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listAnnouncements: b.query<AnnouncementView[], void>({
      query: () => ({ url: "/announcements" }),
      transformResponse: (res: unknown): AnnouncementView[] =>
        pickRows(res).map(toView),
      providesTags: () => [{ type: "AnnouncementsPublic" as const, id: "LIST" }],
      keepUnusedDataFor: 120,
    }),

    getAnnouncementById: b.query<AnnouncementView, string>({
      // id hem sayısal hem slug/uuid olabilir → BE ne bekliyorsa aynen gönderiyoruz
      query: (id) => ({ url: `/announcements/${encodeURIComponent(String(id))}` }),
      transformResponse: (res: unknown): AnnouncementView => {
        const row = pickRow(res);
        if (!row) throw new Error("Announcement not found");
        return toView(row);
      },
      providesTags: (_r, _e, id) => [{ type: "AnnouncementPublic" as const, id }],
      keepUnusedDataFor: 300,
    }),
  }),
  overrideExisting: true,
});

export const { useListAnnouncementsQuery, useGetAnnouncementByIdQuery } = announcementsApi;
