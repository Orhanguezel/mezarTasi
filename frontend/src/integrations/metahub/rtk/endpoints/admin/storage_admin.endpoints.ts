// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints.ts
// =============================================================
import { baseApi } from "../../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type {
  StorageMeta,
  StorageAsset,
  ApiStorageAsset,
  StorageListParams,
} from "../../../db/types/storage";

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

/* ================= utils (type-safe) ================= */
const toIso = (x: unknown): string => {
  if (x instanceof Date) return x.toISOString();
  if (typeof x === "number" || typeof x === "string") {
    const d = new Date(x);
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  return new Date().toISOString();
};

const toNum = (x: unknown): number => {
  if (typeof x === "number" && Number.isFinite(x)) return x;
  if (typeof x === "string") {
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof x === "bigint") return Number(x);
  const n = Number((x as unknown) ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const toStr = (x: unknown): string | null =>
  x === undefined || x === null ? null : String(x);

const tryParse = <T>(x: unknown): T => {
  if (typeof x === "string") {
    try { return JSON.parse(x) as T; } catch { /* ignore */ }
  }
  return x as T;
};

const trimLower = (s: unknown): string | null => {
  const v = toStr(s);
  return v ? v.trim().toLowerCase() : null;
};

/** Boş olmayan ilk string’i döndür ("" ve null/undefined atlanır) */
const firstNonEmpty = (...vals: Array<string | null | undefined>): string | undefined => {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
};

/* ============== Normalizer ============== */
const normalize = (raw: ApiStorageAsset | any): StorageAsset & {
  preview_url?: string | null;
  public_url?: string | null;
} => {
  const a: any =
    raw && typeof raw === "object" && "data" in (raw as any) ? (raw as any).data : raw || {};

  // id
  const id =
    firstNonEmpty(
      toStr(a.id),
      toStr(a.asset_id),
      toStr(a.public_id),
      toStr(a._id),
      a.path && a.bucket ? `${a.bucket}:${a.path}` : null,
    ) ?? "";

  // path/bucket
  const bucket = toStr(a.bucket) ?? "";
  const path = toStr(a.path) ?? "";

  // folder
  const folder =
    a.folder != null ? toStr(a.folder) :
    path ? (path.split("/").slice(0, -1).join("/") || null) : null;

  // name
  const name =
    firstNonEmpty(
      toStr(a.name),
      path ? path.split("/").pop() : null,
      toStr(a.original_filename),
      toStr(a.filename),
      id,
    ) ?? "asset";

  // url (öncelik: secure_url > url > asset.url > file.url > /storage/{bucket}/{path})
  const firstUrl =
    firstNonEmpty(
      toStr(a.secure_url),
      toStr(a.url),
      toStr(a.asset?.url),
      toStr(a.file?.url),
      buildPublicStorageUrl(bucket, path),
    ) ?? null;

  // mime
  const mimeCandidate =
    firstNonEmpty(
      trimLower(a.mime),
      trimLower(a.mimetype),
      a.resource_type && a.format ? `image/${String(a.format).toLowerCase()}` : null,
    );
  const mime = (mimeCandidate ?? "application/octet-stream");

  // boyutlar
  const width = a.width == null ? null : toNum(a.width);
  const height = a.height == null ? null : toNum(a.height);
  const size = toNum(a.size);

  // metadata
  const metadata =
    a.metadata == null
      ? null
      : typeof a.metadata === "string"
      ? tryParse<StorageMeta>(a.metadata)
      : (a.metadata as StorageMeta);

  // tarihler
  const created_at = toIso(a.created_at ?? a.createdAt ?? a.uploaded_at);
  const updated_at = toIso(a.updated_at ?? a.updatedAt ?? a.modified_at ?? created_at);

  // opsiyoneller
  const hash = toStr(a.hash);
  const etag = firstNonEmpty(toStr(a.etag), toStr(a.etag_id), toStr(a.etagId)) ?? null;

  const normalized: StorageAsset & { preview_url?: string | null; public_url?: string | null } = {
    id,
    name,
    bucket,
    path,
    folder,
    mime,                    // <- her zaman string
    size,
    width,
    height,
    url: firstUrl,           // StorageAsset tipinde url?: string | null; sorun yok
    metadata,
    created_at,
    updated_at,
    // helpers
    // (opsiyonel alanda null sakıncalı değil)
    preview_url: firstUrl,
    public_url: firstUrl,
  };

  // tipte olmayan ama eklediğimiz alanları varsa ekleyelim
  if (hash) (normalized as any).hash = hash;
  if (etag) (normalized as any).etag = etag;

  return normalized;
};

const normalizeList = (res: unknown): StorageAsset[] => {
  if (Array.isArray(res)) return (res as ApiStorageAsset[]).map(normalize);
  const maybe = res as { data?: unknown };
  return Array.isArray(maybe?.data) ? (maybe.data as ApiStorageAsset[]).map(normalize) : [];
};

/* ============== Params helpers ============== */
const toParams = (p: StorageListParams) => ({
  q: p.q,
  bucket: p.bucket,
  folder: p.folder ?? undefined,
  mime: p.mime,
  limit: p.limit,
  offset: p.offset,
  sort: p.sort,
  order: p.order,
});

const cleanParams = (obj: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null)) as Record<
    string,
    string | number
  >;

/* ============== Blob guard ============== */
function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, data] = dataUrl.split(",");
  const mime = /data:(.*?);base64/.exec(meta || "")?.[1] || "application/octet-stream";
  const bin = atob(data || "");
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

type HasFiles = { files?: FileList | null };
type EventLike = { target?: HasFiles; currentTarget?: HasFiles };

function pickFromEvent(x: unknown): File | Blob | null {
  const ev = x as EventLike;
  const fl = ev?.target?.files ?? ev?.currentTarget?.files;
  if (fl && fl.length > 0) return fl[0]!;
  return null;
}

function ensureBlob(f: unknown): { blob: Blob; filename: string } {
  // 0) ChangeEvent desteği
  const evFile = pickFromEvent(f);
  if (evFile instanceof File) return { blob: evFile, filename: evFile.name || "upload.bin" };
  if (evFile instanceof Blob) return { blob: evFile, filename: "upload.bin" };

  // 1) File
  if (f instanceof File) return { blob: f, filename: f.name || "upload.bin" };
  // 2) Blob
  if (f instanceof Blob) return { blob: f, filename: "upload.bin" };
  // 3) FileList
  if (typeof FileList !== "undefined" && f instanceof FileList && f.length > 0) {
    const first = f[0]!;
    return { blob: first, filename: (first as File).name || "upload.bin" };
  }
  // 4) Array-like (File[] | Blob[])
  if (Array.isArray(f) && f.length > 0) {
    const first = f[0]!;
    if (first instanceof File) return { blob: first, filename: first.name || "upload.bin" };
    if (first instanceof Blob) return { blob: first, filename: "upload.bin" };
  }
  // 5) { file: File | Blob }
  if (typeof f === "object" && f !== null) {
    const obj = f as { file?: File | Blob };
    if (obj.file instanceof File) return { blob: obj.file, filename: obj.file.name || "upload.bin" };
    if (obj.file instanceof Blob) return { blob: obj.file, filename: "upload.bin" };
  }
  // 6) dataURL
  if (typeof f === "string" && f.startsWith("data:")) {
    const b = dataUrlToBlob(f);
    return { blob: b, filename: "upload.bin" };
  }

  throw new Error("file_required");
}

/* ============== endpoints ============== */
const BASE = "/admin/storage";

export const storageAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listStorageAssetsAdmin: b.query<StorageAsset[], StorageListParams | void>({
      query: (params) => {
        const fa: FetchArgs = { url: `${BASE}/assets` };
        if (params) fa.params = cleanParams(toParams(params));
        return fa;
      },
      transformResponse: (res: unknown): StorageAsset[] => normalizeList(res),
      providesTags: (result) =>
        result
          ? [
              ...result.map((a) => ({ type: "StorageAsset" as const, id: a.id })),
              { type: "StorageAssets" as const, id: "LIST" },
            ]
          : [{ type: "StorageAssets" as const, id: "LIST" }],
    }),

    getStorageAssetAdmin: b.query<StorageAsset, string>({
      query: (id) => ({ url: `${BASE}/assets/${id}` } as FetchArgs),
      transformResponse: (res: unknown): StorageAsset => normalize(res as ApiStorageAsset),
      providesTags: (_r, _e, id) => [{ type: "StorageAsset", id }],
    }),

    uploadStorageAssetAdmin: b.mutation<
      StorageAsset,
      { file: File | Blob | string | FileList | { file?: File | Blob } | EventLike; bucket?: string; folder?: string | null; metadata?: StorageMeta }
    >({
      query: ({ file, bucket, folder, metadata }) => {
        const form = new FormData();
        const { blob, filename } = ensureBlob(file);
        form.append("file", blob, filename);
        if (bucket) form.append("bucket", bucket);
        if (folder != null) form.append("folder", folder);
        if (metadata) form.append("metadata", JSON.stringify(metadata));
        const fa: FetchArgs = { url: `${BASE}/assets`, method: "POST", body: form };
        return fa;
      },
      transformResponse: (res: unknown): StorageAsset => normalize(res as ApiStorageAsset),
      invalidatesTags: [{ type: "StorageAssets" as const, id: "LIST" }],
    }),

    updateStorageAssetAdmin: b.mutation<
      StorageAsset,
      { id: string; body: { name?: string; folder?: string | null; metadata?: StorageMeta } }
    >({
      query: ({ id, body }) =>
        ({ url: `${BASE}/assets/${id}`, method: "PATCH", body } as FetchArgs),
      transformResponse: (res: unknown): StorageAsset => normalize(res as ApiStorageAsset),
      invalidatesTags: (_r, _e, arg) => [
        { type: "StorageAsset", id: arg.id },
        { type: "StorageAssets", id: "LIST" },
      ],
    }),

    deleteStorageAssetAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `${BASE}/assets/${id}`, method: "DELETE" } as FetchArgs),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: "StorageAssets" as const, id: "LIST" }],
    }),

    bulkDeleteStorageAssetsAdmin: b.mutation<{ deleted: number }, { ids: string[] }>({
      query: (body) =>
        ({ url: `${BASE}/assets/bulk-delete`, method: "POST", body } as FetchArgs),
      transformResponse: (res: unknown): { deleted: number } => {
        const obj = (res && typeof res === "object") ? (res as Record<string, unknown>) : {};
        const v = (obj as Record<string, unknown>)["deleted"];
        return { deleted: typeof v === "number" ? v : Number(v ?? 0) || 0 };
      },
      invalidatesTags: [{ type: "StorageAssets" as const, id: "LIST" }],
    }),

    listStorageFoldersAdmin: b.query<string[], void>({
      query: () => ({ url: `${BASE}/folders` } as FetchArgs),
      transformResponse: (res: unknown): string[] =>
        Array.isArray(res) ? (res as unknown[]).map((x) => String(x)) : [],
      providesTags: [{ type: "StorageFolders" as const, id: "LIST" }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListStorageAssetsAdminQuery,
  useGetStorageAssetAdminQuery,
  useUploadStorageAssetAdminMutation,
  useUpdateStorageAssetAdminMutation,
  useDeleteStorageAssetAdminMutation,
  useBulkDeleteStorageAssetsAdminMutation,
  useListStorageFoldersAdminQuery,
} = storageAdminApi;
