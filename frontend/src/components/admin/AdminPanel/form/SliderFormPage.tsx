// =============================================================
// FILE: src/components/admin/AdminPanel/form/SliderFormPage.tsx
// =============================================================
"use client";

import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

import {
  useAdminGetSlideQuery,
  useAdminCreateSlideMutation,
  useAdminUpdateSlideMutation,
  useAdminSetSlideStatusMutation,
  useAdminSetSlideImageMutation, // ✅ PATCH /admin/sliders/:id/image
} from "@/integrations/metahub/rtk/endpoints/admin/sliders_admin.endpoints";

// Storage upload (tek görsel patern)
import { useCreateAssetAdminMutation } from "@/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints";

// Shared sections (daha önce kullandığımız)
import { Section } from "@/components/admin/AdminPanel/form/sections/shared/Section";
import { CoverImageSection } from "@/components/admin/AdminPanel/form/sections/CoverImageSection";

const slugifyTr = (s: string) =>
  s.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
    .substring(0, 120);

export default function SliderFormPage() {
  const { id } = useParams() as { id?: string };
  const isNew = !id || id === "new";
  const navigate = useNavigate();

  const { data: existing, isFetching } = useAdminGetSlideQuery(String(id ?? ""), { skip: isNew });

  // form state
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [autoSlug, setAutoSlug] = React.useState(true);
  const [description, setDescription] = React.useState<string>("");

  const [buttonText, setButtonText] = React.useState<string>("");
  const [buttonLink, setButtonLink] = React.useState<string>("");

  const [featured, setFeatured] = React.useState(false);
  const [isActive, setIsActive] = React.useState(true);
  const [displayOrder, setDisplayOrder] = React.useState<number>(0);

  // tek görsel patern
  const [imageUrl, setImageUrl] = React.useState<string>("");
  const [alt, setAlt] = React.useState<string>("");
  const [assetId, setAssetId] = React.useState<string | undefined>(undefined);
  const [stagedAssetId, setStagedAssetId] = React.useState<string | undefined>(undefined);

  // mutations
  const [createOne, { isLoading: creating }] = useAdminCreateSlideMutation();
  const [updateOne, { isLoading: updating }] = useAdminUpdateSlideMutation();
  const [setStatus] = useAdminSetSlideStatusMutation();
  const [setImage, { isLoading: settingImage }] = useAdminSetSlideImageMutation();
  const [uploadAsset] = useCreateAssetAdminMutation();

  const saving = creating || updating || settingImage;

  // hydrate
  React.useEffect(() => {
    if (!isNew && existing) {
      setName(existing.name);
      setSlug(existing.slug);
      setDescription(existing.description ?? "");
      setButtonText(existing.buttonText ?? "");
      setButtonLink(existing.buttonLink ?? "");
      setFeatured(!!existing.featured);
      setIsActive(!!existing.is_active);
      setDisplayOrder(Number(existing.display_order ?? 0));

      setImageUrl(existing.image_effective_url ?? existing.image_url ?? "");
      setAlt(existing.alt ?? "");
      setAssetId(existing.image_asset_id ?? undefined);
      setStagedAssetId(undefined);
    }
  }, [existing, isNew]);

  React.useEffect(() => { if (autoSlug) setSlug(slugifyTr(name)); }, [name, autoSlug]);

  const onBack = () =>
    window.history.length ? window.history.back() : navigate("/admin/sliders");

  const buildCreateBody = () => ({
    name,
    slug,
    description: description || null,

    image_url: imageUrl || null,
    image_asset_id: assetId ?? null,
    alt: alt || null,

    buttonText: buttonText || null,
    buttonLink: buttonLink || null,

    featured,
    is_active: isActive,
    display_order: Number(displayOrder) || 0,
  });

  const buildUpdateBody = () => ({
    name,
    slug,
    description: description || null,

    image_url: imageUrl || null,
    image_asset_id: assetId ?? null,
    alt: alt || null,

    buttonText: buttonText || null,
    buttonLink: buttonLink || null,

    featured,
    is_active: isActive,
    display_order: Number(displayOrder) || 0,
  });

  const afterCreateOrUpdate = async (theId: string | number) => {
    const chosen = assetId ?? stagedAssetId;
    try {
      if (chosen) {
        await setImage({ id: theId, body: { asset_id: chosen } }).unwrap();
      } else if (imageUrl) {
        await updateOne({ id: theId, body: { image_url: imageUrl } }).unwrap();
      }
    } catch (e: any) {
      toast.error(e?.data?.message || "Görsel ilişkilendirilemedi");
    }
  };

  const doCreate = async () => {
    if (!name) return toast.error("Ad zorunlu");
    try {
      const created = await createOne(buildCreateBody()).unwrap();
      await afterCreateOrUpdate(String(created.id));
      toast.success("Slider oluşturuldu");
      navigate("/admin/sliders");
    } catch (e: any) {
      toast.error(e?.data?.message || "Oluşturma başarısız");
    }
  };

  const doUpdate = async () => {
    if (isNew || !id) return;
    if (!name) return toast.error("Ad zorunlu");
    try {
      await updateOne({ id: id!, body: buildUpdateBody() }).unwrap();
      const chosen = assetId ?? stagedAssetId;
      if (chosen) await setImage({ id: id!, body: { asset_id: chosen } }).unwrap();
      toast.success("Slider güncellendi");
      navigate("/admin/sliders");
    } catch (e: any) {
      toast.error(e?.data?.message || "Güncelleme başarısız");
    }
  };

  const uploadCover = async (file: File) => {
    try {
      const res = await uploadAsset({
        file,
        bucket: "slider",
        folder: `slider/${slug || id || Date.now()}/cover`,
      }).unwrap();

      const newId = (res as any)?.id as string | undefined;
      const publicUrl = (res as any)?.url || (res as any)?.public_url;

      if (!newId) return toast.error("Yükleme cevabı beklenen formatta değil");

      setAssetId(newId);
      setStagedAssetId(newId);
      if (publicUrl) setImageUrl(publicUrl);

      if (!isNew && id) {
        await setImage({ id, body: { asset_id: newId } }).unwrap();
        toast.success("Kapak resmi güncellendi");
      } else {
        toast.success("Kapak yüklendi (kayıt sonrası ilişkilendirilecek)");
      }
    } catch (e: any) {
      toast.error(e?.data?.message || "Kapak yüklenemedi");
    }
  };

  const removeCover = async () => {
    if (isNew) {
      setAssetId(undefined); setStagedAssetId(undefined); setImageUrl("");
      toast.info("Görsel yerelden kaldırıldı (kayıt yok).");
      return;
    }
    if (!id) return;
    try {
      await setImage({ id, body: { asset_id: null } }).unwrap();
      setAssetId(undefined); setStagedAssetId(undefined); setImageUrl("");
      toast.success("Görsel kaldırıldı");
    } catch (e: any) {
      toast.error(e?.data?.message || "Görsel kaldırılamadı");
    }
  };

  const saveAltOnly = async () => {
    if (isNew || !id) return;
    try {
      await updateOne({ id, body: { alt: alt || null } }).unwrap();
      toast.success("Alt metin güncellendi");
    } catch (e: any) {
      toast.error(e?.data?.message || "Alt metin güncellenemedi");
    }
  };

  const onUrlChange = (v: string) => {
    setImageUrl(v);
    if (v) { setAssetId(undefined); setStagedAssetId(undefined); }
  };

  if (!isNew && isFetching) {
    return <div className="p-4 text-sm text-gray-500">Yükleniyor…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => onBack()} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Geri
        </Button>
        {isNew ? (
          <Button onClick={doCreate} disabled={saving} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="h-4 w-4" /> Oluştur
          </Button>
        ) : (
          <Button onClick={doUpdate} disabled={saving} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="h-4 w-4" /> Kaydet
          </Button>
        )}
      </div>

      <Section title="Temel Bilgiler">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Ad</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Slider adı" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>Slug</Label>
              <label className="flex items-center gap-2 text-xs text-gray-500">
                <Switch checked={autoSlug} onCheckedChange={setAutoSlug} className="data-[state=checked]:bg-indigo-600" />
                otomatik
              </label>
            </div>
            <Input
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setAutoSlug(false); }}
              placeholder="slider-slug"
            />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label>Açıklama (ops.)</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Buton Yazısı (ops.)</Label>
            <Input value={buttonText} onChange={(e) => setButtonText(e.target.value)} placeholder="İncele" />
          </div>

          <div className="space-y-2">
            <Label>Buton Link (ops.)</Label>
            <Input value={buttonLink} onChange={(e) => setButtonLink(e.target.value)} placeholder="/urunler" />
          </div>

          <div className="space-y-2">
            <Label>Aktif</Label>
            <div className="flex h-10 items-center">
              <Switch
                checked={isActive}
                onCheckedChange={(v) => { setIsActive(v); if (!isNew && id) setStatus({ id, body: { is_active: v } }); }}
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Öne Çıkan</Label>
            <div className="flex h-10 items-center">
              <Switch
                checked={featured}
                onCheckedChange={async (v) => {
                  setFeatured(v);
                  if (!isNew && id) {
                    try { await updateOne({ id, body: { featured: v } }).unwrap(); }
                    catch { toast.error("Öne çıkarma güncellenemedi"); setFeatured(!v); }
                  }
                }}
                className="data-[state=checked]:bg-amber-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sıra</Label>
            <Input inputMode="numeric" value={String(displayOrder)} onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)} />
          </div>
        </div>
      </Section>

      {/* Tek görsel patern */}
      <CoverImageSection
        title="Kapak Görseli"
        coverId={assetId /* image_asset_id */}
        stagedCoverId={stagedAssetId}
        imageUrl={imageUrl}
        alt={alt}
        saving={saving}
        onPickFile={uploadCover}
        onRemove={removeCover}
        onUrlChange={onUrlChange}
        onAltChange={setAlt}
        onSaveAlt={!isNew && !!id ? saveAltOnly : undefined}
        accept="image/*"
      />
    </div>
  );
}
