// =============================================================
// FILE: src/components/admin/AdminPanel/Tabs/TabsProducts.tsx
// =============================================================
"use client";

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useAdminListProductsQuery,
  useAdminDeleteProductMutation,
  useAdminToggleActiveMutation,
  useAdminToggleHomepageMutation,
  useAdminBulkSetActiveMutation,
  useAdminListCategoriesQuery,
  useAdminListSubcategoriesQuery,
  type AdminProductListParams,
} from "@/integrations/rtk/endpoints/admin/products_admin.endpoints";
import { cn } from "@/components/ui/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Search, Trash2, Pencil, Home } from "lucide-react";

/** Durum filtresi */
type StatusFilter = "all" | "active" | "inactive";

/** Stabil state: seçimsiz alanlar null */
type Filters = {
  q: string;
  status: StatusFilter; // <-- tri-state
  category_id: string | null;
  sub_category_id: string | null;
  limit: number;
  offset: number;
  sort: "price" | "rating" | "created_at" | "title" | "review_count";
  order: "asc" | "desc";
};

const DEFAULT_LIMIT = 20;
const as01 = (b: boolean) => (b ? 1 : 0);

export function TabsProducts() {
  const navigate = useNavigate();

  const [filters, setFilters] = React.useState<Filters>({
    q: "",
    status: "all",
    category_id: null,
    sub_category_id: null,
    limit: DEFAULT_LIMIT,
    offset: 0,
    sort: "created_at",
    order: "desc",
  });

  // API param haritalama: "all" ise is_active göndermiyoruz
  const apiParams = React.useMemo<AdminProductListParams>(() => {
    const p: AdminProductListParams = {
      limit: filters.limit,
      offset: filters.offset,
      sort: filters.sort,
      order: filters.order,
    };
    if (filters.q) p.q = filters.q;
    if (filters.category_id) p.category_id = filters.category_id;
    if (filters.sub_category_id) p.sub_category_id = filters.sub_category_id;
    if (filters.status === "active") p.is_active = 1;
    if (filters.status === "inactive") p.is_active = 0;
    return p;
  }, [filters]);

  const { data: categories } = useAdminListCategoriesQuery();
  const { data: subcats } = useAdminListSubcategoriesQuery(
    filters.category_id ? { category_id: filters.category_id } : undefined
  );

  const { data: rows, isFetching, refetch } = useAdminListProductsQuery(apiParams);
  const [del] = useAdminDeleteProductMutation();
  const [toggleActive] = useAdminToggleActiveMutation();
  const [toggleHomepage] = useAdminToggleHomepageMutation();
  const [bulkActive] = useAdminBulkSetActiveMutation();

  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const items = rows ?? [];
  const selectedIds = Object.entries(selected).filter(([, v]) => !!v).map(([k]) => k);

  // ---- Optimistic local patch (yalnızca is_active / is_featured) ----
  const [pending, setPending] = React.useState<
    Record<string, Partial<{ is_active: boolean; is_featured: boolean }>>
  >({});

  const viewActive = (id: string, fallback: boolean | 0 | 1) =>
    (pending[id]?.is_active ?? !!fallback) as boolean;

  const viewFeatured = (id: string, fallback: boolean | 0 | 1) =>
    (pending[id]?.is_featured ?? !!fallback) as boolean;

  const clearPending = (id: string) =>
    setPending((p) => {
      const { [id]: _, ...rest } = p;
      return rest;
    });

  const toggleSelectAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    if (checked) for (const r of items) next[r.id] = true;
    setSelected(next);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    try {
      await del(id).unwrap();
      toast.success("Ürün silindi");
      refetch();
    } catch (e: any) {
      toast.error(e?.data?.message || "Silinemedi");
    }
  };

  // ✅ Switch: optimistic -> API -> refetch -> pending temizle (hata olursa geri al)
  const handleToggleActive = async (id: string, next: boolean) => {
    setPending((p) => ({ ...p, [id]: { ...p[id], is_active: next } }));
    try {
      await toggleActive({ id, is_active: as01(next) }).unwrap();
      await refetch();
      clearPending(id);
      toast.success(next ? "Aktifleştirildi" : "Pasifleştirildi");
    } catch (e: any) {
      setPending((p) => ({ ...p, [id]: { ...p[id], is_active: !next } }));
      toast.error(e?.data?.message || "Durum güncellenemedi");
    }
  };

  const handleToggleHomepage = async (id: string, next: boolean) => {
    setPending((p) => ({ ...p, [id]: { ...p[id], is_featured: next } }));
    try {
      // ❗ BE tarafı is_featured bekliyor → 0/1 gönder
      await toggleHomepage({ id, is_featured: as01(next) } as any).unwrap();
      await refetch();
      clearPending(id);
      toast.success(next ? "Anasayfada gösterilecek" : "Anasayfadan kaldırıldı");
    } catch (e: any) {
      setPending((p) => ({ ...p, [id]: { ...p[id], is_featured: !next } }));
      toast.error(e?.data?.message || "Anasayfa durumu güncellenemedi");
    }
  };

  const doBulkActive = async (val: boolean) => {
    if (!selectedIds.length) return;
    try {
      await bulkActive({ ids: selectedIds, is_active: as01(val) } as any).unwrap();
      toast.success(`Seçilen ürünler ${val ? "aktif" : "pasif"} yapıldı`);
      setSelected({});
      refetch();
    } catch (e: any) {
      toast.error(e?.data?.message || "Güncellenemedi");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="border-gray-200 shadow-none">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <Label className="sr-only">Ara</Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Başlık/slug ara…"
                  value={filters.q}
                  onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                />
                <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="mb-1 block text-xs text-gray-500">Kategori</Label>
              <select
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                value={filters.category_id ?? ""}
                onChange={(e) =>
                  setFilters((p) => ({
                    ...p,
                    category_id: e.target.value || null,
                    sub_category_id: null,
                    offset: 0,
                  }))
                }
              >
                <option value="">Tümü</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="mb-1 block text-xs text-gray-500">Alt Kategori</Label>
              <select
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                value={filters.sub_category_id ?? ""}
                onChange={(e) =>
                  setFilters((p) => ({
                    ...p,
                    sub_category_id: e.target.value || null,
                    offset: 0,
                  }))
                }
                disabled={!filters.category_id}
              >
                <option value="">Tümü</option>
                {subcats?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="mb-1 block text-xs text-gray-500">Sıralama</Label>
              <div className="flex gap-2">
                <select
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  value={filters.sort}
                  onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value as Filters["sort"] }))}
                >
                  <option value="created_at">Oluşturulma</option>
                  <option value="title">Başlık</option>
                  <option value="price">Fiyat</option>
                  <option value="rating">Puan</option>
                  <option value="review_count">Yorum</option>
                </select>
                <select
                  className="w-28 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  value={filters.order}
                  onChange={(e) => setFilters((p) => ({ ...p, order: e.target.value as Filters["order"] }))}
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>

            {/* Durum filtresi: Hepsi / Aktif / Pasif */}
            <div className="flex items-end">
              <div className="ml-auto flex items-center gap-1 rounded-md bg-gray-100 p-1">
                {(["all", "active", "inactive"] as StatusFilter[]).map((opt) => (
                  <Button
                    key={opt}
                    type="button"
                    size="sm"
                    variant={filters.status === opt ? "default" : "secondary"}
                    className={cn(
                      "h-8",
                      opt === "active" && filters.status === opt && "bg-emerald-600 text-white",
                      opt === "inactive" && filters.status === opt && "bg-rose-600 text-white"
                    )}
                    onClick={() => setFilters((p) => ({ ...p, status: opt, offset: 0 }))}
                  >
                    {opt === "all" ? "Hepsi" : opt === "active" ? "Aktif" : "Pasif"}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end bg-emerald-600 p-2 rounded-md text-white">
              <Button onClick={() => navigate("/admin/products/new")} className="gap-2">
                <Plus className="h-4 w-4 " />
                Yeni Ürün
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions */}
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={() => doBulkActive(true)} disabled={!selectedIds.length}>
          Hepsini Aktif Yap
        </Button>
        <Button variant="secondary" onClick={() => doBulkActive(false)} disabled={!selectedIds.length}>
          Hepsini Pasif Yap
        </Button>
        <div className="ml-auto text-sm text-gray-500">
          {isFetching ? "Yükleniyor…" : `${items.length} kayıt`}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr className="text-xs">
              <th className="w-10 p-3">
                <Checkbox
                  checked={items.length > 0 && selectedIds.length === items.length}
                  onCheckedChange={(v) => toggleSelectAll(!!v)}
                />
              </th>
              <th className="w-16 p-3">Kapak</th>
              <th className="p-3">Başlık</th>
              <th className="p-3">Slug</th>
              <th className="p-3 text-right">Fiyat</th>
              <th className="w-40 p-3 text-center">Durum</th>
              <th className="w-40 p-3 text-center">Anasayfa</th>
              <th className="w-40 p-3 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => {
              const dim = !viewActive(r.id, r.is_active) ? "opacity-60" : "";
              const checkedActive = viewActive(r.id, r.is_active);
              const checkedFeatured = viewFeatured(r.id, r.is_featured);

              return (
                <tr key={r.id} className={cn("border-t transition-opacity", dim)}>
                  <td className="p-3">
                    <Checkbox
                      checked={!!selected[r.id]}
                      onCheckedChange={(v) => setSelected((s) => ({ ...s, [r.id]: !!v }))}
                    />
                  </td>
                  <td className="p-3">
                    {r.image_url ? (
                      <img src={r.image_url} alt={r.alt ?? ""} className="h-10 w-12 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-12 rounded bg-gray-100" />
                    )}
                  </td>
                  <td className="p-3">
                    <div className="max-w-[26rem] truncate">{r.title}</div>
                  </td>
                  <td className="p-3 text-gray-500">{r.slug}</td>
                  <td className="p-3 text-right tabular-nums">
                    {Number(r.price).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                  </td>

                  {/* Durum (renkli switch) */}
                  <td className="p-3">
                    <div className="flex items-center justify-center">
                      <Switch
                        checked={checkedActive}
                        onCheckedChange={(v) => handleToggleActive(r.id, v)}
                        onClick={(e) => e.stopPropagation()}
                        className={cn("bg-gray-300 data-[state=checked]:bg-emerald-600", "h-5 w-10")}
                        aria-label="Aktif / Pasif"
                      />
                    </div>
                  </td>

                  {/* Anasayfa (renkli switch) */}
                  <td className="p-3">
                    <div className="flex items-center justify-center">
                      <Switch
                        checked={checkedFeatured}
                        onCheckedChange={(v) => handleToggleHomepage(r.id, v)}
                        onClick={(e) => e.stopPropagation()}
                        className={cn("bg-gray-300 data-[state=checked]:bg-sky-600", "h-5 w-10")}
                        aria-label="Anasayfada göster"
                      />
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/products/${r.id}`)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Düzenle
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(r.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                        Sil
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {!items.length && !isFetching && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">Kayıt bulunamadı</td>
              </tr>
            )}
            {isFetching && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                  Yükleniyor…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Sayfa: {Math.floor((filters.offset ?? 0) / (filters.limit ?? DEFAULT_LIMIT)) + 1}
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={(filters.offset ?? 0) <= 0 || isFetching}
            onClick={() =>
              setFilters((p) => ({ ...p, offset: Math.max((p.offset ?? 0) - (p.limit ?? DEFAULT_LIMIT), 0) }))
            }
          >
            Önceki
          </Button>
          <Button
            variant="secondary"
            disabled={isFetching || items.length < (filters.limit ?? DEFAULT_LIMIT)}
            onClick={() =>
              setFilters((p) => ({ ...p, offset: (p.offset ?? 0) + (p.limit ?? DEFAULT_LIMIT) }))
            }
          >
            Sonraki
          </Button>
        </div>
      </div>
    </div>
  );
}
