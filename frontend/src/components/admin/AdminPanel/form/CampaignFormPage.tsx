// =============================================================
// FILE: src/components/admin/AdminPanel/form/CampaignFormPage.tsx
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
  useGetCampaignAdminByIdQuery,
  useCreateCampaignAdminMutation,
  useUpdateCampaignAdminMutation,
  useAttachCampaignImageAdminMutation,
  useDetachCampaignImageAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/campaigns_admin.endpoints";

import { useCreateAssetAdminMutation } from "@/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints";
import { Section } from "@/components/admin/AdminPanel/form/sections/shared/Section";
import { CoverImageSection } from "@/components/admin/AdminPanel/form/sections/CoverImageSection";

export default function CampaignFormPage() {
  const { id } = useParams() as { id?: string };
  const isNew = !id || id === "new";
  const navigate = useNavigate();

  const { data: existing, isFetching } = useGetCampaignAdminByIdQuery(String(id ?? ""), { skip: isNew });

  // form state
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [seoKeywordsText, setSeoKeywordsText] = React.useState(""); // virgül/enter ile
  const [isActive, setIsActive] = React.useState(true);

  // image state
  const [imageUrl, setImageUrl] = React.useState<string>("");
  const [alt, setAlt] = React.useState<string>("");
  const [coverId, setCoverId] = React.useState<string | undefined>(undefined);
  const [stagedCoverId, setStagedCoverId] = React.useState<string | undefined>(undefined);

  // mutations
  const [createOne, { isLoading: creating }] = useCreateCampaignAdminMutation();
  const [updateOne, { isLoading: updating }] = useUpdateCampaignAdminMutation();
  const [attachImg, { isLoading: attaching }] = useAttachCampaignImageAdminMutation();
  const [detachImg, { isLoading: detaching }] = useDetachCampaignImageAdminMutation();
  const [uploadOne] = useCreateAssetAdminMutation();

  const saving = creating || updating || attaching || detaching;
  const savingImg = attaching || detaching;

  // hydrate
  React.useEffect(() => {
    if (!isNew && existing) {
      setTitle(existing.title ?? "");
      setDescription(existing.description ?? "");
      setSeoKeywordsText(Array.isArray(existing.seo_keywords) ? existing.seo_keywords.join(", ") : "");
      setIsActive(!!existing.is_active);

      setImageUrl(existing.image_effective_url ?? existing.image_url ?? "");
      setAlt(existing.alt ?? "");
      // mevcut asset_id varsa sakla (opsiyonel alan)
      setCoverId((existing as any).storage_asset_id ?? undefined);
      setStagedCoverId(undefined);
    }
  }, [existing, isNew]);

  const toKeywords = React.useCallback(() => {
    return seoKeywordsText
      .split(/[,\n]/g)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [seoKeywordsText]);

  const onBack = () =>
    window.history.length ? window.history.back() : navigate("/admin/campaigns");

  const buildCreateBody = () => ({
    title,
    description,
    seoKeywords: toKeywords(),
    is_active: isActive,
  });

  const buildUpdateBody = () => ({
    title,
    description,
    seoKeywords: toKeywords(),
    is_active: isActive,
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
    if (!title || !description || toKeywords().length === 0) {
      toast.error("Başlık, açıklama ve en az 1 anahtar kelime zorunlu.");
      return;
    }
    try {
      const created = await createOne(buildCreateBody()).unwrap();
      await afterCreateOrUpdate(String(created.id));
      toast.success("Kampanya oluşturuldu");
      navigate("/admin/campaigns");
    } catch (e: any) {
      toast.error(e?.data?.message || "Oluşturma başarısız");
    }
  };

  const doUpdate = async () => {
    if (isNew || !id) return;
    if (!title || !description || toKeywords().length === 0) {
      toast.error("Başlık, açıklama ve en az 1 anahtar kelime zorunlu.");
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

      toast.success("Kampanya güncellendi");
      navigate("/admin/campaigns");
    } catch (e: any) {
      toast.error(e?.data?.message || "Güncelleme başarısız");
    }
  };

  const uploadCover = async (file: File): Promise<void> => {
    try {
      const res = await uploadOne({
        file,
        bucket: "campaigns",
        folder: `campaigns/${id || Date.now()}/cover`,
      }).unwrap();

      const newCoverId = (res as any)?.id as string | undefined;
      const publicUrl = (res as any)?.url || (res as any)?.public_url;

      if (!newCoverId) {
        toast.error("Yükleme cevabı beklenen formatta değil");
        return;
      }

      setCoverId(newCoverId);
      setStagedCoverId(newCoverId);
      if (publicUrl) setImageUrl(publicUrl); // anlık önizleme

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
      await updateOne({ id: String(id), body: { alt: alt || null } }).unwrap();
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
      await detachImg({ id: String(id) }).unwrap();
      setCoverId(undefined);
      setStagedCoverId(undefined);
      setImageUrl("");
      toast.success("Görsel kaldırıldı");
    } catch (e: any) {
      toast.error(e?.data?.message || "Görsel kaldırılamadı");
    }
  };

  // Dış URL alanını değiştirirken asset önceliğini kapat (URL’ye öncelik ver)
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
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Kampanya başlığı" />
          </div>

          <div className="space-y-2">
            <Label>Aktif</Label>
            <div className="flex h-10 items-center">
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label>Açıklama</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Kısa açıklama" />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label>SEO Keywords (virgül/enter ile)</Label>
            <Textarea rows={2} value={seoKeywordsText} onChange={(e) => setSeoKeywordsText(e.target.value)} placeholder="örn: kampanya, taş, mermer" />
          </div>
        </div>
      </Section>

      <CoverImageSection
        title="Kapak Görseli"
        coverId={coverId}
        stagedCoverId={stagedCoverId}
        imageUrl={imageUrl}
        alt={alt}
        saving={savingImg}
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
