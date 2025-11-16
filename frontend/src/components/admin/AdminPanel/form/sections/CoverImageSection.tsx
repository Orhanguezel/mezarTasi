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
  title?: string;

  // ⬇️ exactOptionalPropertyTypes ile uyumlu: undefined da geçerli
  coverId?: string | undefined;
  stagedCoverId?: string | undefined;

  imageUrl: string;
  alt: string;

  saving?: boolean;

  onPickFile: (file: File) => void | Promise<void>;
  onRemove: () => void;

  onUrlChange: (url: string) => void;
  onAltChange: (alt: string) => void;

  // ⬇️ burada da bazen `undefined` geçiyoruz: onSaveAlt={id ? ... : undefined}
  onSaveAlt?: (() => void) | undefined;

  /** Dosya input accept (default: image/*) */
  accept?: string;

  /** 🔸 Opsiyonel: tetikleme modu (varsayılan "label") */
  trigger?: "label" | "button";

  /** 🔸 Opsiyonel: input id (varsayılan "file-cover") */
  inputId?: string;
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
  trigger = "label",
  inputId = "file-cover",
}: CoverImageSectionProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const hasAnyStorage = Boolean(coverId || stagedCoverId);

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (f) void onPickFile(f);
    // aynı dosyayı tekrar seçebilsin diye temizle
    e.currentTarget.value = "";
  };

  const openPicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <Section
      title={title}
      action={
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleFileChange}
          />

          {trigger === "label" ? (
            <label
              htmlFor={inputId}
              className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-rose-600 px-3 py-2 text-sm text-white hover:bg-rose-700"
            >
              <ImagePlus className="h-4 w-4" />
              Kapak Yükle
            </label>
          ) : (
            <Button
              type="button"
              onClick={openPicker}
              className="inline-flex items-center gap-2 bg-rose-600 text-white hover:bg-rose-700"
            >
              <ImagePlus className="h-4 w-4" />
              Kapak Yükle
            </Button>
          )}

          {hasAnyStorage && (
            <Button
              type="button"
              variant="ghost"
              onClick={onRemove}
              className="text-rose-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
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
              <Button
                type="button"
                variant="ghost"
                onClick={() => onUrlChange("")}
                title="Temizle"
              >
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
                  <SaveIcon className="mr-2 h-4 w-4" />
                  Alt&apos;ı Kaydet
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Storage Kapak Preview */}
        <div className="space-y-2">
          <Label className="block">
            Storage Kapak (ID: {coverId ?? stagedCoverId ?? "—"})
          </Label>
          {hasAnyStorage ? (
            <div className="mt-2">
              <ThumbById id={(coverId ?? stagedCoverId)!} isCover />
            </div>
          ) : (
            <div className="mt-2 text-xs text-gray-500">
              Henüz storage kapak seçilmedi.
            </div>
          )}
          {saving && (
            <div className="mt-2 text-xs text-gray-500">
              Görsel kaydediliyor…
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

// /home/orhan/Documents/mezarTasi/backend/uploads/categories/aaaa0001-1111-4111-8111-aaaaaaaa0001/cover/Bildschirmfoto_vom_2025-10-17_22-27-09.png
//  http://localhost:8083/uploads/categories/aaaa0001-1111-4111-8111-aaaaaaaa0001/cover/Bildschirmfoto_vom_2025-10-17_22-27-09.png