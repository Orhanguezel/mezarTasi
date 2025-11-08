// src/components/public/CampaignAnnouncementDetailPanel.tsx
"use client";

import React from "react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { useGetSimpleCampaignByIdQuery } from "@/integrations/metahub/rtk/endpoints/campaigns.endpoints";
import { useGetAnnouncementByIdQuery } from "@/integrations/metahub/rtk/endpoints/announcements.endpoints";
import type { SimpleCampaignView } from "@/integrations/metahub/db/types/campaigns";

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

  // Sayısal/alfanümerik ayrımı YOK — BE ne veriyorsa o.
  const {
    data: campaign,
    isFetching: isCampaignLoading,
    isError: isCampaignError,
    error: campaignErrObj,
  } = useGetSimpleCampaignByIdQuery(id, {
    skip: !isCampaign || !validId,
    refetchOnMountOrArgChange: true,
  });

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

        {campaign.seo_keywords?.length ? (
          <div className="flex flex-wrap gap-2 pt-2">
            {campaign.seo_keywords.map((k) => (
              <span
                key={k}
                className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                #{k}
              </span>
            ))}
          </div>
        ) : null}
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

    const when = whenRaw && !Number.isNaN(Date.parse(whenRaw)) ? new Date(whenRaw).toLocaleString() : "";

  const bg = (announcement as any).bg_color || "bg-white";
  const text = (announcement as any).text_color || "text-slate-800";
  const border = (announcement as any).border_color || "border-slate-200";

  return (
    <div className={`p-6 ${bg} ${text} border-t ${border}`}>
      <div className="text-center space-y-2">
        <div className="inline-flex text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
          Duyuru
        </div>
        <h1 className="text-2xl">{announcement.title}</h1>
        {when && <div className="text-xs opacity-80">{when}</div>}
      </div>

      <div className="prose max-w-none mt-6 prose-p:my-3 prose-headings:mt-6 prose-headings:mb-3">
         <div dangerouslySetInnerHTML={{ __html: (announcement as any).html || "" }} />
      </div>
    </div>
  );
}
