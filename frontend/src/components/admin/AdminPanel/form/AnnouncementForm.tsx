// =============================================================
// FILE: src/components/admin/AdminPanel/form/AnnouncementForm.tsx
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
  useGetAnnouncementAdminByIdQuery,
  useCreateAnnouncementAdminMutation,
  useUpdateAnnouncementAdminMutation,
  useSetAnnouncementImageAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/announcements_admin.endpoints";
import { useCreateAssetAdminMutation } from "@/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints";

import { Section } from "@/components/admin/AdminPanel/form/sections/shared/Section";
import { CoverImageSection } from "@/components/admin/AdminPanel/form/sections/CoverImageSection";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function AnnouncementForm() {
  const { id } = useParams() as { id?: string };
  const isNew = !id || id === "new";
  const navigate = useNavigate();

  const { data: existing, isFetching } = useGetAnnouncementAdminByIdQuery(String(id ?? ""), { skip: isNew });

  // ---- form state
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [content, setContent] = React.useState(""); // düz HTML
  const [iconType, setIconType] = React.useState<"emoji" | "lucide">("emoji");
  const [icon, setIcon] = React.useState("");           // emoji veya generic icon text
  const [lucide, setLucide] = React.useState<string>(""); // icon_type=lucide iken kullan
  const [link, setLink] = React.useState("");

  const [bg, setBg] = React.useState("#F8FAFC");
  const [hoverBg, setHoverBg] = React.useState("#EFF6FF");
  const [iconColor, setIconColor] = React.useState("#0EA5E9");
  const [textColor, setTextColor] = React.useState("#0F172A");
  const [borderColor, setBorderColor] = React.useState("#E2E8F0");

  const [badgeText, setBadgeText] = React.useState<string>("");
  const [badgeColor, setBadgeColor] = React.useState<string>("");
  const [buttonText, setButtonText] = React.useState<string>("");
  const [buttonColor, setButtonColor] = React.useState<string>("");

  const [isActive, setIsActive] = React.useState(true);
  const [isPublished, setIsPublished] = React.useState(true);
  const [displayOrder, setDisplayOrder] = React.useState<number>(1);

  // image state
  const [imageUrl, setImageUrl] = React.useState<string>("");
  const [alt, setAlt] = React.useState<string>("");
  const [coverId, setCoverId] = React.useState<string | undefined>(undefined);
  const [stagedCoverId, setStagedCoverId] = React.useState<string | undefined>(undefined);

  // mutations
  const [createOne, { isLoading: creating }] = useCreateAnnouncementAdminMutation();
  const [updateOne, { isLoading: updating }] = useUpdateAnnouncementAdminMutation();
  const [setImage, { isLoading: settingImg }] = useSetAnnouncementImageAdminMutation();
  const [uploadOne] = useCreateAssetAdminMutation();

  const saving = creating || updating || settingImg;

  // hydrate
  React.useEffect(() => {
    if (!isNew && existing) {
      setTitle(existing.title ?? "");
      setDescription(existing.description ?? "");
      setContent(existing.html ?? existing.content ?? ""); // güvenli
      setIconType((existing.icon_type as any) === "lucide" ? "lucide" : "emoji");
      setIcon(existing.icon ?? "");
      setLucide((existing as any).lucide_icon ?? "");
      setLink(existing.link ?? "");

      setBg(existing.bg_color ?? "");
      setHoverBg(existing.hover_color ?? "");
      setIconColor(existing.icon_color ?? "");
      setTextColor(existing.text_color ?? "");
      setBorderColor(existing.border_color ?? "");

      setBadgeText(existing.badge_text ?? "");
      setBadgeColor(existing.badge_color ?? "");
      setButtonText(existing.button_text ?? "");
      setButtonColor(existing.button_color ?? "");

      setIsActive(!!existing.is_active);
      setIsPublished(!!existing.is_published);
      setDisplayOrder(Number(existing.display_order ?? 1));

      setImageUrl((existing as any).image_url ?? "");
      setAlt((existing as any).alt ?? "");
      setCoverId((existing as any).storage_asset_id ?? undefined);
      setStagedCoverId(undefined);
    }
  }, [existing, isNew]);

  const onBack = () =>
    window.history.length ? window.history.back() : navigate("/admin/announcements");

  // build body for create/update
  const buildBody = () => ({
    title,
    description,
    content, // DÜZ HTML
    icon,
    icon_type: iconType,
    lucide_icon: iconType === "lucide" ? (lucide || null) : null,
    link,

    bg_color: bg,
    hover_color: hoverBg,
    icon_color: iconColor,
    text_color: textColor,
    border_color: borderColor,

    badge_text: badgeText || null,
    badge_color: badgeColor || null,
    button_text: buttonText || null,
    button_color: buttonColor || null,

    is_active: isActive,
    is_published: isPublished,
    display_order: Number(displayOrder) || 1,

    // görsel alanları opsiyonel patch'lerle ayrıca SET IMAGE uçlarından yönetilecek
    // create/update’ye image göndermeye gerek yok ama istersen aynı isimlerle gönderebilirsin
  });

  const afterCreateOrUpdate = async (theId: string) => {
    const assocId = coverId ?? stagedCoverId;
    try {
      if (assocId) {
        await setImage({ id: theId, body: { storage_asset_id: assocId, alt: alt || null } }).unwrap();
      } else if (imageUrl) {
        await setImage({ id: theId, body: { image_url: imageUrl, alt: alt || null } }).unwrap();
      }
    } catch (e: any) {
      toast.error(e?.data?.message || "Görsel ilişkilendirilemedi");
    }
  };

  const doCreate = async () => {
    if (!title || !description || !content || !icon || !link) {
      toast.error("Başlık, açıklama, içerik, ikon ve link zorunlu.");
      return;
    }
    try {
      const created = await createOne(buildBody()).unwrap();
      await afterCreateOrUpdate(String(created.id));
      toast.success("Duyuru oluşturuldu");
      navigate("/admin/announcements");
    } catch (e: any) {
      toast.error(e?.data?.message || "Oluşturma başarısız");
    }
  };

  const doUpdate = async () => {
    if (isNew || !id) return;
    if (!title || !description || !content || !icon || !link) {
      toast.error("Başlık, açıklama, içerik, ikon ve link zorunlu.");
      return;
    }
    try {
      await updateOne({ id: String(id), patch: buildBody() }).unwrap();

      const assocId = coverId ?? stagedCoverId;
      if (assocId) {
        await setImage({ id: String(id), body: { storage_asset_id: assocId, alt: alt || null } }).unwrap();
      } else if (imageUrl) {
        await setImage({ id: String(id), body: { image_url: imageUrl, alt: alt || null } }).unwrap();
      }

      toast.success("Duyuru güncellendi");
      navigate("/admin/announcements");
    } catch (e: any) {
      toast.error(e?.data?.message || "Güncelleme başarısız");
    }
  };

  const uploadCover = async (file: File) => {
    try {
      const res = await uploadOne({
        file,
        bucket: "announcements",
        folder: `announcements/${id || Date.now()}/cover`,
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
        await setImage({ id: String(id), body: { storage_asset_id: newCoverId, alt: alt || null } }).unwrap();
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
      await setImage({ id: String(id), body: { alt: alt || null } }).unwrap();
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
      await setImage({ id: String(id), body: { storage_asset_id: null, image_url: null, alt: alt || null } }).unwrap();
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
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Duyuru başlığı" />
          </div>
          <div className="space-y-2">
            <Label>Aktif</Label>
            <div className="flex h-10 items-center">
              <Switch checked={isActive} onCheckedChange={setIsActive} className="data-[state=checked]:bg-emerald-600" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Yayınlandı</Label>
            <div className="flex h-10 items-center">
              <Switch checked={isPublished} onCheckedChange={setIsPublished} className="data-[state=checked]:bg-indigo-600" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Sıra</Label>
            <Input inputMode="numeric" value={String(displayOrder)} onChange={(e) => setDisplayOrder(Number(e.target.value) || 1)} />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label>Kısa Açıklama</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label>İçerik (HTML)</Label>
            <ReactQuill theme="snow" value={content} onChange={setContent} />
          </div>
        </div>
      </Section>

      <Section title="İkon ve Link">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Icon Type</Label>
            <select
              className="h-10 w-full rounded border px-2"
              value={iconType}
              onChange={(e) => setIconType(e.target.value as any)}
            >
              <option value="emoji">emoji</option>
              <option value="lucide">lucide</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>{iconType === "emoji" ? "Emoji" : "Icon Name"}</Label>
            <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder={iconType === "emoji" ? "🚀" : "Megaphone"} />
          </div>
          {iconType === "lucide" && (
            <div className="space-y-2">
              <Label>Lucide Icon</Label>
              <Input value={lucide} onChange={(e) => setLucide(e.target.value)} placeholder="megaphone" />
            </div>
          )}
          <div className="sm:col-span-3 space-y-2">
            <Label>Link</Label>
            <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/kampanyalar" />
          </div>
        </div>
      </Section>

      <Section title="Renkler">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          <div className="space-y-2"><Label>BG</Label><Input value={bg} onChange={(e) => setBg(e.target.value)} /></div>
          <div className="space-y-2"><Label>Hover</Label><Input value={hoverBg} onChange={(e) => setHoverBg(e.target.value)} /></div>
          <div className="space-y-2"><Label>Icon</Label><Input value={iconColor} onChange={(e) => setIconColor(e.target.value)} /></div>
          <div className="space-y-2"><Label>Text</Label><Input value={textColor} onChange={(e) => setTextColor(e.target.value)} /></div>
          <div className="space-y-2"><Label>Border</Label><Input value={borderColor} onChange={(e) => setBorderColor(e.target.value)} /></div>
        </div>
      </Section>

      <Section title="Badge / Button">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Badge Text</Label><Input value={badgeText} onChange={(e) => setBadgeText(e.target.value)} /></div>
          <div className="space-y-2"><Label>Badge Color</Label><Input value={badgeColor} onChange={(e) => setBadgeColor(e.target.value)} /></div>
          <div className="space-y-2"><Label>Button Text</Label><Input value={buttonText} onChange={(e) => setButtonText(e.target.value)} /></div>
          <div className="space-y-2"><Label>Button Color</Label><Input value={buttonColor} onChange={(e) => setButtonColor(e.target.value)} /></div>
        </div>
      </Section>

      <CoverImageSection
        title="Kapak Görseli"
        coverId={coverId}
        stagedCoverId={stagedCoverId}
        imageUrl={imageUrl}
        alt={alt}
        saving={settingImg}
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
