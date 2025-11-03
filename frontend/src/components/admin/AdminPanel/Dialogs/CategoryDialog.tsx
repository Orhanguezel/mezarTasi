// =============================================================
// FILE: src/components/admin/AdminPanel/Dialogs/CategoryDialog.tsx
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

export type UiCategoryLite = { label: string; value: string };

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialValue: UiCategoryLite | null;
  onSave: (payload: UiCategoryLite) => void;
  saving?: boolean;
  existingSlugs?: Set<string>;
};

const slugify = (v: string) =>
  v.toString().trim().toLowerCase()
    .replace(/[^a-z0-9ğüşöçı\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export default function CategoryDialog({
  open,
  onOpenChange,
  initialValue,
  onSave,
  saving,
  existingSlugs,
}: Props) {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");

  useEffect(() => {
    if (initialValue) {
      setLabel(initialValue.label ?? "");
      setValue(initialValue.value ?? "");
    } else {
      setLabel("");
      setValue("");
    }
  }, [initialValue, open]);

  const duplicated = useMemo(
    () =>
      !!existingSlugs &&
      value &&
      existingSlugs.has(value) &&
      (!initialValue || initialValue.value !== value),
    [existingSlugs, value, initialValue]
  );

  const canSave =
    label.trim().length > 0 && value.trim().length > 0 && !duplicated && !saving;

  const save = () => {
    if (!canSave) return;
    onSave({ label: label.trim(), value: value.trim() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          w-[min(92vw,38rem)] max-w-xl p-0 overflow-hidden
          rounded-2xl border border-gray-200 bg-white shadow-2xl
        "
      >
        <DialogHeader
          className="
            sticky top-0 z-10 bg-white px-5 py-4
          "
        >
          <DialogTitle className="text-base sm:text-lg">
            {initialValue ? "Kategori Düzenle" : "Yeni Kategori"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Kategori adını ve slug değerini girin. Slug boşsa otomatik üretmeniz önerilir.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70dvh] overflow-y-auto bg-white px-5 pb-4 pt-2 sm:pb-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Kategori Adı *</label>
              <Input
                className="mt-1 bg-white"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Örn: MEZAR MODELLERİ"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Slug *</label>
              <Input
                className="mt-1 bg-white"
                value={value}
                onChange={(e) => setValue(slugify(e.target.value))}
                placeholder="mezar-modelleri"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                İpucu: Boş bırakırsanız adı yazdıktan sonra <code>tek-kisilik-mermer</code> gibi bir slug üretin.
              </p>
              {duplicated && (
                <p className="mt-1 text-xs text-red-600">
                  Bu slug zaten kullanılıyor. Lütfen farklı bir değer girin.
                </p>
              )}
            </div>

            {/* Sticky actions */}
            <div
              className="
                sticky bottom-0 z-10 mt-6 flex gap-2
                bg-white pb-1 pt-3 border-t border-gray-200
              "
            >
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                İptal
              </Button>
              <Button
                type="button"
                className="flex-1 bg-teal-600 hover:bg-teal-700"
                onClick={save}
                disabled={!canSave}
              >
                Kaydet
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
