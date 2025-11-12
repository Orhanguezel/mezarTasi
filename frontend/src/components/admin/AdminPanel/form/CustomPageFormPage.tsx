// =============================================================
// FILE: src/components/admin/AdminPanel/form/CustomPageFormPage.tsx
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
  useGetCustomPageAdminByIdQuery,
  useCreateCustomPageAdminMutation,
  useUpdateCustomPageAdminMutation,
  useSetCustomPageImageAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/custom_pages_admin.endpoints";

import { useCreateAssetAdminMutation } from "@/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints";

import { Section } from "@/components/admin/AdminPanel/form/sections/shared/Section";
import { CoverImageSection } from "@/components/admin/AdminPanel/form/sections/CoverImageSection";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const slugifyTr = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .substring(0, 120);

export default function CustomPageFormPage() {
  const { id } = useParams() as { id?: string };
  const isNew = !id || id === "new";
  const navigate = useNavigate();

  const { data: existing, isFetching: loadingExisting } = useGetCustomPageAdminByIdQuery(String(id ?? ""), {
    skip: isNew,
  });

  // --- form state
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [autoSlug, setAutoSlug] = React.useState(true);

  const [content, setContent] = React.useState("");
  const [metaTitle, setMetaTitle] = React.useState("");
  const [metaDesc, setMetaDesc] = React.useState("");
  const [isPublished, setIsPublished] = React.useState(false);

  // image state
  const [imageUrl, setImageUrl] = React.useState<string>("");
  const [alt, setAlt] = React.useState<string>("");
  const [coverId, setCoverId] = React.useState<string | undefined>(undefined);
  const [stagedCoverId, setStagedCoverId] = React.useState<string | undefined>(undefined);

  // mutations
  const [createOne, { isLoading: creating }] = useCreateCustomPageAdminMutation();
  const [updateOne, { isLoading: updating }] = useUpdateCustomPageAdminMutation();
  const [setCover, { isLoading: savingImg }] = useSetCustomPageImageAdminMutation();
  const [uploadOne] = useCreateAssetAdminMutation();

  const saving = creating || updating;

  // --- hydrate
  React.useEffect(() => {
    if (!isNew && existing) {
      setTitle(existing.title ?? "");
      setSlug(existing.slug ?? "");
      setContent(existing.content ?? "");
      setMetaTitle(existing.meta_title ?? "");
      setMetaDesc(existing.meta_description ?? "");
      setIsPublished(!!existing.is_published);

      setImageUrl(existing.image_effective_url ?? existing.image_url ?? "");
      setAlt(existing.alt ?? "");

      setCoverId(undefined);
      setStagedCoverId(undefined);
    }
  }, [existing, isNew]);

  React.useEffect(() => {
    if (autoSlug) setSlug(slugifyTr(title));
  }, [title, autoSlug]);

  const onBack = () =>
    window.history.length ? window.history.back() : navigate("/admin/pages");

  // ✅ Navigasyonu deterministik yapan helper (microtask + hard fallback)
  const gotoAdminRoot = React.useCallback(() => {
    const to = "/admin";
    // 1) microtask: SPA navigate
    (typeof queueMicrotask === "function"
      ? queueMicrotask
      : (fn: () => void) => Promise.resolve().then(fn))(() => {
      try {
        navigate(to, { replace: true });
      } catch {}
    });
    // 2) macrotask fallback: nadiren router stuck olursa tam sayfa geçiş
    setTimeout(() => {
      try {
        if (window.location.pathname !== to) {
          window.location.assign(to);
        }
      } catch {
        // no-op
      }
    }, 0);
  }, [navigate]);

  // --- payload builders
  const buildCreatePayload = () => ({
    title,
    slug,
    content,
    meta_title: metaTitle || null,
    meta_description: metaDesc || null,
    is_published: isPublished,
  });

  const buildUpdatePayload = () => ({
    title,
    slug,
    content,
    meta_title: metaTitle || null,
    meta_description: metaDesc || null,
    is_published: isPublished,
  });

  // --- actions
  const doCreate = async () => {
    if (!title || !slug || !content) {
      toast.error("Başlık, slug ve içerik zorunlu");
      return;
    }
    try {
      const created = await createOne(buildCreatePayload()).unwrap();
      const newId = String(created.id);

      // Opsiyonel: kapak
      const assocId = coverId ?? stagedCoverId;
      try {
        if (assocId) {
          await setCover({ id: newId, body: { asset_id: assocId, alt: alt || null } }).unwrap();
        } else if (imageUrl) {
          await setCover({ id: newId, body: { asset_id: null, image_url: imageUrl, alt: alt || null } }).unwrap();
        }
      } catch (e: any) {
        toast.error(e?.data?.message || "Görsel ilişkilendirilemedi");
      }

      toast.success("Sayfa oluşturuldu");
      gotoAdminRoot(); // ✅
      return;
    } catch (e: any) {
      toast.error(e?.data?.message || "Oluşturma başarısız");
    }
  };

  const doUpdate = async () => {
    if (isNew || !id) return;
    if (!title || !slug || !content) {
      toast.error("Başlık, slug ve içerik zorunlu");
      return;
    }
    try {
      await updateOne({ id: String(id), body: buildUpdatePayload() }).unwrap();

      const assocId = coverId ?? stagedCoverId;
      if (assocId) {
        await setCover({ id: String(id), body: { asset_id: assocId, alt: alt || null } }).unwrap();
      } else if (imageUrl) {
        await setCover({ id: String(id), body: { asset_id: null, image_url: imageUrl, alt: alt || null } }).unwrap();
      }

      toast.success("Sayfa güncellendi");
      gotoAdminRoot(); // ✅
      return;
    } catch (e: any) {
      toast.error(e?.data?.message || "Güncelleme başarısız");
    }
  };

  // --- upload & image helpers
  const uploadCover = async (file: File): Promise<void> => {
    try {
      const res = await uploadOne({
        file,
        bucket: "custom_pages",
        folder: `custom_pages/${id || Date.now()}/cover`,
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

  const saveAltOnly = async () => {
    if (isNew || !id) return;
    try {
      await setCover({ id: String(id), body: { alt: alt || null } }).unwrap();
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
      await setCover({ id: String(id), body: { asset_id: null, image_url: null, alt: alt || null } }).unwrap();
      setCoverId(undefined);
      setStagedCoverId(undefined);
      setImageUrl("");
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
        <Button type="button" variant="secondary" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Geri
        </Button>
        {isNew ? (
          <Button
            type="button"
            onClick={doCreate}
            disabled={saving}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="h-4 w-4" />
            Oluştur
          </Button>
        ) : (
          <Button
            type="button"
            onClick={doUpdate}
            disabled={saving}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="h-4 w-4" />
            Kaydet
          </Button>
        )}
      </div>

      {/* Temel Bilgiler */}
      <Section title="Temel Bilgiler">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Başlık</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sayfa başlığı" />
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
              placeholder="sayfa-slug"
            />
          </div>

          <div className="space-y-2">
            <Label>Yayında</Label>
            <div className="flex h-10 items-center">
              <Switch
                checked={isPublished}
                onCheckedChange={setIsPublished}
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Meta Title</Label>
            <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Opsiyonel" />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label>Meta Description</Label>
            <Textarea rows={3} value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} placeholder="Opsiyonel" />
          </div>
        </div>
      </Section>

      {/* İçerik */}
      <Section title="İçerik (HTML)">
        <div className="space-y-2">
          <ReactQuill theme="snow" value={content} onChange={setContent} />
        </div>
      </Section>

      {/* Kapak */}
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
