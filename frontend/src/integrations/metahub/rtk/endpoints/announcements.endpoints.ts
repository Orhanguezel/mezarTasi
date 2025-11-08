// src/integrations/metahub/rtk/endpoints/announcements.endpoints.ts

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

const toView = (r: AnnouncementRow): AnnouncementView => ({
  ...r,
  is_active: toBool(r.is_active),
  is_published: toBool(r.is_published),
  html: extractHtml(r.content),
});

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

export const announcementsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listAnnouncements: b.query<AnnouncementView[], void>({
      query: () => ({ url: "/announcements" }),
      transformResponse: (res: unknown): AnnouncementView[] =>
        Array.isArray(res) ? (res as AnnouncementRow[]).map(toView) : [],
      providesTags: () => [{ type: "AnnouncementsPublic" as const, id: "LIST" }],
      keepUnusedDataFor: 120,
    }),

    getAnnouncementById: b.query<AnnouncementView, string>({
      query: (id) => ({ url: `/announcements/${encodeURIComponent(id)}` }),
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
