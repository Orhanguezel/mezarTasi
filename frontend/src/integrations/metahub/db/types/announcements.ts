// src/integrations/metahub/db/types/announcements.ts
export type AnnouncementRow = {
  id: string;
  title: string;
  description: string;
  content: string; // JSON-string {"html": "..."}
  icon: string;
  icon_type: "emoji" | "lucide";
  lucide_icon?: string | null;
  link: string;

  bg_color: string; hover_color: string; icon_color: string; text_color: string; border_color: string;
  badge_text?: string | null; badge_color?: string | null; button_text?: string | null; button_color?: string | null;

  is_active: 0 | 1 | boolean | "0" | "1" | "true" | "false";
  is_published: 0 | 1 | boolean | "0" | "1" | "true" | "false";
  display_order: number;

  created_at?: string; updated_at?: string; published_at?: string | null; expires_at?: string | null;
  meta_title?: string | null; meta_description?: string | null;
};
export type AnnouncementView = AnnouncementRow & {
  is_active: boolean;
  is_published: boolean;
  html: string; // extracted
};
