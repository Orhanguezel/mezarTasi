// =============================================================
// FILE: src/pages/admin/AdminPanel/Dialogs/PopupDialog.tsx
// =============================================================
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import type { DisplayFrequency, PopupAdminView } from "@/integrations/metahub/db/types/popup";
import {
  useCreatePopupAdminMutation,
  useUpdatePopupAdminMutation,
  useDeletePopupAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/popups_admin.endpoints";

// ✅ Storage admin upload
import { useUploadStorageAssetAdminMutation } from "@/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints";

/* ------------------------- helpers ------------------------- */
const freqOptions: DisplayFrequency[] = ["always", "once", "daily", "weekly"];

const toInputValue = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromInputValue = (v: string): string | null => {
  if (!v) return null;
  try { return new Date(v).toISOString(); } catch { return null; }
};

const nullIfEmpty = (s: string | null | undefined) =>
  s && s.trim() ? s : null;

// null ve boş string’leri opsiyonel alanlardan düş
function cleanOptional<T extends Record<string, any>>(obj: T, keepEmptyKeys: string[] = []): Partial<T> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (keepEmptyKeys.includes(k)) { out[k] = v; continue; }
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    out[k] = v;
  }
  return out as Partial<T>;
}

type FormState = {
  title: string;
  content: string;

  image_url: string | null;
  image_asset_id: string | null;
  image_alt: string | null;

  button_text: string | null;
  button_link: string | null;
  is_active: boolean;

  display_frequency: DisplayFrequency;
  delay_seconds: number;

  start_date: string | null;
  end_date: string | null;

  product_id: string | null;
  coupon_code: string | null;
  display_pages: string;
  priority: number | null;
  duration_seconds: number | null;
};

const emptyForm: FormState = {
  title: "",
  content: "",
  image_url: null,
  image_asset_id: null,
  image_alt: null,
  button_text: null,
  button_link: null,
  is_active: true,
  display_frequency: "always",
  delay_seconds: 0,
  start_date: null,
  end_date: null,
  product_id: null,
  coupon_code: null,
  display_pages: "all",
  priority: null,
  duration_seconds: null,
};

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialValue: PopupAdminView | null;
  onDone?: () => void;
};

