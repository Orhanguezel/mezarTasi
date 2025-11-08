"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import {
  useGetCategoryAdminByIdQuery,
  useCreateCategoryAdminMutation,
  useUpdateCategoryAdminMutation,
  useSetCategoryImageAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/categories_admin.endpoints";
import { useUploadStorageAssetAdminMutation } from "@/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints";

import type { CategoryForm } from "@/integrations/metahub/db/types/categories.rows";

const slugify = (v: string) =>
  v.toString().trim().toLowerCase()
    .replace(/[^a-z0-9ğüşöçı\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

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
  (res?.path && res?.bucket
    ? `${(import.meta.env.VITE_PUBLIC_API_ORIGIN ?? "")
        .toString()
        .replace(/\/$/, "")}/storage/${encodeURIComponent(res.bucket)}/${
          // replaceAll yerine regex (ES2021 gerektirmez)
          encodeURIComponent(res.path).replace(/%2F/gi, "/")
        }`
    : undefined);

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

export default function CategoryFormPage() {
  const nav = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  useGlobalFileDropGuard();

  const isEdit = Boolean(id);

  const initialFromState = (location.state as any)?.initialValue as
    | { id?: string; name?: string; slug?: string; description?: string; image_url?: string | null }
    | undefined;

  const { data: serverRow, isFetching } = useGetCategoryAdminByIdQuery(id!, {
    skip: !isEdit,
    refetchOnMountOrArgChange: true,
  });

  const [createCategory, { isLoading: creating }] = useCreateCategoryAdminMutation();
  const [updateCategory, { isLoading: updating }] = useUpdateCategoryAdminMutation();
  const [setCatImage, { isLoading: settingImage }] = useSetCategoryImageAdminMutation();
  const [uploadAsset, { isLoading: uploading }] = useUploadStorageAssetAdminMutation();

  // exactOptionalPropertyTypes: id'yi sadece varsa ekle
  const [form, setForm] = useState<CategoryForm>({
    ...(id ? { id } : {}),
    name: initialFromState?.name ?? "",
    slug: initialFromState?.slug ?? "",
    description: initialFromState?.description ?? "",
    image_url: initialFromState?.image_url ?? null,
    is_active: true,
    is_featured: false,
    display_order: 0,
  });

  useEffect(() => {
    if (!serverRow) return;
    setForm((prev) => ({
      ...prev,
      id: serverRow.id,
      name: prev.name || serverRow.name || "",
      slug: prev.slug || serverRow.slug || "",
      description: prev.description ?? (serverRow.description ?? "") ?? "",
      image_url: serverRow.image_url ?? null,
      is_active: !!serverRow.is_active,
      is_featured: !!serverRow.is_featured,
      display_order: Number(serverRow.display_order ?? 0),
    }));
  }, [serverRow]);

  // Dosya input
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onUpload = async (files: File[]) => {
    if (!files.length) return;
    const file = files[0];
    if (!file) return; // TS: file possibly undefined guard

    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen bir resim seçin");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Maksimum 10MB");
      return;
    }

    try {
      const folder = isEdit ? `categories/${id}` : `categories/tmp`;
      const res: any = await uploadAsset({ file, bucket: "categories", folder }).unwrap();
      const url = pickAssetUrl(res);
      const assetId = pickAssetId(res);
      if (!url) {
        toast.error("Yüklenen görsel için URL alınamadı");
        return;
      }
      setForm((p) => ({ ...p, image_url: url }));
      if (isEdit && assetId) {
        await setCatImage({ id: id!, body: { asset_id: assetId } }).unwrap();
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
      if (isEdit) {
        await setCatImage({ id: id!, body: { asset_id: null } }).unwrap();
      }
      toast.success("Görsel kaldırıldı");
    } catch (e: any) {
      toast.error(e?.data?.error?.message ?? "Kaldırma başarısız");
    }
  };

  const saving = creating || updating || uploading || settingImage || isFetching;

  const save = async () => {
    const name = form.name.trim();
    let slug = form.slug.trim();
    if (!name) return toast.error("Kategori adı gerekli");
    if (!slug) slug = slugify(name);

    const body = {
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
        await updateCategory({ id: id!, body }).unwrap();
        toast.success("Kategori güncellendi");
      } else {
        await createCategory(body).unwrap();
        toast.success("Yeni kategori oluşturuldu");
      }
      // Listeye güvenli dönüş (tanımlı route)
      nav("/admin");
    } catch (e: any) {
      toast.error(e?.data?.error?.message ?? "Kaydetme başarısız");
    }
  };

  const [dragOver, setDragOver] = useState(false);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 bg-white">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{isEdit ? "Kategori Düzenle" : "Yeni Kategori"}</h1>
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
            <Label htmlFor="cat-name">Kategori Adı *</Label>
            <Input
              id="cat-name"
              className="mt-1"
              value={form.name}
              onChange={(e) =>
                setForm((p) => ({ ...p, name: e.target.value, slug: p.slug || slugify(e.target.value) }))
              }
            />
          </div>

          <div>
            <Label htmlFor="cat-slug">Slug *</Label>
            <Input
              id="cat-slug"
              className="mt-1"
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))}
            />
          </div>

          <div>
            <Label htmlFor="cat-order">Sıra</Label>
            <Input
              id="cat-order"
              type="number"
              inputMode="numeric"
              className="mt-1"
              value={form.display_order}
              onChange={(e) => setForm((p) => ({ ...p, display_order: Number(e.target.value || 0) }))}
            />
          </div>

          <div className="flex items-end gap-3">
            <Switch
              id="cat-active"
              checked={!!form.is_active}
              onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
            />
            <Label htmlFor="cat-active" className="text-sm text-muted-foreground">Aktif</Label>
          </div>

          <div className="flex items-end gap-3">
            <Switch
              id="cat-featured"
              checked={!!form.is_featured}
              onCheckedChange={(v) => setForm((p) => ({ ...p, is_featured: v }))}
            />
            <Label htmlFor="cat-featured" className="text-sm text-muted-foreground">Öne Çıkar</Label>
          </div>
        </div>

        <div className="mt-6">
          <Label htmlFor="cat-desc">Açıklama</Label>
          <Textarea
            id="cat-desc"
            className="mt-1 min-h-[110px]"
            value={form.description ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </div>

        {/* Görsel alanı */}
        <div className="mt-6">
          <Label>Kategori Görseli</Label>

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
              id="cat-image"
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
