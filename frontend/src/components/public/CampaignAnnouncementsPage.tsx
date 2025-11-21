// =============================================================
// FILE: src/components/public/CampaignAnnouncementsPage.tsx
// =============================================================
"use client";

import React, { useMemo, useState } from "react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Search, Tag, Calendar } from "lucide-react";
import { ModalWrapper } from "./ModalWrapper";

import { useListSimpleCampaignsQuery } from "@/integrations/rtk/endpoints/campaigns.endpoints";
import { useListAnnouncementsQuery } from "@/integrations/rtk/endpoints/announcements.endpoints";
import type { SimpleCampaignView } from "@/integrations/rtk/types/campaigns";
import type { AnnouncementView } from "@/integrations/rtk/types/announcements";
import { DetailPanel } from "./CampaignAnnouncementDetailPanel";

type Kind = "campaign" | "announcement";
type ListItem = {
  kind: Kind;
  id: string;
  title: string;
  desc: string;
  image: string;
  date?: string;
  tags: string[];
  active: boolean;
  label: "Kampanya" | "Duyuru";
};
type Selected = { kind: Kind; id: string } | null;

const placeholderImg =
  "https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=800&h=500&fit=crop";

function campaignImageUrl(c: SimpleCampaignView): string {
  return (
    c.images?.[0]?.image_effective_url ??
    c.images?.[0]?.image_url ??
    c.image_effective_url ??
    c.image_url ??
    placeholderImg
  );
}

const htmlToText = (html: string) => {
  if (!html) return "";
  const tmp = typeof window !== "undefined" ? document.createElement("div") : null;
  if (!tmp) return "";
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

const firstImgFromHtml = (html?: string | null): string | null => {
  if (!html) return null;
  const tmp = typeof window !== "undefined" ? document.createElement("div") : null;
  if (!tmp) return null;
  tmp.innerHTML = html;
  const img = tmp.querySelector("img");
  return img?.getAttribute("src") || null;
};

function announcementCardImage(a: AnnouncementView): string {
  return a.image_url || firstImgFromHtml(a.html) || placeholderImg;
}

interface CampaignAnnouncementsPageProps {
  onNavigate: (page: string) => void;
  initialSelected?: Selected;
}

const CampaignAnnouncementsPage: React.FC<CampaignAnnouncementsPageProps> = ({
  onNavigate,
  initialSelected = null,
}) => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selected, setSelected] = useState<Selected>(initialSelected);

  const { data: campaigns = [] } = useListSimpleCampaignsQuery(undefined, {
    refetchOnMountOrArgChange: 30,
  });
  const { data: announcements = [] } = useListAnnouncementsQuery(undefined, {
    refetchOnMountOrArgChange: 30,
  });

  const items: ListItem[] = useMemo(() => {
    const fromCampaigns: ListItem[] = (campaigns as SimpleCampaignView[]).map((c) => ({
      kind: "campaign",
      id: String(c.id),
      title: c.title,
      desc: c.description ?? "",
      image: campaignImageUrl(c),
      tags: c.seo_keywords || [],
      active: !!c.is_active,
      label: "Kampanya",
      ...(c.updated_at || c.created_at ? { date: c.updated_at || c.created_at } : {}),
    }));

    const fromAnnouncements: ListItem[] = (announcements as AnnouncementView[]).map((a) => ({
      kind: "announcement",
      id: String(a.id), // 🔹 doğrudan id
      title: a.title,
      desc: a.html ? htmlToText(a.html).slice(0, 220) : a.description || "",
      image: announcementCardImage(a), // 🔹 kapak → html içi ilk img → placeholder
      tags: [],
      active: a.is_active !== false,
      label: "Duyuru",
      ...((a as any).published_at || a.updated_at || a.created_at
        ? { date: (a as any).published_at || a.updated_at || a.created_at }
        : {}),
    }));

    return [...fromCampaigns, ...fromAnnouncements].sort((x, y) => {
      const dx = x.date ? new Date(x.date).getTime() : 0;
      const dy = y.date ? new Date(y.date).getTime() : 0;
      return dy - dx;
    });
  }, [campaigns, announcements]);

  const filtered = useMemo(() => {
    const q = searchKeyword.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const hay = [it.title, it.desc, ...(it.tags || [])].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [items, searchKeyword]);

  const selectedItem: ListItem | null = selected
    ? items.find((it) => it.kind === selected.kind && it.id === selected.id) ?? null
    : null;

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl text-emerald-800 mb-4">Duyuru / Kampanyalar</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Özel indirimler, sezonsal kampanyalar ve hizmet duyurularımızdan haberdar olun.
          </p>
        </div>

        {/* Hero */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=800&h=500&fit=crop"
              alt="Kampanya ve duyurular"
              className="w-full h-[400px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <h3 className="text-2xl mb-2">Özel Fırsatlar</h3>
              <p className="text-lg opacity-90">Avantajlı kampanyalarımızı kaçırmayın</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="text-center mb-12">
          <h2 className="text-2xl text-emerald-700 mb-6">Kampanya / Duyuru Ara</h2>
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Input
                type="text"
                placeholder="Başlık, açıklama veya etiket ara..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-4 pr-12 py-3 text-lg border-2 border-emerald-200 focus:border-emerald-500 rounded-lg"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Liste */}
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((it) => (
            <button
              key={`${it.kind}-${it.id}`}
              className="text-left bg-white rounded-xl shadow-md hover:shadow-lg transition p-0 overflow-hidden border border-emerald-100"
              onClick={() => setSelected({ kind: it.kind, id: it.id })}
            >
              <ImageWithFallback src={it.image} alt={it.title} className="w-full h-40 object-cover" />
              <div className="p-4">
                <div className="text-xs text-emerald-700 font-semibold mb-1">{it.label}</div>
                <h3 className="text-slate-800 font-medium line-clamp-2">{it.title}</h3>
                <p className="text-slate-600 text-sm mt-1 line-clamp-3">{it.desc}</p>
                <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    <span>{it.tags?.[0] || "Genel"}</span>
                  </div>
                  {it.date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(it.date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button onClick={() => onNavigate("home")} className="bg-slate-600 hover:bg-slate-700 text-white px-8 py-3 rounded-lg">
            ← Ana Sayfaya Dön
          </Button>
        </div>
      </div>

      {/* Modal */}
      <ModalWrapper
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={
          selectedItem
            ? selectedItem.kind === "announcement"
              ? "Duyuru Detayı"
              : "Kampanya Detayı"
            : "Detay"
        }
        maxWidth="max-w-3xl"
      >
        {selected && (
          <>
            <DetailPanel kind={selected.kind} id={selected.id} />
            {/* Diğer aktif kampanyalar */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-slate-700 mb-3">Diğer aktif kampanyalar</h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {items
                  .filter((x) => x.kind === "campaign" && x.active && x.id !== selected.id)
                  .map((x) => (
                    <button
                      key={`rel-${x.id}`}
                      className="shrink-0 w-48 text-left bg-white rounded-lg border border-emerald-100 hover:shadow transition"
                      onClick={() => setSelected({ kind: "campaign", id: x.id })}
                    >
                      <ImageWithFallback src={x.image} alt={x.title} className="w-full h-24 object-cover rounded-t-lg" />
                      <div className="p-2">
                        <div className="text-[10px] text-emerald-700 font-semibold mb-1">Kampanya</div>
                        <div className="text-xs text-slate-800 line-clamp-2">{x.title}</div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </>
        )}
      </ModalWrapper>
    </div>
  );
};

export default CampaignAnnouncementsPage;
