// =============================================================
// FILE: src/components/admin/AdminPanel/form/SliderFormPage.tsx
// =============================================================
"use client";

import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Upload, Trash2 } from "lucide-react";

import {
  useAdminGetSlideQuery,
  useAdminCreateSlideMutation,
  useAdminUpdateSlideMutation,
  useAdminAttachSlideImageMutation,
  useAdminDetachSlideImageMutation,
} from "@/integrations/metahub/rtk/endpoints/slider.endpoints";

import { useUploadStorageAssetAdminMutation } from "@/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints";
import type {
  SliderCreateInput,
  SliderUpdateInput,
  SliderAttachImageBody,
} from "@/integrations/metahub/db/types/slider";

const SLIDER_BUCKET =
  (import.meta.env.VITE_STORAGE_SLIDER_BUCKET as string | undefined) || "sliders";

const pickAssetId = (res: any): string | undefined =>
  (typeof res?.id === "string" && res.id) ||
  (typeof res?.asset_id === "string" && res.asset_id) ||
  (typeof res?.public_id === "string" && res.public_id) ||
  (typeof res?.data?.id === "string" && res.data.id) ||
  (typeof res?._id === "string" && res._id) ||
  undefined;

const pickAssetUrl = (res: any): string | undefined =>
  (typeof res?.url === "string" && res.url) ||
  (typeof res?.secure_url === "string" && res.secure_url) ||
  (res?.asset?.url as string | undefined) ||
  (res?.file?.url as string | undefined) ||
  undefined;

function emptyToNull<T extends Record<string, any>>(obj: T): T {
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v === "" ? null : v;
  return out;
}

