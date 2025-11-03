// =============================================================
// FILE: src/components/admin/AdminPanel/Dialogs/PageDialog.tsx
// =============================================================
"use client";

import React, { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Download, Upload, ImagePlus, Code, Eye, PencilLine } from "lucide-react";

import type { CustomPageView } from "@/integrations/metahub/db/types/content";
import {
  useCreateCustomPageAdminMutation,
  useUpdateCustomPageAdminMutation,
  useDeleteCustomPageAdminMutation,
  type UpsertCustomPageBody,
} from "@/integrations/metahub/rtk/endpoints/admin/custom_pages_admin.endpoints";

// Vite/React için lazy yükleme
const ReactQuill = lazy(() => import("react-quill"));
import "react-quill/dist/quill.snow.css";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialValue: CustomPageView | null;
  onDone?: () => void;
  existingSlugs?: Set<string>;
};

type FormState = {
  title: string;
  slug: string;
  content: string; // düz HTML
  meta_title: string;
  meta_description: string;
  is_published: boolean;
};

const emptyForm: FormState = {
  title: "",
  slug: "",
  content: "",
  meta_title: "",
  meta_description: "",
  is_published: true,
};

const slugify = (v: string) =>
  v.toString().trim().toLowerCase()
    .replace(/^[\/]+/, "")
    .replace(/[^a-z0-9ğüşöçı\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const MAX_META_TITLE = 60;
const MAX_META_DESC = 160;

/** Her formda ortak kullan: raw içeriği her koşulda düz HTML string’e indirger */
function extractHtmlFromAny(raw: unknown): string {
  if (typeof raw === "string") {
    // Bazı BE’ler content’i JSON string olarak döndürüyor: "{\"html\":\"<p>...\"}"
    try {
      const parsed = JSON.parse(raw) as any;
      if (parsed && typeof parsed === "object" && typeof parsed.html === "string") {
        return parsed.html as string;
      }
      return raw; // zaten düz HTML string
    } catch {
      return raw; // parse edilemeyen string -> düz HTML kabul et
    }
  }
  if (raw && typeof raw === "object" && typeof (raw as any).html === "string") {
    return (raw as any).html as string;
  }
  return String(raw ?? "");
}

export default function PageDialog({
  open,
  onOpenChange,
  initialValue,
  onDone,
  existingSlugs,
}: Props) {
  const [form, setForm] = useState<FormState>({ ...emptyForm });
  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "html">("edit");

  const [createPage, { isLoading: creating }] = useCreateCustomPageAdminMutation();
  const [updatePage, { isLoading: updating }] = useUpdateCustomPageAdminMutation();
  const [deletePage, { isLoading: deleting }] = useDeleteCustomPageAdminMutation();

  const saving = creating || updating;
  const busy = saving || deleting;

  const quillRef = useRef<any>(null);
  const htmlFileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  // initial fill (içeriği her zaman normalize et)
  useEffect(() => {
    if (initialValue) {
      setForm({
        title: initialValue.title ?? "",
        slug: initialValue.slug ?? "",
        content: extractHtmlFromAny(initialValue.content),
        meta_title: initialValue.meta_title ?? "",
        meta_description: initialValue.meta_description ?? "",
        is_published: !!initialValue.is_published,
      });
      setActiveTab("edit");
    } else {
      setForm({ ...emptyForm });
      setActiveTab("edit");
    }
  }, [initialValue, open]);

  const normalizedSlug = useMemo(
    () => slugify(form.slug || form.title),
    [form.slug, form.title]
  );

  const duplicatedSlug = useMemo(() => {
    if (!existingSlugs || !normalizedSlug) return false;
    const currentSlug = initialValue?.slug;
    return normalizedSlug !== currentSlug && existingSlugs.has(normalizedSlug);
  }, [existingSlugs, normalizedSlug, initialValue?.slug]);

  const canSave =
    !busy &&
    form.title.trim().length > 0 &&
    normalizedSlug.trim().length > 0 &&
    !duplicatedSlug;

  // Quill configs
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
        handlers: { image: () => imageFileInputRef.current?.click() },
      },
      clipboard: { matchVisual: false },
    }),
    []
  );

  const quillFormats = [
    "header","bold","italic","underline","strike","color","background",
    "align","list","bullet","blockquote","code-block","link","image",
  ];

  // Actions
  const save = async () => {
    if (!canSave) {
      if (duplicatedSlug) toast.error("Bu slug zaten kullanılıyor");
      return;
    }
    const body: UpsertCustomPageBody = {
      title: form.title.trim(),
      slug: normalizedSlug,
      content: form.content ?? "",
      is_published: !!form.is_published,
      meta_title: form.meta_title ? form.meta_title : null,
      meta_description: form.meta_description ? form.meta_description : null,
    };
    try {
      if (initialValue?.id) {
        await updatePage({ id: initialValue.id, body }).unwrap();
        toast.success("Sayfa güncellendi");
      } else {
        await createPage(body).unwrap();
        toast.success("Yeni sayfa eklendi");
      }
      onDone?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.data?.error?.message || e?.error || "Kaydetme başarısız");
    }
  };

  const handleDelete = async () => {
    if (!initialValue?.id) return;
    if (!confirm("Bu sayfayı silmek istediğinize emin misiniz?")) return;
    try {
      await deletePage(initialValue.id).unwrap();
      toast.success("Sayfa silindi");
      onDone?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.data?.error?.message || e?.error || "Silme başarısız");
    }
  };

  // HTML içe aktarma (dosyadan)
  const onImportHtmlFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const raw = (e.target?.result as string) || "";
      const html = extractHtmlFromAny(raw);
      setForm((p) => ({ ...p, content: html }));
      setActiveTab("edit");
      toast.success("HTML içeriği içe aktarıldı");
    };
    reader.readAsText(file, "utf-8");
  };

  // HTML dışa aktarma
  const exportHtml = () => {
    const blob = new Blob([form.content || ""], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const name = (normalizedSlug || "sayfa") + ".html";
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  // URL'den görsel ekle
  const insertImageUrl = () => {
    const url = prompt("Görsel URL'si:");
    if (!url) return;
    try {
      const quill = quillRef.current?.getEditor?.();
      const range = quill?.getSelection?.();
      const index = range?.index ?? quill?.getLength?.() ?? 0;
      quill?.insertEmbed(index, "image", url, "user");
      quill?.setSelection(index + 1, 0);
      toast.success("Görsel eklendi");
    } catch {
      setForm((p) => ({ ...p, content: (p.content || "") + `<p><img src="${url}" alt="" /></p>` }));
    }
  };

  // Dosyadan görsel (base64)
  const onImportImageFile = (file: File) => {

    if (!file.type.startsWith("image/")) return toast.error("Lütfen bir görsel dosyası seçin");
    if (file.size > 5 * 1024 * 1024) return toast.error("Görsel 5MB'den büyük");
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = (e.target?.result as string) || "";
      try {
        const quill = quillRef.current?.getEditor?.();
        const range = quill?.getSelection?.();
        const index = range?.index ?? quill?.getLength?.() ?? 0;
        quill?.insertEmbed(index, "image", dataUrl, "user");
        quill?.setSelection(index + 1, 0);
        toast.success("Görsel yüklendi");
      } catch {
        setForm((p) => ({ ...p, content: (p.content || "") + `<p><img src="${dataUrl}" alt="" /></p>` }));
      }
    };
    reader.readAsDataURL(file);
  };

  const metaTitleCount = form.meta_title.trim().length;
  const metaDescCount = form.meta_description.trim().length;
  const cntClass = (ok: boolean) => (ok ? "text-emerald-600" : "text-amber-600");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(92vw,56rem)] max-w-3xl p-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <DialogHeader className="sticky top-0 z-10 bg-white px-5 py-4">
          <DialogTitle className="text-base sm:text-lg">
            {initialValue ? "Sayfayı Düzenle" : "Yeni Sayfa"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Başlık, slug, zengin içerik ve SEO alanlarını doldurun. Önizleme ile sonucu görebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[75dvh] overflow-y-auto bg-white px-5 pb-4 pt-2 sm:pb-6">
          <div className="space-y-5">
            {/* Üst alanlar */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Başlık *</Label>
                <Input
                  className="mt-1 h-10 rounded-lg border-gray-300 bg-white px-3 text-sm shadow-sm focus:border-teal-500 focus:ring-4 focus:ring-teal-200"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Örn: Hakkımızda"
                />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input
                  className="mt-1 h-10 rounded-lg border-gray-300 bg-white px-3 text-sm shadow-sm focus:border-teal-500 focus:ring-4 focus:ring-teal-200"
                  value={form.slug}
                  onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                  placeholder="hakkimizda"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Son değer: <code>/{normalizedSlug}</code>
                  {duplicatedSlug && <span className="ml-2 text-red-600">• Bu slug zaten kullanılıyor</span>}
                </p>
              </div>
            </div>

            {/* SEO */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="flex items-center justify-between">
                  <Label>Meta Title</Label>
                  <span className={`text-[11px] ${cntClass(metaTitleCount <= MAX_META_TITLE)}`}>
                    {metaTitleCount}/{MAX_META_TITLE}
                  </span>
                </div>
                <Input
                  className="mt-1 h-10 rounded-lg border-gray-300 bg-white px-3 text-sm shadow-sm focus:border-teal-500 focus:ring-4 focus:ring-teal-200"
                  value={form.meta_title}
                  onChange={(e) => setForm((p) => ({ ...p, meta_title: e.target.value }))}
                  placeholder="SEO başlık (50–60 karakter önerilir)"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>Meta Description</Label>
                  <span className={`text-[11px] ${cntClass(metaDescCount <= MAX_META_DESC)}`}>
                    {metaDescCount}/{MAX_META_DESC}
                  </span>
                </div>
                <Input
                  className="mt-1 h-10 rounded-lg border-gray-300 bg-white px-3 text-sm shadow-sm focus:border-teal-500 focus:ring-4 focus:ring-teal-200"
                  value={form.meta_description}
                  onChange={(e) => setForm((p) => ({ ...p, meta_description: e.target.value }))}
                  placeholder="Kısa açıklama (150–160 karakter önerilir)"
                />
              </div>
            </div>

            {/* Yayın durumu */}
            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_published}
                onCheckedChange={(v) => setForm((p) => ({ ...p, is_published: v }))}
                id="pg-active"
              />
              <Label htmlFor="pg-active" className="text-sm text-muted-foreground">Aktif</Label>
            </div>

            {/* Editör Aksiyonları */}
            <div className="flex flex-wrap items-center gap-2">
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

              <Button type="button" variant="outline" size="sm" onClick={() => imageFileInputRef.current?.click()}>
                <ImagePlus className="mr-2 h-4 w-4" /> Görsel Yükle
              </Button>
              <input
                ref={imageFileInputRef}
                type="file" accept="image/*" className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onImportImageFile(f);
                  e.currentTarget.value = "";
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={insertImageUrl}>
                <ImagePlus className="mr-2 h-4 w-4" /> URL'den Görsel
              </Button>
            </div>

            {/* Editor / Preview / HTML */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-1">
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

              {/* Zengin Editör */}
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

              {/* Önizleme */}
              <TabsContent value="preview" className="mt-3">
                <div className="prose max-w-none rounded-lg border border-gray-200 bg-white p-4">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: form.content || "<p><em>Önizleme için içerik girin…</em></p>",
                    }}
                  />
                </div>
              </TabsContent>

              {/* RAW HTML */}
              <TabsContent value="html" className="mt-3">
                <Textarea
                  className="min-h-[260px]"
                  value={form.content}
                  onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  spellCheck={false}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Bu alanda doğrudan HTML düzenleyebilirsiniz. Değişiklikler editöre yansır.
                </p>
              </TabsContent>
            </Tabs>

            {/* Sticky actions */}
            <div className="sticky bottom-0 z-10 mt-6 flex items-center gap-2 border-t border-gray-200 bg-white pb-1 pt-3">
              {initialValue?.id && (
                <Button type="button" variant="destructive" onClick={handleDelete} disabled={busy}>
                  Sil
                </Button>
              )}
              <div className="ml-auto flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
                  İptal
                </Button>
                <Button
                  type="button"
                  className="bg-teal-600 hover:bg-teal-700"
                  onClick={save}
                  disabled={!canSave}
                >
                  {saving ? "Kaydediliyor..." : initialValue ? "Güncelle" : "Ekle"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
