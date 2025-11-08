"use client";

import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

import type { Category } from "@/integrations/metahub/db/types/categories.rows";

import { useListCategoriesAdminQuery } from "@/integrations/metahub/rtk/endpoints/admin/categories_admin.endpoints";

import {
  useListSubCategoriesAdminQuery,
  useDeleteSubCategoryAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/sub_categories_admin.endpoints";

export const TabsSubCategories: React.FC = () => {
  const navigate = useNavigate();

  // Kategoriler (select name gösterimi için)
  const { data: categories = [], isLoading: catLoading } = useListCategoriesAdminQuery(
    { sort: "name", order: "asc", limit: 200 },
    { refetchOnMountOrArgChange: true }
  );

  // Alt kategoriler
  const {
    data: subCategories = [],
    isLoading,
    isFetching,
  } = useListSubCategoriesAdminQuery(
    { sort: "display_order", order: "asc", limit: 200 },
    { refetchOnMountOrArgChange: true }
  );

  const [deleteSub, { isLoading: deleting }] = useDeleteSubCategoryAdminMutation();

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c] as const)),
    [categories]
  );

  const startCreate = () => {
    navigate("/admin/subcategories/new");
  };

  const startEdit = (id: string) => {
    const sc = subCategories.find((x) => x.id === id);
    navigate(`/admin/subcategories/${id}`, {
      state: sc
        ? {
            initialValue: {
              id: sc.id,
              category_id: sc.category_id,
              name: sc.name,
              slug: sc.slug,
              description: sc.description ?? "",
              image_url: sc.image_url ?? null,
            },
          }
        : undefined,
    });
  };

  const onDelete = async (id: string) => {
    try {
      await deleteSub(id).unwrap();
      toast.success("Alt kategori silindi");
    } catch (e: any) {
      const msg = e?.data?.error?.message || e?.error || "Silme işlemi başarısız";
      toast.error(msg);
    }
  };

  return (
    <>
      {/* Başlık aksiyonları */}
      <div className="mb-3 flex justify-end">
        <Button size="sm" onClick={startCreate} disabled={isLoading || isFetching || catLoading}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Alt Kategori
        </Button>
      </div>

      {/* Liste */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* Head (md+) */}
        <div className="hidden grid-cols-12 items-center gap-4 border-b border-border bg-muted/50 px-4 py-3 text-[12px] uppercase tracking-wide text-muted-foreground md:grid">
          <div className="col-span-4">Alt Kategori</div>
          <div className="col-span-4">Üst Kategori</div>
          <div className="col-span-2">Slug</div>
          <div className="col-span-2 justify-self-end">İşlemler</div>
        </div>

        <div className="divide-y">
          {(isLoading || isFetching) && (
            <div className="px-4 py-6 text-sm text-muted-foreground">Yükleniyor…</div>
          )}

          {!isLoading &&
            subCategories.map((sc) => {
              const cat = categoryById.get(sc.category_id) as Category | undefined;
              return (
                <div
                  key={sc.id}
                  className="group px-4 py-3 hover:bg-muted/30 md:grid md:grid-cols-12 md:items-center md:gap-4"
                >
                  <div className="min-w-0 md:col-span-4">
                    <p className="truncate font-medium">{sc.name}</p>
                    {/* Mobil META */}
                    <div className="mt-2 grid grid-cols-2 gap-y-2 text-sm md:hidden">
                      <span className="text-muted-foreground">Kategori</span>
                      <span className="text-foreground/80">
                        <Badge variant="secondary">{cat?.name ?? "—"}</Badge>
                      </span>
                      <span className="text-muted-foreground">Slug</span>
                      <span className="text-foreground/80">
                        <Badge variant="secondary">{sc.slug}</Badge>
                      </span>
                    </div>
                  </div>

                  <div className="hidden text-sm text-foreground/80 md:col-span-4 md:block">
                    <Badge variant="secondary">{cat?.name ?? "—"}</Badge>
                  </div>

                  <div className="hidden text-sm text-foreground/80 md:col-span-2 md:block">
                    <Badge variant="secondary">{sc.slug}</Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 md:col-span-2 md:mt-0 md:justify-self-end">
                    <Button variant="outline" size="sm" onClick={() => startEdit(sc.id)}>
                      <Edit className="mr-1 h-4 w-4" />
                      Düzenle
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onDelete(sc.id)} disabled={deleting}>
                      <Trash2 className="mr-1 h-4 w-4" />
                      Sil
                    </Button>
                  </div>
                </div>
              );
            })}

          {!isLoading && subCategories.length === 0 && (
            <div className="px-4 py-6 text-sm text-muted-foreground">Kayıt bulunamadı.</div>
          )}
        </div>
      </div>
    </>
  );
};
