"use client";

import React, { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trash2, ImagePlus, Upload, Download, Eye, Code, PencilLine } from "lucide-react";

import {
  useGetCustomPageAdminByIdQuery,
  useCreateCustomPageAdminMutation,
  useUpdateCustomPageAdminMutation,
  useSetCustomPageFeaturedImageAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/custom_pages_admin.endpoints";
import type { UpsertCustomPageBody } from "@/integrations/metahub/db/types/customPages";
import { useUploadStorageAssetAdminMutation } from "@/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints";

const ReactQuill = lazy(() => import("react-quill"));
import "react-quill/dist/quill.snow.css";

/* ================= Types & Utils ================= */
type FormState = {
  title: string;
  slug: string;
  content: string;
  meta_title: string;
  meta_description: string;
  is_published: boolean;
  featured_image: string | null;
  featured_image_asset_id: string | null; // ★ eklendi
  featured_image_alt: string;
};

const slugify = (v: string) =>
  v.toString().trim().toLowerCase()
    .replace(/^[\/]+/, "")
    .replace(/[^a-z0-9ğüşöçı\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const pickUrlAndId = (res: any) => {
  const url =
    res?.url ||
    res?.public_url ||
    res?.data?.url ||
    res?.asset?.url ||
    res?.file?.url ||
    (res?.path && res?.bucket
      ? `${(import.meta.env.VITE_PUBLIC_API_ORIGIN ?? "").toString().replace(/\/$/, "")}/storage/${encodeURIComponent(res.bucket)}/${encodeURIComponent(res.path).replace(/%2F/g, "/")}`
      : null);

  const id =
    res?.asset_id ||
    res?.id ||
    res?.data?.id ||
    res?.asset?.id ||
    res?.file?.id ||
    null;

  return { url, id } as { url: string | null; id: string | null };
};

function extractHtmlFromAny(raw: unknown): string {
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as any;
      if (parsed && typeof parsed === "object" && typeof parsed.html === "string") {
        return parsed.html as string;
      }
      return raw;
    } catch { return raw; }
  }
  if (raw && typeof raw === "object" && typeof (raw as any).html === "string") {
    return (raw as any).html as string;
  }
  return String(raw ?? "");
}

/* ========== küçük yardımcılar ========== */
const validateImageFile = (file: File, maxMB = 10) => {
  const okByMime = !!file.type && file.type.startsWith("image/");
  const okByExt = /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name || "");
  if (!okByMime && !okByExt) { toast.error("Lütfen bir görsel seçin"); return false; }
  if (file.size > maxMB * 1024 * 1024) { toast.error(`Maksimum ${maxMB}MB`); return false; }
  return true;
};

