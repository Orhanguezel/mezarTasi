// src/components/admin/AdminPanel/Tabs/TabsProducts.tsx

"use client";

import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Image, Edit, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  useAdminListProductsQuery,
  useAdminDeleteProductMutation,
  useAdminListCategoriesQuery,
} from "@/integrations/metahub/rtk/endpoints/admin/products_admin.endpoints";

export const TabsProducts: React.FC = () => {
  const nav = useNavigate();

  const { data: products, isFetching, isError, error } = useAdminListProductsQuery(undefined);
  const [deleteProduct, { isLoading: deleting }] = useAdminDeleteProductMutation();

  const { data: cats } = useAdminListCategoriesQuery();
  const { catNameById, subCatNameById } = useMemo(() => {
    const cMap = new Map<string, string>();
    const sMap = new Map<string, string>();
    (cats as any[] | undefined)?.forEach((c: any) => {
      if (c?.id && c?.name) cMap.set(String(c.id), String(c.name));
      const subs = Array.isArray(c?.sub_categories) ? c.sub_categories : [];
      subs.forEach((s: any) => {
        if (s?.id && s?.name) sMap.set(String(s.id), String(s.name));
      });
    });
    return { catNameById: cMap, subCatNameById: sMap };
  }, [cats]);

  const rows = useMemo(() => Array.isArray(products) ? products : [], [products]);

  const onCreate = () => nav("/admin/products/new");
  const onEdit = (row: any) => {
    // state ile ilk değerleri taşıyıp anında boyamak istersen:
    const images = Array.isArray(row.images) && row.images.length ? row.images
      : (row.image_url ? [row.image_url] : []);
    nav(`/admin/products/${row.id}`, {
      state: {
        initialValue: {
          id: row.id,
          title: String(row.title ?? ""),
          price: String(row.price ?? ""),
          description: row.description ?? "",
          category: String(row.category_id ?? ""),
          subCategory: String(row.sub_category_id ?? ""),
          image: images[0] ?? "",
          images,
          status: row.is_active ? "Active" : "Inactive",
          specifications: row.specifications ?? undefined,
        },
      },
    });
  };

  const onDelete = async (id: string) => {
    try {
      await deleteProduct(id).unwrap();
      toast.success("Ürün silindi");
    } catch (e: any) {
      toast.error(e?.data?.error?.message ?? "Silme başarısız");
    }
  };

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button size="sm" onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Ürün
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-12 items-center gap-4 border-b border-border bg-muted/50 px-4 py-3 text-[12px] uppercase tracking-wide text-muted-foreground">
          <div className="col-span-5 sm:col-span-4">Başlık</div>
          <div className="col-span-3 sm:col-span-2">Kategori</div>
          <div className="col-span-3 sm:col-span-2">Alt Kategori</div>
          <div className="hidden sm:block sm:col-span-2">Durum</div>
          <div className="col-span-4 sm:col-span-2 justify-self-end">İşlemler</div>
        </div>

        <div className="divide-y">
          {isFetching && <div className="px-4 py-6 text-sm text-muted-foreground">Yükleniyor…</div>}

          {isError && (
            <div className="px-4 py-6 text-sm text-red-600">
              Liste alınamadı. {String((error as any)?.data?.error?.message ?? "")}
            </div>
          )}

          {!isFetching && !isError && rows.map((product) => {
            const imgArr = Array.isArray(product.images) && product.images?.length
              ? product.images
              : (product.image_url ? [product.image_url] : []);
            const firstImg = imgArr[0];

            return (
              <div key={String(product.id)} className="grid grid-cols-12 items-center gap-4 px-4 py-3 hover:bg-muted/30">
                <div className="col-span-12 sm:col-span-4">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {imgArr.length ? (
                        <>
                          <div className="size-10 overflow-hidden rounded-lg bg-muted">
                            <img
                              src={firstImg}
                              alt={product.title}
                              className="h-full w-full object-cover"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                            />
                          </div>
                          {imgArr.length > 1 && (
                            <div className="-space-x-1 hidden sm:flex">
                              {imgArr.slice(1, 3).map((img, idx) => (
                                <div key={idx} className="size-6 overflow-hidden rounded border-2 border-card bg-muted">
                                  <img src={img} alt="" className="h-full w-full object-cover" />
                                </div>
                              ))}
                              {imgArr.length > 3 && (
                                <div className="flex size-6 items-center justify-center rounded border-2 border-card bg-foreground/60 text-[10px] text-background">
                                  +{imgArr.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                          <Image className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-medium">{product.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {typeof product.price === "number" ? product.price.toFixed(2) : String(product.price ?? "")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-span-6 text-sm text-foreground/80 sm:col-span-2">
                  {product.category_id ? (catNameById.get(String(product.category_id)) ?? String(product.category_id)) : "-"}
                </div>
                <div className="col-span-6 text-sm text-foreground/80 sm:col-span-2">
                  {product.sub_category_id ? (
                    <Badge variant="secondary" title={product.sub_category_id}>
                      {subCatNameById.get(String(product.sub_category_id)) ?? `${String(product.sub_category_id).slice(0, 8)}…`}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>

                <div className="hidden sm:col-span-2 sm:flex">
                  <Badge variant={product.is_active ? "default" : "secondary"}>
                    <span className={`mr-2 inline-block size-2 rounded-full ${product.is_active ? "bg-green-500" : "bg-gray-400"}`} />
                    {product.is_active ? "Aktif" : "Pasif"}
                  </Badge>
                </div>

                <div className="col-span-12 flex justify-end gap-2 sm:col-span-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(product)}>
                    <Edit className="mr-1 h-4 w-4" />
                    Düzenle
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onDelete(product.id)} disabled={deleting}>
                    <Trash2 className="mr-1 h-4 w-4" />
                    Sil
                  </Button>
                </div>
              </div>
            );
          })}

          {!isFetching && !isError && rows.length === 0 && (
            <div className="px-4 py-6 text-sm text-muted-foreground">Kayıt bulunamadı.</div>
          )}
        </div>
      </div>
    </>
  );
};
