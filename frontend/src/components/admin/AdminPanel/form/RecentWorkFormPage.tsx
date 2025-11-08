"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Upload, Link as LinkIcon, Trash2 } from "lucide-react";

import {
  useGetRecentWorkAdminQuery,
  useCreateRecentWorkAdminMutation,
  useUpdateRecentWorkAdminMutation,
  useRemoveRecentWorkAdminMutation,
  useAttachRecentWorkImageAdminMutation,
  useDetachRecentWorkImageAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/recent_works_admin.endpoints";
import { useUploadStorageAssetAdminMutation } from "@/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints";

/* ---------------- Rich Text (Quill) Safe Wrapper ---------------- */
let ReactQuill: any = null;
if (typeof window !== "undefined") {
  try { ReactQuill = require("react-quill"); } catch {}
}
function RichTextEditor({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  if (!ReactQuill) {
    return (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[140px]"
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
            [{ header: [1, 2, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "clean"],
          ],
        }}
      />
    </div>
  );
}

/* ---------------- helpers ---------------- */
const hasText = (s?: string | null) => !!(s && s.trim());
const MAX_DESC = 500;

function htmlToPlain(s: string): string {
  if (!s) return "";
  const noTags = s.replace(/<[^>]*>/g, " ");
  return noTags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
function parseKeywords(input: string): string[] {
  return input.split(/[\n,;]+/g).map((s) => s.trim()).filter(Boolean);
}
function joinKeywords(arr: string[] | undefined): string {
  return (arr ?? []).join(", ");
}
function parseFeatures(input: string): string[] {
  return input.split(/[\n,;,•\-]+/g).map((s) => s.trim()).filter(Boolean);
}
function joinFeatures(arr: string[] | undefined): string {
  return (arr ?? []).join(", ");
}
function slugify(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .replace(/-{2,}/g, "-");
}

/* ========================================================= */
export default function RecentWorkFormPage() {
  const navigate = useNavigate();

  // :id ya da splat(*) desteği
  const routeParams = useParams();
  const paramId =
    (routeParams as any).id ??
    ((routeParams as any)["*"]
      ? String((routeParams as any)["*"]).split("/").filter(Boolean)[0]
      : undefined);

  const isNew = !paramId || paramId === "new";
  const id = !isNew ? (paramId as string) : undefined;

  const { data, isFetching, refetch } = useGetRecentWorkAdminQuery(id!, { skip: isNew });

  const [createRow, { isLoading: creating }] = useCreateRecentWorkAdminMutation();
  const [updateRow, { isLoading: updating }] = useUpdateRecentWorkAdminMutation();
  const [removeRow, { isLoading: removing }] = useRemoveRecentWorkAdminMutation();
  const [attachImage, { isLoading: attaching }] = useAttachRecentWorkImageAdminMutation();
  const [detachImage, { isLoading: detaching }] = useDetachRecentWorkImageAdminMutation();
  const [uploadAsset, { isLoading: uploading }] = useUploadStorageAssetAdminMutation();

  /* ---------------- form state ---------------- */
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [seoText, setSeoText] = useState("");
  const [seoTitle, setSeoTitle] = useState("");           // ✅ SEO Title
  const [seoDescription, setSeoDescription] = useState(""); // ✅ SEO Description
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [material, setMaterial] = useState("");
  const [price, setPrice] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState<number>(0);

  // Details
  const [dimensions, setDimensions] = useState("");
  const [workTime, setWorkTime] = useState("");
  const [featuresText, setFeaturesText] = useState("");
  const [customerReview, setCustomerReview] = useState<string | null>(null);

  // Tek görsel (DB alanları)
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [storageAssetId, setStorageAssetId] = useState<string | null>(null);
  const [alt, setAlt] = useState<string | null>(null);

  // Sadece ÖNİZLEME için lokal URL (upload/attach anında gösterim)
  const [previewTempUrl, setPreviewTempUrl] = useState<string | undefined>(undefined);

  const busy = creating || updating || removing || attaching || detaching || uploading;
  const fileRef = useRef<HTMLInputElement>(null);

  // temp blob URL temizliği
  useEffect(() => {
    return () => {
      if (previewTempUrl && previewTempUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewTempUrl);
      }
    };
  }, [previewTempUrl]);

  // data → form
  useEffect(() => {
    if (!data) {
      if (isNew) {
        setTitle(""); setSlug(""); setDescription("");
        setCategory(""); setSeoText(""); setSeoTitle(""); setSeoDescription("");
        setDate(""); setLocation(""); setMaterial(""); setPrice(null);
        setDimensions(""); setWorkTime(""); setFeaturesText(""); setCustomerReview(null);
        setIsActive(true); setDisplayOrder(0);
        setImageUrl(null); setStorageAssetId(null); setAlt(null);
        setPreviewTempUrl(undefined);
      }
      return;
    }
    setTitle(data.title || "");
    setSlug(data.slug || "");
    setDescription(data.description || "");
    setCategory(data.category || "");
    setSeoText(joinKeywords(data.seo_keywords)); 
    setDate(data.date || "");
    setLocation(data.location || "");
    setMaterial(data.material || "");
    setPrice(typeof data.price === "string" ? data.price : null);
    setIsActive(!!data.is_active);
    setDisplayOrder(typeof data.display_order === "number" ? data.display_order : 0);

    setDimensions(data.details?.dimensions || "");
    setWorkTime(data.details?.workTime || "");
    setFeaturesText(joinFeatures(data.details?.specialFeatures));
    setCustomerReview(
      typeof data.details?.customerReview === "string" ? data.details?.customerReview : null
    );

    setImageUrl(data.image_url ?? null);
    setStorageAssetId(data.storage_asset_id ?? null);
    setAlt(data.alt ?? null);

    if (previewTempUrl && (data.image_effective_url || data.image_url)) {
      setPreviewTempUrl(undefined);
    }
  }, [data, isNew]); // eslint-disable-line react-hooks/exhaustive-deps

  // Önizleme: temp → local state → server
  const previewUrl = useMemo(
    () => (previewTempUrl ?? imageUrl ?? data?.image_effective_url ?? data?.image_url ?? undefined),
    [previewTempUrl, imageUrl, data?.image_effective_url, data?.image_url]
  );

  /* ---------------- handlers ---------------- */
  async function handleSave(e?: React.FormEvent): Promise<void> {
    e?.preventDefault();

    if (!hasText(title)) { toast.error("Başlık zorunlu."); return; }

    const finalSlug = hasText(slug) ? slugify(slug) : slugify(title);
    if (!hasText(slug)) setSlug(finalSlug);

    if (!hasText(description)) { toast.error("Kısa açıklama zorunlu."); return; }
    if (!hasText(category)) { toast.error("Kategori zorunlu."); return; }
    if (!hasText(date)) { toast.error("Yıl/Tarih zorunlu."); return; }
    if (!hasText(location)) { toast.error("Konum zorunlu."); return; }
    if (!hasText(material)) { toast.error("Materyal zorunlu."); return; }
    if (!hasText(dimensions)) { toast.error("Ölçüler zorunlu."); return; }
    if (!hasText(workTime)) { toast.error("Çalışma süresi zorunlu."); return; }

    const descPlain = htmlToPlain(description).slice(0, MAX_DESC);
    const kw = parseKeywords(seoText);
    if (!kw.length) { toast.error("En az bir SEO anahtar kelime girin."); return; }

    const details = {
      dimensions: dimensions.trim(),
      workTime: workTime.trim(),
      specialFeatures: parseFeatures(featuresText),
      customerReview: hasText(customerReview || "") ? (customerReview as string) : null,
    };

    const body: any = {
      title: title.trim(),
      slug: finalSlug,
      description: descPlain,
      category: category.trim(),
      seoTitle: hasText(seoTitle) ? seoTitle.trim() : null,                 // ✅ body
      seoDescription: hasText(seoDescription) ? seoDescription.trim() : null, // ✅ body
      seoKeywords: kw,
      date: date.trim(),
      location: location.trim(),
      material: material.trim(),
      price: hasText(price || "") ? (price as string).trim() : null,
      details,
      is_active: isActive,
      display_order: Number.isFinite(displayOrder) ? displayOrder : 0,
      image_url: imageUrl ?? null,
      storage_asset_id: storageAssetId ?? null,
      alt: hasText(alt || "") ? (alt as string) : null,
    };

    try {
      if (isNew) {
        await createRow(body).unwrap();
        toast.success("Kayıt oluşturuldu.");
      } else {
        await updateRow({ id: id!, body }).unwrap();
        toast.success("Kayıt güncellendi.");
      }
      navigate("/admin", { replace: true });
      return;
    } catch (e: any) {
      const msg = e?.data?.error?.message;
      if (msg === "slug_already_exists") {
        toast.error("Bu slug zaten var. Başlığı veya slug’ı değiştirin.");
        return;
      }
      toast.error(msg || "Kaydetme sırasında hata oluştu.");
      return;
    }
  }

  function onPickFile(): void {
    if (!id) { toast.info("Önce kaydedin, ardından görsel yükleyin."); return; }
    fileRef.current?.click();
  }

  async function onFileChange(ev: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const f = ev.target.files?.[0];
    ev.target.value = "";
    if (!f) return;
    if (!id) { toast.info("Önce kaydedin, ardından görsel yükleyin."); return; }

    // Anında önizleme (blob URL)
    const localUrl = URL.createObjectURL(f);
    // eski blob'u serbest bırak
    if (previewTempUrl?.startsWith("blob:")) URL.revokeObjectURL(previewTempUrl);
    setPreviewTempUrl(localUrl);

    try {
      const asset = await uploadAsset({ file: f, folder: "recent_works" }).unwrap();
      const res = await attachImage({ id, body: { storage_asset_id: asset.id } }).unwrap();

      setImageUrl(res.image_url ?? null);
      setStorageAssetId(res.storage_asset_id ?? asset.id);
      setAlt(res.alt ?? null);

      const assetUrl = (asset as any)?.url || (asset as any)?.public_url;
      if (assetUrl) setPreviewTempUrl(String(assetUrl));

      await refetch();
      toast.success("Görsel yüklendi.");
      return;
    } catch (e: any) {
      toast.error(e?.data?.error?.message || "Görsel yüklenemedi.");
      return;
    }
  }

  async function onAttachByUrl(): Promise<void> {
    if (!id) { toast.info("Önce kaydedin, ardından görsel ekleyin."); return; }
    const url = prompt("Görsel URL’si (https://…)");
    if (!url) return;
    try {
      const res = await attachImage({ id, body: { image_url: url } }).unwrap();
      setImageUrl(res.image_url ?? url);
      setStorageAssetId(res.storage_asset_id ?? null);
      setAlt(res.alt ?? null);
      setPreviewTempUrl(url);
      await refetch();
      toast.success("Görsel bağlandı.");
      return;
    } catch (e: any) {
      toast.error(e?.data?.error?.message || "URL ile bağlanamadı.");
      return;
    }
  }

  async function handleDetachImage(): Promise<void> {
    if (!id) return;
    if (!imageUrl && !storageAssetId) { toast.info("Bu kayda bağlı görsel yok."); return; }
    try {
      const res = await detachImage(id).unwrap();
      setImageUrl(res.image_url ?? null);
      setStorageAssetId(res.storage_asset_id ?? null);
      setAlt(res.alt ?? null);
      setPreviewTempUrl(undefined);
      await refetch();
      toast.success("Görsel kaldırıldı.");
      return;
    } catch (e: any) {
      toast.error(e?.data?.error?.message || "Görsel kaldırılamadı.");
      return;
    }
  }

  async function handleDelete(): Promise<void> {
    if (!id) return;
    if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    try {
      await removeRow(id).unwrap();
      toast.success("Kayıt silindi.");
      navigate("/admin", { replace: true });
      return;
    } catch (e: any) {
      toast.error(e?.data?.error?.message || "Silme sırasında hata oluştu.");
      return;
    }
  }

  /* ---------------- render ---------------- */
  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* gizli file input */}
      <input
        id="recent-work-file-input"
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="sr-only absolute -left-[9999px] -top-[9999px]"
        tabIndex={-1}
        aria-hidden
      />

      <Card className="border border-gray-200 shadow-none">
        <CardHeader className="border-b border-gray-200 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={busy || isFetching}>
                Geri
              </Button>
              <CardTitle className="text-base sm:text-lg">
                {isNew ? "Yeni İş/Çalışma" : "İş/Çalışma Düzenle"}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {!isNew && (
                <Button type="button" variant="destructive" disabled={busy} onClick={handleDelete}>
                  Sil
                </Button>
              )}
              <Button type="submit" disabled={busy}>
                {busy ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Temel alanlar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Başlık</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Şile Mezar Yapım İşleri"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <div className="flex gap-2">
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="ornegin-sile-mezar-yapim"
                />
                <Button type="button" variant="secondary" onClick={() => setSlug(slugify(title))}>
                  Oluştur
                </Button>
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>Kısa Açıklama</Label>
              <RichTextEditor value={description} onChange={setDescription} placeholder="Çalışma hakkında kısa açıklama…" />
              <p className="text-xs text-gray-500">Kaydederken 500 karaktere kısaltılır.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Örn: Şile Mezar Yapım" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Yıl / Tarih</Label>
              <Input id="date" value={date} onChange={(e) => setDate(e.target.value)} placeholder="Örn: 2024" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Konum</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Örn: Şile, İstanbul" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="material">Materyal</Label>
              <Input id="material" value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Örn: Granit" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Fiyat (opsiyonel)</Label>
              <Input id="price" value={price ?? ""} onChange={(e) => setPrice(e.target.value || null)} placeholder="Opsiyonel" />
            </div>

            {/* ✅ SEO Alanları */}
            <div className="md:col-span-2 rounded-md border p-4 space-y-3">
              <h3 className="font-medium">SEO</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="seoTitle">SEO Başlık</Label>
                  <Input id="seoTitle" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Sayfa başlığı (opsiyonel)" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoKeywords">SEO Anahtar Kelimeler</Label>
                  <Textarea
                    id="seoKeywords"
                    value={seoText}
                    onChange={(e) => setSeoText(e.target.value)}
                    placeholder="virgülle/satırla: granit mezar, şile mezar, ..."
                    rows={2}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="seoDesc">SEO Açıklama</Label>
                  <Textarea
                    id="seoDesc"
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder="Meta description (opsiyonel)"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="md:col-span-2 rounded-md border p-4 space-y-3">
              <h3 className="font-medium">Detaylar</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Ölçüler</Label>
                  <Input value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="Örn: 200x100 cm" />
                </div>
                <div className="space-y-2">
                  <Label>Çalışma Süresi</Label>
                  <Input value={workTime} onChange={(e) => setWorkTime(e.target.value)} placeholder="Örn: 3 gün" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Öne Çıkan Özellikler</Label>
                  <Textarea
                    value={featuresText}
                    onChange={(e) => setFeaturesText(e.target.value)}
                    placeholder="Örn: Özel gravür işleme, Dayanıklı malzeme, Profesyonel montaj"
                    rows={2}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Müşteri Yorumu (opsiyonel)</Label>
                  <Textarea
                    value={customerReview ?? ""}
                    onChange={(e) => setCustomerReview(e.target.value || null)}
                    placeholder="Kısa yorum…"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Aktif & Sıra */}
            <div className="space-y-2">
              <Label htmlFor="active">Aktif mi?</Label>
              <div className="flex h-10 items-center rounded-md border px-3">
                <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                <span className="ml-3 text-sm text-gray-600">{isActive ? "Aktif" : "Pasif"}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayOrder">Görünüm Sırası</Label>
              <Input
                id="displayOrder"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Görsel yönetimi (tek görsel) */}
          <div className="rounded-md border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Görsel</h3>
              <div className="text-xs text-gray-500">Tek görsel (services/campaign patern).</div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {/* Preview */}
              <div className="w-[220px] shrink-0">
                <div className="aspect-[4/3] overflow-hidden rounded border bg-gray-50 relative">
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} alt={alt || "recent-work-image"} className="h-full w-full object-cover" />
                      <Button
                        type="button"
                        variant="ghost"
                        className="absolute right-1 top-1 h-8 w-8 p-0 text-red-600"
                        onClick={handleDetachImage}
                        disabled={busy || (!imageUrl && !storageAssetId)}
                        title="Görseli Kaldır"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">Önizleme</div>
                  )}
                </div>
              </div>

              {/* Fields + actions */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onPickFile}
                    disabled={busy || isNew}
                    title={isNew ? "Önce kaydedin" : "Dosyadan yükle"}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Dosyadan Yükle
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={onAttachByUrl}
                    disabled={busy || isNew}
                    title={isNew ? "Önce kaydedin" : "URL ile bağla"}
                  >
                    <LinkIcon className="mr-2 h-4 w-4" />
                    URL ile Bağla
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="text-red-600"
                    onClick={handleDetachImage}
                    disabled={busy || (!imageUrl && !storageAssetId)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Görseli Kaldır
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Alt Metin</Label>
                    <Input value={alt ?? ""} onChange={(e) => setAlt(e.target.value || null)} placeholder="Erişilebilirlik için görsel alt metni" />
                    <p className="text-xs text-gray-500">Alt metin, <b>Kaydet</b> ile güncellenir.</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Bağlı Storage Asset ID</Label>
                    <Input value={storageAssetId ?? ""} readOnly placeholder="—" />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Bağlı Image URL</Label>
                    <Input value={imageUrl ?? ""} readOnly placeholder="—" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alt butonlar */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={busy || isFetching}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={busy}>
              {isNew ? "Oluştur" : "Kaydet"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
