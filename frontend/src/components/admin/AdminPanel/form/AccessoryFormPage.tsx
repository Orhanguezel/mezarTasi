// =============================================================
// FILE: src/components/admin/AdminPanel/form/AccessoryFormPage.tsx
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
  useAdminGetAccessoryQuery,
  useAdminCreateAccessoryMutation,
  useAdminUpdateAccessoryMutation,
} from "@/integrations/metahub/rtk/endpoints/accessories.endpoints";

import { useUploadStorageAssetAdminMutation } from "@/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints";
import type {
  AccessoryCreateInput,
  AccessoryUpdateInput,
  AccessoryKey,
} from "@/integrations/metahub/db/types/accessories";

/* ================= ENV & URL helpers ================= */
const API_ORIGIN =
  (import.meta.env.VITE_PUBLIC_API_ORIGIN as string | undefined)?.replace(/\/+$/, "") || "";

const toSafePath = (p: string) => encodeURIComponent(p).split("%2F").join("/");

const buildPublicStorageUrl = (bucket?: string | null, path?: string | null) => {
  if (!bucket || !path) return null;
  return API_ORIGIN
    ? `${API_ORIGIN}/storage/${encodeURIComponent(bucket)}/${toSafePath(path)}`
    : `/storage/${encodeURIComponent(bucket)}/${toSafePath(path)}`;
};

/* ================= Accessory constants ================= */
const CATEGORIES: AccessoryKey[] = ["suluk", "sutun", "vazo", "aksesuar"];

const ACCESSORY_BUCKET =
  (import.meta.env.VITE_STORAGE_ACCESSORY_BUCKET as string | undefined) || "accessories";

/* ================= Small helpers ================= */
const pickAssetId = (res: any): string | undefined =>
  (typeof res?.id === "string" && res.id) ||
  (typeof res?.asset_id === "string" && res.asset_id) ||
  (typeof res?.public_id === "string" && res.public_id) ||
  (typeof res?.data?.id === "string" && res.data.id) ||
  (typeof res?._id === "string" && res._id) ||
  undefined;

const pickAssetUrl = (res: any): string | undefined => {
  const direct =
    (typeof res?.url === "string" && res.url) ||
    (typeof res?.secure_url === "string" && res.secure_url) ||
    (res?.asset?.url as string | undefined) ||
    (res?.file?.url as string | undefined);
  if (direct && direct.length > 0) return direct;

  const urlFromBucketPath = buildPublicStorageUrl(
    (res?.bucket as string | undefined) ?? (res?.data?.bucket as string | undefined) ?? null,
    (res?.path as string | undefined) ?? (res?.data?.path as string | undefined) ?? null
  );
  return urlFromBucketPath ?? undefined;
};

function emptyToNull<T extends Record<string, any>>(obj: T): T {
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v === "" ? null : v;
  return out;
}

