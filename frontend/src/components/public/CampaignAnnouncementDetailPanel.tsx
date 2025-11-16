// =============================================================
// FILE: src/components/public/CampaignAnnouncementDetailPanel.tsx
// =============================================================
"use client";

import React from "react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { useGetSimpleCampaignByIdQuery } from "@/integrations/metahub/rtk/endpoints/campaigns.endpoints";
import { useGetAnnouncementByIdQuery } from "@/integrations/metahub/rtk/endpoints/announcements.endpoints";
import type { SimpleCampaignView } from "@/integrations/metahub/db/types/campaigns";
import type { AnnouncementView } from "@/integrations/metahub/db/types/announcements";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=800&h=500&fit=crop";

function campaignImageUrl(c: SimpleCampaignView): string {
  return (
    c.images?.[0]?.image_effective_url ??
    c.images?.[0]?.image_url ??
    c.image_effective_url ??
    c.image_url ??
    PLACEHOLDER
  );
}

function firstImgFromHtml(html?: string | null): string | null {
  if (!html) return null;
  const tmp = typeof window !== "undefined" ? document.createElement("div") : null;
  if (!tmp) return null;
  tmp.innerHTML = html;
  const img = tmp.querySelector("img");
  return img?.getAttribute("src") || null;
}

function announcementImageUrl(a: AnnouncementView): string {
  return a.image_url || firstImgFromHtml(a.html) || PLACEHOLDER;
}

export function DetailPanel({
  kind,
  id,
}: {
  kind: "campaign" | "announcement";
  id: string;
}) {
  const validId = typeof id === "string" && id.trim().length > 0;
  if (!validId) return <div className="p-6 text-slate-600">Kayıt anahtarı eksik.</div>;

  const isCampaign = kind === "campaign";
  const isAnnouncement = kind === "announcement";

  // Kampanya
  const {
    data: campaign,
    isFetching: isCampaignLoading,
    isError: isCampaignError,
    error: campaignErrObj,
  } = useGetSimpleCampaignByIdQuery(id, {
    skip: !isCampaign || !validId,
    refetchOnMountOrArgChange: true,
  });

  // Duyuru
  const {
    data: announcement,
    isFetching: isAnnouncementLoading,
    isError: isAnnouncementError,
    error: announcementErrObj,
  } = useGetAnnouncementByIdQuery(id, {
    skip: !isAnnouncement || !validId,
    refetchOnMountOrArgChange: true,
  });

  const loading = isCampaignLoading || isAnnouncementLoading;
  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-6 bg-gray-100 rounded animate-pulse" />
        <div className="h-48 bg-gray-100 rounded animate-pulse" />
        <div className="h-24 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  const hasError = isCampaignError || isAnnouncementError;
  if (hasError) {
    console.warn("DetailPanel error", { campaignErrObj, announcementErrObj });
    return <div className="p-6 text-red-600">İçerik yüklenemedi.</div>;
  }

  // --- Kampanya ---
  if (isCampaign) {
    if (!campaign) return <div className="p-6 text-slate-600">Kampanya bulunamadı.</div>;
    const imgSrc = campaignImageUrl(campaign);
    const when = campaign.updated_at || campaign.created_at || "";

    return (
      <div className="bg-white p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex text-xs px-2 py-1 rounded bg-teal-50 text-teal-700 border border-teal-200">
            Kampanya
          </div>
          <h1 className="text-2xl text-teal-700">{campaign.title}</h1>
          {when && <div className="text-xs text-slate-500">{new Date(when).toLocaleString()}</div>}
        </div>

        <div className="w-full h-60 rounded-lg overflow-hidden">
          <ImageWithFallback src={imgSrc} alt={campaign.title} className="w-full h-full object-cover" />
        </div>

        {!!campaign.description && (
          <p className="text-slate-700 leading-relaxed">{campaign.description}</p>
        )}
      </div>
    );
  }

  // --- Duyuru ---
  if (!announcement) return <div className="p-6 text-slate-600">Duyuru bulunamadı.</div>;

  const whenRaw =
    (announcement as any).published_at ||
    (announcement as any).updated_at ||
    (announcement as any).created_at ||
    "";
  const when =
    whenRaw && !Number.isNaN(Date.parse(whenRaw)) ? new Date(whenRaw).toLocaleString() : "";

  // Renkler hex olarak geliyor → inline style ile uygula
  const bg = (announcement as any).bg_color || "#ffffff";
  const text = (announcement as any).text_color || "#0f172a";
  const border = (announcement as any).border_color || "#e2e8f0";

  const imgSrc = announcementImageUrl(announcement);
  const imgAlt = announcement.alt || announcement.title;

  return (
    <div className="p-6 border-t rounded-b-lg" style={{ backgroundColor: bg, color: text, borderColor: border }}>
      <div className="text-center space-y-2">
        <div className="inline-flex text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
          Duyuru
        </div>
        <h1 className="text-2xl">{announcement.title}</h1>
        {when && <div className="text-xs opacity-80">{when}</div>}
      </div>

      {/* Kapak görseli */}
      <div className="w-full mt-6 rounded-lg overflow-hidden">
        <ImageWithFallback src={imgSrc} alt={imgAlt} className="w-full h-60 md:h-72 object-cover" />
      </div>

      {/* HTML içerik */}
      <div className="prose max-w-none mt-6 prose-p:my-3 prose-headings:mt-6 prose-headings:mb-3">
        <div dangerouslySetInnerHTML={{ __html: (announcement as any).html || "" }} />
      </div>
    </div>
  );
}
