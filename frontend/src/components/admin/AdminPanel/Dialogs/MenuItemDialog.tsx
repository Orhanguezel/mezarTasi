// =============================================================
// FILE: src/components/admin/AdminPanel/Dialogs/MenuItemDialog.tsx
// =============================================================
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import {
  useListMenuItemsAdminQuery,
  useCreateMenuItemAdminMutation,
  useUpdateMenuItemAdminMutation,
  useDeleteMenuItemAdminMutation,
  type UpsertMenuItemBody,
} from "@/integrations/metahub/rtk/endpoints/admin/menu_admin.endpoints";
import type { MenuItemAdmin } from "@/integrations/metahub/db/types/menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** düzenleme için mevcut kayıt; null ise create */
  initialValue: MenuItemAdmin | null;
  /** başarı sonrası üst listeyi yenilemek için */
  onDone?: () => void;
};

const emptyForm: UpsertMenuItemBody = {
  title: "",
  url: "/",
  type: "custom",
  location: "header",
  page_id: null,
  parent_id: null,
  icon: null,
  section_id: null,
  is_active: true,
  display_order: 0,
};

export default function MenuItemDialog({ open, onOpenChange, initialValue, onDone }: Props) {
  // Mevcut öğeleri çek (parent seçimi + default order için kullanılacak)
  const { data: list = [] } = useListMenuItemsAdminQuery(undefined, {
    skip: !open, // diyalog açıldığında yükle
  });

  const [createItem, { isLoading: creating }] = useCreateMenuItemAdminMutation();
  const [updateItem, { isLoading: updating }] = useUpdateMenuItemAdminMutation();
  const [deleteItem, { isLoading: deleting }] = useDeleteMenuItemAdminMutation();

  const busy = creating || updating || deleting;

  const [form, setForm] = useState<UpsertMenuItemBody>({ ...emptyForm });

  // Varsayılan display_order: listedeki en büyük + 1
  const nextOrder = useMemo(() => {
    if (!list.length) return 0;
    const max = Math.max(...list.map((m) => m.display_order ?? 0));
    return Number.isFinite(max) ? max + 1 : 0;
  }, [list]);

  // initialValue değiştiğinde veya diyalog açıldığında formu doldur
  useEffect(() => {
    if (!open) return;
    if (initialValue) {
      setForm({
        title: initialValue.title ?? "",
        url: initialValue.url ?? "/",
        type: initialValue.type ?? "custom",
        location: initialValue.location ?? "header",
        page_id: initialValue.page_id ?? null,
        parent_id: initialValue.parent_id ?? null,
        icon: initialValue.icon ?? null,
        section_id: initialValue.section_id ?? null,
        is_active: !!initialValue.is_active,
        display_order: initialValue.display_order ?? 0,
      });
    } else {
      setForm({ ...emptyForm, display_order: nextOrder });
    }
  }, [initialValue, open, nextOrder]);

  const handleSave = async () => {
    if (!form.title.trim() || !form.url.trim()) {
      toast.error("Başlık ve URL zorunlu");
      return;
    }
    try {
      if (initialValue) {
        await updateItem({ id: initialValue.id, body: form }).unwrap();
        toast.success("Menü öğesi güncellendi");
      } else {
        await createItem(form).unwrap();
        toast.success("Yeni menü öğesi eklendi");
      }
      onDone?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.data?.error?.message || e?.error || "Kaydetme başarısız");
    }
  };

  const handleDelete = async () => {
    if (!initialValue) return;
    if (!confirm("Bu menü öğesini silmek istediğinizden emin misiniz?")) return;
    try {
      await deleteItem(initialValue.id).unwrap();
      toast.success("Menü öğesi silindi");
      onDone?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.data?.error?.message || e?.error || "Silme başarısız");
    }
  };

  // Parent seçenekleri (kendini hariç tut)
  const parentOptions = useMemo(
    () => list.filter((m) => (initialValue ? m.id !== initialValue.id : true)),
    [list, initialValue]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          w-[min(92vw,38rem)] max-w-xl p-0 overflow-hidden
          rounded-2xl border border-gray-200 bg-white shadow-2xl
        "
      >
        <DialogHeader className="sticky top-0 z-10 bg-white px-5 py-4">
          <DialogTitle className="text-base sm:text-lg">
            {initialValue ? "Menü Öğesi Düzenle" : "Yeni Menü Öğesi"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Başlık, URL, konum ve üst menüyü belirleyin. Sıralama alanı, menüdeki görünüm sırasını etkiler.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70dvh] overflow-y-auto bg-white px-5 pb-4 pt-2 sm:pb-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Başlık *</label>
              <Input
                className="mt-1 bg-white"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Örn: Hakkımızda"
              />
            </div>

            <div>
              <label className="text-sm font-medium">URL *</label>
              <Input
                className="mt-1 bg-white"
                value={form.url}
                onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                placeholder="/hakkimizda"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Konum</label>
                <Select
                  value={form.location}
                  onValueChange={(v) => setForm((p) => ({ ...p, location: v as "header" | "footer" }))}
                >
                  <SelectTrigger className="mt-1 bg-white">
                    <SelectValue placeholder="Konum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="header">Header</SelectItem>
                    <SelectItem value="footer">Footer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Üst Menü</label>
                <Select
                  value={form.parent_id ?? "root"}
                  onValueChange={(v) => setForm((p) => ({ ...p, parent_id: v === "root" ? null : v }))}
                >
                  <SelectTrigger className="mt-1 bg-white">
                    <SelectValue placeholder="Üst seviye" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="root">— Üst seviye —</SelectItem>
                    {parentOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Sıra</label>
                <Input
                  type="number"
                  className="mt-1 bg-white"
                  value={form.display_order ?? 0}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      display_order: Math.max(0, Number(e.target.value) || 0),
                    }))
                  }
                />
              </div>

              <div className="flex items-end gap-3">
                <Switch
                  checked={!!form.is_active}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
                />
                <span className="text-sm text-muted-foreground">Aktif</span>
              </div>
            </div>

            {/* Sticky actions */}
            <div className="sticky bottom-0 z-10 mt-6 flex gap-2 bg-white pb-1 pt-3 border-t border-gray-200">
              {initialValue && (
                <Button type="button" variant="destructive" onClick={handleDelete} disabled={busy}>
                  Sil
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="ml-auto"
                onClick={() => onOpenChange(false)}
                disabled={busy}
              >
                İptal
              </Button>
              <Button
                type="button"
                className="bg-teal-600 hover:bg-teal-700"
                onClick={handleSave}
                disabled={busy || !form.title.trim() || !form.url.trim()}
              >
                {initialValue ? "Güncelle" : "Ekle"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
