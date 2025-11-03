// =============================================================
// FILE: src/components/admin/AdminPanel/Tabs/CategoriesTab.tsx
// =============================================================
"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  useListCategoriesAdminQuery,
  useCreateCategoryAdminMutation,
  useUpdateCategoryAdminMutation,
  useDeleteCategoryAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/categories_admin.endpoints";

import CategoryDialog, { UiCategoryLite } from "../Dialogs/CategoryDialog";

// UI iç tipi (DB değil)
type UiCategory = { id?: string; value: string; label: string };

const slugify = (v: string) =>
  v
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9ğüşöçı\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const TabsCategories: React.FC = () => {
  // Dialog state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UiCategory | null>(null);

  // RTK data
  const { data, isLoading, isFetching, refetch } = useListCategoriesAdminQuery({
    sort: "display_order",
    order: "asc",
    limit: 200,
  });

  const [createCategory, { isLoading: creating }] = useCreateCategoryAdminMutation();
  const [updateCategory, { isLoading: updating }] = useUpdateCategoryAdminMutation();
  const [deleteCategory, { isLoading: deleting }] = useDeleteCategoryAdminMutation();

  // DB -> UI map
  const uiCategories: UiCategory[] = useMemo(
    () => (data ?? []).map((c) => ({ id: c.id, value: c.slug, label: c.name })),
    [data]
  );

  const existingSlugs = useMemo(() => new Set(uiCategories.map((c) => c.value)), [uiCategories]);

  const startCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const startEdit = (cat: UiCategory) => {
    setEditing(cat);
    setOpen(true);
  };

  const onDelete = async (cat: UiCategory) => {
    if (!cat.id) return toast.error("Kategori ID bulunamadı.");
    try {
      await deleteCategory(cat.id).unwrap();
      toast.success("Kategori silindi");
      refetch();
    } catch (e) {
      toast.error("Kategori silinemedi");
      console.error(e);
    }
  };

  const handleSave = async (payload: UiCategoryLite) => {
    const label = payload.label.trim();
    let value = payload.value.trim();
    if (!label) return toast.error("Kategori adı (label) gerekli");
    if (!value) value = slugify(label);

    const slugTaken = existingSlugs.has(value) && (!editing || editing.value !== value);
    if (slugTaken) return toast.error("Bu slug zaten kullanılıyor");

    try {
      if (editing?.id) {
        await updateCategory({ id: editing.id, body: { name: label, slug: value } }).unwrap();
        toast.success("Kategori güncellendi");
      } else {
        await createCategory({ name: label, slug: value }).unwrap();
        toast.success("Yeni kategori eklendi");
      }
      setOpen(false);
      refetch();
    } catch (e) {
      toast.error("Kaydetme sırasında hata oluştu");
      console.error(e);
    }
  };

  // ---- UI ----
  return (
    <>
      {/* Başlık aksiyonları */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {isLoading ? "Yükleniyor..." : `Toplam ${uiCategories.length} kategori`}
          {isFetching && " (güncelleniyor...)"}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Yenile
          </Button>
          <Button size="sm" onClick={startCreate} disabled={creating || updating}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Kategori
          </Button>
        </div>
      </div>

      {/* Liste / tablo kabı */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* Tablo başlığı (md+) */}
        <div className="hidden grid-cols-12 items-center gap-4 border-b border-border bg-muted/50 px-4 py-3 text-[12px] uppercase tracking-wide text-muted-foreground md:grid">
          <div className="col-span-6">Kategori Adı</div>
          <div className="col-span-4">Slug</div>
          <div className="col-span-2 justify-self-end">İşlemler</div>
        </div>

        <div className="divide-y">
          {(uiCategories ?? []).map((c) => (
            <div
              key={c.id ?? c.value}
              className="group px-4 py-3 hover:bg-muted/30 md:grid md:grid-cols-12 md:items-center md:gap-4"
            >
              {/* Ad + mobil meta */}
              <div className="min-w-0 md:col-span-6">
                <p className="truncate font-medium">{c.label}</p>

                {/* Mobilde meta */}
                <div className="mt-2 grid grid-cols-2 gap-y-2 text-sm md:hidden">
                  <span className="text-muted-foreground">Slug</span>
                  <span className="text-foreground/80">
                    <Badge variant="secondary">{c.value}</Badge>
                  </span>
                </div>
              </div>

              {/* Slug (md+) */}
              <div className="hidden text-sm text-foreground/80 md:col-span-4 md:block">
                <Badge variant="secondary">{c.value}</Badge>
              </div>

              {/* İşlemler */}
              <div className="mt-3 flex flex-wrap gap-2 md:col-span-2 md:mt-0 md:justify-self-end">
                <Button variant="outline" size="sm" onClick={() => startEdit(c)} disabled={updating}>
                  <Edit className="mr-1 h-4 w-4" />
                  Düzenle
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(c)} disabled={deleting}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  Sil
                </Button>
              </div>
            </div>
          ))}

          {!isLoading && (uiCategories?.length ?? 0) === 0 && (
            <div className="px-4 py-6 text-sm text-muted-foreground">Kayıt bulunamadı.</div>
          )}

          {isLoading && <div className="px-4 py-6 text-sm text-muted-foreground">Yükleniyor…</div>}
        </div>
      </div>

      {/* Category Dialog (ayrı dosya) */}
      <CategoryDialog
        open={open}
        onOpenChange={setOpen}
        initialValue={editing ? { label: editing.label, value: editing.value } : null}
        onSave={handleSave}
        saving={creating || updating}
        existingSlugs={existingSlugs}
      />
    </>
  );
};
