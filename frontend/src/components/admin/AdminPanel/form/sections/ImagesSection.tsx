// =============================================================
// FILE: src/components/admin/products/sections/ImagesSection.tsx
// =============================================================
"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Upload, ImagePlus } from "lucide-react";
import { Section } from "./shared/Section";
import { ThumbById } from "./shared/ThumbById";

type Props = {
  /** kapak id undefined olabilir (yeni üründe) */
  coverId?: string | undefined;
  galleryIds: string[];

  savingImages: boolean;

  imageUrl: string;
  setImageUrl: (v: string) => void;

  alt: string;
  setAlt: (v: string) => void;

  onUploadCover: (file: File) => Promise<void>;
  onUploadGallerySingle: (file: File) => Promise<void>;
  onUploadGalleryMultiple: (files: FileList | null) => Promise<void>;
  onRemoveFromGallery: (id: string) => void;
};

export function ImagesSection(props: Props) {
  const {
    coverId,
    galleryIds,
    savingImages,
    imageUrl,
    setImageUrl,
    alt,
    setAlt,
    onUploadCover,
    onUploadGallerySingle,
    onUploadGalleryMultiple,
    onRemoveFromGallery,
  } = props;

  return (
    <Section
      title="Görseller (Kapak ayrı + Galeri ayrı)"
      action={
        <div className="flex items-center gap-2">
          {/* Çoklu galeri yükle */}
          <label
            htmlFor="file-multi"
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-sky-600 px-3 py-2 text-sm text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400"
          >
            <Upload className="h-4 w-4" />
            Galeri: Çoklu
          </label>
          <input
            id="file-multi"
            type="file"
            multiple
            className="hidden"
            onChange={(e) => onUploadGalleryMultiple(e.target.files)}
          />

          {/* Tekli galeri yükle */}
          <label
            htmlFor="file-one"
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
          >
            <ImagePlus className="h-4 w-4" />
            Galeri: Tekli
          </label>
          <input
            id="file-one"
            type="file"
            className="hidden"
            onChange={(e) =>
              e.target.files?.[0] && onUploadGallerySingle(e.target.files[0])
            }
          />

          {/* Kapak yükle (ayrı) */}
          <label
            htmlFor="file-cover"
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-rose-600 px-3 py-2 text-sm text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-400"
          >
            <ImagePlus className="h-4 w-4" />
            Kapak: Tekli
          </label>
          <input
            id="file-cover"
            type="file"
            className="hidden"
            onChange={(e) =>
              e.target.files?.[0] && onUploadCover(e.target.files[0])
            }
          />
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Dış kapak URL (opsiyonel) */}
        <div className="space-y-2">
          <Label>Dış Kapak URL (opsiyonel)</Label>
          <div className="flex gap-2">
            <Input
              placeholder="https://…"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            {imageUrl && (
              <Button
                variant="ghost"
                type="button"
                onClick={() => setImageUrl("")}
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
            <Input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Kapak resmi alternatif metin"
            />
          </div>

          {/* Storage kapak önizleme */}
          <div className="mt-4">
            <Label className="block">
              Storage Kapak (ID: {coverId ?? "—"})
            </Label>
            {coverId ? (
              <div className="mt-2">
                <ThumbById id={coverId} />
              </div>
            ) : (
              <div className="mt-2 text-xs text-gray-500">
                Henüz storage kapak seçilmedi.
              </div>
            )}
          </div>
        </div>

        {/* Galeri */}
        <div className="space-y-2">
          <Label>Storage Galeri</Label>
          <div className="flex flex-wrap gap-3">
            {galleryIds.map((gid) => (
              <ThumbById
                key={gid}
                id={gid}
                isCover={coverId === gid}
                onRemove={() => onRemoveFromGallery(gid)}
              />
            ))}
            {!galleryIds.length && (
              <div className="text-sm text-gray-500">Henüz görsel yok.</div>
            )}
          </div>
          {savingImages && (
            <div className="text-xs text-gray-500">
              Görseller kaydediliyor…
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
