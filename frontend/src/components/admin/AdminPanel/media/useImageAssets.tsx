"use client";

import * as React from "react";

export type Asset = { url: string; id?: string };
export type UploadArgs = { file: File; bucket: string; folder?: string };
export type UploadFn = (args: UploadArgs) => Promise<any>;

type Mode = "single" | "multiple";

/* ====== KATEGORİ SAYFASINDAKİYLE BİREBİR ====== */
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
  (res?.path && res?.bucket
    ? `${(import.meta as any)?.env?.VITE_PUBLIC_API_ORIGIN?.toString()?.replace?.(/\/$/, "") || ""}/storage/${encodeURIComponent(res.bucket)}/${encodeURIComponent(res.path).replace(/%2F/gi, "/")}`
    : undefined);
/* ============================================= */

function toFilesArray(input?: File[] | FileList | readonly File[] | null): File[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter((f): f is File => f instanceof File);
  return Array.from(input).filter((f): f is File => f instanceof File);
}

function uniqueAssets(list: Asset[]): Asset[] {
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

export type UseImageAssetsOptions = {
  bucket: string;
  folder?: string;       // exactOptionalPropertyTypes: undefined göndermeyeceğiz
  upload: UploadFn;      // RTK unwrap dönen fonksiyon
  onError?: (m: string) => void;
  onUploaded?: (asset: Asset) => void;
};

export function useImageAssets(opts: UseImageAssetsOptions) {
  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const addLocalBlobs = React.useCallback((files: File[]) => {
    const now = Date.now();
    const items = files.map((f, i) => ({
      url: URL.createObjectURL(f),
      id: `tmp:${now}:${i}:${Math.random().toString(36).slice(2)}`,
    }));
    setAssets((prev) => uniqueAssets([...prev, ...items]));
    return items;
  }, []);

  const removeAt = React.useCallback((index: number) => {
    setAssets((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clear = React.useCallback(() => setAssets([]), []);

  const replaceAt = React.useCallback((matchId: string, real: Asset) => {
    setAssets((prev) => prev.map((a) => (a.id === matchId ? real : a)));
  }, []);

  const uploadFiles = React.useCallback(
    async (
      filesIn: File[] | FileList | readonly File[],
      mode: Mode = "multiple",
      folderOverride?: string
    ) => {
      const files = toFilesArray(filesIn);
      if (!files.length) return;

      const picked = mode === "single" ? (files[0] ? [files[0]] : []) : files;
      if (!picked.length) return;

      const tempItems = addLocalBlobs(picked);
      setIsUploading(true);

      try {
        for (let i = 0; i < picked.length; i++) {
          const file = picked[i]!;
          const temp = tempItems[i];
          if (!temp) continue;

          try {
            const payload =
              folderOverride ? { file, bucket: opts.bucket, folder: folderOverride } :
              opts.folder       ? { file, bucket: opts.bucket, folder: opts.folder } :
                                  { file, bucket: opts.bucket };

            const res = await opts.upload(payload);
            const url = pickAssetUrl(res);
            if (!url) {
              opts.onError?.(`${file.name}: URL alınamadı (upload cevabı)`);
              // temp kartı kalsın (kullanıcı görüyor)
              continue;
            }
            const id = pickAssetId(res);
            replaceAt(temp.id!, id ? { url, id } : { url });
            opts.onUploaded?.(id ? { url, id } : { url });
          } catch (e: any) {
            opts.onError?.(`${file.name}: ${e?.data?.error?.message ?? e?.message ?? "Yükleme başarısız"}`);
            // temp kartı kalsın
          } finally {
            try { URL.revokeObjectURL(temp.url); } catch {}
          }
        }
      } finally {
        setIsUploading(false);
      }
    },
    [addLocalBlobs, opts, replaceAt]
  );

  const onInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = toFilesArray(e.currentTarget?.files ?? e.target?.files ?? null);
    if (!files.length) return;
    if (inputRef.current) inputRef.current.value = "";
    void uploadFiles(files);
  };

  const openPicker = () => {
    if (!inputRef.current) return;
    inputRef.current.value = "";
    inputRef.current.click();
  };

  return {
    assets,
    setAssets,
    inputRef,
    openPicker,
    onInputChange,
    uploadFiles,
    removeAt,
    clear,
    isUploading,
  };
}

/* =================== Hazır UI Alanı =================== */
type ImageAssetsFieldProps = {
  label?: string;
  mode?: Mode;
  className?: string;
  bucket: string;
  folder?: string;
  upload: UploadFn;
  initial?: Asset[];
  onChange?: (assets: Asset[]) => void;
  accept?: string;
  maxSizeMB?: number;
  onBusyChange?: (busy: boolean) => void;
};

export function ImageAssetsField(props: ImageAssetsFieldProps) {
  const {
    label = "Görseller",
    mode = "multiple",
    className,
    bucket,
    folder,
    upload,
    initial,
    onChange,
    accept = "image/*",
    maxSizeMB = 10,
    onBusyChange,
  } = props;

  const { assets, setAssets, inputRef, openPicker, onInputChange, uploadFiles, removeAt, isUploading } =
    useImageAssets({
      bucket,
      ...(folder ? { folder } : {}),
      upload,
      onError: (m) => console.error(m),
    });

  React.useEffect(() => {
    if (initial && initial.length) setAssets(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => { onChange?.(assets); }, [assets, onChange]);
  React.useEffect(() => { onBusyChange?.(isUploading); }, [isUploading, onBusyChange]);

  const onDrop: React.DragEventHandler<HTMLLabelElement> = (e) => {
    e.preventDefault(); e.stopPropagation();
    const files = toFilesArray(e.dataTransfer?.files ?? null).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    const tooBig = files.find((f) => f.size > maxSizeMB * 1024 * 1024);
    if (tooBig) {
      console.error(`${tooBig.name} ${maxSizeMB}MB'den büyük`);
      return;
    }
    void uploadFiles(files, mode, folder);
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={mode === "multiple"}
        className="sr-only"
        onChange={onInputChange}
      />

      <label
        onClick={openPicker}
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        className="mt-2 block cursor-pointer rounded-lg border border-dashed border-gray-300 bg-gray-50/80 p-4 text-center text-sm text-gray-600 transition hover:bg-gray-50"
      >
        Dosya seç veya görselleri bu alana bırak
      </label>

      {assets.length > 0 && (
        <div className="mt-3 rounded-lg border bg-white p-4">
          <p className="mb-3 text-sm font-medium text-gray-700">
            Görseller ({assets.length}) {isUploading ? "— yükleniyor…" : ""}
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {assets.map((a, idx) => (
              <div key={`${a.id ?? "url"}-${a.url}-${idx}`} className="group relative">
                <div className="aspect-video w-full overflow-hidden rounded-md border bg-muted">
                  <img src={a.url} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="absolute bottom-1 left-1 rounded bg-black/65 px-1.5 py-0.5 text-[11px] font-medium text-white shadow">
                  {idx + 1}
                </div>
                <button
                  type="button"
                  aria-label="Sil"
                  title="Sil"
                  onClick={() => removeAt(idx)}
                  className="absolute right-2 top-2 h-8 w-8 rounded-full p-0 shadow-lg ring-2 ring-white hover:scale-105 transition bg-red-600 text-white"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
