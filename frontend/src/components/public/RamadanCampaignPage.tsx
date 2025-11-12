// FILE: src/pages/campaigns/RamazanCampaignCMS.tsx
"use client";

import { useEffect } from "react";
import { useGetCustomPageBySlugQuery } from "@/integrations/metahub/rtk/endpoints/custom_pages.endpoints";
import { MobileSEOOptimizer } from "./MobileSEOOptimizer";

export default function RamazanCampaignCMS() {
  const { data, isLoading } = useGetCustomPageBySlugQuery({ slug: "ramazan-kampanyasi" });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  const canonical =
    data?.slug ? `https://mezarisim.com/${data.slug}` : undefined;
  const og =
    data?.image_effective_url || data?.image_url || undefined;

  return (
    <>
      <MobileSEOOptimizer
        currentPage="campaigns"
        {...(data?.meta_title ? { title: data.meta_title } : {})}
        {...(data?.meta_description ? { description: data.meta_description } : {})}
        {...(canonical ? { canonicalUrl: canonical } : {})}
        {...(og ? { ogImage: og } : {})}
        // keywords göndermiyoruz; undefined ise exactOptionalPropertyTypes uyarısı üretmesin
      />
      <div dangerouslySetInnerHTML={{ __html: data?.content || "" }} />
    </>
  );
}
