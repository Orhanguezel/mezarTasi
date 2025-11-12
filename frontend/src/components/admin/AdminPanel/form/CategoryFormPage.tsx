// =============================================================
// FILE: src/components/admin/AdminPanel/form/CategoryFormPage.tsx
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
  useGetCategoryAdminByIdQuery,
  useCreateCategoryAdminMutation,
  useUpdateCategoryAdminMutation,
  useSetCategoryImageAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/categories_admin.endpoints";
import { useCreateAssetAdminMutation } from "@/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints";

import { Section } from "@/components/admin/AdminPanel/form/sections/shared/Section";
import { CoverImageSection } from "@/components/admin/AdminPanel/form/sections/CoverImageSection";

const slugifyTr = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .substring(0, 120);

export default function CategoryFormPage() {
  const { id } = useParams() as { id?: string };
  const isNew = !id || id === "new";
  const navigate = useNavigate();

  const { data: existing, isFetching: loadingExisting } = useGetCategoryAdminByIdQuery(id as string, {
    skip: isNew,
  });

  // form state
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [autoSlug, setAutoSlug] = React.useState(true);
  const [description, setDescription] = React.useState("");

  const [isActive, setIsActive] = React.useState(true);
  const [isFeatured, setIsFeatured] = React.useState(false);
  const [displayOrder, setDisplayOrder] = React.useState<number>(0);

  // image state
  const [imageUrl, setImageUrl] = React.useState<string>("");
  const [alt, setAlt] = React.useState<string>("");
  const [coverId, setCoverId] = React.useState<string | undefined>(undefined);
  const [stagedCoverId, setStagedCoverId] = React.useState<string | undefined>(undefined);

  // mutations
  const [createCategory, { isLoading: creating }] = useCreateCategoryAdminMutation();
  const [updateCategory, { isLoading: updating }] = useUpdateCategoryAdminMutation();
  const [setCategoryImage, { isLoading: savingImg }] = useSetCategoryImageAdminMutation();
  const [uploadOne] = useCreateAssetAdminMutation();

  const saving = creating || updating;

  // hydrate
  React.useEffect(() => {
    if (!isNew && existing) {
      setName(existing.name ?? "");
      setSlug(existing.slug ?? "");
      setDescription(existing.description ?? "");
      setIsActive(!!existing.is_active);
      setIsFeatured(!!existing.is_featured);
      setDisplayOrder(Number(existing.display_order ?? 0));
      setImageUrl(existing.image_url ?? "");
      setCoverId((existing as any).storage_asset_id ?? undefined);
      setAlt((existing as any).alt ?? "");
    }
  }, [existing, isNew]);

  React.useEffect(() => {
    if (autoSlug) setSlug(slugifyTr(name));
  }, [name, autoSlug]);

  const onBack = () =>
    window.history.length ? window.history.back() : navigate("/admin/categories");

  // UpsertCategoryBody: boolean bekler
  const buildPayload = () => ({
    name,
    slug,
    description: description || null,
    image_url: imageUrl || null, // dış url istenirse
    is_active: isActive,
    is_featured: isFeatured,
    display_order: Number(displayOrder) || 0,
  });

  const doCreate = async () => {
    if (!name || !slug) {
      toast.error("Ad ve slug zorunlu");
      return;
    }
    try {
      const created = await createCategory(buildPayload()).unwrap();

      // Storage kapak seçilmişse ilişkilendir
      const assocId = coverId ?? stagedCoverId;
      if (assocId) {
        try {
          await setCategoryImage({
            id: created.id,
            body: { asset_id: assocId, alt: alt || null }, // undefined gönderme
          }).unwrap();
          toast.success("Görsel ilişkilendirildi");
        } catch (e: any) {
          toast.error(e?.data?.message || "Görsel ilişkilendirilemedi");
        }
      }

      toast.success("Kategori oluşturuldu");
      navigate("/admin/categories");
    } catch (e: any) {
      toast.error(e?.data?.message || "Oluşturma başarısız");
    }
  };

  const doUpdate = async () => {
    if (isNew || !id) return;
    if (!name || !slug) {
      toast.error("Ad ve slug zorunlu");
      return;
    }
    try {
      await updateCategory({ id, body: buildPayload() }).unwrap();
      toast.success("Kategori güncellendi");
      navigate("/admin/categories");
    } catch (e: any) {
      toast.error(e?.data?.message || "Güncelleme başarısız");
    }
  };

  /** Section içinden çağrılır: dosya yükle + storage id ata + gerekirse anında ilişkilendir */
  const uploadCover = async (file: File): Promise<void> => {
    try {
      const res = await uploadOne({
        file,
        bucket: "categories",
        folder: `categories/${Date.now()}/cover`,
      }).unwrap();
      const newCoverId = (res as any)?.id as string | undefined;
      if (!newCoverId) {
        toast.error("Yükleme cevabı beklenen formatta değil");
        return;
      }

      setCoverId(newCoverId);
      setStagedCoverId(newCoverId);

      if (!isNew && id) {
        await setCategoryImage({ id, body: { asset_id: newCoverId, alt: alt || null } }).unwrap();
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
      await setCategoryImage({ id, body: { alt: alt || null } }).unwrap(); // asset_id göndermiyoruz
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
      await setCategoryImage({ id, body: { asset_id: null, alt: alt || null } }).unwrap();
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
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kategori adı" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>Slug</Label>
              <label className="flex items-center gap-2 text-xs text-gray-500">
                <Switch
                  checked={autoSlug}
                  onCheckedChange={setAutoSlug}
                  className="data-[state=checked]:bg-indigo-600"
                />
                otomatik
              </label>
            </div>
            <Input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setAutoSlug(false);
              }}
              placeholder="kategori-slug"
            />
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

          <div className="space-y-2">
            <Label>Anasayfa</Label>
            <div className="flex h-10 items-center">
              <Switch
                checked={isFeatured}
                onCheckedChange={setIsFeatured}
                className="data-[state=checked]:bg-amber-500"
              />
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

      {/* KAPAK GÖRSELİ - AYRI SECTION */}
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
