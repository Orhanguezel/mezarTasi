"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import {
  useListCategoriesAdminQuery,
} from "@/integrations/metahub/rtk/endpoints/admin/categories_admin.endpoints";

import {
  useGetSubCategoryAdminByIdQuery,
  useCreateSubCategoryAdminMutation,
  useUpdateSubCategoryAdminMutation,
  useSetSubCategoryImageAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/sub_categories_admin.endpoints";

import { useUploadStorageAssetAdminMutation } from "@/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints";

type UiSubCategory = {
  id?: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string | null;

  is_active: boolean;
  is_featured: boolean;
  display_order: number;
};

const slugify = (v: string) =>
  v.toString().trim().toLowerCase()
    .replace(/[^a-z0-9ğüşöçı\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

// replaceAll kullanmadan güvenli %2F -> /
const unescapePath = (s: string) => s.replace(/%2F/gi, "/");

const pickAssetId = (res: any): string | undefined => {
  if (typeof res?.id === "string" && res.id) return res.id;
  if (typeof res?.asset_id === "string" && res.asset_id) return res.asset_id;
  if (typeof res?.public_id === "string" && res.public_id) return res.public_id;
  if (typeof res?.data?.id === "string" && res.data.id) return res.data.id;
  if (typeof res?._id === "string" && res._id) return res._id;
  return undefined;
};

const pickAssetUrl = (res: any): string | undefined => {
  if (typeof res?.url === "string" && res.url) return res.url;
  if (typeof res?.secure_url === "string" && res.secure_url) return res.secure_url;
  if (res?.path && res?.bucket) {
    const origin = (import.meta.env.VITE_PUBLIC_API_ORIGIN ?? "").toString().replace(/\/$/, "");
    const bucket = encodeURIComponent(res.bucket);
    const path = unescapePath(encodeURIComponent(res.path));
    return `${origin}/storage/${bucket}/${path}`;
  }
  return undefined;
};

// Global DnD guard → dosya bırakınca sayfadan çıkmayı engelle
function useGlobalFileDropGuard() {
  useEffect(() => {
    const guard = (e: DragEvent) => {
      if (!e.dataTransfer) return;
      const hasFiles = Array.from(e.dataTransfer.types || []).includes("Files");
      if (hasFiles) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("dragover", guard, true);
    window.addEventListener("drop", guard, true);
    return () => {
      window.removeEventListener("dragover", guard, true);
      window.removeEventListener("drop", guard, true);
    };
  }, []);
}

export default function SubCategoryFormPage() {
  const nav = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  useGlobalFileDropGuard();

  const isEdit = Boolean(id);

  // Kategoriler (select için)
  const { data: categories = [] } = useListCategoriesAdminQuery(
    { sort: "name", order: "asc", limit: 200 },
    { refetchOnMountOrArgChange: true }
  );

  // Eğer listeden state ile geldiysek anında boyamak için
  const initialFromState = (location.state as any)?.initialValue as
    | { id?: string; category_id?: string; name?: string; slug?: string; description?: string; image_url?: string | null }
    | undefined;

  const { data: serverRow, isFetching } = useGetSubCategoryAdminByIdQuery(id!, {
    skip: !isEdit,
    refetchOnMountOrArgChange: true,
  });

  const [createSub, { isLoading: creating }] = useCreateSubCategoryAdminMutation();
  const [updateSub, { isLoading: updating }] = useUpdateSubCategoryAdminMutation();
  const [setSubImage, { isLoading: settingImage }] = useSetSubCategoryImageAdminMutation();
  const [uploadAsset, { isLoading: uploading }] = useUploadStorageAssetAdminMutation();

  // Son yüklenen asset id (yeni kayıtta bağlamak için)
  const lastAssetIdRef = useRef<string | null>(null);

  // İlk kategori id’si
  const firstCatId = useMemo(() => categories[0]?.id ?? "", [categories]);

  // exactOptionalPropertyTypes’a uygun initial
  const makeInitial = (): UiSubCategory => {
    const base: UiSubCategory = {
      category_id: initialFromState?.category_id ?? firstCatId,
      name: initialFromState?.name ?? "",
      slug: initialFromState?.slug ?? "",
      description: initialFromState?.description ?? "",
      image_url: initialFromState?.image_url ?? null,
      is_active: true,
      is_featured: false,
      display_order: 0,
    };
    if (id) return { ...base, id };
    return base;
  };

  const [form, setForm] = useState<UiSubCategory>(makeInitial);

  // Kategoriler geldiyse ve boşsa category_id’yi doldur
  useEffect(() => {
    if (!isEdit && !form.category_id && firstCatId) {
      setForm((p) => ({ ...p, category_id: firstCatId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstCatId]);

  // Sunucudan alt kategori gelince forma yükle
  useEffect(() => {
    if (!serverRow) return;
    setForm((prev) => {
      const base: UiSubCategory = {
        category_id: prev.category_id || serverRow.category_id || firstCatId,
        name: prev.name || serverRow.name || "",
        slug: prev.slug || serverRow.slug || "",
        description: prev.description ?? (serverRow.description ?? "") ?? "",
        image_url: serverRow.image_url ?? null,
        is_active: !!serverRow.is_active,
        is_featured: !!serverRow.is_featured,
        display_order: Number(serverRow.display_order ?? 0),
      };
      return id ? { ...base, id } : base;
    });
  }, [serverRow, id, firstCatId]);

  // Dosya input
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onUpload = async (files: File[]) => {
    if (!files.length) return;
    const file = files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Lütfen bir resim seçin");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Maksimum 10MB");
      return;
    }

    try {
      const folder = isEdit ? `sub-categories/${id}` : `sub-categories/tmp`;
      const res: any = await uploadAsset({ file, bucket: "sub-categories", folder }).unwrap();
      const url = pickAssetUrl(res);
      const assetId = pickAssetId(res);
      if (!url) {
        toast.error("Yüklenen görsel için URL alınamadı");
        return;
      }
      // UI önizleme
      setForm((p) => ({ ...p, image_url: url }));
      lastAssetIdRef.current = assetId ?? null;

      // Kayıt mevcutsa BE tarafına anında bağla
      if (isEdit && assetId) {
        await setSubImage({ id: id!, body: { asset_id: assetId } }).unwrap();
      }

      toast.success("Görsel yüklendi");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e: any) {
      toast.error(e?.data?.error?.message ?? "Yükleme başarısız");
    }
  };

  const removeImage = async () => {
    try {
      setForm((p) => ({ ...p, image_url: null }));
      lastAssetIdRef.current = null;
      if (isEdit) {
        await setSubImage({ id: id!, body: { asset_id: null } }).unwrap();
      }
      toast.success("Görsel kaldırıldı");
    } catch (e: any) {
      toast.error(e?.data?.error?.message ?? "Kaldırma başarısız");
    }
  };

  const saving = creating || updating || uploading || settingImage || isFetching;

  const save = async () => {
    const category_id = String(form.category_id || "").trim();
    const name = form.name.trim();
    let slug = form.slug.trim();
    if (!category_id) return toast.error("Lütfen bir üst kategori seçin");
    if (!name) return toast.error("Alt kategori adı gerekli");
    if (!slug) slug = slugify(name);

    const body = {
      category_id,
      name,
      slug,
      description: form.description?.trim() || null,
      image_url: form.image_url ?? null,
      is_active: !!form.is_active,
      is_featured: !!form.is_featured,
      display_order: Number(form.display_order || 0),
    } as const;

    try {
      if (isEdit) {
        await updateSub({ id: id!, body }).unwrap();
        toast.success("Alt kategori güncellendi");
        // Görsel setleme edit akışında zaten onUpload’ta yapıldı.
      } else {
        const created = await createSub(body).unwrap();
        toast.success("Yeni alt kategori oluşturuldu");
        // Eğer az önce upload ettiysek ve assetId varsa şimdi bağla
        if (lastAssetIdRef.current) {
          try {
            await setSubImage({
              id: created.id,
              body: { asset_id: lastAssetIdRef.current },
            }).unwrap();
          } catch {
            /* sessiz bırak */
          }
        }
      }
      // Listeye geri dön (geldiğin yere)
      nav(-1);
    } catch (e: any) {
      const code = e?.data?.error?.message;
      if (code === "duplicate_slug_in_category") {
        toast.error("Bu slug bu kategori içinde zaten kullanılıyor");
      } else if (code === "invalid_category_id") {
        toast.error("Geçersiz kategori");
      } else if (code === "invalid_body") {
        toast.error("Form verisi geçersiz");
      } else {
        toast.error(e?.error || "Kaydetme başarısız");
      }
    }
  };

  // Dropzone highlight opsiyonel
  const [dragOver, setDragOver] = useState(false);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 bg-white">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{isEdit ? "Alt Kategori Düzenle" : "Yeni Alt Kategori"}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => nav(-1)} disabled={saving}>Geri</Button>
          <Button onClick={save} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
            {isEdit ? "Güncelle" : "Oluştur"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Label htmlFor="scat-category">Üst Kategori *</Label>
            <select
              id="scat-category"
              className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm shadow-sm focus:border-teal-500 focus:outline-none"
              value={form.category_id}
              onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
            >
              <option value="" disabled>Seçiniz…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="scat-order">Sıra</Label>
            <Input
              id="scat-order"
              type="number"
              inputMode="numeric"
              className="mt-1"
              value={form.display_order}
              onChange={(e) => setForm((p) => ({ ...p, display_order: Number(e.target.value || 0) }))}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="scat-name">Alt Kategori Adı *</Label>
            <Input
              id="scat-name"
              className="mt-1"
              value={form.name}
              onChange={(e) =>
                setForm((p) => ({ ...p, name: e.target.value, slug: p.slug || slugify(e.target.value) }))
              }
            />
          </div>

          <div>
            <Label htmlFor="scat-slug">Slug *</Label>
            <Input
              id="scat-slug"
              className="mt-1"
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))}
            />
          </div>

          <div className="flex items-end gap-3">
            <Switch
              id="scat-active"
              checked={!!form.is_active}
              onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
            />
            <Label htmlFor="scat-active" className="text-sm text-muted-foreground">Aktif</Label>
          </div>

          <div className="flex items-end gap-3">
            <Switch
              id="scat-featured"
              checked={!!form.is_featured}
              onCheckedChange={(v) => setForm((p) => ({ ...p, is_featured: v }))}
            />
            <Label htmlFor="scat-featured" className="text-sm text-muted-foreground">Öne Çıkar</Label>
          </div>
        </div>

        <div className="mt-6">
          <Label htmlFor="scat-desc">Açıklama</Label>
          <Textarea
            id="scat-desc"
            className="mt-1 min-h-[110px]"
            value={form.description ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </div>

        {/* Görsel alanı */}
        <div className="mt-6">
          <Label>Alt Kategori Görseli</Label>

          {/* Dropzone: default navigasyonu engelle */}
          <div
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault(); e.stopPropagation(); setDragOver(false);
              const files = Array.from(e.dataTransfer?.files ?? []) as File[];
              void onUpload(files);
            }}
            className={[
              "mt-2 rounded-lg border border-dashed p-4 text-center text-sm transition",
              dragOver ? "border-teal-500 bg-teal-50/70 text-teal-700" : "border-gray-300 bg-gray-50/80 text-gray-600 hover:bg-gray-50"
            ].join(" ")}
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
          >
            Dosya seç veya görseli bu alana bırak
            <input
              ref={fileInputRef}
              id="scat-image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onUpload(Array.from(e.target.files ?? []))}
            />
          </div>
          {uploading && <p className="mt-2 text-xs text-muted-foreground">Yükleniyor…</p>}

          {form.image_url && (
            <div className="mt-3 rounded-lg border bg-white p-4">
              <p className="mb-3 text-sm font-medium text-gray-700">Kapak Görseli</p>
              <div className="relative max-w-sm">
                <div className="aspect-video overflow-hidden rounded-md border bg-muted">
                  <img src={form.image_url} alt="" className="h-full w-full object-cover" />
                </div>

                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  aria-label="Görseli sil"
                  title="Sil"
                  onClick={removeImage}
                  className="absolute right-2 top-2 h-8 w-8 rounded-full p-0 shadow-lg ring-2 ring-white hover:scale-105 transition"
                  disabled={uploading || settingImage}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
