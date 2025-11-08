// /src/components/admin/AdminPanel/form/ProductFormPage.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import type { Product as UiProduct, Spec as UiSpec } from "../types";
import {
  useAdminListProductsQuery,
  useAdminListCategoriesQuery,
  useAdminCreateProductMutation,
  useAdminUpdateProductMutation,
  useAdminSetProductImagesMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/products_admin.endpoints";
import { useUploadStorageAssetAdminMutation } from "@/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints";

type Status = "Active" | "Inactive";
type AssetItem = { url: string; id?: string };

type ProductFormState = {
  title: string;
  price: string;
  category: string;
  subCategory: string;
  description: string;
  assets: AssetItem[];
  specifications?: UiSpec | Record<string, any>;
  status?: Status;
};

const emptySpec: UiSpec = {
  dimensions: "",
  weight: "",
  thickness: "",
  surfaceFinish: "",
  warranty: "",
  installationTime: "",
};

const asNumber = (v: number | string | null | undefined, fallback = 0): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
  if (typeof v === "string") {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
};

function buildPublicStorageUrl(bucket: string, path: string) {
  const safe = encodeURIComponent(path).split("%2F").join("/");
  const base = (import.meta.env.VITE_PUBLIC_API_ORIGIN as string | undefined)?.replace(/\/$/, "");
  return base ? `${base}/storage/${encodeURIComponent(bucket)}/${safe}` : `/storage/${encodeURIComponent(bucket)}/${safe}`;
}

const pickAssetId = (res: any): string | undefined =>
  (typeof res?.id === "string" && res.id) ||
  (typeof res?.asset_id === "string" && res.asset_id) ||
  (typeof res?.public_id === "string" && res.public_id) ||
  (typeof res?.data?.id === "string" && res.data.id) ||
  (typeof res?._id === "string" && res._id) ||
  undefined;

const pickAssetUrl = (res: any): string | undefined =>
  (typeof res?.url === "string" && res.url) ||
  (typeof res?.secure_url === "string" && res.secure_url) ||
  (res?.path && res?.bucket ? buildPublicStorageUrl(res.bucket, res.path) : undefined);

/** DB satırını UI'ye çevir (images=string[]) */
function rowToUi(row: any): UiProduct {
  const images: string[] =
    Array.isArray(row.images) && row.images.length ? row.images.filter(Boolean)
    : row.image_url ? [row.image_url]
    : [];
  return {
    id: row.id,
    title: String(row.title ?? ""),
    price: String(row.price ?? ""),
    description: row.description ?? "",
    category: String(row.category_id ?? ""),
    subCategory: String(row.sub_category_id ?? ""),
    image: images[0] ?? "",
    images,
    status: row.is_active ? "Active" : "Inactive",
    specifications: (row.specifications as UiSpec) ?? undefined,
  };
}

/** Admin upsert gövdesi */
function toUpsert(
  payload: Omit<UiProduct, "id" | "status"> & Partial<Pick<UiProduct, "status">>
) {
  const priceNum = asNumber(payload.price, 0);
  const firstImg = payload.images?.[0] ?? payload.image ?? "";
  const specs = payload.specifications && typeof payload.specifications === "object"
    ? payload.specifications
    : undefined;

  const out: any = {};
  out.title = payload.title;
  out.price = priceNum;
  out.description = payload.description === "" ? null : payload.description;
  if (payload.category) out.category_id = payload.category;
  if (payload.subCategory) out.sub_category_id = payload.subCategory;
  if (firstImg) out.image_url = firstImg;
  if (payload.images?.length) out.images = payload.images; // URL'lerin tamamı
  out.is_active = (payload.status ?? "Active") === "Active";
  if (specs !== undefined) out.specifications = specs;

  return out;
}

/** Row içinden mümkünse id+url eşleşmeleri çıkar (eski görseller silinmesin) */
function extractAssetsFromRow(row: any): AssetItem[] {
  if (!row) return [];

  const objList = Array.isArray(row.image_assets) ? row.image_assets
                : Array.isArray(row.assets) ? row.assets
                : Array.isArray(row.images_meta) ? row.images_meta
                : Array.isArray(row.images) && typeof row.images[0] === "object" ? row.images
                : null;

  if (objList) {
    const mapped = objList
      .map((a: any) => {
        const id = a?.id || a?.asset_id || a?.public_id || a?._id;
        const url = a?.url || (a?.bucket && a?.path ? buildPublicStorageUrl(a.bucket, a.path) : undefined);
        return url ? ({ url, ...(id ? { id: String(id) } : {}) }) as AssetItem : null;
      })
      .filter(Boolean) as AssetItem[];
    if (mapped.length) return mapped;
  }

  if (Array.isArray(row.image_ids) && Array.isArray(row.images) && row.image_ids.length === row.images.length) {
    return row.images.map((u: string, i: number) => {
      const id = row.image_ids[i];
      return id ? { url: u, id: String(id) } : { url: u };
    });
  }

  if (Array.isArray(row.images) && row.images.length) {
    return row.images.filter(Boolean).map((u: string) => ({ url: u }));
  }
  if (row.image_url) return [{ url: String(row.image_url) }];

  return [];
}

/** URL veya ID'ye göre tekilleştir (olası kopyaları temizler) */
function uniqueAssets(list: AssetItem[]): AssetItem[] {
  const seen = new Set<string>();
  const out: AssetItem[] = [];
  for (const a of list) {
    const key = a.id ? `id:${a.id}` : `url:${a.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out;
}

export default function ProductFormPage() {
  const nav = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();

  const isEdit = Boolean(id);
  const { data: products } = useAdminListProductsQuery(undefined);
  const editingRow = useMemo(
    () => (isEdit ? (Array.isArray(products) ? products.find((p: any) => String(p.id) === String(id)) : undefined) : undefined),
    [isEdit, id, products]
  );

  const uiInitial: UiProduct | null =
    (location.state as any)?.initialValue ?? (editingRow ? rowToUi(editingRow) : null);

  const initialAssets: AssetItem[] = useMemo(() => {
    if ((location.state as any)?.initialAssets) return (location.state as any).initialAssets as AssetItem[];
    if (editingRow) {
      const assets = extractAssetsFromRow(editingRow);
      if (assets.length) return assets;
    }
    return (uiInitial?.images ?? []).map((u) => ({ url: u }));
  }, [editingRow, uiInitial, location.state]);

  const [form, setForm] = useState<ProductFormState>({
    title: uiInitial?.title ?? "",
    price: uiInitial?.price ?? "",
    category: uiInitial?.category ?? "",
    subCategory: uiInitial?.subCategory ?? "",
    description: uiInitial?.description ?? "",
    assets: uniqueAssets(initialAssets),
    specifications: (uiInitial?.specifications as UiSpec) ?? { ...emptySpec },
    status: (uiInitial?.status as Status) ?? "Active",
  });

  useEffect(() => {
    if (!uiInitial) return;
    setForm((prev) => {
      if (prev.title || prev.assets.length) return prev;
      return {
        title: uiInitial.title ?? "",
        price: uiInitial.price ?? "",
        category: uiInitial.category ?? "",
        subCategory: uiInitial.subCategory ?? "",
        description: uiInitial.description ?? "",
        assets: uniqueAssets(initialAssets),
        specifications: (uiInitial.specifications as UiSpec) ?? { ...emptySpec },
        status: (uiInitial.status as Status) ?? "Active",
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiInitial?.id]);

  const { data: cats } = useAdminListCategoriesQuery();
  const catsWithSubs = useMemo(() => {
    return (cats ?? []).map((c: any) => ({
      id: String(c?.id ?? ""),
      name: String(c?.name ?? c?.id ?? ""),
      sub_categories: Array.isArray(c?.sub_categories)
        ? c.sub_categories.map((s: any) => ({ id: String(s?.id ?? ""), name: String(s?.name ?? s?.id ?? "") }))
        : [],
    }));
  }, [cats]);

  const catItems = useMemo(() => catsWithSubs.map((c) => ({ id: c.id, name: c.name })), [catsWithSubs]);
  const subcatItemsForSelected = useMemo(() => {
    const cat = catsWithSubs.find((c) => c.id === form.category);
    return cat?.sub_categories ?? [];
  }, [catsWithSubs, form.category]);

  const [uploadAsset, { isLoading: uploading }] = useUploadStorageAssetAdminMutation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const appendAssets = useCallback((items: AssetItem[]) => {
    setForm((prev) => ({ ...prev, assets: uniqueAssets(prev.assets.concat(items)) }));
  }, []);

  const uploadFilesToStorage = async (files: File[]) => {
    const productId = id ? String(id) : null;
    const folder = productId ? `products/${productId}/gallery` : `products/tmp`;

    let success = 0;
    for (const file of files) {
      try {
        if (!file.type.startsWith("image/")) { toast.error(`${file.name} bir resim dosyası değil`); continue; }
        if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} 10MB'den büyük`); continue; }

        const res: any = await uploadAsset({ file, bucket: "products", folder }).unwrap();
        const url = pickAssetUrl(res);
        const idd = pickAssetId(res);
        if (!url) { toast.error(`${file.name} için URL alınamadı`); continue; }

        const item: AssetItem = idd ? { url, id: idd } : { url };
        appendAssets([item]);
        success++;
      } catch (err: any) {
        const msg = err?.data?.error?.message ?? err?.message ?? "Yükleme başarısız";
        toast.error(`${file.name}: ${msg}`);
      }
    }
    if (success) toast.success(`${success} görsel yüklendi`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onDrop: React.DragEventHandler<HTMLLabelElement> = (e) => {
    e.preventDefault(); e.stopPropagation();
    const files = Array.from(e.dataTransfer?.files ?? []).filter((f) => f.type.startsWith("image/"));
    if (files.length) void uploadFilesToStorage(files as File[]);
  };
  const onDragOver: React.DragEventHandler<HTMLLabelElement> = (e) => { e.preventDefault(); e.stopPropagation(); };

  const removeImage = (i: number) => {
    setForm((prev) => ({ ...prev, assets: prev.assets.filter((_, idx) => idx !== i) }));
  };

  const imagesFromAssets = useMemo(() => form.assets.map((a) => a.url), [form.assets]);
  const assetIdsAll = useMemo(() => form.assets.map((a) => a.id).filter(Boolean) as string[], [form.assets]);
  const coverId = useMemo(() => (form.assets.find((a) => a.id)?.id) as string | undefined, [form.assets]);

  const [createProduct, { isLoading: creating }] = useAdminCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useAdminUpdateProductMutation();
  const [setProductImages, { isLoading: persistingImages }] = useAdminSetProductImagesMutation();

  const saving = creating || updating || uploading || persistingImages;

  const save = async () => {
    if (!form.title.trim() || !form.price.trim() || !form.description.trim() || !form.category || imagesFromAssets.length === 0) {
      toast.error("Zorunlu alanları doldurun ve en az bir görsel ekleyin");
      return;
    }

    const firstImg = imagesFromAssets[0] ?? "";
    const payload = {
      title: form.title,
      price: form.price,
      category: form.category,
      subCategory: form.subCategory,
      description: form.description,
      images: imagesFromAssets.slice(), // URL’lerin TAMAMI korunur
      image: firstImg,
      specifications: form.specifications as UiSpec,
      status: form.status ?? "Active",
    } as const;

    const body = toUpsert(payload);

    try {
      let productId: string;

      if (isEdit) {
        // 1) Önce asset id’lerini bağla (backend burada images'ı resetlese bile)
        if (assetIdsAll.length > 0) {
          await setProductImages({
            id: id!,
            body: { image_ids: assetIdsAll, ...(coverId ? { cover_id: coverId } : {}) },
          }).unwrap();
        }
        // 2) Ardından ürünün TAM images URL listesini yeniden yaz
        await updateProduct({ id: id!, body }).unwrap();
        productId = String(id);
        toast.success("Ürün güncellendi");
      } else {
        // 1) Ürünü oluştur — ilk hali tam URL listesini içerir
        const created = await createProduct(body).unwrap();
        productId = String(created.id);

        // 2) Asset id’lerini bağla (muhtemelen backend images'ı id listesine göre yazar)
        if (assetIdsAll.length > 0) {
          await setProductImages({
            id: productId,
            body: { image_ids: assetIdsAll, ...(coverId ? { cover_id: coverId } : {}) },
          }).unwrap();

          // 3) Son olarak tekrar update ile TAM URL listesini garanti altına al
          await updateProduct({ id: productId, body }).unwrap();
        }

        toast.success("Yeni ürün oluşturuldu");
      }

      nav("/admin");
    } catch (e: any) {
      toast.error(e?.data?.error?.message ?? "Kaydetme başarısız");
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 bg-white">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{isEdit ? "Ürünü Düzenle" : "Yeni Ürün"}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => nav(-1)} disabled={saving}>Geri</Button>
          <Button onClick={save} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
            {isEdit ? "Güncelle" : "Oluştur"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="pf-title">Ürün Başlığı *</Label>
            <Input id="pf-title" className="mt-1"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          </div>

          <div>
            <Label htmlFor="pf-price">Ürün Fiyatı *</Label>
            <Input id="pf-price" className="mt-1" inputMode="decimal" placeholder="15000"
              value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
          </div>

          <div className="flex items-end gap-3">
            <Switch id="pf-active"
              checked={(form.status ?? "Active") === "Active"}
              onCheckedChange={(v) => setForm((p) => ({ ...p, status: v ? "Active" : "Inactive" }))} />
            <Label htmlFor="pf-active" className="text-sm text-muted-foreground">Aktif</Label>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="pf-cat">Kategori *</Label>
            <Select value={form.category}
              onValueChange={(value) => setForm((p) => ({ ...p, category: value, subCategory: "" }))}>
              <SelectTrigger id="pf-cat" className="mt-1 h-10 rounded-lg border-gray-300 bg-white/70 px-3 text-sm shadow-sm">
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-gray-200 bg-white/95 shadow-2xl">
                {catItems.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-sm">{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="pf-subcat">{subcatItemsForSelected.length ? "Alt Kategori" : "Alt Kategori (opsiyonel / ID)"}</Label>
            {subcatItemsForSelected.length ? (
              <Select value={form.subCategory} onValueChange={(v) => setForm((p) => ({ ...p, subCategory: v }))} disabled={!form.category}>
                <SelectTrigger id="pf-subcat" className="mt-1 h-10 rounded-lg border-gray-300 bg-white/70 px-3 text-sm shadow-sm">
                  <SelectValue placeholder="Alt kategori seçin" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-gray-200 bg-white/95 shadow-2xl">
                  {subcatItemsForSelected.map((s: any) => (
                    <SelectItem key={s.id} value={s.id} className="text-sm">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input id="pf-subcat" className="mt-1 h-10 rounded-lg border-gray-300 bg-white/70 px-3 text-sm shadow-sm"
                value={form.subCategory}
                onChange={(e) => setForm((p) => ({ ...p, subCategory: e.target.value }))} />
            )}
          </div>
        </div>

        <div className="mt-6">
          <Label htmlFor="pf-desc">Ürün Açıklaması *</Label>
          <Textarea id="pf-desc" className="mt-1 min-h-[110px]"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
        </div>

        <div className="mt-6 rounded-lg border bg-gray-50 p-4">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Teknik Özellikler</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {([
              ["dimensions", "Boyutlar", "Örn: 200cm x 100cm x 15cm"],
              ["weight", "Ağırlık", "Örn: 450 kg"],
              ["thickness", "Kalınlık", "Örn: 15 cm"],
              ["surfaceFinish", "Yüzey İşlemi", "Örn: Doğal Mermer Cilalı"],
              ["warranty", "Garanti", "Örn: 10 Yıl Garanti"],
              ["installationTime", "Kurulum Süresi", "Örn: 1-2 Gün"],
            ] as const).map(([key, label, ph]) => (
              <div key={key}>
                <Label>{label}</Label>
                <Input className="mt-1"
                  value={(form.specifications as UiSpec | undefined)?.[key as keyof UiSpec] ?? ""}
                  onChange={(e) => setForm((p) => ({
                    ...p,
                    specifications: { ...(p.specifications ?? {}), [key]: e.target.value } as UiSpec,
                  }))} placeholder={ph} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <Label>Ürün Görselleri *</Label>
          <div className="mt-2">
            <input
              ref={fileInputRef}
              id="pf-images"
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => void uploadFilesToStorage(Array.from(e.target.files ?? []))}
            />
            <label
              htmlFor="pf-images"
              onDrop={onDrop}
              onDragOver={onDragOver}
              className="block cursor-pointer rounded-lg border border-dashed border-gray-300 bg-gray-50/80 p-4 text-center text-sm text-gray-600 transition hover:bg-gray-50"
            >
              Dosya seç veya görselleri bu alana bırak
            </label>
            {uploading && <p className="mt-2 text-xs text-muted-foreground">Yükleniyor…</p>}
          </div>

          {form.assets.length > 0 && (
            <div className="mt-3 rounded-lg border bg-white p-4">
              <p className="mb-3 text-sm font-medium text-gray-700">
                Ürün Görselleri ({form.assets.length} adet)
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {form.assets.map((a, idx) => (
                  <div key={`${a.id ?? "url"}-${a.url}-${idx}`} className="group relative">
                    <div className="aspect-video w-full overflow-hidden rounded-md border bg-muted">
                      <img crossOrigin="anonymous" src={a.url} alt="" className="h-full w-full object-cover" />
                    </div>

                    <div className="absolute bottom-1 left-1 rounded bg-black/65 px-1.5 py-0.5 text-[11px] font-medium text-white shadow">
                      {idx + 1}
                    </div>

                    {/* 🔴 Daha belirgin silme düğmesi */}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      aria-label="Görseli sil"
                      title="Sil"
                      onClick={() => removeImage(idx)}
                      className="absolute right-2 top-2 h-8 w-8 rounded-full p-0 shadow-lg ring-2 ring-white hover:scale-105 transition"
                      disabled={uploading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end gap-2">
          <Button variant="outline" onClick={() => nav(-1)} disabled={saving}>Vazgeç</Button>
          <Button onClick={save} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
            {isEdit ? "Güncelle" : "Oluştur"}
          </Button>
        </div>
      </div>
    </main>
  );
}
