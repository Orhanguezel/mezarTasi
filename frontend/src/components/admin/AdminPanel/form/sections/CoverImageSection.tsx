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

  // 🔎 Tarayıcı tespiti (özellikle Firefox için)
  const [isFirefox, setIsFirefox] = React.useState(false);

  React.useEffect(() => {
    const ua =
      typeof navigator !== "undefined"
        ? navigator.userAgent.toLowerCase()
        : "";
    const ff = ua.includes("firefox");
    setIsFirefox(ff);

    console.log("[CoverImageSection] mount", {
      coverId,
      stagedCoverId,
      imageUrl,
      alt,
      trigger,
      inputId,
      isFirefox: ff,
    });
  }, [coverId, stagedCoverId, imageUrl, alt, trigger, inputId]);

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];

    console.log("[CoverImageSection] file input change", {
      hasFile: !!f,
      name: f?.name,
      size: f?.size,
      type: f?.type,
    });

    if (f) {
      try {
        const maybe = onPickFile(f);
        // onPickFile async ise olası hatayı yakala
        if (maybe && typeof (maybe as any).then === "function") {
          (maybe as Promise<void>).catch((err) => {
            console.error("[CoverImageSection] onPickFile promise ERROR", err);
          });
        }
      } catch (err) {
        console.error("[CoverImageSection] onPickFile sync ERROR", err);
      }
    }

    // aynı dosyayı tekrar seçebilsin diye temizle
    e.currentTarget.value = "";
  };

  const openPicker = () => {
    console.log("[CoverImageSection] openPicker", {
      hasRef: !!fileInputRef.current,
      inputId,
    });
    fileInputRef.current?.click();
  };

  // 🔹 input'u display:none yapmıyoruz; ekrandan taşıyoruz (Firefox için daha güvenli)
  const hiddenInputStyle: React.CSSProperties = {
    position: "absolute",
    left: "-9999px",
    top: "auto",
    width: "1px",
    height: "1px",
    opacity: 0,
  };

  const renderTrigger = () => {
    // 🔥 Firefox Fallback: direkt native <input type="file">
    if (isFirefox) {
      return (
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            className="inline-flex items-center gap-2 bg-rose-600 text-white hover:bg-rose-700"
            onClick={() => {
              console.log("[CoverImageSection] firefox openPicker", {
                hasRef: !!fileInputRef.current,
                inputId,
              });
              fileInputRef.current?.click();
            }}
          >
            <ImagePlus className="h-4 w-4" />
            Kapak Yükle (Firefox)
          </Button>
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            // Firefox'ta da görsel olarak minimal kalsın diye ekrandan taşıyoruz
            style={hiddenInputStyle}
          />
        </div>
      );
    }

    // 🌐 Diğer tarayıcılar: label + off-screen input + programmatic click
    if (trigger === "button") {
      // Görünüş olarak button, davranış olarak label benzeri
      return (
        <>
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            style={hiddenInputStyle}
          />
          <Button
            type="button"
            onClick={openPicker}
            className="inline-flex items-center gap-2 bg-rose-600 text-white hover:bg-rose-700"
          >
            <ImagePlus className="h-4 w-4" />
            Kapak Yükle
          </Button>
        </>
      );
    }

    // Klasik label trigger
    return (
      <>
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          style={hiddenInputStyle}
        />
        <label
          htmlFor={inputId}
          className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-rose-600 px-3 py-2 text-sm text-white hover:bg-rose-700"
          onClick={() => {
            console.log("[CoverImageSection] label click", { inputId });
          }}
        >
          <ImagePlus className="h-4 w-4" />
          Kapak Yükle
        </label>
      </>
    );
  };

  return (
    <Section
      title={title}
      action={
        <div className="flex items-center gap-2">
          {renderTrigger()}

          {hasAnyStorage && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                console.log("[CoverImageSection] onRemove click", {
                  coverId,
                  stagedCoverId,
                });
                onRemove();
              }}
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
              onChange={(e) => {
                console.log("[CoverImageSection] imageUrl change", {
                  value: e.target.value,
                });
                onUrlChange(e.target.value);
              }}
            />
            {imageUrl && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  console.log("[CoverImageSection] clear imageUrl");
                  onUrlChange("");
                }}
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
                onChange={(e) => {
                  console.log("[CoverImageSection] alt change", {
                    value: e.target.value,
                  });
                  onAltChange(e.target.value);
                }}
                placeholder="Kapak resmi alternatif metin"
              />
              {onSaveAlt && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    console.log("[CoverImageSection] onSaveAlt click");
                    onSaveAlt();
                  }}
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
