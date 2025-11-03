// =============================================================
// FILE: src/pages/admin/Dialogs/SliderDialog.tsx
// =============================================================
"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash2 } from "lucide-react";
import type { Slide } from "../types";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  initialValue: Slide | null;
  onSave: (payload: Omit<Slide, "id">) => void;
};

export const SliderDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  initialValue,
  onSave,
}) => {
  const [form, setForm] = useState<Omit<Slide, "id">>({
    title: "",
    subtitle: "Slider Alt Başlık",
    description: "Slider Açıklama",
    image: "",
    buttonText: "İncele",
    buttonLink: "#products",
    isActive: true,
    order: 1,
  });

  useEffect(() => {
    if (initialValue) {
      const { id, ...rest } = initialValue;
      setForm(rest);
    } else {
      setForm({
        title: "",
        subtitle: "Slider Alt Başlık",
        description: "Slider Açıklama",
        image: "",
        buttonText: "İncele",
        buttonLink: "#products",
        isActive: true,
        order: 1,
      });
    }
  }, [initialValue, open]);

  const handleFile = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen resim dosyası seçin");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dosya 5MB'den küçük olmalı");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) =>
      setForm((p) => ({ ...p, image: (e.target?.result as string) ?? "" }));
    reader.readAsDataURL(file);
  };

  const clearImage = () =>
    setForm((p) => ({
      ...p,
      image: "",
    }));

  const save = () => {
    if (!form.title.trim() || !form.image) {
      toast.error("Başlık ve görsel zorunlu");
      return;
    }
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby="slider-form-description"
        className="
          w-[min(92vw,48rem)] max-w-xl
          overflow-hidden rounded-xl border bg-white shadow-xl p-0
        "
      >
        {/* Sticky header */}
        <DialogHeader className="sticky top-0 z-10 bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-6">
          <DialogTitle className="text-base sm:text-lg">
            {initialValue ? "Slider Düzenle" : "Yeni Slider Ekle"}
          </DialogTitle>
          <DialogDescription
            id="slider-form-description"
            className="text-xs sm:text-sm"
          >
            Slider bilgilerini doldurun ve kaydedin.
          </DialogDescription>
        </DialogHeader>

        {/* CONTENT — scrollable & white */}
        <div className="max-h-[80dvh] overflow-y-auto bg-white px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
          <div className="space-y-4">
            {/* Başlık */}
            <div>
              <Label htmlFor="sl-title">Başlık *</Label>
              <Input
                id="sl-title"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                className="mt-1"
              />
            </div>

            {/* Sıra + Aktiflik */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="sl-order">Sıra *</Label>
                <Input
                  id="sl-order"
                  type="number"
                  min={1}
                  value={form.order}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      order: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div className="flex items-end gap-3 pt-1">
                <Switch
                  id="sl-active"
                  checked={form.isActive}
                  onCheckedChange={(v) =>
                    setForm((p) => ({ ...p, isActive: v }))
                  }
                />
                <Label
                  htmlFor="sl-active"
                  className="text-sm text-muted-foreground"
                >
                  Aktif
                </Label>
              </div>
            </div>

            {/* Görsel */}
            <div>
              <Label>Görsel *</Label>

              {/* Dropzone-like alan */}
              <div className="mt-2">
                <input
                  id="sl-image"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
                {!form.image ? (
                  <label
                    htmlFor="sl-image"
                    className="block cursor-pointer rounded-lg border border-dashed border-gray-300 bg-gray-50/80 p-4 text-center text-sm text-gray-600 transition hover:bg-gray-50"
                  >
                    Dosya seç veya görseli buraya bırak
                  </label>
                ) : (
                  <div className="rounded-lg border bg-white p-3">
                    <p className="mb-3 text-sm font-medium text-gray-700">
                      Önizleme
                    </p>
                    <div className="relative">
                      <div className="aspect-video w-full overflow-hidden rounded-md border bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={form.image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <label
                          htmlFor="sl-image"
                          className="inline-flex cursor-pointer items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                        >
                          Değiştir
                        </label>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={clearImage}
                          className="inline-flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Kaldır
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky footer actions */}
          <div className="sticky bottom-0 z-10 mt-6 flex gap-2 bg-white/95 pb-1 pt-3 backdrop-blur-sm">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1"
            >
              İptal
            </Button>
            <Button
              type="button"
              onClick={save}
              className="flex-1 bg-teal-600 hover:bg-teal-700"
            >
              {initialValue ? "Güncelle" : "Ekle"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
