// =============================================================
// FILE: src/pages/admin/Dialogs/ProductDialog.tsx
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Product, Spec } from "../types";
import { useAdminListCategoriesQuery } from "@/integrations/metahub/rtk/endpoints/admin/products_admin.endpoints";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialValue: Product | null;
  onSave: (
    payload: Omit<Product, "id" | "status"> & Partial<Pick<Product, "status">>
  ) => void;
};

const emptySpec: Spec = {
  dimensions: "",
  weight: "",
  thickness: "",
  surfaceFinish: "",
  warranty: "",
  installationTime: "",
};

/** Form state tipini netleştiriyoruz: images ZORUNLU string[] */
type ProductFormState = Omit<Product, "id" | "status" | "images"> &
  { images: string[] } &
  Partial<Pick<Product, "status">>;

export const ProductDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  initialValue,
  onSave,
}) => {
  const { data: catList, isFetching: catsLoading } = useAdminListCategoriesQuery();

  const [form, setForm] = useState<ProductFormState>({
    title: "",
    price: "",
    category: "",
    subCategory: "",
    description: "",
    images: [],           // <-- guaranteed string[]
    image: "",
    specifications: { ...emptySpec },
    status: "Active",
  });

  // initial fill
  useEffect(() => {
    if (initialValue) {
      setForm({
        title: initialValue.title,
        price: initialValue.price,
        category: initialValue.category, // kategori ID
        subCategory: initialValue.subCategory ?? "",
        description: initialValue.description ?? "",
        images: initialValue.images ?? (initialValue.image ? [initialValue.image] : []),
        image: initialValue.image ?? "",
        specifications: initialValue.specifications ?? { ...emptySpec },
        status: initialValue.status ?? "Active",
      });
    } else {
      setForm({
        title: "",
        price: "",
        category: "",
        subCategory: "",
        description: "",
        images: [],
        image: "",
        specifications: { ...emptySpec },
        status: "Active",
      });
    }
  }, [initialValue, open]);

  /** Kategori ve alt kategori listeleri (BE sub_categories varsa isimle Select; yoksa input) */
  type CatWithSubs = {
    id: string;
    name: string;
    sub_categories?: Array<{ id: string; name: string }>;
  };

  const catsWithSubs: CatWithSubs[] = useMemo(() => {
    return (catList ?? []).map((c: any) => ({
      id: String(c.id),
      name: String(c.name ?? c.id),
      sub_categories: Array.isArray(c?.sub_categories)
        ? c.sub_categories.map((s: any) => ({
            id: String(s.id),
            name: String(s.name ?? s.id),
          }))
        : undefined,
    }));
  }, [catList]);

  const catItems = useMemo(
    () => catsWithSubs.map((c) => ({ id: c.id, name: c.name })),
    [catsWithSubs]
  );

  const subcatItemsForSelected = useMemo(() => {
    const cat = catsWithSubs.find((c) => c.id === form.category);
    return cat?.sub_categories ?? [];
  }, [catsWithSubs, form.category]);

  const handleFiles = (files: File[]) => {
    const valid = files.filter((f) => {
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name} bir resim dosyası değil`);
        return false;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name} 5MB'den büyük`);
        return false;
      }
      return true;
    });

    valid.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = (e.target?.result as string) ?? "";
        setForm((prev) => ({
          ...prev,
          images: [...prev.images, result], // prev.images DEFINITE string[]
        }));
      };
      reader.readAsDataURL(file);
    });

    if (valid.length) toast.success(`${valid.length} görsel eklendi`);
  };

  const removeImage = (i: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== i),
    }));
  };

  const save = () => {
    if (
      !form.title.trim() ||
      !form.price.trim() ||
      !form.description.trim() ||
      !form.category ||
      form.images.length === 0
    ) {
      toast.error("Zorunlu alanları doldurun ve en az bir görsel ekleyin");
      return;
    }

    // Tekil image alanını images[0] ile senkronla
    const firstImg = form.images[0] ?? form.image ?? "";
    const payload: Omit<Product, "id" | "status"> &
      Partial<Pick<Product, "status">> = {
      ...form,
      image: firstImg,
      status: form.status ?? "Active",
    };

    onSave(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby="product-form-description"
        className="w-[min(92vw,64rem)] max-w-3xl overflow-hidden rounded-2xl border bg-white p-0 shadow-xl"
      >
        {/* Sticky header */}
        <DialogHeader className="sticky top-0 z-10 bg-white/95 px-5 py-4 backdrop-blur-sm">
          <DialogTitle className="text-base sm:text-lg">
            {initialValue ? "Ürünü Düzenle" : "Yeni Ürün Oluştur"}
          </DialogTitle>
          <DialogDescription id="product-form-description" className="text-xs sm:text-sm" />
        </DialogHeader>

        {/* Scrollable content */}
        <div className="max-h-[80dvh] overflow-y-auto bg-white px-5 pb-4 pt-2 sm:pb-6">
          <div className="space-y-6">
            {/* Başlık & Fiyat & Aktiflik */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="pd-title">Ürün Başlığı *</Label>
                <Input
                  id="pd-title"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Örn: Klasik Mermer Mezar Taşı"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="pd-price">Ürün Fiyatı *</Label>
                <Input
                  id="pd-price"
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                  placeholder="Örn: 15000"
                  inputMode="decimal"
                  className="mt-1"
                />
              </div>

              <div className="flex items-end gap-3">
                <Switch
                  id="pd-active"
                  checked={(form.status ?? "Active") === "Active"}
                  onCheckedChange={(v) =>
                    setForm((p) => ({ ...p, status: v ? "Active" : "Inactive" }))
                  }
                />
                <Label htmlFor="pd-active" className="text-sm text-muted-foreground">
                  Aktif
                </Label>
              </div>
            </div>

            {/* Kategori / Alt Kategori */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="pd-cat">Kategori *</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) =>
                    setForm((p) => ({ ...p, category: value, subCategory: "" }))
                  }
                  disabled={catsLoading}
                >
                  <SelectTrigger
                    id="pd-cat"
                    className="mt-1 h-10 rounded-lg border-gray-300 bg-white/70 px-3 text-sm shadow-sm backdrop-blur placeholder:text-muted-foreground data-[placeholder]:text-muted-foreground focus:border-teal-500 focus:ring-4 focus:ring-teal-200"
                  >
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-gray-200 bg-white/95 shadow-2xl backdrop-blur-sm">
                    {catItems.map((c) => (
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

              {/* Alt kategori: BE 'sub_categories' sağlıyorsa isimle SELECT, yoksa ID input */}
              <div>
                <Label htmlFor="pd-subcat">
                  {subcatItemsForSelected.length ? "Alt Kategori" : "Alt Kategori (opsiyonel / ID)"}
                </Label>

                {subcatItemsForSelected.length ? (
                  <Select
                    value={form.subCategory}
                    onValueChange={(value) => setForm((p) => ({ ...p, subCategory: value }))}
                    disabled={!form.category}
                  >
                    <SelectTrigger
                      id="pd-subcat"
                      className="mt-1 h-10 rounded-lg border-gray-300 bg-white/70 px-3 text-sm shadow-sm focus:border-teal-500 focus:ring-4 focus:ring-teal-200"
                    >
                      <SelectValue placeholder="Alt kategori seçin" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-gray-200 bg-white/95 shadow-2xl backdrop-blur-sm">
                      {subcatItemsForSelected.map((s) => (
                        <SelectItem
                          key={s.id}
                          value={s.id}
                          className="cursor-pointer text-sm focus:bg-teal-50 focus:text-teal-700"
                        >
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="pd-subcat"
                    value={form.subCategory}
                    onChange={(e) => setForm((p) => ({ ...p, subCategory: e.target.value }))}
                    placeholder="Alt kategori ID (opsiyonel)"
                    className="mt-1 h-10 rounded-lg border-gray-300 bg-white/70 px-3 text-sm shadow-sm focus:border-teal-500 focus:ring-4 focus:ring-teal-200"
                  />
                )}
              </div>
            </div>

            {/* Açıklama */}
            <div>
              <Label htmlFor="pd-desc">Ürün Açıklaması *</Label>
              <Textarea
                id="pd-desc"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Ürün açıklaması..."
                className="mt-1 min-h-[110px]"
              />
            </div>

            {/* Teknik Özellikler */}
            <div className="rounded-lg border bg-gray-50 p-4">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Teknik Özellikler</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {([
                  ["dimensions", "Boyutlar", "Örn: 200cm x 100cm x 15cm"],
                  ["weight", "Ağırlık", "Örn: 450 kg"],
                  ["thickness", "Kalınlık", "Örn: 15 cm"],
                  ["surfaceFinish", "Yüzey İşlemi", "Örn: Doğal Mermer Cilalı"],
                  ["warranty", "Garanti", "Örn: 10 Yıl Garanti"],
                  ["installationTime", "Kurulum Süresi", "Örn: 1-2 Gün"],
                ] as const).map(([key, label, ph]) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <Input
                      value={(form.specifications as Spec)?.[key] ?? ""}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          specifications: {
                            ...(p.specifications ?? {}),
                            [key]: e.target.value,
                          } as Spec,
                        }))
                      }
                      placeholder={ph}
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Görseller */}
            <div>
              <Label>Ürün Görselleri *</Label>

              <div className="mt-2">
                <input
                  id="pd-images"
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
                />
                <label
                  htmlFor="pd-images"
                  className="block cursor-pointer rounded-lg border border-dashed border-gray-300 bg-gray-50/80 p-4 text-center text-sm text-gray-600 transition hover:bg-gray-50"
                >
                  Dosya seç veya görselleri bu alana bırak
                </label>
              </div>

              {form.images.length > 0 && (
                <div className="mt-3 rounded-lg border bg-white p-4">
                  <p className="mb-3 text-sm font-medium text-gray-700">
                    Ürün Görselleri ({form.images.length} adet)
                  </p>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {form.images.map((img, idx) => (
                      <div key={idx} className="group relative">
                        <div className="aspect-video w-full overflow-hidden rounded-md border bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="absolute bottom-1 left-1 rounded bg-black/55 px-1 text-[11px] text-white">
                          {idx + 1}
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

            {/* Actions (sticky) */}
            <div className="sticky bottom-0 z-10 mt-6 flex gap-2 bg-white/95 pb-1 pt-3 backdrop-blur-sm">
              <Button type="button" onClick={() => onOpenChange(false)} variant="outline" className="flex-1">
                İptal
              </Button>
              <Button type="button" onClick={save} className="flex-1 bg-teal-600 hover:bg-teal-700">
                {initialValue ? "Güncelle" : "Oluştur"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
