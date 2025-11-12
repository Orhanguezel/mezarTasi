// =============================================================
// FILE: src/components/admin/AdminPanel/form/RecentWorkFormPage.tsx
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
  useGetRecentWorkAdminQuery,
  useCreateRecentWorkAdminMutation,
  useUpdateRecentWorkAdminMutation,
  useAttachRecentWorkImageAdminMutation,
  useDetachRecentWorkImageAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/recent_works_admin.endpoints";
import { useCreateAssetAdminMutation } from "@/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints";

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

export default function RecentWorkFormPage() {
  const { id } = useParams() as { id?: string };
  const isNew = !id || id === "new";
  const navigate = useNavigate();

  const { data: existing, isFetching } = useGetRecentWorkAdminQuery(String(id ?? ""), { skip: isNew });

  // ---- form state
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [autoSlug, setAutoSlug] = React.useState(true);
  const [description, setDescription] = React.useState("");

  const [category, setCategory] = React.useState("");
  const [seoKeywordsText, setSeoKeywordsText] = React.useState("");

  const [date, setDate] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [material, setMaterial] = React.useState("");
  const [price, setPrice] = React.useState<string>("");

  const [dimensions, setDimensions] = React.useState("");
  const [workTime, setWorkTime] = React.useState("");
  const [specialsText, setSpecialsText] = React.useState(""); // virgül/enter
  const [customerReview, setCustomerReview] = React.useState("");

  const [isActive, setIsActive] = React.useState(true);
  const [displayOrder, setDisplayOrder] = React.useState<number>(0);

  // image state
  const [imageUrl, setImageUrl] = React.useState<string>("");
  const [alt, setAlt] = React.useState<string>("");
  const [coverId, setCoverId] = React.useState<string | undefined>(undefined);
  const [stagedCoverId, setStagedCoverId] = React.useState<string | undefined>(undefined);

  // mutations
  const [createOne, { isLoading: creating }] = useCreateRecentWorkAdminMutation();
  const [updateOne, { isLoading: updating }] = useUpdateRecentWorkAdminMutation();
  const [attachImg, { isLoading: attaching }] = useAttachRecentWorkImageAdminMutation();
  const [detachImg, { isLoading: detaching }] = useDetachRecentWorkImageAdminMutation();
  const [uploadOne] = useCreateAssetAdminMutation();

  const saving = creating || updating || attaching || detaching;

  React.useEffect(() => {
    if (!isNew && existing) {
      setTitle(existing.title ?? "");
      setSlug(existing.slug ?? "");
      setDescription(existing.description ?? "");

      setCategory(existing.category ?? "");
      setSeoKeywordsText(Array.isArray(existing.seo_keywords) ? existing.seo_keywords.join(", ") : "");

      setDate(existing.date ?? "");
      setLocation(existing.location ?? "");
      setMaterial(existing.material ?? "");
      setPrice(existing.price ?? "");

      setDimensions(existing.details?.dimensions ?? "");
      setWorkTime(existing.details?.workTime ?? "");
      setSpecialsText(Array.isArray(existing.details?.specialFeatures) ? existing.details!.specialFeatures.join(", ") : "");
      setCustomerReview(existing.details?.customerReview ?? "");

      setIsActive(!!existing.is_active);
      setDisplayOrder(Number(existing.display_order ?? 0));

      setImageUrl(existing.image_effective_url ?? existing.image_url ?? "");
      setAlt(existing.alt ?? "");
      setCoverId((existing as any).storage_asset_id ?? undefined);
      setStagedCoverId(undefined);
    }
  }, [existing, isNew]);

  React.useEffect(() => {
    if (autoSlug) setSlug(slugifyTr(title));
  }, [title, autoSlug]);

  const toKeywords = React.useCallback(
    () => seoKeywordsText.split(/[,\n]/g).map((s) => s.trim()).filter(Boolean),
    [seoKeywordsText]
  );
  const toSpecials = React.useCallback(
    () => specialsText.split(/[,\n]/g).map((s) => s.trim()).filter(Boolean),
    [specialsText]
  );

  const onBack = () =>
    window.history.length ? window.history.back() : navigate("/admin/recent_works");

  const buildCreateBody = () => ({
    title,
    slug,
    description,
    category,
    seoKeywords: toKeywords(),
    date,
    location,
    material,
    price: price ? price : null,
    details: {
      dimensions,
      workTime,
      specialFeatures: toSpecials(),
      customerReview: customerReview ? customerReview : null,
    },
    is_active: isActive,
    display_order: Number(displayOrder) || 0,
  });

  const buildUpdateBody = () => ({
    title,
    slug,
    description,
    category,
    seoKeywords: toKeywords(),
    date,
    location,
    material,
    price: price ? price : null,
    details: {
      dimensions,
      workTime,
      specialFeatures: toSpecials(),
      customerReview: customerReview ? customerReview : null,
    },
    is_active: isActive,
    display_order: Number(displayOrder) || 0,
  });

  const afterCreateOrUpdate = async (theId: string) => {
    const assocId = coverId ?? stagedCoverId;
    try {
      if (assocId) {
        await attachImg({ id: theId, body: { storage_asset_id: assocId, alt: alt || null } }).unwrap();
      } else if (imageUrl) {
        await attachImg({ id: theId, body: { image_url: imageUrl, alt: alt || null } }).unwrap();
      }
    } catch (e: any) {
      toast.error(e?.data?.message || "Görsel ilişkilendirilemedi");
    }
  };

  const doCreate = async () => {
    if (!title || !slug || !description || !category || !date || !location || !material || !dimensions || !workTime) {
      toast.error("Zorunlu alanları doldurun.");
      return;
    }
    try {
      const created = await createOne(buildCreateBody()).unwrap();
      await afterCreateOrUpdate(String(created.id));
      toast.success("Çalışma oluşturuldu");
      navigate("/admin/recent_works");
    } catch (e: any) {
      const msg = e?.data?.error?.message || e?.data?.message;
      if (msg === "slug_already_exists") toast.error("Slug zaten kullanılıyor");
      else toast.error(msg || "Oluşturma başarısız");
    }
  };

  const doUpdate = async () => {
    if (isNew || !id) return;
    if (!title || !slug || !description || !category || !date || !location || !material || !dimensions || !workTime) {
      toast.error("Zorunlu alanları doldurun.");
      return;
    }
    try {
      await updateOne({ id: String(id), body: buildUpdateBody() }).unwrap();

      const assocId = coverId ?? stagedCoverId;
      if (assocId) {
        await attachImg({ id: String(id), body: { storage_asset_id: assocId, alt: alt || null } }).unwrap();
      } else if (imageUrl) {
        await attachImg({ id: String(id), body: { image_url: imageUrl, alt: alt || null } }).unwrap();
      }

      toast.success("Çalışma güncellendi");
      navigate("/admin/recent_works");
    } catch (e: any) {
      const msg = e?.data?.error?.message || e?.data?.message;
      if (msg === "slug_already_exists") toast.error("Slug zaten kullanılıyor");
      else toast.error(msg || "Güncelleme başarısız");
    }
  };

  const uploadCover = async (file: File) => {
    try {
      const res = await uploadOne({
        file,
        bucket: "recent_works",
        folder: `recent_works/${slug || id || Date.now()}/cover`,
      }).unwrap();

      const newCoverId = (res as any)?.id as string | undefined;
      const publicUrl = (res as any)?.url || (res as any)?.public_url;

      if (!newCoverId) {
        toast.error("Yükleme cevabı beklenen formatta değil");
        return;
      }
      setCoverId(newCoverId);
      setStagedCoverId(newCoverId);
      if (publicUrl) setImageUrl(publicUrl);

      if (!isNew && id) {
        await attachImg({ id: String(id), body: { storage_asset_id: newCoverId, alt: alt || null } }).unwrap();
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
      await attachImg({ id: String(id), body: { alt: alt || null } }).unwrap();
      toast.success("Alt metin güncellendi");
    } catch (e: any) {
      toast.error(e?.data?.message || "Alt metin güncellenemedi");
    }
  };

  const removeCover = async () => {
    if (isNew) {
      setCoverId(undefined);
      setStagedCoverId(undefined);
      setImageUrl("");
      toast.info("Görsel yerelden kaldırıldı (kayıt yok).");
      return;
    }
    if (!id) return;
    try {
      await detachImg(String(id)).unwrap();
      setCoverId(undefined);
      setStagedCoverId(undefined);
      setImageUrl("");
      toast.success("Görsel kaldırıldı");
    } catch (e: any) {
      toast.error(e?.data?.message || "Görsel kaldırılamadı");
    }
  };

  const onUrlChange = (v: string) => {
    setImageUrl(v);
    if (v) {
      setCoverId(undefined);
      setStagedCoverId(undefined);
    }
  };

  if (!isNew && isFetching) {
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

      <Section title="Temel Bilgiler">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Başlık</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Çalışma başlığı" />
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
              placeholder="ornek-calisma"
            />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label>Kısa Açıklama</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Kategori</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>SEO Keywords (virgül/enter)</Label>
            <Textarea rows={2} value={seoKeywordsText} onChange={(e) => setSeoKeywordsText(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Tarih</Label>
            <Input value={date} onChange={(e) => setDate(e.target.value)} placeholder="2024-06 gibi" />
          </div>

          <div className="space-y-2">
            <Label>Konum</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Malzeme</Label>
            <Input value={material} onChange={(e) => setMaterial(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Fiyat (opsiyonel)</Label>
            <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="örn: 12.500 ₺" />
          </div>

          <div className="space-y-2">
            <Label>Aktif</Label>
            <div className="flex h-10 items-center">
              <Switch checked={isActive} onCheckedChange={setIsActive} className="data-[state=checked]:bg-emerald-600" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sıra</Label>
            <Input inputMode="numeric" value={String(displayOrder)} onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)} />
          </div>
        </div>
      </Section>

      <Section title="Detaylar">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Ölçüler</Label>
            <Input value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="örn: 80x120 cm" />
          </div>
          <div className="space-y-2">
            <Label>İş Süresi</Label>
            <Input value={workTime} onChange={(e) => setWorkTime(e.target.value)} placeholder="örn: 3 gün" />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label>Özel Özellikler (virgül/enter)</Label>
            <Textarea rows={2} value={specialsText} onChange={(e) => setSpecialsText(e.target.value)} placeholder="Parlak cila, Su tahliye kanalı, ..." />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label>Müşteri Yorumu (opsiyonel)</Label>
            <Textarea rows={3} value={customerReview} onChange={(e) => setCustomerReview(e.target.value)} />
          </div>
        </div>
      </Section>

      <CoverImageSection
        title="Kapak Görseli"
        coverId={coverId}
        stagedCoverId={stagedCoverId}
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
