// =============================================================
// FILE: src/shared/storage/assetPaths.ts
// =============================================================

export function assetFolder(entity: string, entityId: string | number, slot?: string): string {
  const e = String(entity).trim().toLowerCase();
  const id = String(entityId).trim();
  const s = slot ? String(slot).trim().toLowerCase() : "";
  return [e, id, s].filter(Boolean).join("/");
}

export function safeFileName(name: string): string {
  const base = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base.length > 0 ? base : "file.bin";
}

/**
 * Public URL: {API_ORIGIN}/storage/:bucket/:path
 * /storage → /api/storage rewrite’i reverse-proxy ile yapıldığı için burada /storage’ı koruyoruz.
 */
export function publicStorageUrl(
  bucket: string,
  path: string,
  apiBase = (import.meta.env.VITE_PUBLIC_API_ORIGIN ?? "").toString()
) {
  const base = (apiBase || "").replace(/\/$/, "");
  const normalized = path.startsWith(`${bucket}/`) ? path.slice(bucket.length + 1) : path;
  const encoded = encodeURIComponent(normalized).replace(/%2F/gi, "/");
  return `${base}/storage/${encodeURIComponent(bucket)}/${encoded}`;
}

export function buildAssetPath(filename: string, folder?: string): string {
  const clean = safeFileName(filename);
  return folder ? `${folder}/${clean}` : clean;
}

export const isImageMime = (mime?: string | null) => !!mime && mime.startsWith("image/");
export const isVideoMime = (mime?: string | null) => !!mime && mime.startsWith("video/");
