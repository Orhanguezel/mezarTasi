// src/components/admin/AdminPanel/media/asset-utils.ts
/* exactOptionalPropertyTypes uyumlu, güvenli tipler */
export type Asset = { url: string; id?: string };
export type UploadArgs = { file: File; bucket: string; folder?: string };
export type UploadFn = (args: UploadArgs) => Promise<any>;

export function buildPublicStorageUrl(bucket: string, path: string, apiOrigin?: string) {
  const safe = encodeURIComponent(path).split("%2F").join("/");
  const base = (apiOrigin ?? (import.meta as any)?.env?.VITE_PUBLIC_API_ORIGIN)?.replace?.(/\/$/, "");
  return base ? `${base}/storage/${encodeURIComponent(bucket)}/${safe}` : `/storage/${encodeURIComponent(bucket)}/${safe}`;
}

/** BE/S3/Cloudinary varyantlarını normalize et */
export function pickAssetUrl(res: any): string | undefined {
  const take = (o: any) => {
    if (!o) return undefined;
    if (typeof o.url === "string") return o.url;
    if (typeof o.secure_url === "string") return o.secure_url;
    if (o.bucket && (o.path || o.key)) return buildPublicStorageUrl(o.bucket, o.path ?? o.key);
    return undefined;
  };
  const cloudBase: string | undefined = (import.meta as any)?.env?.VITE_CLOUDINARY_BASE;

  return (
    take(res) ||
    take(res?.result) ||
    take(res?.asset) ||
    take(res?.file) ||
    take(res?.data) ||
    (typeof res?.public_id === "string" && cloudBase ? `${cloudBase}/${res.public_id}` : undefined) ||
    (typeof res?.data?.public_id === "string" && cloudBase ? `${cloudBase}/${res.data.public_id}` : undefined)
  );
}

export function pickAssetId(res: any): string | undefined {
  return res?.id ?? res?.asset_id ?? res?.public_id ?? res?._id ?? res?.data?.id ?? res?.data?.public_id ?? undefined;
}

/** Upload cevabını -> Asset (veya null) çevir. url yoksa NULL döner (opsiyonel alanlara undefined koymuyoruz). */
export function normalizeUploadResponse(res: any): Asset | null {
  const url = pickAssetUrl(res);
  if (!url) return null;
  const id = pickAssetId(res);
  const out: Partial<Asset> = {};
  out.url = url;                     // url ZORUNLU
  if (typeof id === "string") out.id = id; // id varsa ekle
  return out as Asset;
}

/** Liste içinde aynı id/url’yi tekrar etme */
export function uniqueAssets(list: Asset[]): Asset[] {
  const seen = new Set<string>();
  const out: Asset[] = [];
  for (const a of list) {
    const key = a.id ? `id:${a.id}` : `url:${a.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out;
}

/** image_ids listesine çevir (id yoksa dışarıda bırak) */
export function assetsToIds(list: Asset[]): string[] {
  return list.map((a) => a.id).filter(Boolean) as string[];
}