export default function SliderFormPage() {
  const navigate = useNavigate();
  const params = useParams();

  const paramId = (params as Record<string, string | undefined>)["id"] ?? params["*"] ?? "";
  const isNew = paramId === "new";
  const idStr = isNew ? "" : paramId;

  const { data, isFetching, refetch } = useAdminGetSlideQuery(idStr, { skip: isNew || !idStr });
  const [create, { isLoading: creating }] = useAdminCreateSlideMutation();
  const [update, { isLoading: updating }] = useAdminUpdateSlideMutation();
  const [attachImage, { isLoading: attaching }] = useAdminAttachSlideImageMutation();
  const [detachImage, { isLoading: detaching }] = useAdminDetachSlideImageMutation();
  const [uploadAsset, { isLoading: uploading }] = useUploadStorageAssetAdminMutation();

  const [form, setForm] = React.useState<SliderCreateInput>({
    name: "",
    slug: "",
    description: "",
    image_url: null,
    storage_asset_id: null,
    alt: "",
    buttonText: "",
    buttonLink: "",
    featured: false,
    is_active: true,
    display_order: 1,
  });

  const [localCoverUrl, setLocalCoverUrl] = React.useState<string | null>(null);
  const objectUrlRef = React.useRef<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!isNew && data) {
      setForm({
        name: data.name,
        slug: data.slug,
        description: data.description ?? "",
        image_url: data.image_url,
        storage_asset_id: data.storage_asset_id,
        alt: data.alt ?? "",
        buttonText: data.buttonText ?? "",
        buttonLink: data.buttonLink ?? "",
        featured: data.featured,
        is_active: data.is_active,
        display_order: data.display_order,
      });

      const serverPreview = data.image_effective_url || data.image_url || null;
      if (serverPreview) {
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }
        setLocalCoverUrl(serverPreview);
      }
    }
  }, [isNew, data]);

  React.useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const set =
    (k: keyof (SliderCreateInput & SliderUpdateInput)) =>
    (e: React.ChangeEvent<HTMLInputElement> | string) => {
      if (typeof e === "string") {
        setForm((s: any) => ({ ...s, [k]: e }));
        return;
      }
      const t = e.target;
      let v: any = t.value;
      if (t.type === "number") v = Number(v);
      setForm((s: any) => ({ ...s, [k]: v }));
    };

  const setToggle = (k: keyof SliderCreateInput) => (v: boolean) =>
    setForm((s) => ({ ...s, [k]: v }));

  const saving = creating || updating || isFetching || attaching || detaching;

  const onSave = async () => {
    if (!form.name?.trim()) {
      toast.error("Lütfen ad girin.");
      return;
    }

    const body = emptyToNull({
      ...form,
      display_order: Number(form.display_order || 1),
    });

    try {
      if (isNew) {
        await create(body as SliderCreateInput).unwrap();
        toast.success("Slider oluşturuldu");
      } else {
        await update({ id: idStr!, body: body as SliderUpdateInput }).unwrap();
        toast.success("Slider güncellendi");
      }
      navigate("/admin/sliders", { replace: true });
    } catch (e: any) {
      toast.error(e?.data?.error || "Kaydetme hatası");
    }
  };

  const uploadAndAttach = async (file: File) => {
    if (isNew) {
      toast.info("Önce kaydedin, sonra görsel ekleyin.");
      return;
    }
    try {
      const res: any = await uploadAsset({
        bucket: SLIDER_BUCKET,
        folder: `sliders/${idStr}/cover`,
        file,
      }).unwrap();

      const assetId = pickAssetId(res);
      let uploadedUrl = pickAssetUrl(res);
      if (!assetId) throw new Error("Asset ID alınamadı");

      if (!uploadedUrl) {
        uploadedUrl = URL.createObjectURL(file);
        objectUrlRef.current = uploadedUrl;
      } else if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      setLocalCoverUrl(uploadedUrl);

      await attachImage({ id: idStr!, body: { storage_asset_id: assetId } }).unwrap();
      setForm((s) => ({ ...s, storage_asset_id: assetId, image_url: null }));
      toast.success("Görsel yüklendi");
      await refetch();
    } catch (e: any) {
      toast.error(e?.data?.error || "Yükleme hatası");
    }
  };

  const detach = async () => {
    if (isNew) return;
    try {
      await detachImage(idStr!).unwrap();
      setForm((s) => ({ ...s, storage_asset_id: null, image_url: null }));
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setLocalCoverUrl(null);
      toast.success("Görsel kaldırıldı");
      await refetch();
    } catch (e: any) {
      toast.error(e?.data?.error || "Kaldırma hatası");
    }
  };

  const coverPreview = localCoverUrl || data?.image_effective_url || data?.image_url || null;

  return (
    <Card className="border border-gray-200 shadow-none">
      <CardHeader className="border-b border-gray-200 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg">
            {isNew ? "Yeni Slider" : "Slider Düzenle"}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate("/admin/sliders")}
              disabled={saving}
            >
              Listeye Geri Dön
            </Button>
            <Button onClick={onSave} disabled={saving}>
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* LEFT */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Ad *</Label>
              <Input value={form.name || ""} onChange={set("name")} placeholder="Örn. Kış Kampanyası" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Slug</Label>
                <Input value={form.slug || ""} onChange={set("slug")} placeholder="kis-kampanyasi" />
              </div>
              <div className="grid gap-2">
                <Label>Sıra</Label>
                <Input
                  type="number"
                  value={Number(form.display_order ?? 1)}
                  onChange={set("display_order")}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Açıklama</Label>
              <Input value={form.description || ""} onChange={set("description")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Buton Metni</Label>
                <Input value={form.buttonText || ""} onChange={set("buttonText")} placeholder="Hemen İncele" />
              </div>
              <div className="grid gap-2">
                <Label>Buton Linki</Label>
                <Input value={form.buttonLink || ""} onChange={set("buttonLink")} placeholder="/kampanyalar" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Alt Yazı (alt)</Label>
              <Input value={form.alt || ""} onChange={set("alt")} placeholder="Slider görseli alt yazısı" />
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2">
                <Switch checked={!!form.featured} onCheckedChange={setToggle("featured")} />
                <span>Öne çıkar</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch checked={!!form.is_active} onCheckedChange={setToggle("is_active")} />
                <span>Aktif</span>
              </label>
            </div>
          </div>

          {/* RIGHT — Görsel */}
          <div className="space-y-6">
            <div className="grid gap-2">
              <Label>Kapak Görseli</Label>
              <div className="rounded-lg border bg-white p-3">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  <div className="group relative">
                    <div className="aspect-video w-full overflow-hidden rounded-md border bg-muted" title="Dosya seçin">
                      {coverPreview ? (
                        <img
                          src={coverPreview}
                          crossOrigin="anonymous"
                          alt={form.alt || data?.alt || "cover"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
                          Görsel yok
                        </div>
                      )}
                    </div>

                    {(form.storage_asset_id || form.image_url || coverPreview) && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={detach}
                        disabled={detaching || updating}
                        className="absolute right-2 top-2 h-8 w-8 rounded-full p-0 shadow-lg ring-2 ring-white hover:scale-105 transition"
                        aria-label="Görseli kaldır"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.currentTarget.files?.[0] || null;
                      if (f) await uploadAndAttach(f);
                      e.currentTarget.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isNew || uploading || attaching}
                    title={isNew ? "Önce kaydedin" : undefined}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading || attaching ? "Yükleniyor…" : "Dosyadan Yükle"}
                  </Button>
                </div>
              </div>

              {/* Manuel URL */}
              <div className="grid grid-cols-1 gap-2">
                <Label>image_url (manuel)</Label>
                <Input
                  value={form.image_url ?? ""}
                  onChange={set("image_url")}
                  placeholder="https://…"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={async () => {
                      if (isNew) {
                        toast.info("Önce kaydedin.");
                        return;
                      }
                      try {
                        const trimmed = (form.image_url ?? "").trim();

                        if (!trimmed) {
                          // URL yoksa ilişkiyi temizle
                          await detachImage(idStr!).unwrap();
                          setLocalCoverUrl(null);
                          if (objectUrlRef.current) {
                            URL.revokeObjectURL(objectUrlRef.current);
                            objectUrlRef.current = null;
                          }
                          setForm((s) => ({ ...s, image_url: null, storage_asset_id: null }));
                          toast.success("Görsel kaldırıldı");
                          await refetch();
                          return;
                        }

                        // ✅ exactOptionalPropertyTypes: undefined göndermiyoruz
                        const body: SliderAttachImageBody = { image_url: trimmed };
                        await attachImage({ id: idStr!, body }).unwrap();

                        setLocalCoverUrl(trimmed);
                        if (objectUrlRef.current) {
                          URL.revokeObjectURL(objectUrlRef.current);
                          objectUrlRef.current = null;
                        }
                        setForm((s) => ({ ...s, image_url: trimmed, storage_asset_id: null }));
                        toast.success("URL güncellendi");
                        await refetch();
                      } catch (e: any) {
                        toast.error(e?.data?.error || "Güncelleme hatası");
                      }
                    }}
                  >
                    {updating ? "Kaydediliyor…" : "URL’yi Kaydet"}
                  </Button>
                </div>
              </div>

              <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-600">
                Not: Dosyadan yüklemede dosya storage’a yüklenir ve <b>storage_asset_id</b> ile bağlanır.
                “Sil” sadece ilişkiyi temizler (asset’i kaldırmaz).
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
