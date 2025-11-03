// =============================================================
// FILE: src/pages/admin/Dialogs/CampaignDialog.tsx
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Campaign } from "../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type Props = {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  initialValue: Campaign | null;
  onSave: (payload: Omit<Campaign, "id">) => void;
};

export const CampaignDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  initialValue,
  onSave,
}) => {
  const [form, setForm] = useState<Omit<Campaign, "id">>({
    title: "",
    description: "",
    images: [],
    tag: "Kampanya",
    date: "",
    isActive: true,
  });

  useEffect(() => {
    if (initialValue) {
      const { id, ...rest } = initialValue;
      setForm(rest);
    } else {
      setForm({
        title: "",
        description: "",
        images: [],
        tag: "Kampanya",
        date: "",
        isActive: true,
      });
    }
  }, [initialValue, open]);

  const handleFiles = (files: File[]) => {
    if (!files.length) return;
    files.forEach((f) => {
      if (!f.type.startsWith("image/")) return;
      if (f.size > 5 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = (e) =>
        setForm((p) => ({
          ...p,
          images: [...p.images, (e.target?.result as string) ?? ""],
        }));
      reader.readAsDataURL(f);
    });
    toast.success("Görseller eklendi");
  };

  const removeImage = (i: number) =>
    setForm((p) => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }));

  const save = () => {
    if (!form.title.trim() || !form.description.trim() || !form.date.trim()) {
      toast.error("Zorunlu alanlar boş");
      return;
    }
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby="campaign-form-description"
        className="
          w-[min(92vw,56rem)] max-w-2xl
          overflow-hidden rounded-xl border bg-white shadow-xl p-0
        "
      >
        {/* Sticky header */}
        <DialogHeader className="sticky top-0 z-10 bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-6">
          <DialogTitle className="text-base sm:text-lg">
            {initialValue ? "Kampanya Düzenle" : "Yeni Kampanya Ekle"}
          </DialogTitle>
          <DialogDescription
            id="campaign-form-description"
            className="text-xs sm:text-sm"
          >
            Kampanya bilgilerini doldurun ve kaydedin.
          </DialogDescription>
        </DialogHeader>

        {/* CONTENT (white bg, scrollable) */}
        <div className="max-h-[80dvh] overflow-y-auto bg-white px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
          <div className="space-y-4">
            {/* Başlık */}
            <div>
              <Label htmlFor="cmp-title">Başlık *</Label>
              <Input
                id="cmp-title"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                className="mt-1"
              />
            </div>

            {/* Açıklama */}
            <div>
              <Label htmlFor="cmp-desc">Açıklama *</Label>
              <Textarea
                id="cmp-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                className="mt-1 min-h-[100px]"
              />
            </div>

            {/* Etiket / Tarih / Aktiflik */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label htmlFor="cmp-tag">Etiket</Label>
                <Select
                  value={form.tag}
                  onValueChange={(v) => setForm((p) => ({ ...p, tag: v }))}
                >
                  <SelectTrigger id="cmp-tag" className="mt-1">
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kampanya">Kampanya</SelectItem>
                    <SelectItem value="Hizmet">Hizmet</SelectItem>
                    <SelectItem value="Duyuru">Duyuru</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cmp-date">Tarih *</Label>
                <Input
                  id="cmp-date"
                  placeholder="Haziran 2024"
                  value={form.date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, date: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>

              <div className="flex items-end gap-3 pt-1">
                <Switch
                  id="cmp-active"
                  checked={form.isActive}
                  onCheckedChange={(v) =>
                    setForm((p) => ({ ...p, isActive: v }))
                  }
                />
                <Label
                  htmlFor="cmp-active"
                  className="text-sm text-muted-foreground"
                >
                  Aktif
                </Label>
              </div>
            </div>

            {/* Görseller */}
            <div>
              <Label>Görseller</Label>

              {/* Dropzone-like */}
              <div className="mt-2">
                <input
                  id="cmp-images"
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
                />
                <label
                  htmlFor="cmp-images"
                  className="block cursor-pointer rounded-lg border border-dashed border-gray-300 bg-gray-50/80 p-4 text-center text-sm text-gray-600 transition hover:bg-gray-50"
                >
                  Dosya seç veya görselleri bu alana bırak
                </label>
              </div>

              {form.images.length > 0 && (
                <div className="mt-3 rounded-lg border bg-white p-3">
                  <p className="mb-3 text-sm font-medium text-gray-700">
                    Görseller ({form.images.length})
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {form.images.map((img, idx) => (
                      <div key={idx} className="group relative">
                        <div className="aspect-video w-full overflow-hidden rounded-md border bg-muted">
                          <img
                            src={img}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removeImage(idx)}
                          className="absolute right-2 top-2 h-7 w-7 rounded-full p-0 opacity-0 transition group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