/* ================= Component ================= */
export default function AccessoryFormPage() {
  const navigate = useNavigate();
  const params = useParams();

  const paramId = (params as Record<string, string | undefined>)["id"] ?? params["*"] ?? "";
  const isNew = paramId === "new";
  const idStr = isNew ? "" : paramId;

  const { data, isFetching, refetch } = useAdminGetAccessoryQuery(idStr, { skip: isNew || !idStr });
  const [create, { isLoading: creating }] = useAdminCreateAccessoryMutation();
  const [update, { isLoading: updating }] = useAdminUpdateAccessoryMutation();
  const [uploadAsset, { isLoading: uploading }] = useUploadStorageAssetAdminMutation();

  const [form, setForm] = React.useState<AccessoryCreateInput>({
    name: "",
    category: "aksesuar",
    material: "",
    price: "",
    description: "",
    image_url: null,
    storage_asset_id: null,
    featured: false,
    dimensions: "",
    weight: "",
    thickness: "",
    finish: "",
    warranty: "",
    installation_time: "",
    display_order: 1,
    is_active: true,
  });

  // client-side preview
  const [localCoverUrl, setLocalCoverUrl] = React.useState<string | null>(null);
  const objectUrlRef = React.useRef<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!isNew && data) {
      setForm({
        name: data.name,
        category: data.category,
        material: data.material,
        price: data.price,
        description: data.description ?? "",
        image_url: data.image_url,
        storage_asset_id: data.storage_asset_id,
        featured: data.featured,
        dimensions: data.dimensions ?? "",
        weight: data.weight ?? "",
        thickness: data.thickness ?? "",
        finish: data.finish ?? "",
        warranty: data.warranty ?? "",
        installation_time: data.installation_time ?? "",
        display_order: data.display_order,
        is_active: data.is_active,
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
    (k: keyof (AccessoryCreateInput & AccessoryUpdateInput)) =>
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

  const setToggle = (k: keyof AccessoryCreateInput) => (v: boolean) =>
    setForm((s) => ({ ...s, [k]: v }));

  const saving = creating || updating || isFetching || uploading;

  /* ---------------- SAVE ---------------- */
  const onSave = async () => {
    // Minimum doğrulama
    if (!form.name?.trim()) {
      toast.error("Lütfen ad girin.");
      return;
    }
    if (!form.category) {
      toast.error("Lütfen kategori seçin.");
      return;
    }

    const body = emptyToNull({
      ...form,
      display_order: Number(form.display_order || 1),
    });

    try {
      if (isNew) {
        await create(body as AccessoryCreateInput).unwrap();
        toast.success("Aksesuar oluşturuldu");
      } else {
        await update({ id: idStr!, body: body as AccessoryUpdateInput }).unwrap();
        toast.success("Aksesuar güncellendi");
      }
      // Standart: listeye geri dön
      navigate("/admin/accessories", { replace: true });
    } catch (e: any) {
      toast.error(e?.data?.error || "Kaydetme hatası");
    }
  };

  /* ---------------- IMAGE OPS ---------------- */
  const onPick = () => fileInputRef.current?.click();

  const uploadAndSetCover = async (file: File) => {
    if (isNew) {
      toast.info("Önce kaydedin, sonra görsel ekleyin.");
      return;
    }
    try {
      const res: any = await uploadAsset({
        bucket: ACCESSORY_BUCKET,
        folder: `accessories/${idStr}/cover`,
        file,
      }).unwrap();

      const assetId = pickAssetId(res);
      let uploadedUrl = pickAssetUrl(res);

      if (!assetId) throw new Error("Asset ID alınamadı");

      if (!uploadedUrl) {
        uploadedUrl = URL.createObjectURL(file);
        objectUrlRef.current = uploadedUrl; // blob için revoke hazırlığı
      } else if (objectUrlRef.current) {
        // Gelen URL blob değilse eski blob’u temizle
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      // optimistic preview
      setLocalCoverUrl(uploadedUrl);

      // kayda yaz
      await update({
        id: idStr!,
        body: { storage_asset_id: assetId, image_url: null },
      }).unwrap();

      setForm((s) => ({ ...s, storage_asset_id: assetId, image_url: null }));
      toast.success("Görsel yüklendi");
      await refetch();
    } catch (e: any) {
      toast.error(e?.data?.error || "Yükleme hatası");
    }
  };

  const removeCover = async () => {
    if (isNew) return;
    try {
      await update({ id: idStr!, body: { storage_asset_id: null, image_url: null } }).unwrap();

      setForm((s) => ({ ...s, storage_asset_id: null, image_url: null }));
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setLocalCoverUrl(null);

      toast.success("Görsel temizlendi");
      await refetch();
    } catch (e: any) {
      toast.error(e?.data?.error || "Kaldırma hatası");
    }
  };

  const coverPreview =
    localCoverUrl || data?.image_effective_url || data?.image_url || null;

  return (
    <Card className="border border-gray-200 shadow-none">
      <CardHeader className="border-b border-gray-200 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg">
            {isNew ? "Yeni Aksesuar" : "Aksesuar Düzenle"}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate("/admin/accessories")}
              disabled={saving}
            >
              Listeye Dön
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
              <Input value={form.name || ""} onChange={set("name")} placeholder="Örn. Vazo X" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Kategori</Label>
                <select
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  value={form.category}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, category: e.target.value as AccessoryKey }))
                  }
                >
                  {CATEGORIES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Fiyat</Label>
                <Input value={form.price || ""} onChange={set("price")} placeholder="₺…" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Malzeme</Label>
                <Input value={form.material || ""} onChange={set("material")} />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Boyutlar</Label>
                <Input value={form.dimensions || ""} onChange={set("dimensions")} />
              </div>
              <div className="grid gap-2">
                <Label>Ağırlık</Label>
                <Input value={form.weight || ""} onChange={set("weight")} />
              </div>
              <div className="grid gap-2">
                <Label>Kalınlık</Label>
                <Input value={form.thickness || ""} onChange={set("thickness")} />
              </div>
              <div className="grid gap-2">
                <Label>Yüzey</Label>
                <Input value={form.finish || ""} onChange={set("finish")} />
              </div>
              <div className="grid gap-2">
                <Label>Garanti</Label>
                <Input value={form.warranty || ""} onChange={set("warranty")} />
              </div>
              <div className="grid gap-2">
                <Label>Montaj Süresi</Label>
                <Input value={form.installation_time || ""} onChange={set("installation_time")} />
              </div>
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
                          alt={data?.name || "cover"}
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
                        onClick={removeCover}
                        disabled={uploading || updating}
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
                      if (f) await uploadAndSetCover(f);
                      e.currentTarget.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onPick}
                    disabled={isNew || uploading}
                    title={isNew ? "Önce kaydedin" : undefined}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? "Yükleniyor…" : "Dosyadan Yükle"}
                  </Button>
                </div>
              </div>

              {/* Manuel URL */}
              <div className="grid grid-cols-1 gap-2">
                <Label>image_url (manuel)</Label>
                <Input value={form.image_url ?? ""} onChange={set("image_url")} placeholder="https://…" />
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
                        await update({
                          id: idStr!,
                          body: { image_url: form.image_url || null, storage_asset_id: null },
                        }).unwrap();
                        setLocalCoverUrl(form.image_url || null);
                        if (objectUrlRef.current) {
                          URL.revokeObjectURL(objectUrlRef.current);
                          objectUrlRef.current = null;
                        }
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
                Not: Dosyadan yükleme, dosyayı storage’a koyar ve yalnızca
                <b> storage_asset_id</b> alanını günceller. Silmek asset’i kaldırmaz,
                sadece ilişkiyi temizler.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
