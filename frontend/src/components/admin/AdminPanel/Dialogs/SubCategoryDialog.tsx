// =============================================================
// FILE: src/components/admin/AdminPanel/Dialogs/SubCategoryDialog.tsx
// =============================================================
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type UiSubCategoryLite = {
  /** yoksa hiç koyma — exactOptionalPropertyTypes için önemli */
  id?: string;
  category_id: string;
  name: string;
  slug: string;
};

type CatOption = { id: string; name: string };

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialValue: UiSubCategoryLite | null;
  categories: CatOption[];
  onSave: (payload: UiSubCategoryLite) => void;
  saving?: boolean;
  /** Aynı kategori içinde slug çakışması için: category_id -> Set(slug) */
  existingSlugsByCat?: Map<string, Set<string>>;
};

const slugify = (v: string) =>
  v.toString().trim().toLowerCase()
    .replace(/[^a-z0-9ğüşöçı\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const makeEmptyForm = (firstCatId?: string): UiSubCategoryLite => ({
  category_id: firstCatId ?? "",
  name: "",
  slug: "",
});

export default function SubCategoryDialog({
  open,
  onOpenChange,
  initialValue,
  categories,
  onSave,
  saving,
  existingSlugsByCat,
}: Props) {
  const [form, setForm] = useState<UiSubCategoryLite>(makeEmptyForm(categories[0]?.id));

  // initial / reset
  useEffect(() => {
    if (initialValue) {
      // id undefined ise hiç koyma (exactOptionalPropertyTypes)
      const next: UiSubCategoryLite = {
        category_id: initialValue.category_id || categories[0]?.id || "",
        name: initialValue.name ?? "",
        slug: initialValue.slug ?? "",
      };
      if (initialValue.id) next.id = initialValue.id;
      setForm(next);
    } else {
      setForm(makeEmptyForm(categories[0]?.id));
    }
  }, [initialValue, open, categories]);

  const currentCatSlugs = useMemo(
    () => existingSlugsByCat?.get(form.category_id) ?? new Set<string>(),
    [existingSlugsByCat, form.category_id]
  );

  const duplicated =
    !!form.slug &&
    currentCatSlugs.has(form.slug) &&
    (!initialValue ||
      initialValue.slug !== form.slug ||
      initialValue.category_id !== form.category_id);

  const canSave =
    !saving &&
    form.category_id.trim().length > 0 &&
    form.name.trim().length > 0 &&
    !duplicated;

  const save = () => {
    if (!canSave) return;
    const slug = form.slug.trim() || slugify(form.name);

    // payload’da id varsa ekle, yoksa ekleme
    const payload: UiSubCategoryLite = {
      category_id: form.category_id.trim(),
      name: form.name.trim(),
      slug,
    };
    if (form.id) payload.id = form.id;

    onSave(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          w-[min(92vw,42rem)] max-w-2xl p-0 overflow-hidden
          rounded-2xl border border-gray-200 bg-white shadow-2xl
        "
      >
        <DialogHeader className="sticky top-0 z-10 bg-white px-5 py-4">
          <DialogTitle className="text-base sm:text-lg">
            {form.id ? "Alt Kategori Düzenle" : "Yeni Alt Kategori"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Alt kategori adını, slug’ı ve bağlı olduğu kategoriyi seçin.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70dvh] overflow-y-auto bg-white px-5 pb-4 pt-2 sm:pb-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Üst Kategori *</label>
              <Select
                value={form.category_id}
                onValueChange={(v) => setForm((p) => ({ ...p, category_id: v }))}
              >
                <SelectTrigger className="mt-1 h-10 rounded-lg border-gray-300 bg-white px-3 text-sm shadow-sm focus:border-teal-500 focus:ring-4 focus:ring-teal-200">
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-gray-200 bg-white shadow-2xl">
                  {categories.map((c) => (
                    <SelectItem
                      key={c.id}
                      value={c.id}
                      className="cursor-pointer text-sm focus:bg-teal-50 focus:text-teal-700"
                    >
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Ad *</label>
              <Input
                className="mt-1 h-10 rounded-lg border-gray-300 bg-white px-3 text-sm shadow-sm focus:border-teal-500 focus:ring-4 focus:ring-teal-200"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Örn: Oval Başlık"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Slug</label>
              <Input
                className="mt-1 h-10 rounded-lg border-gray-300 bg-white px-3 text-sm shadow-sm focus:border-teal-500 focus:ring-4 focus:ring-teal-200"
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))}
                placeholder="oval-baslik"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Boş bırakırsanız isimden otomatik üretilecektir.
              </p>
              {duplicated && (
                <p className="mt-1 text-xs text-red-600">
                  Bu slug bu kategori içinde zaten kullanılıyor.
                </p>
              )}
            </div>

            {/* Sticky actions */}
            <div className="sticky bottom-0 z-10 mt-6 flex gap-2 border-t border-gray-200 bg-white pb-1 pt-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={!!saving}
              >
                İptal
              </Button>
              <Button
                type="button"
                className="flex-1 bg-teal-600 hover:bg-teal-700"
                onClick={save}
                disabled={!canSave}
              >
                {saving ? "Kaydediliyor..." : (form.id ? "Güncelle" : "Kaydet")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
