// =============================================================
// FILE: src/shared/storage/useStorageUpload.ts
// Amaç: Admin tarafı tekil/çoklu yükleme için merkezî React hook
// RTK admin endpoint isimleriyle uyumlu (create/patch/delete)
// =============================================================
import * as React from "react";
import type { StorageAsset, StorageMeta } from "@/integrations/metahub/db/types/storage";
import {
  useCreateAssetAdminMutation,
  usePatchAssetAdminMutation,
  useDeleteAssetAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/storage_admin.endpoints";
import { ensureBlob, ensureMany, type BlobTask } from "./storageClient";
import { assetFolder, buildAssetPath, isImageMime } from "./assetPaths";

export type UploadInput =
  | File
  | Blob
  | FileList
  | { file?: File | Blob }
  | string
  | React.ChangeEvent<HTMLInputElement>;

export type UseStorageUploadOptions = {
  bucket?: string;
  folder?: string | null;
  metadata?: StorageMeta;
  imagesOnly?: boolean;
  maxBytes?: number;
};

export function useStorageUpload(opts: UseStorageUploadOptions = {}) {
  const [createMut] = useCreateAssetAdminMutation();
  const [patchMut]  = usePatchAssetAdminMutation();
  const [deleteMut] = useDeleteAssetAdminMutation();

  const [uploading, setUploading] = React.useState(false);
  const [lastError, setLastError] = React.useState<unknown>(null);

  const validate = React.useCallback(
    (blob: Blob) => {
      if (opts.imagesOnly !== false && !isImageMime(blob.type)) {
        throw Object.assign(new Error("only_images_allowed"), { code: "ONLY_IMAGES" });
      }
      if (opts.maxBytes && blob.size > opts.maxBytes) {
        throw Object.assign(new Error("file_too_large"), { code: "FILE_TOO_LARGE", max: opts.maxBytes });
      }
    },
    [opts.imagesOnly, opts.maxBytes]
  );

  const uploadOne = React.useCallback(
    async (
      input: UploadInput,
      override?: { bucket?: string; folder?: string | null; metadata?: StorageMeta; fileName?: string }
    ): Promise<StorageAsset> => {
      const { blob, filename } = ensureBlob(input);
      validate(blob);

      const bucket = override?.bucket ?? opts.bucket ?? "default";
      const folder = override?.folder ?? opts.folder ?? null;

      // ✅ metadata'yı undefined olmayacak şekilde daralt
      let metaVal: StorageMeta | undefined = override?.metadata;
      if (metaVal === undefined) metaVal = opts.metadata;

      const finalName = override?.fileName ?? filename;
      const file = new File([blob], finalName, { type: blob.type || "application/octet-stream" });

      setUploading(true);
      setLastError(null);
      try {
        const res = await createMut({
          file,
          bucket,
          ...(folder !== null && folder !== undefined ? { folder } : {}),
          ...(metaVal !== undefined ? { metadata: metaVal } : {}), // ✅ yalnızca tanımlıysa ekle
        }).unwrap();
        return res;
      } catch (e) {
        setLastError(e);
        throw e;
      } finally {
        setUploading(false);
      }
    },
    [opts.bucket, opts.folder, opts.metadata, createMut, validate]
  );

  const uploadMany = React.useCallback(
    async (
      inputs: UploadInput[],
      override?: { bucket?: string; folder?: string | null; metadata?: StorageMeta; names?: (string | undefined)[] }
    ): Promise<StorageAsset[]> => {
      const tasks: BlobTask[] = inputs.flatMap((inp) => ensureMany(inp));

      if (override?.names && override.names.length) {
        const n = Math.min(tasks.length, override.names.length);
        for (let i = 0; i < n; i++) {
          const nm = override.names[i];
          if (typeof nm === "string") {
            const { blob } = tasks[i]!;
            tasks[i] = { blob, filename: nm };
          }
        }
      }

      const out: StorageAsset[] = [];
      for (let i = 0; i < tasks.length; i++) {
        const { blob, filename } = tasks[i]!;

        // ✅ exactOptionalPropertyTypes'e uygun override objesi kur
        const ov: { bucket?: string; folder?: string | null; metadata?: StorageMeta; fileName?: string } = {};
        if (override?.bucket !== undefined) ov.bucket = override.bucket;
        ov.folder = (override?.folder ?? opts.folder ?? null);

        // metadata'yı yine undefined olmayacak şekilde daralt
        let metaVal: StorageMeta | undefined = override?.metadata;
        if (metaVal === undefined) metaVal = opts.metadata;
        if (metaVal !== undefined) ov.metadata = metaVal; // ✅ yalnızca tanımlıysa property ekle

        ov.fileName = filename;

        const a = await uploadOne(
          new File([blob], filename, { type: blob.type || "application/octet-stream" }),
          ov
        );
        out.push(a);
      }
      return out;
    },
    [uploadOne, opts.folder, opts.metadata]
  );

  const moveToFolder = React.useCallback(
    async (assetId: string, newFolder: string | null) => {
      const res = await patchMut({ id: assetId, body: { folder: newFolder } }).unwrap();
      return res;
    },
    [patchMut]
  );

  const rename = React.useCallback(
    async (assetId: string, newName: string) => {
      const res = await patchMut({ id: assetId, body: { name: newName } }).unwrap();
      return res;
    },
    [patchMut]
  );

  const remove = React.useCallback(
    async (assetId: string) => {
      await deleteMut({ id: assetId }).unwrap();
      return true;
    },
    [deleteMut]
  );

  return {
    uploading,
    lastError,
    uploadOne,
    uploadMany,
    moveToFolder,
    rename,
    remove,
    buildFolder: assetFolder,
    buildPath: buildAssetPath,
  };
}
