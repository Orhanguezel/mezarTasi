// =============================================================
// FILE: src/components/admin/AdminPanel/Tabs/PagesTab.tsx
// =============================================================
"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

import type { CustomPageView } from "@/integrations/metahub/db/types/content";
import {
  useListCustomPagesAdminQuery,
  useDeleteCustomPageAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/custom_pages_admin.endpoints";
import PageDialog from "@/components/admin/AdminPanel/Dialogs/PageDialog";

// helpers
const stripHtml = (s: string) => s.replace(/<[^>]*>/g, "");

export const TabsPages: React.FC = () => {
  // RTK data
  const {
    data: pages = [],
    isLoading,
    isFetching,
    refetch,
  } = useListCustomPagesAdminQuery(undefined, { refetchOnMountOrArgChange: true });

  const [deletePage, { isLoading: deleting }] = useDeleteCustomPageAdminMutation();

  // UI state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CustomPageView | null>(null);

  const list = useMemo(() => pages, [pages]);

  const existingSlugs = useMemo(() => {
    const set = new Set<string>();
    for (const p of list) if (p.slug) set.add(p.slug);
    return set;
  }, [list]);

  const startCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const startEdit = (p: CustomPageView) => {
    setEditing(p);
    setOpen(true);
  };

  const onDelete = async (id: string) => {
    try {
      await deletePage(id).unwrap();
      toast.success("Sayfa silindi");
      refetch();
    } catch (e: any) {
      toast.error(e?.data?.error?.message || e?.error || "Silme başarısız");
    }
  };

  return (
    <>
      {/* Başlık aksiyonları */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {isLoading ? "Yükleniyor..." : `Toplam ${list.length} sayfa`}
          {isFetching && " (güncelleniyor...)"}
        </div>
        <Button size="sm" onClick={startCreate}>
          <Plus className="mr-2 h-4 w-4" /> Yeni Sayfa
        </Button>
      </div>

      {/* Liste */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-12 items-center gap-4 border-b border-border bg-muted/50 px-4 py-3 text-[12px] uppercase tracking-wide text-muted-foreground">
          <div className="col-span-6 sm:col-span-6">Başlık</div>
          <div className="hidden sm:block sm:col-span-3">Slug</div>
          <div className="hidden sm:block sm:col-span-1">Durum</div>
          <div className="col-span-6 sm:col-span-2 justify-self-end">İşlemler</div>
        </div>

        <div className="divide-y">
          {(isLoading || isFetching) && (
            <div className="px-4 py-6 text-sm text-muted-foreground">Yükleniyor…</div>
          )}

          {!isLoading &&
            list.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-12 items-center gap-4 px-4 py-3 hover:bg-muted/30"
              >
                <div className="col-span-12 min-w-0 sm:col-span-6">
                  <p className="truncate font-medium">{p.title}</p>
                  <p className="line-clamp-1 text-sm text-muted-foreground">
                    {stripHtml(p.content).slice(0, 140)}
                  </p>
                </div>

                <div className="hidden sm:block sm:col-span-3 text-sm text-foreground/80">
                  /{p.slug}
                </div>

                <div className="hidden sm:flex sm:col-span-1">
                  <Badge variant={p.is_published ? "default" : "secondary"}>
                    <span
                      className={`mr-2 inline-block size-2 rounded-full ${
                        p.is_published ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    {p.is_published ? "Aktif" : "Pasif"}
                  </Badge>
                </div>

                <div className="col-span-12 flex justify-end gap-2 sm:col-span-2">
                  <Button variant="outline" size="sm" onClick={() => startEdit(p)}>
                    <Edit className="mr-1 h-4 w-4" /> Düzenle
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(p.id)}
                    disabled={deleting}
                  >
                    <Trash2 className="mr-1 h-4 w-4" /> Sil
                  </Button>
                </div>
              </div>
            ))}

          {!isLoading && list.length === 0 && (
            <div className="px-4 py-6 text-sm text-muted-foreground">Kayıt bulunamadı.</div>
          )}
        </div>
      </div>

      {/* Dialog (CRUD dialog içinde) */}
      <PageDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setEditing(null);
        }}
        initialValue={editing}
        existingSlugs={existingSlugs}
        onDone={() => {
          // create/update/delete sonrası listeyi güncelle
          setEditing(null);
          setOpen(false);
          refetch();
        }}
      />
    </>
  );
};
