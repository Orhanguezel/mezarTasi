// =============================================================
// FILE: src/components/admin/AdminPanel/Tabs/MenuTab.tsx
// =============================================================
"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

import type { MenuItemAdmin } from "@/integrations/metahub/db/types/menu";
import {
  useListMenuItemsAdminQuery,
  useDeleteMenuItemAdminMutation,
  useReorderMenuItemsAdminMutation,
  useUpdateMenuItemAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/menu_admin.endpoints";

import MenuItemDialog from "../Dialogs/MenuItemDialog";

export const TabsMenu: React.FC = () => {
  // Liste
  const {
    data: list = [] as MenuItemAdmin[],
    isLoading,
    isFetching,
    refetch,
  } = useListMenuItemsAdminQuery(undefined, { refetchOnMountOrArgChange: true });

  // Mutations
  const [deleteItem, { isLoading: deleting }] = useDeleteMenuItemAdminMutation();
  const [reorderItems, { isLoading: reordering }] = useReorderMenuItemsAdminMutation();
  const [updateItem, { isLoading: updating }] = useUpdateMenuItemAdminMutation();

  const busy = deleting || reordering || updating;

  // UI state (diyalog)
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItemAdmin | null>(null);

  // sıra -> ascending
  const sorted: MenuItemAdmin[] = useMemo(
    () => [...list].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
    [list]
  );

  const startCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const startEdit = (item: MenuItemAdmin) => {
    setEditing(item);
    setOpen(true);
  };

  const onDelete = async (id: string) => {
    if (!confirm("Bu menü öğesini silmek istediğinizden emin misiniz?")) return;
    try {
      await deleteItem(id).unwrap();
      toast.success("Menü öğesi silindi");
    } catch (e: any) {
      toast.error(e?.data?.error?.message || e?.error || "Silme başarısız");
    }
  };

  // tek adımlık swap reorder (guards ile: a/b undefined değil)
  const move = async (idx: number, dir: -1 | 1) => {
    const ni = idx + dir;
    if (ni < 0 || ni >= sorted.length) return;

    const a = sorted[idx];
    const b = sorted[ni];
    if (!a || !b) return;

    try {
      await reorderItems([
        { id: a.id, display_order: b.display_order ?? 0 },
        { id: b.id, display_order: a.display_order ?? 0 },
      ]).unwrap();
    } catch (e: any) {
      toast.error(e?.data?.error?.message || e?.error || "Sıralama başarısız");
    }
  };

  const toggleActive = async (item: MenuItemAdmin) => {
    try {
      await updateItem({
        id: item.id,
        body: {
          title: item.title,
          url: item.url ?? "",
          type: item.type ?? "custom",
          location: item.location ?? "header",
          is_active: !item.is_active,
          display_order: item.display_order ?? 0,
          page_id: item.page_id ?? null,
          parent_id: item.parent_id ?? null,
          icon: item.icon ?? null,
          section_id: item.section_id ?? null,
        },
      }).unwrap();
    } catch (e: any) {
      toast.error(e?.data?.error?.message || e?.error || "Durum güncellenemedi");
    }
  };

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {isLoading ? "Yükleniyor..." : `Toplam ${sorted.length} öğe`}
          {isFetching && " (güncelleniyor…)"}
        </div>
        <Button size="sm" onClick={startCreate} disabled={busy}>
          <Plus className="mr-2 h-4 w-4" /> Yeni Menü Öğesi
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-12 items-center gap-4 border-b border-border bg-muted/50 px-4 py-3 text-[12px] uppercase tracking-wide text-muted-foreground">
          <div className="col-span-6 sm:col-span-5">Başlık</div>
          <div className="hidden sm:block sm:col-span-3">URL</div>
          <div className="hidden sm:block sm:col-span-1">Sıra</div>
          <div className="hidden sm:block sm:col-span-1">Durum</div>
          <div className="col-span-6 sm:col-span-2 justify-self-end">İşlemler</div>
        </div>

        <div className="divide-y">
          {(isLoading || isFetching) && (
            <div className="px-4 py-6 text-sm text-muted-foreground">Yükleniyor…</div>
          )}

          {!isLoading &&
            sorted.map((m, i) => (
              <div key={m.id} className="grid grid-cols-12 items-center gap-4 px-4 py-3 hover:bg-muted/30">
                <div className="col-span-12 min-w-0 sm:col-span-5">
                  <p className="truncate font-medium">{m.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-1">{m.url}</p>
                </div>

                <div className="hidden sm:block sm:col-span-3 text-sm text-foreground/80">
                  {m.url}
                </div>

                <div className="hidden sm:block sm:col-span-1 text-sm">
                  {m.display_order ?? 0}
                </div>

                <div className="hidden sm:flex sm:col-span-1">
                  <Badge
                    onClick={() => toggleActive(m)}
                    className="cursor-pointer"
                    variant={m.is_active ? "default" : "secondary"}
                  >
                    <span
                      className={`mr-2 inline-block size-2 rounded-full ${
                        m.is_active ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    {m.is_active ? "Aktif" : "Pasif"}
                  </Badge>
                </div>

                <div className="col-span-12 flex justify-end gap-2 sm:col-span-2">
                  <Button variant="outline" size="icon" onClick={() => move(i, -1)} disabled={busy || i === 0}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => move(i, +1)}
                    disabled={busy || i === sorted.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => startEdit(m)} disabled={busy}>
                    <Edit className="mr-1 h-4 w-4" /> Düzenle
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onDelete(m.id)} disabled={busy}>
                    <Trash2 className="mr-1 h-4 w-4" /> Sil
                  </Button>
                </div>
              </div>
            ))}

          {!isLoading && !sorted.length && (
            <div className="px-4 py-6 text-sm text-muted-foreground">Kayıt bulunamadı.</div>
          )}
        </div>
      </div>

      {/* ✨ Ayrı diyalog bileşeni */}
      <MenuItemDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setEditing(null);
        }}
        initialValue={editing}
        onDone={() => refetch()}
      />
    </>
  );
};
