// =============================================================
// FILE: src/components/admin/AdminPanel/form/sections/CoverImageSection.tsx
// =============================================================
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Section } from "./shared/Section";
import { ThumbById } from "./shared/ThumbById";
import { ImagePlus, Trash2, X, Save as SaveIcon } from "lucide-react";

export type CoverImageSectionProps = {
  /** Başlık metni (default: "Görsel (tekli, storage destekli)") */
  title?: string | undefined;

  /** Storage tarafındaki mevcut kapak id'si (opsiyonel) */
  coverId?: string | undefined;
  /** Henüz kaydı yapılmamış "staged" kapak id'si (opsiyonel) */
  stagedCoverId?: string | undefined;

  /** Dış URL ve ALT (zorunlu) */
  imageUrl: string;
  alt: string;

  /** Kaydetme/işlem sırasında gösterilecek durum (opsiyonel) */
  saving?: boolean | undefined;

  /** Upload seçimi geldiğinde tetiklenecek handler (dosyayı parent yükler) */
  onPickFile: (file: File) => void;

  /** Storage kapak kaldırma */
  onRemove: () => void;

  /** Dış URL ve ALT değişimleri */
  onUrlChange: (url: string) => void;
  onAltChange: (alt: string) => void;

  /** Sadece ALT metnini kaydet (opsiyonel). Sağlanırsa bir "Alt'ı Kaydet" butonu çıkar */
  onSaveAlt?: (() => void) | undefined;

  /** Input accept (default: image/*) */
  accept?: string | undefined;
};

export function CoverImageSection({
  title = "Görsel (tekli, storage destekli)",
  coverId,
  stagedCoverId,
  imageUrl,
  alt,
  saving = false,
  onPickFile,
  onRemove,
  onUrlChange,
  onAltChange,
  onSaveAlt,
  accept = "image/*",
}: CoverImageSectionProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const hasAnyStorage = Boolean(coverId || stagedCoverId);

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (f) onPickFile(f);
    // aynı dosyayı tekrar seçebilsin diye temizle
    e.currentTarget.value = "";
  };

  return (
    <Section
      title={title}
      action={
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            id="file-cover"
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleFileChange}
          />
          <label
            htmlFor="file-cover"
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-rose-600 px-3 py-2 text-sm text-white hover:bg-rose-700"
          >
            <ImagePlus className="h-4 w-4" />
            Kapak Yükle
          </label>

          {hasAnyStorage && (
            <Button variant="ghost" onClick={onRemove} className="text-rose-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Görseli Kaldır
            </Button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* External URL + ALT */}
        <div className="space-y-2">
          <Label>Dış Kapak URL (opsiyonel)</Label>
          <div className="flex gap-2">
            <Input
              placeholder="https://…"
              value={imageUrl}
              onChange={(e) => onUrlChange(e.target.value)}
            />
            {imageUrl && (
              <Button variant="ghost" onClick={() => onUrlChange("")} title="Temizle">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {imageUrl ? (
            <img
              src={imageUrl}
              alt={alt}
              className="mt-2 h-32 w-56 rounded border object-cover"
            />
          ) : (
            <div className="mt-2 h-32 w-56 rounded border bg-gray-50" />
          )}

          <div className="space-y-1">
            <Label>Alt (alt) metin</Label>
            <div className="flex gap-2">
              <Input
                value={alt}
                onChange={(e) => onAltChange(e.target.value)}
                placeholder="Kapak resmi alternatif metin"
              />
              {onSaveAlt && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onSaveAlt}
                  title="Sadece ALT bilgisini kaydet"
                >
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Alt'ı Kaydet
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Storage Kapak Preview */}
        <div className="space-y-2">
          <Label className="block">Storage Kapak (ID: {coverId ?? stagedCoverId ?? "—"})</Label>
          {hasAnyStorage ? (
            <div className="mt-2">
              <ThumbById id={(coverId ?? stagedCoverId)!} />
            </div>
          ) : (
            <div className="text-xs text-gray-500 mt-2">Henüz storage kapak seçilmedi.</div>
          )}
          {saving && <div className="text-xs text-gray-500 mt-2">Görsel kaydediliyor…</div>}
        </div>
      </div>
    </Section>
  );
}
