"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  useListPopupsAdminQuery,
  useDeletePopupAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/popups_admin.endpoints";
import type { PopupAdminView } from "@/integrations/metahub/db/types/popup";

import PopupDialog from "@/components/admin/AdminPanel/Dialogs/PopupDialog";

export default function TabsPopups() {
  const { data, isLoading, isFetching, refetch } = useListPopupsAdminQuery();
  const [remove, { isLoading: deleting }] = useDeletePopupAdminMutation();

  const popups = useMemo<PopupAdminView[]>(() => data ?? [], [data]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PopupAdminView | null>(null);

  const busy = isLoading || isFetching;

  const onAdd = () => {
    setEditing(null);
    setOpen(true);
  };

  const onEdit = (p: PopupAdminView) => {
    setEditing(p);
    setOpen(true);
  };

  const onDelete = async (id: string) => {
    if (!confirm("Bu popup'ı silmek istiyor musunuz?")) return;
    try {
      await remove(id).unwrap();
      toast.success("Popup silindi");
    } catch (e: any) {
      toast.error(e?.data?.error?.message || e?.error || "Silme başarısız");
    }
  };

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Toplam: {popups.length}</h3>
        <Button size="sm" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" /> Yeni Popup
        </Button>
      </div>

      <Card className="border border-gray-200 shadow-none">
        <CardHeader className="border-b border-gray-200 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg">Popuplar</CardTitle>
            <div className="text-xs text-muted-foreground">
              {busy ? "Yükleniyor…" : "Hazır"}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden rounded-lg">
            <div className="grid grid-cols-12 items-center gap-4 border-b border-border bg-muted/50 px-4 py-3 text-[12px] uppercase tracking-wide text-muted-foreground">
              <div className="col-span-6 sm:col-span-5">Başlık</div>
              <div className="hidden sm:block sm:col-span-3">Tarih</div>
              <div className="hidden sm:block sm:col-span-2">Durum</div>
              <div className="col-span-6 sm:col-span-2 justify-self-end">İşlemler</div>
            </div>

            <div className="divide-y">
              {popups.map((p) => (
                <div key={p.id} className="grid grid-cols-12 items-center gap-4 px-4 py-3 hover:bg-muted/30">
                  <div className="col-span-12 min-w-0 sm:col-span-5">
                    <p className="truncate font-medium">{p.title}</p>
                    <p className="line-clamp-1 text-sm text-muted-foreground">{p.content}</p>
                  </div>

                  <div className="hidden sm:block sm:col-span-3 text-sm text-foreground/80">
                    {(p.start_date ? new Date(p.start_date).toLocaleDateString() : "–")} – {(p.end_date ? new Date(p.end_date).toLocaleDateString() : "–")}
                  </div>

                  <div className="hidden sm:flex sm:col-span-2">
                    <Badge variant={p.is_active ? "default" : "secondary"}>
                      <span className={`mr-2 inline-block size-2 rounded-full ${p.is_active ? "bg-green-500" : "bg-gray-400"}`} />
                      {p.is_active ? "Aktif" : "Pasif"}
                    </Badge>
                  </div>

                  <div className="col-span-12 flex justify-end gap-2 sm:col-span-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(p)}>
                      <Edit className="mr-1 h-4 w-4" /> Düzenle
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deleting}
                      onClick={() => onDelete(p.id)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" /> Sil
                    </Button>
                  </div>
                </div>
              ))}
              {!popups.length && (
                <div className="px-4 py-6 text-sm text-muted-foreground">
                  Kayıt bulunamadı.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <PopupDialog
        open={open}
        onOpenChange={setOpen}
        initialValue={editing}
        onDone={() => {
          // optimistic update zaten endpointlerde var; yine de tazelemek istersen:
          refetch();
        }}
      />
    </>
  );
}
