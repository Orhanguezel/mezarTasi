"use client";

import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Upload, Download, ImagePlus, PencilLine, Eye, Code, Trash2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import {
  useGetAnnouncementAdminByIdQuery,
  useCreateAnnouncementAdminMutation,
  useUpdateAnnouncementAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/announcements_admin.endpoints";
import type { AnnouncementAdminUpsertInput } from "@/integrations/metahub/rtk/endpoints/admin/announcements_admin.endpoints";
import { useUploadStorageAssetAdminMutation } from "@/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints";

const ReactQuill = React.lazy(() => import("react-quill"));
import "react-quill/dist/quill.snow.css";

/* ---------- datetime helpers ---------- */
function toLocalInputValue(s?: string | null): string {
  if (!s) return "";
  const d = new Date(s); if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function toISOorNull(s: string): string | null {
  if (!s) return null; const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/* ---------- content helpers ---------- */
function extractHtmlFromAny(raw: unknown): string {
  if (typeof raw === "string") {
    try {
      const j = JSON.parse(raw) as any;
      if (j && typeof j.html === "string") return j.html;
      return raw;
    } catch { return raw; }
  }
  if (raw && typeof raw === "object" && typeof (raw as any).html === "string") return (raw as any).html;
  return String(raw ?? "");
}
const validateImageFile = (file: File, maxMB = 5) => {
  if (!(file.type?.startsWith("image/"))) { toast.error("Lütfen bir görsel seçin"); return false; }
  if (file.size > maxMB * 1024 * 1024) { toast.error(`Maksimum ${maxMB}MB`); return false; }
  return true;
};

export default function AnnouncementForm() {
  const navigate = useNavigate();
  const params = useParams();
  const id = params["*"] || params["id"] || (window.location.pathname.split("/").pop() ?? "new");
  const isNew = id === "new";

  const { data: existing, isFetching } = useGetAnnouncementAdminByIdQuery(id!, { skip: isNew });
  const [createOne, { isLoading: creating }] = useCreateAnnouncementAdminMutation();
  const [updateOne, { isLoading: updating }] = useUpdateAnnouncementAdminMutation();
  const [uploadAsset, { isLoading: uploading }] = useUploadStorageAssetAdminMutation();

  // form state
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [content, setContent] = React.useState(""); // zengin metin HTML
  const [icon, setIcon] = React.useState("");
  const [iconType, setIconType] = React.useState<"emoji" | "lucide">("emoji");
  const [lucideIcon, setLucideIcon] = React.useState<string>("");
  const [link, setLink] = React.useState("");

  const [bgColor, setBgColor] = React.useState("#ffffff");
  const [hoverColor, setHoverColor] = React.useState("#f5f5f5");
  const [iconColor, setIconColor] = React.useState("#000000");
  const [textColor, setTextColor] = React.useState("#111111");
  const [borderColor, setBorderColor] = React.useState("#dddddd");

  const [badgeText, setBadgeText] = React.useState<string>("");
  const [badgeColor, setBadgeColor] = React.useState<string>("");
  const [buttonText, setButtonText] = React.useState<string>("");
  const [buttonColor, setButtonColor] = React.useState<string>("");

  const [isActive, setIsActive] = React.useState(true);
  const [isPublished, setIsPublished] = React.useState(true);
  const [displayOrder, setDisplayOrder] = React.useState<number>(1);

  const [publishedAt, setPublishedAt] = React.useState<string>("");
  const [expiresAt, setExpiresAt] = React.useState<string>("");

  const [metaTitle, setMetaTitle] = React.useState<string>("");
  const [metaDescription, setMetaDescription] = React.useState<string>("");

  React.useEffect(() => {
    if (!isNew && existing) {
      setTitle(existing.title ?? "");
      setDescription(existing.description ?? "");
      setContent(extractHtmlFromAny((existing as any).html ?? (existing as any).content));
      setIcon((existing as any).icon ?? "");
      setIconType((existing as any).icon_type ?? "emoji");
      setLucideIcon(((existing as any).lucide_icon ?? "") || "");
      setLink((existing as any).link ?? "");

      setBgColor((existing as any).bg_color ?? "#ffffff");
      setHoverColor((existing as any).hover_color ?? "#f5f5f5");
      setIconColor((existing as any).icon_color ?? "#000000");
      setTextColor((existing as any).text_color ?? "#111111");
      setBorderColor((existing as any).border_color ?? "#dddddd");

      setBadgeText(((existing as any).badge_text ?? "") || "");
      setBadgeColor(((existing as any).badge_color ?? "") || "");
      setButtonText(((existing as any).button_text ?? "") || "");
      setButtonColor(((existing as any).button_color ?? "") || "");

      setIsActive(!!existing.is_active);
      setIsPublished(!!existing.is_published);
      setDisplayOrder((existing as any).display_order ?? 1);

      setPublishedAt(toLocalInputValue((existing as any).published_at ?? null));
      setExpiresAt(toLocalInputValue((existing as any).expires_at ?? null));

      setMetaTitle(((existing as any).meta_title ?? "") || "");
      setMetaDescription(((existing as any).meta_description ?? "") || "");
    }
  }, [isNew, existing]);

  /* ---------- Quill ---------- */
  const quillRef = React.useRef<any>(null);
  const htmlFileInputRef = React.useRef<HTMLInputElement>(null);
  const quillImageInputRef = React.useRef<HTMLInputElement>(null);

  const quillModules = React.useMemo(
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

  const uploadToStorage = async (file: File) => {
    const res: any = await uploadAsset({ file, folder: "announcements/content" }).unwrap();
    const url =
      res?.url || res?.public_url || res?.data?.url ||
      (res?.path && res?.bucket
        ? `${(import.meta.env.VITE_PUBLIC_API_ORIGIN ?? "").toString().replace(/\/$/, "")}/storage/${encodeURIComponent(res.bucket)}/${encodeURIComponent(res.path).replace(/%2F/g,"/")}`
        : null);
    if (!url) throw new Error("upload_failed_no_url");
    return url as string;
  };

  const handleQuillImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!validateImageFile(f, 5)) { if (quillImageInputRef.current) quillImageInputRef.current.value = ""; return; }
    try {
      const url = await uploadToStorage(f);
      const quill = quillRef.current?.getEditor?.();
      if (quill) {
        quill.focus();
        const range = quill.getSelection(true);
        const index = range ? range.index : quill.getLength();
        quill.insertEmbed(index, "image", url, "user");
        quill.setSelection(index + 1, 0);
      } else {
        setContent((p) => (p || "") + `<p><img src="${url}" alt="" /></p>`);
      }
      toast.success("Görsel eklendi");
    } catch (err: any) {
      toast.error(err?.data?.error?.message ?? "Görsel yüklenemedi");
    } finally {
      if (quillImageInputRef.current) quillImageInputRef.current.value = "";
    }
  };

  /* ---------- HTML içe/dışa aktar ---------- */
  const onImportHtmlFile = (file: File): void => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = (ev.target?.result as string) || "";
      setContent(extractHtmlFromAny(raw));
      toast.success("HTML içeriği içe aktarıldı");
    };
    reader.readAsText(file, "utf-8");
  };
  const exportHtml = (): void => {
    const blob = new Blob([content || ""], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = (title || "duyuru") + ".html"; a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------- Kaydet ---------- */
  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!title.trim()) return toast.error("Başlık gerekli");
    if (!description.trim()) return toast.error("Açıklama gerekli");
    if (!content.trim()) return toast.error("İçerik gerekli");
    if (!icon.trim()) return toast.error("Icon gerekli");
    if (!link.trim()) return toast.error("Link gerekli");

    const body: AnnouncementAdminUpsertInput = {
      title: title.trim(),
      description: description.trim(),
      content, // düz HTML
      icon: icon.trim(),
      icon_type: iconType,
      link: link.trim(),
      bg_color: bgColor,
      hover_color: hoverColor,
      icon_color: iconColor,
      text_color: textColor,
      border_color: borderColor,
      is_active: isActive,
      is_published: isPublished,
      display_order: Number.isFinite(displayOrder) ? displayOrder : 1,
      published_at: toISOorNull(publishedAt),
      expires_at: toISOorNull(expiresAt),
    };
    if (lucideIcon.trim()) body.lucide_icon = lucideIcon.trim(); else body.lucide_icon = null;
    if (badgeText.trim()) body.badge_text = badgeText.trim(); else body.badge_text = null;
    if (badgeColor.trim()) body.badge_color = badgeColor.trim(); else body.badge_color = null;
    if (buttonText.trim()) body.button_text = buttonText.trim(); else body.button_text = null;
    if (buttonColor.trim()) body.button_color = buttonColor.trim(); else body.button_color = null;
    if (metaTitle.trim()) body.meta_title = metaTitle.trim(); else body.meta_title = null;
    if (metaDescription.trim()) body.meta_description = metaDescription.trim(); else body.meta_description = null;

    try {
      if (isNew) { await createOne(body).unwrap(); toast.success("Oluşturuldu"); }
      else { await updateOne({ id: id!, patch: body }).unwrap(); toast.success("Güncellendi"); }
      navigate("/admin");
    } catch { toast.error("Kaydetme başarısız"); }
  };

  const saving = creating || updating || uploading;

  return (
    <Card className="border border-gray-200 shadow-none">
      <CardHeader className="border-b border-gray-200 py-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base sm:text-lg">{isNew ? "Yeni Duyuru" : "Duyuru Düzenle"}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>Geri</Button>
            <Button onClick={onSubmit} disabled={saving || isFetching} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Kaydet
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="ann-title">Başlık</Label>
            <Input id="ann-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ann-link">Link</Label>
            <Input id="ann-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="ann-desc">Açıklama</Label>
            <Input id="ann-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* Editör Aksiyonları */}
          <div className="sm:col-span-2">
            <div className="mb-2 flex flex-wrap items-center gap-2">
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

              {/* Quill image input */}
              <input
                ref={quillImageInputRef}
                type="file" accept="image/*" className="hidden"
                onChange={handleQuillImageFileChange}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => {
                if (quillImageInputRef.current) quillImageInputRef.current.value = "";
                quillImageInputRef.current?.click();
              }}>
                <ImagePlus className="mr-2 h-4 w-4" /> Editöre Görsel
              </Button>
            </div>

            <Tabs defaultValue="edit">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="edit" className="flex items-center gap-2"><PencilLine className="h-4 w-4" /> Editör</TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2"><Eye className="h-4 w-4" /> Önizleme</TabsTrigger>
                <TabsTrigger value="html" className="flex items-center gap-2"><Code className="h-4 w-4" /> HTML</TabsTrigger>
              </TabsList>

              <TabsContent value="edit" className="mt-3">
                <div className="rounded-lg border border-gray-200 bg-white">
                  <React.Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Editör yükleniyor…</div>}>
                    <ReactQuill
                      ref={quillRef as any}
                      value={content}
                      onChange={(html: string) => setContent(html)}
                      modules={quillModules}
                      formats={quillFormats}
                      theme="snow"
                    />
                  </React.Suspense>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="mt-3">
                <div className="prose max-w-none rounded-lg border border-gray-200 bg-white p-4">
                  <div dangerouslySetInnerHTML={{ __html: content || "<p><em>Önizleme için içerik girin…</em></p>" }} />
                </div>
              </TabsContent>

              <TabsContent value="html" className="mt-3">
                <Textarea className="min-h-[220px]" value={content} onChange={(e) => setContent(e.target.value)} spellCheck={false} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Icon + Renkler + Yayın */}
          <div>
            <Label htmlFor="ann-icon">Icon (emoji veya lucide adı)</Label>
            <Input id="ann-icon" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="📣 veya bell" />
          </div>
          <div>
            <Label htmlFor="ann-icontype">Icon Tipi</Label>
            <select id="ann-icontype" className="h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-sm" value={iconType} onChange={(e) => setIconType(e.target.value as "emoji" | "lucide")}>
              <option value="emoji">Emoji</option>
              <option value="lucide">Lucide</option>
            </select>
          </div>

          <div>
            <Label htmlFor="ann-lucide">Lucide Icon</Label>
            <Input id="ann-lucide" value={lucideIcon} onChange={(e) => setLucideIcon(e.target.value)} placeholder="opsiyonel" />
          </div>
          <div>
            <Label htmlFor="ann-order">Gösterim Sırası</Label>
            <Input id="ann-order" type="number" inputMode="numeric" value={displayOrder} onChange={(e) => setDisplayOrder(parseInt(e.target.value || "1", 10))} />
          </div>

          <div className="flex items-center gap-2">
            <Switch id="ann-active" checked={isActive} onCheckedChange={(v) => setIsActive(!!v)} />
            <Label htmlFor="ann-active">Aktif</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="ann-published" checked={isPublished} onCheckedChange={(v) => setIsPublished(!!v)} />
            <Label htmlFor="ann-published">Yayınlanmış</Label>
          </div>

          {/* Renkler */}
          <div><Label htmlFor="ann-bg">Arkaplan</Label><Input id="ann-bg" type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} /></div>
          <div><Label htmlFor="ann-hover">Hover</Label><Input id="ann-hover" type="color" value={hoverColor} onChange={(e) => setHoverColor(e.target.value)} /></div>
          <div><Label htmlFor="ann-ic">Icon Rengi</Label><Input id="ann-ic" type="color" value={iconColor} onChange={(e) => setIconColor(e.target.value)} /></div>
          <div><Label htmlFor="ann-tx">Metin Rengi</Label><Input id="ann-tx" type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} /></div>
          <div><Label htmlFor="ann-brd">Kenarlık Rengi</Label><Input id="ann-brd" type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} /></div>

          {/* Badge / Button */}
          <div><Label htmlFor="ann-badge-t">Badge Metni</Label><Input id="ann-badge-t" value={badgeText} onChange={(e) => setBadgeText(e.target.value)} /></div>
          <div><Label htmlFor="ann-badge-c">Badge Rengi</Label><Input id="ann-badge-c" value={badgeColor} onChange={(e) => setBadgeColor(e.target.value)} /></div>
          <div><Label htmlFor="ann-btn-t">Buton Metni</Label><Input id="ann-btn-t" value={buttonText} onChange={(e) => setButtonText(e.target.value)} /></div>
          <div><Label htmlFor="ann-btn-c">Buton Rengi</Label><Input id="ann-btn-c" value={buttonColor} onChange={(e) => setButtonColor(e.target.value)} /></div>

          {/* Tarihler */}
          <div><Label htmlFor="ann-pub-at">Yayın Tarihi</Label><Input id="ann-pub-at" type="datetime-local" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} /></div>
          <div><Label htmlFor="ann-exp-at">Bitiş Tarihi</Label><Input id="ann-exp-at" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} /></div>

          {/* Meta */}
          <div className="sm:col-span-2"><Label htmlFor="ann-meta-title">Meta Title</Label><Input id="ann-meta-title" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} /></div>
          <div className="sm:col-span-2"><Label htmlFor="ann-meta-desc">Meta Description</Label><Textarea id="ann-meta-desc" rows={3} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} /></div>
        </form>
      </CardContent>
    </Card>
  );
}
