// src/pages/admin/.../ServiceFormPage.tsx
"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import {
  useCreateServiceAdminMutation,
  useGetServiceAdminByIdQuery,
  useUpdateServiceAdminMutation,
  useAttachServiceImageMutation,
  useDetachServiceImageMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/services_admin.endpoints";
import { useUploadStorageAssetAdminMutation } from "@/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints";
import type { ServiceCreateInput, ServiceUpdateInput } from "@/integrations/metahub/db/types/services.types";

/* ---------------- Rich Text (Quill) Safe Wrapper ---------------- */
let ReactQuill: any = null;
if (typeof window !== "undefined") {
  try {
    ReactQuill = require("react-quill");
  } catch {}
}

const getListPath = () =>
  typeof window !== "undefined" && window.location.pathname.includes("/admin")
    ? "/admin/services"
    : "/services";


function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  if (!ReactQuill) {
    return (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[160px]"
      />
    );
  }
  return (
    <div className="prose max-w-none">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={{
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "clean"],
          ],
        }}
      />
    </div>
  );
}

/* ------------------------------ Page ------------------------------ */

export default function ServiceFormPage() {
  const nav = useNavigate();
  const params = useParams();
  const idParam = (params as any)?.id as string | undefined;
  const isEdit = !!idParam && idParam !== "new";

  const { data: existing, isFetching } = useGetServiceAdminByIdQuery(idParam!, {
    skip: !isEdit,
  });

  const [createSvc, { isLoading: creating }] = useCreateServiceAdminMutation();
  const [updateSvc, { isLoading: updating }] = useUpdateServiceAdminMutation();
  const [attachImage, { isLoading: attaching }] = useAttachServiceImageMutation();
  const [detachImage, { isLoading: detaching }] = useDetachServiceImageMutation();
  const [uploadAsset, { isLoading: uploading }] = useUploadStorageAssetAdminMutation();

  // ------- form state -------
  const [name, setName] = useState("");
  const [slug, setSlug] = useState<string | undefined>(undefined);
  const [type, setType] = useState<"gardening" | "soil" | "other">("other");
  const [category, setCategory] = useState("general");

  const [material, setMaterial] = useState<string | undefined>();
  const [price, setPrice] = useState<string | undefined>();
  const [description, setDescription] = useState<string>("");

  const [featured, setFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState<number | undefined>(undefined);

  // image
  const [imageAlt, setImageAlt] = useState<string | undefined>();
  const [effectiveUrl, setEffectiveUrl] = useState<string | null>(null);

  // gardening
  const [area, setArea] = useState<string | undefined>();
  const [duration, setDuration] = useState<string | undefined>();
  const [maintenance, setMaintenance] = useState<string | undefined>();
  const [season, setSeason] = useState<string | undefined>();

  // soil
  const [soilType, setSoilType] = useState<string | undefined>();
  const [thickness, setThickness] = useState<string | undefined>();
  const [equipment, setEquipment] = useState<string | undefined>();

  // common
  const [warranty, setWarranty] = useState<string | undefined>();
  const [includes, setIncludes] = useState<string | undefined>();

  // file ref
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!existing) return;
    setName(existing.name || "");
    setSlug(existing.slug);
    setType(existing.type);
    setCategory(existing.category || "general");

    setMaterial(existing.material ?? undefined);
    setPrice(existing.price ?? undefined);
    setDescription(existing.description ?? "");

    setFeatured(!!existing.featured);
    setIsActive(!!existing.is_active);
    setDisplayOrder(existing.display_order ?? undefined);

    setImageAlt(existing.alt ?? undefined);
    setEffectiveUrl(existing.image_effective_url ?? null);

    setArea(existing.area ?? undefined);
    setDuration(existing.duration ?? undefined);
    setMaintenance(existing.maintenance ?? undefined);
    setSeason(existing.season ?? undefined);

    setSoilType(existing.soil_type ?? undefined);
    setThickness(existing.thickness ?? undefined);
    setEquipment(existing.equipment ?? undefined);

    setWarranty(existing.warranty ?? undefined);
    setIncludes(existing.includes ?? undefined);
  }, [existing]);

  // GET isFetching'i busy'ye dahil ETME → Kaydet kilitlenmesin
  const busy = creating || updating || uploading || attaching || detaching;

  const buildBody = (): ServiceCreateInput | ServiceUpdateInput => {
    const body: ServiceCreateInput = {
      name,
      featured,
      is_active: isActive,

      // string|null alanlar
      material: material ?? null,
      price: price ?? null,
      description: description?.trim() ? description : null,
      alt: imageAlt ?? null,

      // gardening
      area: area ?? null,
      duration: duration ?? null,
      maintenance: maintenance ?? null,
      season: season ?? null,

      // soil
      soil_type: soilType ?? null,
      thickness: thickness ?? null,
      equipment: equipment ?? null,

      // common
      warranty: warranty ?? null,
      includes: includes ?? null,
    };

    // explicit undefined göndermeyelim
    if (slug?.trim()) body.slug = slug.trim();
    if (type) body.type = type;
    if (category?.trim()) body.category = category.trim();
    if (displayOrder !== undefined) body.display_order = displayOrder;

    return body;
  };

  const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!name.trim()) {
    toast.error("İsim gerekli");
    return;
  }

  try {
    if (isEdit) {
      await updateSvc({ id: idParam!, body: buildBody() }).unwrap();
      toast.success("Kaydedildi");
    } else {
      await createSvc(buildBody() as ServiceCreateInput).unwrap();
      toast.success("Oluşturuldu");
    }

    // Listeye dön (admin ise /admin/services, değilse /services)
    nav(getListPath(), { replace: true });
  } catch {
    toast.error("Kaydedilemedi");
  }
};

  const onPickFile = () => fileRef.current?.click();

  const onFileChange = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files?.[0];
    ev.target.value = "";
    if (!f || !isEdit) {
      if (!isEdit) toast.info("Önce kaydedin, sonra görsel ekleyin.");
      return;
    }
    try {
      const asset = await uploadAsset({ file: f, folder: "services" }).unwrap();
      const res = await attachImage({ id: idParam!, body: { storage_asset_id: asset.id } }).unwrap();
      setEffectiveUrl(res.image_effective_url ?? res.image_url ?? null);
      toast.success("Görsel eklendi");
    } catch {
      toast.error("Görsel yüklenemedi");
    }
  };

  const onAttachByUrl = async () => {
    if (!isEdit) {
      toast.info("Önce kaydedin, sonra görsel ekleyin.");
      return;
    }
    const url = prompt("Görsel URL’si (https://…)");
    if (!url) return;
    try {
      const res = await attachImage({ id: idParam!, body: { image_url: url } }).unwrap();
      setEffectiveUrl(res.image_effective_url ?? res.image_url ?? null);
      toast.success("Görsel bağlandı (URL)");
    } catch {
      toast.error("URL ile bağlanamadı");
    }
  };

  const onDetach = async () => {
    if (!isEdit) return;
    try {
      const res = await detachImage({ id: idParam! }).unwrap();
      setEffectiveUrl(res.image_effective_url ?? res.image_url ?? null);
      toast.success("Görsel kaldırıldı");
    } catch {
      toast.error("Görsel kaldırılamadı");
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card className="border border-gray-200 shadow-none">
        <CardHeader className="border-b border-gray-200 py-4">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base sm:text-lg">
              {isEdit ? "Hizmet Düzenle" : "Yeni Hizmet"}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => nav(-1)} disabled={busy}>
                Geri
              </Button>
              <Button
                type="submit"
                disabled={busy}
                className={`${busy ? "opacity-70" : ""} data-[state=busy]:animate-pulse`}
                data-state={busy ? "busy" : "idle"}
              >
                {isEdit ? "Kaydet" : "Oluştur"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-4 sm:p-6">
          {/* Basic */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>İsim</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required disabled={busy && isEdit} />
            </div>
            <div>
              <Label>Slug (opsiyonel)</Label>
              <Input
                value={slug ?? ""}
                onChange={(e) => setSlug(e.target.value || undefined)}
                placeholder="otomatik üretilecek"
                disabled={busy && isEdit}
              />
            </div>

            <div>
              <Label>Tür</Label>
              <select
                className="block w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                disabled={busy && isEdit}
              >
                <option value="gardening">gardening</option>
                <option value="soil">soil</option>
                <option value="other">other</option>
              </select>
            </div>

            <div>
              <Label>Kategori</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="general / mevsimlik / ..."
                disabled={busy && isEdit}
              />
            </div>

            <div>
              <Label>Malzeme</Label>
              <Input
                value={material ?? ""}
                onChange={(e) => setMaterial(e.target.value || undefined)}
                disabled={busy && isEdit}
              />
            </div>
            <div>
              <Label>Fiyat</Label>
              <Input
                value={price ?? ""}
                onChange={(e) => setPrice(e.target.value || undefined)}
                disabled={busy && isEdit}
              />
            </div>
          </div>

          {/* Flags */}
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2">
              <Switch
                className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-slate-300 focus-visible:ring-2 focus-visible:ring-emerald-400"
                checked={featured}
                onCheckedChange={setFeatured}
                disabled={busy && isEdit}
              />
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                Öne Çıkan
              </span>
            </label>
            <label className="flex items-center gap-2">
              <Switch
                className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-slate-300 focus-visible:ring-2 focus-visible:ring-emerald-400"
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={busy && isEdit}
              />
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-50 text-slate-600 border border-slate-200"
                }`}
              >
                {isActive ? "Aktif" : "Pasif"}
              </span>
            </label>
            <div className="flex items-center gap-2">
              <Label>Sıra</Label>
              <Input
                type="number"
                className="w-28"
                value={displayOrder ?? ""}
                onChange={(e) =>
                  setDisplayOrder(e.target.value ? Number(e.target.value) : undefined)
                }
                disabled={busy && isEdit}
              />
            </div>
          </div>

          {/* Image */}
          <div className="rounded-md border border-gray-200 p-4">
            <div className="mb-3 text-sm font-medium">Kapak Görseli</div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="w-[220px] shrink-0">
                <div className="aspect-[4/3] overflow-hidden rounded bg-gray-100">
                  {effectiveUrl ? (
                    <img
                      src={effectiveUrl}
                      alt={imageAlt ?? ""}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">
                      Görsel yok
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onFileChange}
                  />
                  <Button type="button" variant="secondary" onClick={onPickFile} disabled={busy || !isEdit}>
                    Dosyadan Yükle
                  </Button>
                  <Button type="button" variant="outline" onClick={onAttachByUrl} disabled={busy || !isEdit}>
                    URL ile Bağla
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-red-600"
                    onClick={onDetach}
                    disabled={busy || !effectiveUrl || !isEdit}
                  >
                    Görseli Kaldır
                  </Button>
                </div>

                <div>
                  <Label>Alt (alt text)</Label>
                  <Input
                    value={imageAlt ?? ""}
                    onChange={(e) => setImageAlt(e.target.value || undefined)}
                    placeholder="Erişilebilirlik için açıklama"
                    disabled={busy && isEdit}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Kaydet’e bastığınızda alt metin güncellenir.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rich Text */}
          <div>
            <Label>Açıklama</Label>
            <div className="mt-2">
              <RichTextEditor
                value={description}
                onChange={(v) => setDescription(v)}
                placeholder="Hizmet açıklaması..."
              />
            </div>
          </div>

          {/* Gardening */}
          <fieldset className="rounded-md border border-gray-200 p-4">
            <legend className="px-1 text-sm font-medium">Gardening Alanları</legend>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label>Alan</Label>
                <Input value={area ?? ""} onChange={(e) => setArea(e.target.value || undefined)} disabled={busy && isEdit} />
              </div>
              <div>
                <Label>Süre</Label>
                <Input
                  value={duration ?? ""}
                  onChange={(e) => setDuration(e.target.value || undefined)}
                  disabled={busy && isEdit}
                />
              </div>
              <div>
                <Label>Bakım</Label>
                <Input
                  value={maintenance ?? ""}
                  onChange={(e) => setMaintenance(e.target.value || undefined)}
                  disabled={busy && isEdit}
                />
              </div>
              <div>
                <Label>Sezon</Label>
                <Input
                  value={season ?? ""}
                  onChange={(e) => setSeason(e.target.value || undefined)}
                  disabled={busy && isEdit}
                />
              </div>
            </div>
          </fieldset>

          {/* Soil */}
          <fieldset className="rounded-md border border-gray-200 p-4">
            <legend className="px-1 text-sm font-medium">Soil Alanları</legend>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>Toprak Tipi</Label>
                <Input
                  value={soilType ?? ""}
                  onChange={(e) => setSoilType(e.target.value || undefined)}
                  disabled={busy && isEdit}
                />
              </div>
              <div>
                <Label>Kalınlık</Label>
                <Input
                  value={thickness ?? ""}
                  onChange={(e) => setThickness(e.target.value || undefined)}
                  disabled={busy && isEdit}
                />
              </div>
              <div>
                <Label>Ekipman</Label>
                <Input
                  value={equipment ?? ""}
                  onChange={(e) => setEquipment(e.target.value || undefined)}
                  disabled={busy && isEdit}
                />
              </div>
            </div>
          </fieldset>

          {/* Common */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Garanti</Label>
              <Input
                value={warranty ?? ""}
                onChange={(e) => setWarranty(e.target.value || undefined)}
                disabled={busy && isEdit}
              />
            </div>
            <div>
              <Label>Dahil Olanlar</Label>
              <Input
                value={includes ?? ""}
                onChange={(e) => setIncludes(e.target.value || undefined)}
                disabled={busy && isEdit}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => nav(-1)} disabled={busy}>
              Vazgeç
            </Button>
            <Button
              type="submit"
              disabled={busy}
              className="data-[state=busy]:animate-pulse"
              data-state={busy ? "busy" : "idle"}
            >
              {isEdit ? "Kaydet" : "Oluştur"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
