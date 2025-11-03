// =============================================================
// FILE: src/pages/admin/Tabs/CampaignsTab.tsx
// =============================================================
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Campaign } from "../types";
import { CampaignDialog } from "../Dialogs/CampaignDialog";

type Props = { campaigns: Campaign[]; setCampaigns: (arr: Campaign[]) => void };

export const TabsCampaigns: React.FC<Props> = ({ campaigns, setCampaigns }) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);

  const onEdit = (c: Campaign) => {
    setEditing(c);
    setOpen(true);
  };

  const onDelete = (c: Campaign) => {
    setCampaigns(campaigns.filter((x) => x.id !== c.id));
    toast.success("Silindi");
  };

  return (
    <>
      {/* Başlık aksiyonları */}
      <div className="mb-3 flex justify-end">
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Kampanya
        </Button>
      </div>

      {/* Tablo kap / mobil kart aç: header sadece md+ */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* Tablo başlığı (md+) */}
        <div className="hidden grid-cols-12 items-center gap-4 border-b border-border bg-muted/50 px-4 py-3 text-[12px] uppercase tracking-wide text-muted-foreground md:grid">
          <div className="col-span-5">Başlık</div>
          <div className="col-span-2">Tarih</div>
          <div className="col-span-2">Etiket</div>
          <div className="col-span-1">Durum</div>
          <div className="col-span-2 justify-self-end">İşlemler</div>
        </div>

        <div className="divide-y">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="
                group px-4 py-3 hover:bg-muted/30
                md:grid md:grid-cols-12 md:items-center md:gap-4
              "
            >
              {/* Başlık + görseller */}
              <div className="min-w-0 md:col-span-5">
                <div className="flex items-start gap-3">
                  {c.images?.length ? (
                    <div className="flex -space-x-2">
                      {c.images.slice(0, 2).map((img, idx) => (
                        <div
                          key={idx}
                          className="size-10 overflow-hidden rounded-lg border-2 border-card bg-muted"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt="" className="h-full w-full object-cover" />
                        </div>
                      ))}
                      {c.images.length > 2 && (
                        <div className="size-10 rounded-lg border-2 border-card bg-foreground/60 text-background">
                          <div className="flex h-full w-full items-center justify-center text-xs">
                            +{c.images.length - 2}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="size-10 rounded-lg bg-muted" />
                  )}

                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.title}</p>
                    <p className="line-clamp-1 text-sm text-muted-foreground">{c.description}</p>
                  </div>
                </div>

                {/* Mobilde meta alanları (etiketli satırlar) */}
                <div className="mt-3 grid grid-cols-2 gap-y-2 text-sm md:hidden">
                  <span className="text-muted-foreground">Tarih</span>
                  <span className="text-foreground/80">{c.date}</span>

                  <span className="text-muted-foreground">Etiket</span>
                  <span>
                    <Badge variant="secondary">{c.tag}</Badge>
                  </span>

                  <span className="text-muted-foreground">Durum</span>
                  <span>
                    <Badge variant={c.isActive ? "default" : "secondary"}>
                      <span
                        className={[
                          "mr-2 inline-block size-2 rounded-full",
                          c.isActive ? "bg-green-500" : "bg-gray-400",
                        ].join(" ")}
                      />
                      {c.isActive ? "Aktif" : "Pasif"}
                    </Badge>
                  </span>
                </div>
              </div>

              {/* Tarih (md+) */}
              <div className="hidden md:col-span-2 md:block text-sm text-foreground/80">
                {c.date}
              </div>

              {/* Etiket (md+) */}
              <div className="hidden md:col-span-2 md:block">
                <Badge variant="secondary">{c.tag}</Badge>
              </div>

              {/* Durum (md+) */}
              <div className="hidden md:col-span-1 md:flex">
                <Badge variant={c.isActive ? "default" : "secondary"}>
                  <span
                    className={[
                      "mr-2 inline-block size-2 rounded-full",
                      c.isActive ? "bg-green-500" : "bg-gray-400",
                    ].join(" ")}
                  />
                  {c.isActive ? "Aktif" : "Pasif"}
                </Badge>
              </div>

              {/* İşlemler */}
              <div
                className="
                  mt-3 flex flex-wrap gap-2 md:mt-0
                  md:col-span-2 md:justify-self-end
                "
              >
                <Button variant="outline" size="sm" onClick={() => onEdit(c)}>
                  <Edit className="mr-1 h-4 w-4" />
                  Düzenle
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(c)}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  Sil
                </Button>
              </div>
            </div>
          ))}

          {campaigns.length === 0 && (
            <div className="px-4 py-6 text-sm text-muted-foreground">Kayıt bulunamadı.</div>
          )}
        </div>
      </div>

      {/* Dialog */}
      <CampaignDialog
        open={open}
        initialValue={editing}
        onOpenChange={setOpen}
        onSave={(payload) => {
          if (editing) {
            setCampaigns(
              campaigns.map((x) => (x.id === editing.id ? { ...editing, ...payload } : x)),
            );
            toast.success("Kampanya güncellendi");
          } else {
            setCampaigns([...campaigns, { id: Date.now().toString(), ...payload }]);
            toast.success("Yeni kampanya eklendi");
          }
        }}
      />
    </>
  );
};
