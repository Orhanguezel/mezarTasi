// =============================================================
// FILE: src/components/admin/AdminPanel/form/ServiceFormPage.tsx
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
  useGetServiceAdminByIdQuery,
  useCreateServiceAdminMutation,
  useUpdateServiceAdminMutation,
  useSetServiceStatusAdminMutation,
  // ✅ RTK endpoints dosyanıza şu mutasyonu eklediyseniz:
  // setServiceImageAdmin (PATCH /admin/services/:id/image)
  useSetServiceImageAdminMutation, // <-- ESM import ile ekledik
} from "@/integrations/metahub/rtk/endpoints/admin/services_admin.endpoints";

// Storage upload
import { useCreateAssetAdminMutation } from "@/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints";

// Shared sections
import { Section } from "@/components/admin/AdminPanel/form/sections/shared/Section";
import { CoverImageSection } from "@/components/admin/AdminPanel/form/sections/CoverImageSection";

const slugifyTr = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
    .substring(0, 120);

type ServiceType = "gardening" | "soil" | "other";

export default function ServiceFormPage() {
  const { id } = useParams() as { id?: string };
  const isNew = !id || id === "new";
  const navigate = useNavigate();

  const { data: existing, isFetching } = useGetServiceAdminByIdQuery(String(id ?? ""), { skip: isNew });

  // form state
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [autoSlug, setAutoSlug] = React.useState(true);

  const [type, setType] = React.useState<ServiceType>("other");
  const [category, setCategory] = React.useState("general");

  const [material, setMaterial] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [description, setDescription] = React.useState("");

  const [featured, setFeatured] = React.useState(false);
  const [isActive, setIsActive] = React.useState(true);
  const [displayOrder, setDisplayOrder] = React.useState<number>(1);

  // gardening
  const [area, setArea] = React.useState("");
  const [duration, setDuration] = React.useState("");
  const [maintenance, setMaintenance] = React.useState("");
  const [season, setSeason] = React.useState("");

  // soil
  const [soilType, setSoilType] = React.useState("");
  const [thickness, setThickness] = React.useState("");
  const [equipment, setEquipment] = React.useState("");

  // common
  const [warranty, setWarranty] = React.useState("");
  const [includes, setIncludes] = React.useState("");

  // image state (tek görsel patern)
  const [imageUrl, setImageUrl] = React.useState<string>("");
  const [alt, setAlt] = React.useState<string>(""); // alt backend’de normal PATCH ile güncelleniyor
  const [assetId, setAssetId] = React.useState<string | undefined>(undefined); // image_asset_id (staged)
  const [stagedAssetId, setStagedAssetId] = React.useState<string | undefined>(undefined);

  // mutations
  const [createOne, { isLoading: creating }] = useCreateServiceAdminMutation();
  const [updateOne, { isLoading: updating }] = useUpdateServiceAdminMutation();
  const [setStatus] = useSetServiceStatusAdminMutation();
  const [uploadOne] = useCreateAssetAdminMutation();

  // ✅ ESM hook
  const [setImage, { isLoading: settingImage }] = useSetServiceImageAdminMutation();

  const saving = creating || updating || settingImage;

  // hydrate
  React.useEffect(() => {
    if (!isNew && existing) {
      setName(existing.name ?? "");
      setSlug(existing.slug ?? "");
      setType((existing.type as ServiceType) || "other");
      setCategory(existing.category ?? "general");

      setMaterial(existing.material ?? "");
      setPrice(existing.price ?? "");
      setDescription(existing.description ?? "");

      setFeatured(!!existing.featured);
      setIsActive(!!existing.is_active);
      setDisplayOrder(Number(existing.display_order ?? 1));

      setArea(existing.area ?? "");
      setDuration(existing.duration ?? "");
      setMaintenance(existing.maintenance ?? "");
      setSeason(existing.season ?? "");

      setSoilType(existing.soil_type ?? "");
      setThickness(existing.thickness ?? "");
      setEquipment(existing.equipment ?? "");

      setWarranty(existing.warranty ?? "");
      setIncludes(existing.includes ?? "");

      setImageUrl(existing.image_effective_url ?? existing.image_url ?? "");
      setAlt(existing.alt ?? "");
      setAssetId((existing as any).image_asset_id ?? undefined);
      setStagedAssetId(undefined);
    }
  }, [existing, isNew]);

  React.useEffect(() => {
    if (autoSlug) setSlug(slugifyTr(name));
  }, [name, autoSlug]);

  const onBack = () =>
    window.history.length ? window.history.back() : navigate("/admin/services");

  /* ------------ payload builders ------------ */
  const buildCreateBody = () => ({
    name,
    slug,
    type,
    category,
    material: material || null,
    price: price || null,
    description: description || null,

    // görsel alanları create sırasında istersen set edebilirsin
    image_url: imageUrl || null,
    image_asset_id: assetId ?? null,
    alt: alt || null,

    featured,
    is_active: isActive,
    display_order: Number(displayOrder) || 1,

    // gardening
    area: area || null,
    duration: duration || null,
    maintenance: maintenance || null,
    season: season || null,

    // soil
    soil_type: soilType || null,
    thickness: thickness || null,
    equipment: equipment || null,

    // common
    warranty: warranty || null,
    includes: includes || null,
  });

  const buildUpdateBody = () => ({
    name,
    slug,
    type,
    category,
    material: material || null,
    price: price || null,
    description: description || null,

    // normal PATCH ile image_url / image_asset_id / alt set edilebilir
    image_url: imageUrl || null,
    image_asset_id: assetId ?? null,
    alt: alt || null,

    featured,
    is_active: isActive,
    display_order: Number(displayOrder) || 1,

    area: area || null,
    duration: duration || null,
    maintenance: maintenance || null,
    season: season || null,

    soil_type: soilType || null,
    thickness: thickness || null,
    equipment: equipment || null,

    warranty: warranty || null,
    includes: includes || null,
  });

  // create/update sonrası görsel bağlama (prefer: PATCH /:id/image {asset_id})
  const afterCreateOrUpdate = async (theId: string) => {
    const chosen = assetId ?? stagedAssetId;
    try {
      if (chosen && setImage) {
        await setImage({ id: theId, body: { asset_id: chosen } }).unwrap();
      } else if (imageUrl) {
        await updateOne({ id: theId, body: { image_url: imageUrl } }).unwrap();
      }
    } catch (e: any) {
      toast.error(e?.data?.message || "Görsel ilişkilendirilemedi");
    }
  };

  /* ------------ actions ------------ */
  const doCreate = async () => {
    if (!name) return toast.error("Ad zorunlu");
    try {
      const created = await createOne(buildCreateBody()).unwrap();
      await afterCreateOrUpdate(String((created as any).id));
      toast.success("Servis oluşturuldu");
      navigate("/admin/services");
    } catch (e: any) {
      const msg = e?.data?.error?.message || e?.data?.message;
      toast.error(msg || "Oluşturma başarısız");
    }
  };

  const doUpdate = async () => {
    if (isNew || !id) return;
    if (!name) return toast.error("Ad zorunlu");
    try {
      await updateOne({ id: String(id), body: buildUpdateBody() }).unwrap();

      // ayrı set-image uçunu kullanmak istersen:
      const chosen = assetId ?? stagedAssetId;
      if (chosen && setImage) {
        await setImage({ id: String(id), body: { asset_id: chosen } }).unwrap();
      }

      toast.success("Servis güncellendi");
      navigate("/admin/services");
    } catch (e: any) {
      const msg = e?.data?.error?.message || e?.data?.message;
      toast.error(msg || "Güncelleme başarısız");
    }
  };

  const uploadCover = async (file: File) => {
    try {
      const res = await uploadOne({
        file,
        bucket: "services",
        folder: `services/${slug || id || Date.now()}/cover`,
      }).unwrap();

      const newId = (res as any)?.id as string | undefined;
      const publicUrl = (res as any)?.url || (res as any)?.public_url;

      if (!newId) return toast.error("Yükleme cevabı beklenen formatta değil");

      setAssetId(newId);
      setStagedAssetId(newId);
      if (publicUrl) setImageUrl(publicUrl);

      if (!isNew && id && setImage) {
        await setImage({ id: String(id), body: { asset_id: newId } }).unwrap();
        toast.success("Kapak resmi güncellendi");
      } else {
        toast.success("Kapak yüklendi (kayıt sonrası ilişkilendirilecek)");
      }
    } catch (e: any) {
      toast.error(e?.data?.message || "Kapak yüklenemedi");
    }
  };

  const saveAltOnly = async () => {
    if (isNew || !id) return;
    try {
      await updateOne({ id: String(id), body: { alt: alt || null } }).unwrap();
      toast.success("Alt metin güncellendi");
    } catch (e: any) {
      toast.error(e?.data?.message || "Alt metin güncellenemedi");
    }
  };

  const removeCover = async () => {
    if (isNew) {
      setAssetId(undefined);
      setStagedAssetId(undefined);
      setImageUrl("");
      toast.info("Görsel yerelden kaldırıldı (kayıt yok).");
      return;
    }
    if (!id) return;
    try {
      if (setImage) {
        await setImage({ id: String(id), body: { asset_id: null } }).unwrap();
      } else {
        // fallback: normal patch ile temizle
        await updateOne({ id: String(id), body: { image_url: null, image_asset_id: null } }).unwrap();
      }
      setAssetId(undefined);
      setStagedAssetId(undefined);
      setImageUrl("");
      toast.success("Görsel kaldırıldı");
    } catch (e: any) {
      toast.error(e?.data?.message || "Görsel kaldırılamadı");
    }
  };

  const onUrlChange = (v: string) => {
    setImageUrl(v);
    if (v) {
      setAssetId(undefined);
      setStagedAssetId(undefined);
    }
  };

  if (!isNew && isFetching) {
    return <div className="p-4 text-sm text-gray-500">Yükleniyor…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => onBack()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Geri
        </Button>
        {isNew ? (
          <Button onClick={doCreate} disabled={saving} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="h-4 w-4" />
            Oluştur
          </Button>
        ) : (
          <Button onClick={doUpdate} disabled={saving} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Save className="h-4 w-4" />
            Kaydet
          </Button>
        )}
      </div>

      <Section title="Temel Bilgiler">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Ad</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Servis adı" />
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
              placeholder="servis-slug"
            />
          </div>

          <div className="space-y-2">
            <Label>Tür</Label>
            <Select value={type} onValueChange={(v: ServiceType) => setType(v)}>
              <SelectTrigger><SelectValue placeholder="Tür" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gardening">Gardening</SelectItem>
                <SelectItem value="soil">Soil</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Kategori</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Malzeme (ops.)</Label>
            <Input value={material} onChange={(e) => setMaterial(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Fiyat (ops.)</Label>
            <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="örn: 5.000 ₺" />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label>Açıklama (ops.)</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Aktif</Label>
            <div className="flex h-10 items-center">
              <Switch checked={isActive} onCheckedChange={(v) => { setIsActive(v); if (!isNew && id) setStatus({ id: String(id), body: { is_active: v } }); }} className="data-[state=checked]:bg-emerald-600" />
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
                    try { await updateOne({ id: String(id), body: { featured: v } }).unwrap(); }
                    catch { toast.error("Öne çıkarma güncellenemedi"); setFeatured(!v); }
                  }
                }}
                className="data-[state=checked]:bg-amber-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sıra</Label>
            <Input inputMode="numeric" value={String(displayOrder)} onChange={(e) => setDisplayOrder(Number(e.target.value) || 1)} />
          </div>
        </div>
      </Section>

      {/* Type-specific fields */}
      {type === "gardening" && (
        <Section title="Gardening Bilgileri">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Alan</Label><Input value={area} onChange={(e) => setArea(e.target.value)} /></div>
            <div className="space-y-2"><Label>Süre</Label><Input value={duration} onChange={(e) => setDuration(e.target.value)} /></div>
            <div className="space-y-2"><Label>Bakım</Label><Input value={maintenance} onChange={(e) => setMaintenance(e.target.value)} /></div>
            <div className="space-y-2"><Label>Sezon</Label><Input value={season} onChange={(e) => setSeason(e.target.value)} /></div>
          </div>
        </Section>
      )}

      {type === "soil" && (
        <Section title="Soil Bilgileri">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Toprak Türü</Label><Input value={soilType} onChange={(e) => setSoilType(e.target.value)} /></div>
            <div className="space-y-2"><Label>Kalınlık</Label><Input value={thickness} onChange={(e) => setThickness(e.target.value)} /></div>
            <div className="space-y-2"><Label>Ekipman</Label><Input value={equipment} onChange={(e) => setEquipment(e.target.value)} /></div>
          </div>
        </Section>
      )}

      <Section title="Genel Bilgiler (ops.)">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Garanti</Label><Input value={warranty} onChange={(e) => setWarranty(e.target.value)} /></div>
          <div className="space-y-2"><Label>Dahil Olanlar</Label><Input value={includes} onChange={(e) => setIncludes(e.target.value)} /></div>
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
