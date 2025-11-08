"use client";

import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  useListCategoriesAdminQuery,
  useDeleteCategoryAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/categories_admin.endpoints";

type UiCategory = { id?: string; value: string; label: string };

export const TabsCategories: React.FC = () => {
  const nav = useNavigate();

  const { data, isLoading, isFetching, refetch } = useListCategoriesAdminQuery({
    sort: "display_order",
    order: "asc",
    limit: 200,
  });

  const [deleteCategory, { isLoading: deleting }] = useDeleteCategoryAdminMutation();

  const uiCategories: UiCategory[] = useMemo(
    () => (data ?? []).map((c) => ({ id: c.id, value: c.slug, label: c.name })),
    [data]
  );

  const onCreate = () => nav("/admin/categories/new");

  const onEdit = (row: UiCategory) => {
    if (!row.id) return;
    // Ürün paternindeki gibi initial state ile hızlı boyama
    nav(`/admin/categories/${row.id}`, {
      state: {
        initialValue: {
          id: row.id,
          name: row.label,
          slug: row.value,
        },
      },
    });
  };

  const onDelete = async (row: UiCategory) => {
    if (!row.id) return toast.error("Kategori ID bulunamadı.");
    try {
      await deleteCategory(row.id).unwrap();
      toast.success("Kategori silindi");
      refetch();
    } catch (e) {
      toast.error("Kategori silinemedi");
      console.error(e);
    }
  };

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {isLoading ? "Yükleniyor..." : `Toplam ${uiCategories.length} kategori`}
          {isFetching && " (güncelleniyor...)"}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Yenile
          </Button>
          <Button size="sm" onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Kategori
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
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
              <div className="min-w-0 md:col-span-6">
                <p className="truncate font-medium">{c.label}</p>
                <div className="mt-2 grid grid-cols-2 gap-y-2 text-sm md:hidden">
                  <span className="text-muted-foreground">Slug</span>
                  <span className="text-foreground/80">
                    <Badge variant="secondary">{c.value}</Badge>
                  </span>
                </div>
              </div>

              <div className="hidden text-sm text-foreground/80 md:col-span-4 md:block">
                <Badge variant="secondary">{c.value}</Badge>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 md:col-span-2 md:mt-0 md:justify-self-end">
                <Button variant="outline" size="sm" onClick={() => onEdit(c)}>
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
    </>
  );
};