export default function CustomPageFormPage() {
  const nav = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const location = useLocation();

  // 0) Global sürükle-bırak navigasyonunu engelle
  useEffect(() => {
    const prevent = (e: DragEvent | Event) => { e.preventDefault(); e.stopPropagation(); };
    window.addEventListener("dragover", prevent, { passive: false });
    window.addEventListener("drop", prevent,   { passive: false });
    return () => {
      window.removeEventListener("dragover", prevent as any);
      window.removeEventListener("drop", prevent as any);
    };
  }, []);

  const initialFromState = (location.state as any)?.initialValue as
    | Partial<FormState> & { id?: string }
    | undefined;

  const { data: serverRow } = useGetCustomPageAdminByIdQuery(id!, {
    skip: !isEdit,
    refetchOnMountOrArgChange: true,
  });

  const [createPage, { isLoading: creating }] = useCreateCustomPageAdminMutation();
  const [updatePage, { isLoading: updating }] = useUpdateCustomPageAdminMutation();
  const [setFeatured, { isLoading: settingImage }] = useSetCustomPageFeaturedImageAdminMutation();
  const [uploadAsset, { isLoading: uploading }] = useUploadStorageAssetAdminMutation();

  const [form, setForm] = useState<FormState>({
    title: initialFromState?.title ?? "",
    slug: initialFromState?.slug ?? "",
    content: initialFromState?.content ?? "",
    meta_title: initialFromState?.meta_title ?? "",
    meta_description: initialFromState?.meta_description ?? "",
    is_published: initialFromState?.is_published ?? true,
    featured_image: initialFromState?.featured_image ?? null,
    featured_image_asset_id: null,
    featured_image_alt: initialFromState?.featured_image_alt ?? "",
  });

  // create akışında upload’tan dönen id/url’ü saklamak için
  const pendingAssetRef = useRef<{ asset_id: string; url: string } | null>(null);

  useEffect(() => {
    if (!serverRow) return;
    setForm((p) => ({
      ...p,
      title: p.title || serverRow.title || "",
      slug: p.slug || serverRow.slug || "",
      content: extractHtmlFromAny(serverRow.content),
      meta_title: serverRow.meta_title ?? "",
      meta_description: serverRow.meta_description ?? "",
      is_published: !!serverRow.is_published,
      featured_image: (serverRow as any).featured_image ?? null,
      featured_image_asset_id: (serverRow as any).featured_image_asset_id ?? null,
      featured_image_alt: (serverRow as any).featured_image_alt ?? "",
    }));
  }, [serverRow]);

  // Quill
  const quillRef = useRef<any>(null);
  const htmlFileInputRef = useRef<HTMLInputElement>(null);
  const quillImageInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Quill toolbar (çalışan örnekle aynı mantık)
  const quillModules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          [{ list: "ordered" }, { list: "bullet" }],
          ["blockquote", "code-block"],
          ["link", "image"],
          ["clean"],
        ],
        handlers: {
          image: () => {
            if (quillImageInputRef.current) quillImageInputRef.current.value = "";
            quillImageInputRef.current?.click();
          },
        },
      },
      clipboard: { matchVisual: false },
    }),
    []
  );

  const quillFormats = [
    "header","bold","italic","underline","strike","color","background",
    "align","list","bullet","blockquote","code-block","link","image",
  ];

  // Storage helper (çalışan örnekle aynı imza: bucket göndermiyoruz)
  const uploadToStorage = async (file: File, folder = "pages") => {
    const res: any = await uploadAsset({ file, folder }).unwrap();
    const { url, id } = pickUrlAndId(res);
    if (!url) throw new Error("upload_failed_no_url");
    return { url, id };
  };

  const saving = creating || updating || uploading || settingImage;

  /* ---------- Kapak görseli yükleme (URL + id state’e) ---------- */
  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateImageFile(file, 10)) { if (coverInputRef.current) coverInputRef.current.value = ""; return; }
    try {
      const { url, id } = await uploadToStorage(file, isEdit ? `pages/${id}` : "pages/tmp");
      setForm((s) => ({
        ...s,
        featured_image: url,
        featured_image_asset_id: (id as string) || s.featured_image_asset_id,
      }));
      if (isEdit && id && url) {
        await setFeatured({ id: id!, body: { asset_id: id, image_url: url } }).unwrap();
      } else if (id && url) {
        pendingAssetRef.current = { asset_id: id, url };
      }
      toast.success("Kapak görseli yüklendi");
    } catch (err: any) {
      toast.error(err?.data?.error?.message ?? "Kapak görseli yüklenemedi");
    } finally {
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const removeImage = async (): Promise<void> => {
    try {
      setForm((p) => ({ ...p, featured_image: null, featured_image_asset_id: null }));
      pendingAssetRef.current = null;
      if (isEdit) {
        await setFeatured({ id: id!, body: { asset_id: null } }).unwrap();
      }
      toast.success("Görsel kaldırıldı");
    } catch (e: any) {
      toast.error(e?.data?.error?.message ?? "Kaldırma başarısız");
    }
  };

  /* ---------- Quill içine görsel yükle & embed (URL) ---------- */
  const handleQuillImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateImageFile(file, 5)) { if (quillImageInputRef.current) quillImageInputRef.current.value = ""; return; }
    try {
      const { url } = await uploadToStorage(file, "pages/content");
      const quill = quillRef.current?.getEditor?.();
      if (quill) {
        quill.focus();
        const range = quill.getSelection(true);
        const index = range ? range.index : quill.getLength();
        quill.insertEmbed(index, "image", url, "user");
        quill.setSelection(index + 1, 0);
      } else {
        // Fallback: HTML içine ekle
        setForm((p) => ({ ...p, content: (p.content || "") + `<p><img src="${url}" alt="" /></p>` }));
      }
      toast.success("Görsel eklendi");
    } catch (err: any) {
      toast.error(err?.data?.error?.message ?? "Görsel yüklenemedi");
    } finally {
      if (quillImageInputRef.current) quillImageInputRef.current.value = "";
    }
  };

  const normalizedSlug = useMemo(
    () => slugify(form.slug || form.title),
    [form.slug, form.title]
  );

  /* ---------- Kaydet ---------- */
  const save = async (): Promise<void> => {
    if (!form.title.trim()) { toast.error("Başlık gerekli"); return; }
    const normalized = slugify(form.slug || form.title);
    if (!normalized.trim()) { toast.error("Slug gerekli"); return; }

    const body: UpsertCustomPageBody = {
      title: form.title.trim(),
      slug: normalized,
      content: form.content ?? "",
      is_published: !!form.is_published,
      meta_title: form.meta_title ? form.meta_title : null,
      meta_description: form.meta_description ? form.meta_description : null,
      // create akışında kapak bilgilerini body’ye gönder
      ...( !isEdit && pendingAssetRef.current
        ? { featured_image: pendingAssetRef.current.url, featured_image_asset_id: pendingAssetRef.current.asset_id }
        : {} ),
    };

    try {
      if (isEdit) {
        await updatePage({ id: id!, body }).unwrap();
        toast.success("Sayfa güncellendi");
      } else {
        await createPage(body).unwrap();
        toast.success("Yeni sayfa eklendi");
      }
      nav("/admin/pages");
    } catch (e: any) {
      const code = e?.data?.error?.message;
      if (code === "slug_already_exists") { toast.error("Bu slug zaten kullanılıyor"); return; }
      toast.error(e?.data?.error?.message || e?.error || "Kaydetme başarısız");
    }
  };

  /* ---------- HTML içe/dışa aktar ---------- */
  const onImportHtmlFile = (file: File): void => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = (ev.target?.result as string) || "";
      setForm((p) => ({ ...p, content: extractHtmlFromAny(raw) }));
      toast.success("HTML içeriği içe aktarıldı");
    };
    reader.readAsText(file, "utf-8");
  };

  const exportHtml = (): void => {
    const blob = new Blob([form.content || ""], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const name = (normalizedSlug || "sayfa") + ".html";
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  const metaTitleCount = form.meta_title.trim().length;
  const metaDescCount = form.meta_description.trim().length;
  const cntClass = (ok: boolean) => (ok ? "text-emerald-600" : "text-amber-600");

  return (
    <main
      className="mx-auto max-w-5xl px-4 py-6 bg-white"
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{isEdit ? "Sayfa Düzenle" : "Yeni Sayfa"}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => nav(-1)} disabled={saving}>Geri</Button>
          <Button onClick={save} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
            {isEdit ? "Güncelle" : "Oluştur"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        {/* Başlık / Slug */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Label>Başlık *</Label>
            <Input
              className="mt-1"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Örn: Hakkımızda"
            />
          </div>
          <div>
            <Label>Slug *</Label>
            <Input
              className="mt-1"
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
              placeholder="hakkimizda"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Son değer: <code>/{normalizedSlug}</code>
            </p>
          </div>
        </div>

        {/* SEO */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <Label>Meta Title</Label>
              <span className={`text-[11px] ${cntClass(metaTitleCount <= 60)}`}>
                {metaTitleCount}/60
              </span>
            </div>
            <Input
              className="mt-1"
              value={form.meta_title}
              onChange={(e) => setForm((p) => ({ ...p, meta_title: e.target.value }))}
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label>Meta Description</Label>
              <span className={`text-[11px] ${cntClass(metaDescCount <= 160)}`}>
                {metaDescCount}/160
              </span>
            </div>
            <Input
              className="mt-1"
              value={form.meta_description}
              onChange={(e) => setForm((p) => ({ ...p, meta_description: e.target.value }))}
            />
          </div>
        </div>

        {/* Yayın */}
        <div className="mt-6 flex items-center gap-3">
          <Switch
            checked={form.is_published}
            onCheckedChange={(v) => setForm((p) => ({ ...p, is_published: v }))}
            id="pg-active"
          />
          <Label htmlFor="pg-active" className="text-sm text-muted-foreground">Aktif</Label>
        </div>

        {/* Kapak Görseli (çalışan örneğe benzer) */}
        <div className="mt-8">
          <Label>Kapak Görseli</Label>

          {!form.featured_image ? (
            <div className="grid gap-3 sm:grid-cols-2 mt-2">
              <div className="space-y-2">
                <Input
                  placeholder="https://... (opsiyonel)"
                  value={form.featured_image || ""}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, featured_image: e.target.value || null }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  URL girebilir veya aşağıdan dosya yükleyebilirsiniz.
                </p>
              </div>
              <div className="space-y-2">
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={uploading}
                  onClick={() => {
                    if (coverInputRef.current) coverInputRef.current.value = "";
                    coverInputRef.current?.click();
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Yükleniyor..." : "Dosyadan Yükle"}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Asset ID (opsiyonel)"
                    value={form.featured_image_asset_id || ""}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, featured_image_asset_id: e.target.value || null }))
                    }
                  />
                  <Input
                    placeholder="Alt metin (opsiyonel)"
                    value={form.featured_image_alt}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, featured_image_alt: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-lg border bg-white p-4">
              <p className="mb-3 text-sm font-medium text-gray-700">Kapak Görseli</p>
              <div className="relative max-w-sm">
                <div className="aspect-video overflow-hidden rounded-md border bg-muted">
                  <img
                    src={form.featured_image}
                    alt={form.featured_image_alt || ""}
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://placehold.co/800x450?text=Image"; }}
                  />
                </div>

                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  aria-label="Görseli sil"
                  title="Sil"
                  onClick={removeImage}
                  className="absolute right-2 top-2 h-8 w-8 rounded-full p-0 shadow-lg ring-2 ring-white hover:scale-105 transition"
                  disabled={uploading || settingImage}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 max-w-sm">
                <Input
                  placeholder="Asset ID (opsiyonel)"
                  value={form.featured_image_asset_id || ""}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, featured_image_asset_id: e.target.value || null }))
                  }
                />
                <Input
                  placeholder="Alt metin (opsiyonel)"
                  value={form.featured_image_alt}
                  onChange={(e) => setForm((s) => ({ ...s, featured_image_alt: e.target.value }))}
                />
              </div>
            </div>
          )}
        </div>

        {/* Editör Aksiyonları */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => htmlFileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> HTML İçe Aktar
          </Button>
          <input
            ref={htmlFileInputRef}
            type="file" accept=".html,.htm,.txt" className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportHtmlFile(f);
              e.currentTarget.value = "";
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={exportHtml}>
            <Download className="mr-2 h-4 w-4" /> HTML Dışa Aktar
          </Button>

          <div className="mx-2 h-5 w-px bg-gray-200" />

          {/* Quill için gizli file input */}
          <input
            ref={quillImageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleQuillImageFileChange}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (quillImageInputRef.current) quillImageInputRef.current.value = "";
              quillImageInputRef.current?.click();
            }}
          >
            <ImagePlus className="mr-2 h-4 w-4" /> Editöre Görsel
          </Button>
        </div>

        {/* Editor / Preview / HTML */}
        <Tabs defaultValue="edit" className="mt-3">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <PencilLine className="h-4 w-4" /> Editör
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" /> Önizleme
            </TabsTrigger>
            <TabsTrigger value="html" className="flex items-center gap-2">
              <Code className="h-4 w-4" /> HTML
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="mt-3">
            <div className="rounded-lg border border-gray-200 bg-white">
              <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Editör yükleniyor…</div>}>
                <ReactQuill
                  ref={quillRef as any}
                  value={form.content}
                  onChange={(html: string) => setForm((p) => ({ ...p, content: html }))}
                  modules={quillModules}
                  formats={quillFormats}
                  theme="snow"
                />
              </Suspense>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-3">
            <div className="prose max-w-none rounded-lg border border-gray-200 bg-white p-4">
              <div
                dangerouslySetInnerHTML={{
                  __html: form.content || "<p><em>Önizleme için içerik girin…</em></p>",
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="html" className="mt-3">
            <Textarea
              className="min-h-[260px]"
              value={form.content}
              onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              spellCheck={false}
            />
            <p className="mt-1 text-xs text-muted-foreground">Bu alanda doğrudan HTML düzenleyebilirsiniz.</p>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
