// =============================================================
// FILE: src/components/admin/AdminPanel/Tabs/SubCategoriesTab.tsx
// =============================================================
"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

import type { SubCategory } from "@/integrations/metahub/db/types/sub_categories.rows";
import type { Category } from "@/integrations/metahub/db/types/categories.rows";

import {
  useListCategoriesAdminQuery,
} from "@/integrations/metahub/rtk/endpoints/admin/categories_admin.endpoints";

import {
  useListSubCategoriesAdminQuery,
  useCreateSubCategoryAdminMutation,
  useUpdateSubCategoryAdminMutation,
  useDeleteSubCategoryAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/sub_categories_admin.endpoints";

import SubCategoryDialog, {
  type UiSubCategoryLite,
} from "@/components/admin/AdminPanel/Dialogs/SubCategoryDialog";

export const TabsSubCategories: React.FC = () => {
  // Kategoriler (select için)
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

  const [createSub, { isLoading: creating }] = useCreateSubCategoryAdminMutation();
  const [updateSub, { isLoading: updating }] = useUpdateSubCategoryAdminMutation();
  const [deleteSub, { isLoading: deleting }] = useDeleteSubCategoryAdminMutation();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SubCategory | null>(null);

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c] as const)),
    [categories]
  );

  const startCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const startEdit = (sc: SubCategory) => {
    setEditing(sc);
    setOpen(true);
  };

  const onDelete = async (sc: SubCategory) => {
    try {
      await deleteSub(sc.id).unwrap();
      toast.success("Alt kategori silindi");
    } catch (e: any) {
      const msg = e?.data?.error?.message || e?.error || "Silme işlemi başarısız";
      toast.error(msg);
    }
  };

  // Dialog props
  const catOptions = useMemo(
    () => categories.map((c) => ({ id: c.id, name: c.name })),
    [categories]
  );

  const existingSlugsByCat = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const sc of subCategories) {
      if (!map.has(sc.category_id)) map.set(sc.category_id, new Set());
      map.get(sc.category_id)!.add(sc.slug);
    }
    return map;
  }, [subCategories]);

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
                    <Button variant="outline" size="sm" onClick={() => startEdit(sc)}>
                      <Edit className="mr-1 h-4 w-4" />
                      Düzenle
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onDelete(sc)} disabled={deleting}>
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

      {/* Dialog (ayrı component) */}
      <SubCategoryDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setEditing(null);
        }}
        initialValue={
          editing
            ? {
                id: editing.id,
                category_id: editing.category_id,
                name: editing.name,
                slug: editing.slug,
              }
            : null
        }
        categories={catOptions}
        existingSlugsByCat={existingSlugsByCat}
        saving={creating || updating}
        onSave={async (payload: UiSubCategoryLite) => {
          try {
            if (payload.id) {
              await updateSub({
                id: payload.id,
                body: {
                  category_id: payload.category_id,
                  name: payload.name,
                  slug: payload.slug,
                },
              }).unwrap();
              toast.success("Alt kategori güncellendi");
            } else {
              await createSub({
                category_id: payload.category_id,
                name: payload.name,
                slug: payload.slug,
              }).unwrap();
              toast.success("Yeni alt kategori eklendi");
            }
          } catch (e: any) {
            const code = e?.data?.error?.message;
            if (code === "duplicate_slug_in_category") {
              toast.error("Bu slug bu kategori içinde zaten kullanılıyor");
            } else if (code === "invalid_category_id") {
              toast.error("Geçersiz kategori");
            } else if (code === "invalid_body") {
              toast.error("Form verisi geçersiz");
            } else {
              toast.error(e?.error || "Kayıt başarısız");
            }
          }
        }}
      />
    </>
  );
};
