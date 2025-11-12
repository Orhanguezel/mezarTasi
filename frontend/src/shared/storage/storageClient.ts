// =============================================================
// FILE: src/shared/storage/storageClient.ts
// =============================================================

export type EventLike = { target?: { files?: FileList | null }; currentTarget?: { files?: FileList | null } };

/** dataURL -> Blob */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, data] = dataUrl.split(",");
  const mime = /data:(.*?);base64/.exec(meta || "")?.[1] || "application/octet-stream";
  const bin = atob(data || "");
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/** Tek dosya çıkar (File/Blob/FileList/Event/dataURL…) */
export function ensureBlob(f: unknown): { blob: Blob; filename: string } {
  const hasFileCtor = typeof File !== "undefined";
  const hasBlobCtor = typeof Blob !== "undefined";

  const ev = f as EventLike;
  const fl = ev?.target?.files ?? ev?.currentTarget?.files;
  if (fl && fl.length > 0) {
    const first = fl[0]!;
    const name = hasFileCtor && first instanceof File ? (first as File).name || "upload.bin" : "upload.bin";
    return { blob: first, filename: name };
  }

  if (hasFileCtor && f instanceof File) return { blob: f, filename: f.name || "upload.bin" };
  if (hasBlobCtor && f instanceof Blob) return { blob: f, filename: "upload.bin" };

  if (typeof FileList !== "undefined" && f instanceof FileList && f.length > 0) {
    const first = f[0]!;
    const name = hasFileCtor && first instanceof File ? (first as File).name || "upload.bin" : "upload.bin";
    return { blob: first, filename: name };
  }

  if (Array.isArray(f) && f.length > 0) {
    const first = f[0]!;
    if (hasFileCtor && first instanceof File) return { blob: first, filename: first.name || "upload.bin" };
    if (hasBlobCtor && first instanceof Blob) return { blob: first, filename: "upload.bin" };
  }

  if (typeof f === "object" && f !== null) {
    const obj = f as { file?: File | Blob };
    if (hasFileCtor && obj.file instanceof File) return { blob: obj.file, filename: obj.file.name || "upload.bin" };
    if (hasBlobCtor && obj.file instanceof Blob) return { blob: obj.file, filename: "upload.bin" };
  }

  if (typeof f === "string" && f.startsWith("data:")) {
    const b = dataUrlToBlob(f);
    return { blob: b, filename: "upload.bin" };
  }

  throw new Error("file_required");
}

export type BlobTask = { blob: Blob; filename: string };

/** Çoklu dosya çıkar (Event/FileList/File[]/Blob[]/mixed) – her zaman {blob, filename} döner */
export function ensureMany(input: unknown): BlobTask[] {
  const hasFileCtor = typeof File !== "undefined";
  const out: BlobTask[] = [];

  // Event?
  const ev = input as EventLike;
  const fl = ev?.target?.files ?? ev?.currentTarget?.files;
  if (fl && fl.length > 0) {
    for (let i = 0; i < fl.length; i++) {
      const f = fl[i]!;
      const name = hasFileCtor && f instanceof File ? (f as File).name || `upload-${i}.bin` : `upload-${i}.bin`;
      out.push({ blob: f, filename: name });
    }
    return out;
  }

  // FileList?
  if (typeof FileList !== "undefined" && input instanceof FileList) {
    for (let i = 0; i < input.length; i++) {
      const f = input[i]!;
      const name = hasFileCtor && f instanceof File ? (f as File).name || `upload-${i}.bin` : `upload-${i}.bin`;
      out.push({ blob: f, filename: name });
    }
    return out;
  }

  // Dizi?
  if (Array.isArray(input)) {
    for (let i = 0; i < input.length; i++) {
      try {
        const one = ensureBlob(input[i]);
        out.push({ blob: one.blob, filename: one.filename });
      } catch {
        /* geçersiz öğeyi geç */
      }
    }
    if (out.length) return out;
  }

  // Tekil fallback
  try {
    const one = ensureBlob(input);
    return [{ blob: one.blob, filename: one.filename }];
  } catch {
    return [];
  }
}