export default function PopupDialog({ open, onOpenChange, initialValue, onDone }: Props) {
  const [form, setForm] = useState<FormState>({ ...emptyForm });

  const [createPopup, { isLoading: creating }] = useCreatePopupAdminMutation();
  const [updatePopup, { isLoading: updating }] = useUpdatePopupAdminMutation();
  const [deletePopup, { isLoading: deleting }] = useDeletePopupAdminMutation();

  // ✅ Storage upload
  const [uploadAsset, { isLoading: uploading }] = useUploadStorageAssetAdminMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saving = creating || updating;
  const busy = saving || deleting || uploading;

  /* --------- initial fill / normalize (undefined yazma) --------- */
  useEffect(() => {
    if (initialValue) {
      setForm({
        title: initialValue.title ?? "",
        content: initialValue.content ?? "",
        image_url: nullIfEmpty(initialValue.image_url),
        image_asset_id: nullIfEmpty(initialValue.image_asset_id),
        image_alt: nullIfEmpty(initialValue.image_alt),
        button_text: nullIfEmpty(initialValue.button_text),
        button_link: nullIfEmpty(initialValue.button_link),
        is_active: !!initialValue.is_active,
        display_frequency: initialValue.display_frequency ?? "always",
        delay_seconds: Number.isFinite(initialValue.delay_seconds) ? (initialValue.delay_seconds as number) : 0,
        start_date: initialValue.start_date ?? null,
        end_date: initialValue.end_date ?? null,
        product_id: nullIfEmpty(initialValue.product_id),
        coupon_code: nullIfEmpty(initialValue.coupon_code),
        display_pages: initialValue.display_pages ?? "all",
        priority: initialValue.priority ?? null,
        duration_seconds: initialValue.duration_seconds ?? null,
      });
    } else {
      setForm({ ...emptyForm });
    }
  }, [initialValue, open]);

  const canSave = useMemo(() => form.title.trim().length > 0, [form.title]);

  /* ------------------------------ storage actions ------------------------------ */
  const onPickFile = () => fileInputRef.current?.click();

  const onFileSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const asset = await uploadAsset({
        file: f,
        bucket: "popups",
        folder: "popups",
        metadata: { module: "popups" },
      }).unwrap();

      setForm((p) => ({
        ...p,
        image_asset_id: asset.id,
        image_url: asset.url || p.image_url, // BE url dönüyorsa önizleme için yaz
      }));
      toast.success("Görsel yüklendi");
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.error || "Yükleme başarısız");
    } finally {
      e.currentTarget.value = "";
    }
  };

  const clearAsset = () => {
    setForm((p) => ({ ...p, image_asset_id: null }));
    toast.message("Görsel bağlantısı kaldırıldı (asset_id).");
  };

  /* ------------------------------ save/delete ------------------------------ */
  const save = async () => {
    if (!canSave) return toast.error("Başlık zorunlu");

    // Boş stringleri null’a çevir
    const prepared = {
      title: form.title.trim(),
      content: form.content ?? "",
      image_url: nullIfEmpty(form.image_url),
      image_asset_id: nullIfEmpty(form.image_asset_id), // "" → null
      image_alt: nullIfEmpty(form.image_alt),
      button_text: nullIfEmpty(form.button_text),
      button_link: nullIfEmpty(form.button_link),
      is_active: !!form.is_active,
      display_frequency: form.display_frequency,
      delay_seconds: Number.isFinite(form.delay_seconds) ? form.delay_seconds : 0,
      start_date: form.start_date ?? null,
      end_date: form.end_date ?? null,
      product_id: nullIfEmpty(form.product_id),
      coupon_code: nullIfEmpty(form.coupon_code),
      display_pages: form.display_pages || "all",
      priority: form.priority ?? null,
      duration_seconds: form.duration_seconds ?? null,
    } as const;

    // PATCH/POST’ta uuid zorunlulukları yüzünden null/"" olan opsiyonelleri dışarı at
    // (title & content kalsın)
    const body =
      cleanOptional(
        prepared,
        /* keepEmptyKeys */ ["title", "content"]
      );

    try {
      if (initialValue?.id) {
        await updatePopup({ id: initialValue.id, body }).unwrap();
        toast.success("Popup güncellendi");
      } else {
        await createPopup(body as any).unwrap();
        toast.success("Yeni popup eklendi");
      }
      onDone?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.data?.error?.message || e?.error || "Kaydetme başarısız");
    }
  };

  const handleDelete = async () => {
    if (!initialValue?.id) return;
    if (!confirm("Bu popup'ı silmek istediğinize emin misiniz?")) return;
    try {
      await deletePopup(initialValue.id).unwrap();
      toast.success("Popup silindi");
      onDone?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.data?.error?.message || e?.error || "Silme başarısız");
    }
  };

  /* ------------------------------ UI ------------------------------ */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          w-[min(92vw,56rem)] max-w-3xl p-0 overflow-hidden
          rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-xl
          dark:border-gray-800 dark:bg-neutral-900 dark:text-neutral-100
        "
      >
        <DialogHeader className="sticky top-0 z-10 bg-white/95 px-5 py-4 backdrop-blur dark:bg-neutral-900/95">
          <DialogTitle className="text-base sm:text-lg font-semibold tracking-tight">
            {initialValue ? "Popup Düzenle" : "Yeni Popup"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-gray-600 dark:text-neutral-400">
            Başlık, içerik, görsel ve görünürlük ayarlarını düzenleyin.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[75dvh] overflow-y-auto bg-white px-5 pb-4 pt-2 sm:pb-6 dark:bg-neutral-900">
          {/* Temel Bilgiler */}
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-neutral-400">
            Temel Bilgiler
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/60">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-sm">Başlık *</Label>
                <Input
                  className="mt-1 h-10 rounded-lg border-gray-300 bg-white px-3 text-sm shadow-sm
                             focus-visible:ring-4 focus-visible:ring-teal-200 focus-visible:border-teal-600
                             dark:border-neutral-700 dark:bg-neutral-900 dark:focus-visible:ring-teal-600/30"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Örn: Üye Ol İlk Siparişte %10 İndir"
                />
              </div>

              <div className="flex items-center gap-3 pt-6 sm:pt-8">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
                  id="popup-active"
                />
                <Label htmlFor="popup-active" className="text-sm text-gray-600 dark:text-neutral-300">Aktif</Label>
              </div>
            </div>

            <div className="mt-4">
              <Label className="text-sm">İçerik (metin)</Label>
              <Textarea
                className="mt-1 min-h-[100px] rounded-lg border-gray-300 bg-white text-sm shadow-sm
                           focus-visible:ring-4 focus-visible:ring-teal-200 focus-visible:border-teal-600
                           dark:border-neutral-700 dark:bg-neutral-900 dark:focus-visible:ring-teal-600/30"
                value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                placeholder="Popup'ta görünecek metin…"
              />
            </div>
          </div>

          <div className="my-5 h-px bg-gray-200 dark:bg-neutral-800" />

          {/* Görsel & Buton */}
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-neutral-400">
            Görsel & Buton
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/60">
            {/* Önizleme */}
            {(form.image_url || form.image_asset_id) && (
              <div className="mb-3">
                <div className="text-xs text-gray-600 dark:text-neutral-400 mb-1">Önizleme</div>
                <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-800">
                  {/* sadece URL varsa onu, yoksa asset ID’ye ait URL BE’den dönmüşse onu gösteriyoruz */}
                  {form.image_url ? (
                    <img src={form.image_url} alt={form.image_alt || ""} className="max-h-48 w-full object-contain bg-white dark:bg-neutral-900" />
                  ) : (
                    <div className="p-3 text-xs text-muted-foreground">Görsel URL’i yok (sadece asset_id set).</div>
                  )}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-sm">Görsel (URL)</Label>
                <Input
                  className="mt-1 h-10 rounded-lg border-gray-300 bg-white px-3 text-sm shadow-sm
                             focus-visible:ring-4 focus-visible:ring-teal-200 focus-visible:border-teal-600
                             dark:border-neutral-700 dark:bg-neutral-900 dark:focus-visible:ring-teal-600/30"
                  value={form.image_url ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value || null }))}
                  placeholder="https://…"
                />
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label className="text-sm">Görsel (Storage)</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={onPickFile} disabled={uploading}>
                      Dosya Seç / Yükle
                    </Button>
                    {form.image_asset_id && (
                      <Button type="button" variant="secondary" size="sm" onClick={clearAsset}>
                        Kaldır
                      </Button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onFileSelected}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {form.image_asset_id ? `Asset ID: ${form.image_asset_id}` : "Seçilmiş asset yok"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-sm">Buton Metni</Label>
                <Input
                  className="mt-1 h-10 rounded-lg border-gray-300 bg-white px-3 text-sm shadow-sm
                             focus-visible:ring-4 focus-visible:ring-teal-200 focus-visible:border-teal-600
                             dark:border-neutral-700 dark:bg-neutral-900 dark:focus-visible:ring-teal-600/30"
                  value={form.button_text ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, button_text: e.target.value || null }))}
                  placeholder="Örn: Alışveriş Yap"
                />
              </div>
              <div>
                <Label className="text-sm">Buton Linki</Label>
                <Input
                  className="mt-1 h-10 rounded-lg border-gray-300 bg-white px-3 text-sm shadow-sm
                             focus-visible:ring-4 focus-visible:ring-teal-200 focus-visible:border-teal-600
                             dark:border-neutral-700 dark:bg-neutral-900 dark:focus-visible:ring-teal-600/30"
                  value={form.button_link ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, button_link: e.target.value || null }))}
                  placeholder="https://…"
                />
              </div>
            </div>
          </div>

          <div className="my-5 h-px bg-gray-200 dark:bg-neutral-800" />

          {/* Gösterim Kuralları */}
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-neutral-400">
            Gösterim Kuralları
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/60">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label className="text-sm">Gösterim Sıklığı</Label>
                <select
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm shadow-sm
                             focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-200 focus-visible:border-teal-600
                             dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus-visible:ring-teal-600/30"
                  value={form.display_frequency}
                  onChange={(e) => setForm((p) => ({ ...p, display_frequency: e.target.value as DisplayFrequency }))}
                >
                  {freqOptions.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-sm">Gecikme (sn)</Label>
                <Input
                  type="number"
                  className="mt-1 h-10 rounded-lg border-gray-300 bg-white px-3 text-sm shadow-sm
                             focus-visible:ring-4 focus-visible:ring-teal-200 focus-visible:border-teal-600
                             dark:border-neutral-700 dark:bg-neutral-900 dark:focus-visible:ring-teal-600/30"
                  value={String(form.delay_seconds ?? 0)}
                  onChange={(e) => setForm((p) => ({ ...p, delay_seconds: Number(e.target.value || 0) }))}
                  min={0}
                />
              </div>

              <div>
                <Label className="text-sm">Süre (sn)</Label>
                <Input
                  type="number"
                  className="mt-1 h-10 rounded-lg border-gray-300 bg-white px-3 text-sm shadow-sm
                             focus-visible:ring-4 focus-visible:ring-teal-200 focus-visible:border-teal-600
                             dark:border-neutral-700 dark:bg-neutral-900 dark:focus-visible:ring-teal-600/30"
                  value={form.duration_seconds == null ? "" : String(form.duration_seconds)}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      duration_seconds: e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  min={0}
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-sm">Başlangıç</Label>
                <Input
                  type="datetime-local"
                  className="mt-1 h-10 rounded-lg border-gray-300 bg-white px-3 text-sm shadow-sm
                             focus-visible:ring-4 focus-visible:ring-teal-200 focus-visible:border-teal-600
                             dark:border-neutral-700 dark:bg-neutral-900 dark:focus-visible:ring-teal-600/30"
                  value={toInputValue(form.start_date)}
                  onChange={(e) => setForm((p) => ({ ...p, start_date: fromInputValue(e.target.value) }))}
                />
              </div>
              <div>
                <Label className="text-sm">Bitiş</Label>
                <Input
                  type="datetime-local"
                  className="mt-1 h-10 rounded-lg border-gray-300 bg-white px-3 text-sm shadow-sm
                             focus-visible:ring-4 focus-visible:ring-teal-200 focus-visible:border-teal-600
                             dark:border-neutral-700 dark:bg-neutral-900 dark:focus-visible:ring-teal-600/30"
                  value={toInputValue(form.end_date)}
                  onChange={(e) => setForm((p) => ({ ...p, end_date: fromInputValue(e.target.value) }))}
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <Label className="text-sm">Öncelik (priority)</Label>
                <Input
                  type="number"
                  className="mt-1 h-10 rounded-lg border-gray-300 bg-white px-3 text-sm shadow-sm
                             focus-visible:ring-4 focus-visible:ring-teal-200 focus-visible:border-teal-600
                             dark:border-neutral-700 dark:bg-neutral-900 dark:focus-visible:ring-teal-600/30"
                  value={form.priority == null ? "" : String(form.priority)}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, priority: e.target.value === "" ? null : Number(e.target.value) }))
                  }
                />
              </div>
              <div>
                <Label className="text-sm">Sayfalar (display_pages)</Label>
                <Input
                  className="mt-1 h-10 rounded-lg border-gray-300 bg-white px-3 text-sm shadow-sm
                             focus-visible:ring-4 focus-visible:ring-teal-200 focus-visible:border-teal-600
                             dark:border-neutral-700 dark:bg-neutral-900 dark:focus-visible:ring-teal-600/30"
                  value={form.display_pages}
                  onChange={(e) => setForm((p) => ({ ...p, display_pages: e.target.value || "all" }))}
                  placeholder="all"
                />
              </div>
              <div>
                <Label className="text-sm">Kupon Kodu</Label>
                <Input
                  className="mt-1 h-10 rounded-lg border-gray-300 bg-white px-3 text-sm shadow-sm
                             focus-visible:ring-4 focus-visible:ring-teal-200 focus-visible:border-teal-600
                             dark:border-neutral-700 dark:bg-neutral-900 dark:focus-visible:ring-teal-600/30"
                  value={form.coupon_code ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, coupon_code: e.target.value || null }))}
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-sm">Ürün ID</Label>
                <Input
                  className="mt-1 h-10 rounded-lg border-gray-300 bg-white px-3 text-sm shadow-sm
                             focus-visible:ring-4 focus-visible:ring-teal-200 focus-visible:border-teal-600
                             dark:border-neutral-700 dark:bg-neutral-900 dark:focus-visible:ring-teal-600/30"
                  value={form.product_id ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, product_id: e.target.value || null }))}
                />
              </div>
              <div>
                <Label className="text-sm">Görsel Alt (image_alt)</Label>
                <Input
                  className="mt-1 h-10 rounded-lg border-gray-300 bg-white px-3 text-sm shadow-sm
                             focus-visible:ring-4 focus-visible:ring-teal-200 focus-visible:border-teal-600
                             dark:border-neutral-700 dark:bg-neutral-900 dark:focus-visible:ring-teal-600/30"
                  value={form.image_alt ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, image_alt: e.target.value || null }))}
                />
              </div>
            </div>
          </div>

          {/* Sticky actions */}
          <div className="sticky bottom-0 z-10 mt-6 flex items-center gap-2 border-t border-gray-200 bg-white/95 pb-1 pt-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
            {initialValue?.id && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={busy}
                className="shadow-sm"
              >
                Sil
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={busy}
                className="border-gray-300 text-gray-800 hover:bg-gray-50 shadow-sm
                           dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
              >
                İptal
              </Button>
              <Button
                type="button"
                onClick={save}
                disabled={!canSave || busy}
                className="bg-teal-600 text-white hover:bg-teal-700 shadow-sm disabled:opacity-60"
              >
                {saving ? "Kaydediliyor..." : initialValue ? "Güncelle" : "Ekle"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
