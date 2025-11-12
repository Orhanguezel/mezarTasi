// =============================================================
// FILE: src/components/admin/AdminPanel/form/AccessoryFormPage.tsx
// =============================================================
"use client";

import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, ArrowLeft } from "lucide-react";

import {
  useAdminGetAccessoryQuery,
  useAdminCreateAccessoryMutation,
  useAdminUpdateAccessoryMutation,
  useAdminSetAccessoryImageMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/accessories_admin.endpoints";

import { useCreateAssetAdminMutation } from "@/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints";

import { Section } from "@/components/admin/AdminPanel/form/sections/shared/Section";
import { CoverImageSection } from "@/components/admin/AdminPanel/form/sections/CoverImageSection";
import type { AccessoryCreateInput, AccessoryUpdateInput } from "@/integrations/metahub/db/types/accessories";

type AccKey = "suluk" | "sutun" | "vazo" | "aksesuar";

export default function AccessoryFormPage() {
  const { id } = useParams() as { id?: string };
  const isNew = !id || id === "new";
  const navigate = useNavigate();

  const { data: existing, isFetching: loadingExisting } = useAdminGetAccessoryQuery(String(id ?? ""), {
    skip: isNew,
  });

  // form state
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState(""); // read-only (BE name'den üretiyor)
  const [category, setCategory] = React.useState<AccKey>("aksesuar");
  const [material, setMaterial] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [description, setDescription] = React.useState("");

  const [featured, setFeatured] = React.useState(false);
  const [isActive, setIsActive] = React.useState(true);
  const [displayOrder, setDisplayOrder] = React.useState<number>(0);

  // optional attrs
  const [dimensions, setDimensions] = React.useState("");
  const [weight, setWeight] = React.useState("");
  const [thickness, setThickness] = React.useState("");
  const [finish, setFinish] = React.useState("");
  const [warranty, setWarranty] = React.useState("");
  const [installationTime, setInstallationTime] = React.useState("");

  // image state (external + storage)
  const [imageUrl, setImageUrl] = React.useState<string>("");
  const [alt, setAlt] = React.useState<string>("");
  const [coverId, setCoverId] = React.useState<string | undefined>(undefined);
  const [stagedCoverId, setStagedCoverId] = React.useState<string | undefined>(undefined);

  // mutations
  const [createOne, { isLoading: creating }] = useAdminCreateAccessoryMutation();
  const [updateOne, { isLoading: updating }] = useAdminUpdateAccessoryMutation();
  const [setCover, { isLoading: savingImg }] = useAdminSetAccessoryImageMutation();
  const [uploadOne] = useCreateAssetAdminMutation();

  const saving = creating || updating;

  // hydrate
  React.useEffect(() => {
    if (!isNew && existing) {
      setName(existing.name ?? "");
      setSlug(existing.slug ?? "");
      setCategory(existing.category as AccKey);
      setMaterial(existing.material ?? "");
      setPrice(existing.price ?? "");
      setDescription(existing.description ?? "");

      setFeatured(!!existing.featured);
      setIsActive(!!existing.is_active);
      setDisplayOrder(Number(existing.display_order ?? 0));

      setImageUrl(existing.image_url ?? "");
      setCoverId((existing as any).storage_asset_id ?? undefined);
      setAlt(existing.alt ?? "");

      setDimensions(existing.dimensions ?? "");
      setWeight(existing.weight ?? "");
      setThickness(existing.thickness ?? "");
      setFinish(existing.finish ?? "");
      setWarranty(existing.warranty ?? "");
      setInstallationTime(existing.installation_time ?? "");
    }
  }, [existing, isNew]);

  const onBack = () =>
    window.history.length ? window.history.back() : navigate("/admin/accessories");

  // CREATE body (slug gönderme! BE name'den türetiyor)
  const buildCreatePayload = (): AccessoryCreateInput => {
    const assocId = coverId ?? stagedCoverId;

    const body: AccessoryCreateInput = {
      name,
      category,
      material,
      price,
      description: description ?? "",                    // string bekleniyor
      featured,
      display_order: Number(displayOrder) || 0,
      is_active: isActive,
      ...(imageUrl ? { image_url: imageUrl } : {}),      // boşsa hiç ekleme
      ...(assocId ? { storage_asset_id: assocId } : {}), // boşsa hiç ekleme
      ...(dimensions.trim() ? { dimensions } : {}),
      ...(weight.trim() ? { weight } : {}),
      ...(thickness.trim() ? { thickness } : {}),
      ...(finish.trim() ? { finish } : {}),
      ...(warranty.trim() ? { warranty } : {}),
      ...(installationTime.trim() ? { installation_time: installationTime } : {}),
    };

    return body;
  };

  // UPDATE body (strict schema — null ile temizlenebilir)
  const buildUpdatePayload = (): AccessoryUpdateInput => ({
    name,
    category,
    material,
    price,
    description: description || null,
    image_url: imageUrl || null,                // storage'ı ayrıca set ediyoruz
    storage_asset_id: coverId ?? null,          // sadece var olanı kaydet (opsiyonel)
    featured,
    dimensions: dimensions ? dimensions : null,
    weight: weight ? weight : null,
    thickness: thickness ? thickness : null,
    finish: finish ? finish : null,
    warranty: warranty ? warranty : null,
    installation_time: installationTime ? installationTime : null,
    display_order: Number(displayOrder) || 0,
    is_active: isActive,
  });

  const doCreate = async () => {
    if (!name || !category || !material || !price) {
      toast.error("Ad, kategori, malzeme ve fiyat zorunlu");
      return;
    }
    try {
      const created = await createOne(buildCreatePayload()).unwrap();
      const newId = String(created.id);

      // Storage kapak seçilmişse ilişkilendir (alt dahil)
      const assocId = coverId ?? stagedCoverId;
      if (assocId) {
        try {
          await setCover({ id: newId, body: { asset_id: assocId, alt: alt || null } }).unwrap();
          toast.success("Görsel ilişkilendirildi");
        } catch (e: any) {
          toast.error(e?.data?.message || "Görsel ilişkilendirilemedi");
        }
      }

      toast.success("Aksesuar oluşturuldu");
      navigate("/admin/accessories");
    } catch (e: any) {
      toast.error(e?.data?.message || "Oluşturma başarısız");
    }
  };

  const doUpdate = async () => {
    if (isNew || !id) return;
    if (!name || !category || !material || !price) {
      toast.error("Ad, kategori, malzeme ve fiyat zorunlu");
      return;
    }
    try {
      await updateOne({ id: String(id), body: buildUpdatePayload() }).unwrap();
      toast.success("Aksesuar güncellendi");
      navigate("/admin/accessories");
    } catch (e: any) {
      toast.error(e?.data?.message || "Güncelleme başarısız");
    }
  };

  /** Dosya yükle + storage id ata + mevcut kayıtta anında set */
  const uploadCover = async (file: File): Promise<void> => {
    try {
      const res = await uploadOne({
        file,
        bucket: "accessories",
        folder: `accessories/${id || Date.now()}/cover`,
      }).unwrap();

      const newCoverId = (res as any)?.id as string | undefined;
      if (!newCoverId) {
        toast.error("Yükleme cevabı beklenen formatta değil");
        return;
      }

      setCoverId(newCoverId);
      setStagedCoverId(newCoverId);

      if (!isNew && id) {
        await setCover({ id: String(id), body: { asset_id: newCoverId, alt: alt || null } }).unwrap();
        toast.success("Kapak resmi güncellendi");
      } else {
        toast.success("Kapak yüklendi (kayıt sonrası ilişkilendirilecek)");
      }
    } catch (e: any) {
      toast.error(e?.data?.message || "Kapak yüklenemedi");
    }
  };

  /** Sadece ALT bilgisini güncelle (mevcut kayıtta) */
  const saveAltOnly = async () => {
    if (isNew || !id) return;
    try {
      await setCover({ id: String(id), body: { alt: alt || null } }).unwrap(); // asset_id göndermiyoruz
      toast.success("Alt metin güncellendi");
    } catch (e: any) {
      toast.error(e?.data?.message || "Alt metin güncellenemedi");
    }
  };

  /** Storage kapak kaldır */
  const removeCover = async () => {
    if (isNew) {
      setCoverId(undefined);
      setStagedCoverId(undefined);
      toast.info("Görsel yerelden kaldırıldı (kayıt yok).");
      return;
    }
    if (!id) return;
    try {
      await setCover({ id: String(id), body: { asset_id: null, alt: alt || null } }).unwrap();
      setCoverId(undefined);
      setStagedCoverId(undefined);
      toast.success("Görsel kaldırıldı");
    } catch (e: any) {
      toast.error(e?.data?.message || "Görsel kaldırılamadı");
    }
  };

  if (!isNew && loadingExisting) {
    return <div className="p-4 text-sm text-gray-500">Yükleniyor…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={onBack} className="gap-2">
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

      {/* Temel Bilgiler */}
      <Section title="Temel Bilgiler">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Ad</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aksesuar adı" />
          </div>

          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={slug} readOnly placeholder="name’den otomatik üretilir" />
          </div>

          <div className="space-y-2">
            <Label>Kategori</Label>
            <select
              className="h-10 w-full rounded border px-2"
              value={category}
              onChange={(e) => setCategory(e.target.value as AccKey)}
            >
              <option value="suluk">Suluk</option>
              <option value="sutun">Sütun</option>
              <option value="vazo">Vazo</option>
              <option value="aksesuar">Aksesuar</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Malzeme</Label>
            <Input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Granit / Mermer ..." />
          </div>

          <div className="space-y-2">
            <Label>Fiyat</Label>
            <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Örn: 3.500 ₺" />
          </div>

          <div className="space-y-2">
            <Label>Aktif</Label>
            <div className="flex h-10 items-center">
              <Switch checked={isActive} onCheckedChange={setIsActive} className="data-[state=checked]:bg-emerald-600" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Öne Çıkan</Label>
            <div className="flex h-10 items-center">
              <Switch checked={featured} onCheckedChange={setFeatured} className="data-[state=checked]:bg-amber-500" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sıra</Label>
            <Input
              inputMode="numeric"
              value={String(displayOrder)}
              onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label>Açıklama</Label>
            <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
      </Section>

      {/* Ek Alanlar */}
      <Section title="Ek Alanlar">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>Ölçüler</Label>
            <Input value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="Örn: 30×20×10 cm" />
          </div>
          <div className="space-y-1">
            <Label>Ağırlık</Label>
            <Input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Örn: 2.3 kg" />
          </div>
          <div className="space-y-1">
            <Label>Kalınlık</Label>
            <Input value={thickness} onChange={(e) => setThickness(e.target.value)} placeholder="Örn: 12 mm" />
          </div>
          <div className="space-y-1">
            <Label>Yüzey</Label>
            <Input value={finish} onChange={(e) => setFinish(e.target.value)} placeholder="Örn: Parlak / Mat" />
          </div>
          <div className="space-y-1">
            <Label>Garanti</Label>
            <Input value={warranty} onChange={(e) => setWarranty(e.target.value)} placeholder="Örn: 24 ay" />
          </div>
          <div className="space-y-1">
            <Label>Montaj Süresi</Label>
            <Input value={installationTime} onChange={(e) => setInstallationTime(e.target.value)} placeholder="Örn: 2 saat" />
          </div>
        </div>
      </Section>

      {/* KAPAK GÖRSELİ */}
      <CoverImageSection
        title="Kapak Görseli"
        coverId={coverId}
        stagedCoverId={stagedCoverId}
        imageUrl={imageUrl}
        alt={alt}
        saving={savingImg}
        onPickFile={uploadCover}
        onRemove={removeCover}
        onUrlChange={setImageUrl}
        onAltChange={setAlt}
        onSaveAlt={!isNew && !!id ? saveAltOnly : undefined}
        accept="image/*"
      />
    </div>
  );
}
