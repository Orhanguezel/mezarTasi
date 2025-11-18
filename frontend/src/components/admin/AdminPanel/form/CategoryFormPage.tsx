// =============================================================
// FILE: src/components/admin/AdminPanel/form/CategoryFormPage.tsx
// =============================================================
"use client";

import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, ArrowLeft, Info } from "lucide-react";

import {
  useGetCategoryAdminByIdQuery,
  useCreateCategoryAdminMutation,
  useUpdateCategoryAdminMutation,
  useToggleActiveCategoryAdminMutation,
  useToggleFeaturedCategoryAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/categories_admin.endpoints";

// 🔸 ADMIN STORAGE kullanıyoruz
import { useCreateAssetAdminMutation } from "@/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints";

import { Section } from "@/components/admin/AdminPanel/form/sections/shared/Section";

const slugifyTr = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .substring(0, 120);

const RequiredMark = () => (
  <span className="ml-0.5 text-red-500" aria-hidden="true">
    *
  </span>
);

export default function CategoryFormPage() {
  const { id } = useParams() as { id?: string };
  const isNew = !id || id === "new";
  const navigate = useNavigate();

  console.log("[CategoryFormPage] mount", { id, isNew });

  const { data: existing, isFetching: loadingExisting } =
    useGetCategoryAdminByIdQuery(id as string, {
      skip: isNew,
    });

  // ---------- GLOBAL DEBUG: native change dinleyicisi ----------
  React.useEffect(() => {
    const handler = (e: Event) => {
      const t = e.target as HTMLInputElement | null;
      if (t && t.type === "file") {
        console.log("[GLOBAL change listener] FILE INPUT change (native)", {
          filesLength: t.files?.length ?? 0,
          name: t.files?.[0]?.name,
        });
      }
    };
    document.addEventListener("change", handler, true); // capture fazında
    return () => document.removeEventListener("change", handler, true);
  }, []);

  // ---------- form state ----------
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [autoSlug, setAutoSlug] = React.useState(true);
  const [description, setDescription] = React.useState("");

  const [isActive, setIsActive] = React.useState(true);
  const [isFeatured, setIsFeatured] = React.useState(false);
  const [displayOrder, setDisplayOrder] = React.useState<number>(0);

  // ---------- image state ----------
  const [imageUrl, setImageUrl] = React.useState<string>("");
  const [alt, _setAlt] = React.useState<string>("");
  const [altTouched, setAltTouched] = React.useState(false);
  const [coverId, setCoverId] = React.useState<string | undefined>(undefined);
  const [stagedCoverId, setStagedCoverId] = React.useState<string | undefined>(
    undefined,
  );

  const setAlt = (v: string) => {
    setAltTouched(true);
    _setAlt(v);
  };

  // ---------- mutations ----------
  const [createCategory, { isLoading: creating }] =
    useCreateCategoryAdminMutation();
  const [updateCategory, { isLoading: updating }] =
    useUpdateCategoryAdminMutation();
  const [toggleActive] = useToggleActiveCategoryAdminMutation();
  const [toggleFeatured] = useToggleFeaturedCategoryAdminMutation();

  // 🔸 ADMIN STORAGE upload ( /admin/storage/assets )
  const [createAssetAdmin, { isLoading: uploading }] =
    useCreateAssetAdminMutation();

  const saving = creating || updating || uploading;

  // ---------- hydrate ----------
  React.useEffect(() => {
    if (!isNew && existing) {
      console.log("[CategoryFormPage] hydrate existing category", {
        id,
        existing,
      });

      setName(existing.name ?? "");
      setSlug(existing.slug ?? "");
      setDescription(existing.description ?? "");

      setIsActive(!!existing.is_active);
      setIsFeatured(!!existing.is_featured);
      setDisplayOrder(Number(existing.display_order ?? 0));

      setImageUrl(existing.image_url ?? "");

      // alt default: varsa alt, yoksa name
      if (!existing.alt && existing.name) {
        _setAlt(existing.name);
        setAltTouched(false);
      } else {
        _setAlt(existing.alt ?? "");
        setAltTouched(!!existing.alt);
      }

      const existingAssetId =
        (existing as any).asset_id ??
        (existing as any).storage_asset_id ??
        (existing as any).image_asset_id ??
        undefined;
      setCoverId(existingAssetId);
      setStagedCoverId(undefined);

      console.log("[CategoryFormPage] hydrate image state", {
        imageUrl: existing.image_url,
        existingAssetId,
      });
    }
  }, [existing, isNew, id]);

  // name değişince, kullanıcı alt'a dokunmadıysa otomatik doldur
  React.useEffect(() => {
    if (!altTouched && !alt && name) {
      _setAlt(name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  React.useEffect(() => {
    if (autoSlug) setSlug(slugifyTr(name));
  }, [name, autoSlug]);

  const onBack = () =>
    window.history.length
      ? window.history.back()
      : navigate("/admin/categories");

  // UpsertCategoryBody: alt + image_url + bool alanlar
  const buildPayload = () => {
    const payload = {
      name,
      slug,
      description: description || null,
      image_url: imageUrl || null,
      alt: alt || null,
      is_active: isActive,
      is_featured: isFeatured,
      display_order: Number(displayOrder) || 0,
    };

    console.log("[CategoryFormPage] buildPayload", payload);
    return payload;
  };

  // ---------- create / update ----------
  const doCreate = async () => {
    console.log("[CategoryFormPage] doCreate called");

    if (!name) {
      toast.error("Ad zorunlu");
      return;
    }
    if (!slug) {
      toast.error("Slug zorunlu");
      return;
    }
    try {
      const created = await createCategory(buildPayload()).unwrap();
      console.log("[CategoryFormPage] createCategory OK", created);
      toast.success(
        "Kategori oluşturuldu. Şimdi kapak görseli ekleyebilirsiniz.",
      );
      navigate(`/admin/categories/${created.id}`);
    } catch (e: any) {
      console.error("[CategoryFormPage] createCategory ERROR", e);
      toast.error(e?.data?.message || "Oluşturma başarısız");
    }
  };

  const doUpdate = async () => {
    console.log("[CategoryFormPage] doUpdate called", { id, isNew });

    if (isNew || !id) return;
    if (!name) {
      toast.error("Ad zorunlu");
      return;
    }
    if (!slug) {
      toast.error("Slug zorunlu");
      return;
    }
    try {
      await updateCategory({ id, body: buildPayload() }).unwrap();
      console.log("[CategoryFormPage] updateCategory OK");
      toast.success("Kategori güncellendi");
      navigate("/admin/categories");
    } catch (e: any) {
      console.error("[CategoryFormPage] updateCategory ERROR", e);
      toast.error(e?.data?.message || "Güncelleme başarısız");
    }
  };

  // ---------- image handlers (ADMIN STORAGE) ----------

  /** Dosya yükle + admin storage asset + public URL + opsiyonel anında kaydetme */
  const uploadCover = async (file: File): Promise<void> => {
    console.log("[CategoryFormPage] uploadCover CALLED", {
      isNew,
      id,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
    });

    // 🔒 Yeni kayıt iken görsel ekleme yok
    if (isNew || !id) {
      console.warn("[CategoryFormPage] uploadCover blocked (isNew or !id)", {
        isNew,
        id,
      });
      toast.error(
        "Önce Temel Bilgileri kaydedin, sonra kapak görseli ekleyin.",
      );
      return;
    }

    try {
      console.log("[CategoryFormPage] calling createAssetAdmin...");
      const asset = await createAssetAdmin({
        file,
        bucket: "categories",
        folder: `categories/${id}/cover`,
      }).unwrap();
      console.log("[CategoryFormPage] createAssetAdmin OK", asset);

      const publicUrl: string | undefined = asset.url ?? undefined;

      if (!publicUrl) {
        console.error(
          "[CategoryFormPage] publicUrl yok (asset.url undefined)",
          asset,
        );
        toast.error("Yükleme cevabı beklenen formatta değil");
        return;
      }

      // alt default: önce name, yoksa dosya adı
      let nextAlt = alt;
      if (!altTouched && !alt) {
        const base = file.name.replace(/\.[^.]+$/, "");
        nextAlt = name || base;
        _setAlt(nextAlt);
      }

      setImageUrl(publicUrl);
      setCoverId(asset.id);
      setStagedCoverId(undefined);

      console.log("[CategoryFormPage] updating category with new cover", {
        id,
        publicUrl,
        nextAlt,
      });

      await updateCategory({
        id,
        body: {
          ...buildPayload(),
          image_url: publicUrl,
          alt: nextAlt || null,
        },
      }).unwrap();

      console.log("[CategoryFormPage] updateCategory after upload OK");
      toast.success("Kapak resmi güncellendi");
    } catch (e: any) {
      console.error("[CategoryFormPage] uploadCover ERROR", e);
      toast.error(e?.data?.message || "Kapak yüklenemedi");
    }
  };

  /** Sadece ALT bilgisini güncelle (mevcut kayıtta) */
  const saveAltOnly = async () => {
    console.log("[CategoryFormPage] saveAltOnly called", { id, isNew, alt });

    if (isNew || !id) return;
    if (!imageUrl) {
      toast.error("Önce bir görsel ekleyin.");
      return;
    }
    try {
      await updateCategory({
        id,
        body: {
          ...buildPayload(),
          alt: alt || null,
        },
      }).unwrap();
      console.log("[CategoryFormPage] saveAltOnly OK");
      toast.success("Alt metin güncellendi");
    } catch (e: any) {
      console.error("[CategoryFormPage] saveAltOnly ERROR", e);
      toast.error(e?.data?.message || "Alt metin güncellenemedi");
    }
  };

  /** Kapak kaldır */
  const removeCover = async () => {
    console.log("[CategoryFormPage] removeCover called", { id, isNew });

    if (isNew) {
      setCoverId(undefined);
      setStagedCoverId(undefined);
      setImageUrl("");
      _setAlt("");
      setAltTouched(false);
      toast.info("Görsel yerelden kaldırıldı (kayıt yok).");
      return;
    }
    if (!id) return;
    try {
      await updateCategory({
        id,
        body: {
          ...buildPayload(),
          image_url: null,
          alt: null,
        },
      }).unwrap();
      setCoverId(undefined);
      setStagedCoverId(undefined);
      setImageUrl("");
      _setAlt("");
      setAltTouched(false);
      console.log("[CategoryFormPage] removeCover OK");
      toast.success("Görsel kaldırıldı");
    } catch (e: any) {
      console.error("[CategoryFormPage] removeCover ERROR", e);
      toast.error(e?.data?.message || "Görsel kaldırılamadı");
    }
  };

  if (!isNew && loadingExisting) {
    return (
      <div className="p-4 text-sm text-gray-500">
        Yükleniyor…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Geri
        </Button>
        {isNew ? (
          <Button
            onClick={doCreate}
            disabled={saving}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="h-4 w-4" />
            Oluştur
          </Button>
        ) : (
          <Button
            onClick={doUpdate}
            disabled={saving}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="h-4 w-4" />
            Kaydet
          </Button>
        )}
      </div>

      {/* Temel Bilgiler */}
      <Section title="Temel Bilgiler">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Ad */}
          <div className="space-y-2">
            <Label>
              Ad
              <RequiredMark />
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kategori adı"
              required
              aria-required="true"
            />
          </div>

          {/* Slug */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>
                Slug
                <RequiredMark />
              </Label>
              <label className="flex items-center gap-2 text-xs text-gray-500">
                <Switch
                  checked={autoSlug}
                  onCheckedChange={setAutoSlug}
                  className="data-[state=checked]:bg-indigo-600"
                />
                otomatik
              </label>
            </div>
            <Input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setAutoSlug(false);
              }}
              placeholder="kategori-slug"
              required
              aria-required="true"
            />
          </div>

          {/* Aktif */}
          <div className="space-y-2">
            <Label>Aktif</Label>
            <div className="flex h-10 items-center">
              <Switch
                checked={isActive}
                onCheckedChange={async (v) => {
                  console.log("[CategoryFormPage] toggle isActive", { v });
                  setIsActive(v);
                  if (!isNew && id) {
                    try {
                      await toggleActive({ id, is_active: v }).unwrap();
                    } catch {
                      toast.error("Aktiflik durumu güncellenemedi");
                      setIsActive(!v);
                    }
                  }
                }}
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>
          </div>

          {/* Anasayfa (Öne çıkan) */}
          <div className="space-y-2">
            <Label>Anasayfa</Label>
            <div className="flex h-10 items-center">
              <Switch
                checked={isFeatured}
                onCheckedChange={async (v) => {
                  console.log("[CategoryFormPage] toggle isFeatured", { v });
                  setIsFeatured(v);
                  if (!isNew && id) {
                    try {
                      await toggleFeatured({
                        id,
                        is_featured: v,
                      }).unwrap();
                    } catch {
                      toast.error("Öne çıkarma durumu güncellenemedi");
                      setIsFeatured(!v);
                    }
                  }
                }}
                className="data-[state=checked]:bg-amber-500"
              />
            </div>
          </div>

          {/* Sıra */}
          <div className="space-y-2">
            <Label>Sıra</Label>
            <Input
              inputMode="numeric"
              value={String(displayOrder)}
              onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          {/* Açıklama */}
          <div className="sm:col-span-2 space-y-2">
            <Label>Açıklama (opsiyonel)</Label>
            <Textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </Section>

      {/* KAPAK GÖRSELİ – DİREKT NATIVE INPUT + GLOBAL DEBUG */}
      {!isNew ? (
        <Section title="Kapak Görseli (NATIVE INPUT DEBUG)">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Sol: dosya seç + preview */}
            <div className="space-y-2">
              <Label htmlFor="image_upload">Kapak Görseli</Label>
              <input
                id="image_upload"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  console.log("[CategoryFormPage] NATIVE onChange handler", {
                    hasFile: !!file,
                    name: file?.name,
                  });
                  if (!file) return;
                  await uploadCover(file);
                  // aynı dosyayı tekrar seçebilelim
                  e.currentTarget.value = "";
                }}
                onInput={(e) => {
                  const t = e.target as HTMLInputElement;
                  console.log("[CategoryFormPage] NATIVE onInput handler", {
                    filesLength: t.files?.length ?? 0,
                    name: t.files?.[0]?.name,
                  });
                }}
                className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
              />

              {imageUrl ? (
                <>
                  <img
                    src={imageUrl}
                    alt={alt || "Kapak"}
                    className="mt-2 h-32 w-56 rounded border object-cover"
                  />
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                    {coverId && (
                      <span className="px-2 py-1 rounded border bg-gray-50">
                        Storage ID: {coverId}
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeCover}
                    >
                      Görseli Kaldır
                    </Button>
                  </div>
                </>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  Henüz kapak görseli seçilmedi.
                </p>
              )}
            </div>

            {/* Sağ: ALT metni */}
            <div className="space-y-2">
              <Label htmlFor="alt">Alt (alt) metin</Label>
              <Input
                id="alt"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Kapak resmi alternatif metin"
              />
              {!isNew && imageUrl && (
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={saveAltOnly}
                  >
                    Alt&apos;ı Kaydet
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Section>
      ) : (
        <Section title="Kapak Görseli">
          <div className="flex items-start gap-3 rounded-md border p-3 bg-amber-50 text-amber-800">
            <Info className="mt-0.5 h-4 w-4" />
            <div className="text-sm">
              Önce <b>Temel Bilgileri</b> kaydedin. Kayıt oluşturulduktan sonra
              kapak görselini ekleyebilirsiniz.
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}
