// src/components/admin/AdminPanel/form/CampaignFormPage.tsx
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
  useGetCampaignAdminByIdQuery,
  useCreateCampaignAdminMutation,
  useUpdateCampaignAdminMutation,
  useDeleteCampaignAdminMutation,
  useAttachCampaignImageAdminMutation,
  useDetachCampaignImageAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/campaigns_admin.endpoints";
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
function parseKeywords(input: string): string[] {
  return input.split(/[\n,;]+/g).map((s) => s.trim()).filter(Boolean);
}
function joinKeywords(arr: string[] | undefined): string { return (arr ?? []).join(", "); }
// Quill HTML → düz metin (DB varchar(500) için)
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
const MAX_DESC = 500;

/* ========================================================= */
export default function CampaignFormPage() {
  const navigate = useNavigate();

  // ID’yi hem :id paramından hem de splat(*)’ten güvenli oku
  const routeParams = useParams();
  const paramId =
    (routeParams as any).id ??
    ((routeParams as any)["*"]
      ? String((routeParams as any)["*"]).split("/").filter(Boolean)[0]
      : undefined);

  const isNew = !paramId || paramId === "new";
  const id = !isNew ? (paramId as string) : undefined;

  const { data, isFetching, refetch } = useGetCampaignAdminByIdQuery(id!, {
    skip: isNew,
  });

  const [createCampaign, { isLoading: creating }] = useCreateCampaignAdminMutation();
  const [updateCampaign, { isLoading: updating }] = useUpdateCampaignAdminMutation();
  const [deleteCampaign, { isLoading: deleting }] = useDeleteCampaignAdminMutation();
  const [attachImage, { isLoading: attaching }] = useAttachCampaignImageAdminMutation();
  const [detachImage, { isLoading: detaching }] = useDetachCampaignImageAdminMutation();
  const [uploadAsset, { isLoading: uploading }] = useUploadStorageAssetAdminMutation();

  /* ---------------- form state ---------------- */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(""); // Quill HTML
  const [seoText, setSeoText] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Tek görsel pattern
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [storageAssetId, setStorageAssetId] = useState<string | null>(null);
  const [alt, setAlt] = useState<string | null>(null);

  const busy = creating || updating || deleting || attaching || detaching || uploading;

  // file input
  const fileRef = useRef<HTMLInputElement>(null);

  // data → form
  useEffect(() => {
    if (!data) {
      if (isNew) {
        setTitle(""); setDescription(""); setSeoText(""); setIsActive(true);
        setImageUrl(null); setStorageAssetId(null); setAlt(null);
      }
      return;
    }
    setTitle(data.title || "");
    setDescription(data.description || "");
    setSeoText(joinKeywords(data.seo_keywords));
    setIsActive(!!data.is_active);
    setImageUrl(data.image_url ?? null);
    setStorageAssetId(data.storage_asset_id ?? null);
    setAlt(data.alt ?? null);
  }, [data, isNew]);

  const previewUrl = useMemo(
    () => (data?.image_effective_url ?? imageUrl ?? undefined),
    [data?.image_effective_url, imageUrl]
  );

  /* ---------------- handlers ---------------- */
  async function handleSave(e?: React.FormEvent) {
    e?.preventDefault();
    if (!hasText(title)) return toast.error("Başlık zorunlu.");
    if (!hasText(description)) return toast.error("Kısa açıklama zorunlu.");

    const descPlain = htmlToPlain(description).slice(0, MAX_DESC);
    const kw = parseKeywords(seoText);
    if (!kw.length) return toast.error("En az bir SEO anahtar kelime girin.");

    const body = {
      title: title.trim(),
      description: descPlain,
      seoKeywords: kw,
      is_active: isActive,
      image_url: imageUrl ?? null,
      storage_asset_id: storageAssetId ?? null,
      alt: hasText(alt || "") ? (alt as string) : null,
    };

    try {
      if (isNew) {
        await createCampaign(body).unwrap();
        toast.success("Kampanya oluşturuldu.");
      } else {
        await updateCampaign({ id: id!, body }).unwrap();
        toast.success("Kampanya güncellendi.");
      }
      // toast görünür kalsın → kısa gecikme ile /admin
      setTimeout(() => navigate("/admin", { replace: true }), 500);
    } catch (e: any) {
      toast.error(e?.data?.error?.message || "Kaydetme sırasında hata oluştu.");
    }
  }

  async function onFileChange(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0];
    ev.target.value = "";
    if (!f) return;
    if (!id) return toast.info("Önce kampanyayı kaydedin, ardından görsel yükleyin.");
    try {
      const asset = await uploadAsset({ file: f, folder: "campaigns" }).unwrap();
      const res = await attachImage({ id, body: { storage_asset_id: asset.id } }).unwrap();
      setImageUrl(res.image_url ?? null);
      setStorageAssetId(res.storage_asset_id ?? null);
      setAlt(res.alt ?? null);
      toast.success("Görsel yüklendi.");
    } catch (e: any) {
      toast.error(e?.data?.error?.message || "Görsel yüklenemedi.");
    }
  }

  async function onAttachByUrl() {
    if (!id) return toast.info("Önce kampanyayı kaydedin, ardından görsel ekleyin.");
    const url = prompt("Görsel URL’si (https://…)");
    if (!url) return;
    try {
      const res = await attachImage({ id, body: { image_url: url } }).unwrap();
      setImageUrl(res.image_url ?? null);
      setStorageAssetId(res.storage_asset_id ?? null);
      setAlt(res.alt ?? null);
      toast.success("Görsel bağlandı.");
    } catch (e: any) {
      toast.error(e?.data?.error?.message || "URL ile bağlanamadı.");
    }
  }

  async function handleDetachImage() {
    if (!id) return;
    if (!imageUrl && !storageAssetId) return toast.info("Bu kayda bağlı görsel yok.");
    try {
      const res = await detachImage({ id }).unwrap();
      setImageUrl(res.image_url ?? null);
      setStorageAssetId(res.storage_asset_id ?? null);
      setAlt(res.alt ?? null);
      toast.success("Görsel kaldırıldı.");
    } catch (e: any) {
      toast.error(e?.data?.error?.message || "Görsel kaldırılamadı.");
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (!confirm("Bu kampanyayı silmek istediğinize emin misiniz?")) return;
    try {
      await deleteCampaign(id).unwrap();
      toast.success("Kampanya silindi.");
      setTimeout(() => navigate("/admin", { replace: true }), 400);
    } catch (e: any) {
      toast.error(e?.data?.error?.message || "Silme sırasında hata oluştu.");
    }
  }

  /* ---------------- render ---------------- */
  return (
    <form onSubmit={handleSave} className="space-y-6">
      <input
        id="campaign-file-input"
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
                {isNew ? "Yeni Kampanya" : "Kampanya Düzenle"}
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
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn: Mermer Mezar Taşları %25 İndirim" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="active">Aktif mi?</Label>
              <div className="flex h-10 items-center rounded-md border px-3">
                <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                <span className="ml-3 text-sm text-gray-600">{isActive ? "Aktif" : "Pasif"}</span>
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>Kısa Açıklama</Label>
              <RichTextEditor value={description} onChange={setDescription} placeholder="Kampanya açıklaması..." />
              <p className="text-xs text-gray-500">Kaydederken 500 karaktere kısaltılır (etiketler temizlenir).</p>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="seo">SEO Anahtar Kelimeler</Label>
              <Textarea id="seo" value={seoText} onChange={(e) => setSeoText(e.target.value)} placeholder="virgülle ayırın: mezar bakımı, mermer mezar, yaz kampanyası" rows={2} />
              <p className="text-xs text-gray-500">Virgül, noktalı virgül veya satır sonuyla ayırabilirsiniz (en az 1 kelime).</p>
            </div>
          </div>

          {/* Görsel yönetimi */}
          <div className="rounded-md border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Görsel</h3>
              <div className="text-xs text-gray-500">Tek görsel (services patern).</div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="w-[220px] shrink-0">
                <div className="aspect-[4/3] overflow-hidden rounded border bg-gray-50 relative">
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} alt={alt || "campaign-image"} className="h-full w-full object-cover" />
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

              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <label htmlFor="campaign-file-input">
                    <Button type="button" asChild variant="secondary" disabled={busy || isNew} title={isNew ? "Önce kaydedin" : "Dosyadan yükle"}>
                      <span className="inline-flex items-center"><Upload className="mr-2 h-4 w-4" />Dosyadan Yükle</span>
                    </Button>
                  </label>

                  <Button type="button" variant="outline" onClick={onAttachByUrl} disabled={busy || isNew} title={isNew ? "Önce kaydedin" : "URL ile bağla"}>
                    <LinkIcon className="mr-2 h-4 w-4" /> URL ile Bağla
                  </Button>

                  <Button type="button" variant="ghost" className="text-red-600" onClick={handleDetachImage} disabled={busy || (!imageUrl && !storageAssetId)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Görseli Kaldır
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
            <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={busy || isFetching}>Vazgeç</Button>
            <Button type="submit" disabled={busy}>{isNew ? "Oluştur" : "Kaydet"}</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
