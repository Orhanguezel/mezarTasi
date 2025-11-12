// =============================================================
// FILE: src/shared/storage/useEntityAssetManager.ts
// Amaç: Yüklenen asset'i İLİŞTİRME/DİSİLME (attach/detach/reorder)
//       işlerini modüle özel mutation'larla tek merkezden yürütmek
// =============================================================
import * as React from "react";
import type { StorageAsset, StorageMeta } from "@/integrations/metahub/db/types/storage";
import { useStorageUpload, type UploadInput } from "./useStorageUpload";
import { assetFolder } from "./assetPaths";

export type AttachFn  = (asset: StorageAsset, ctx: { index?: number }) => Promise<any> | any;
export type DetachFn  = (assetId: string) => Promise<any> | any;
export type ReorderFn = (orderedIds: string[]) => Promise<any> | any;

export type UseEntityAssetManagerOptions = {
  entity: string;
  entityId: string | number;
  slot?: string;
  bucket?: string;
  folderOverride?: string;
  metadata?: StorageMeta;
  attach: AttachFn;
  detach: DetachFn;
  reorder?: ReorderFn;
  imagesOnly?: boolean;
  maxBytes?: number;
};

export function useEntityAssetManager(opts: UseEntityAssetManagerOptions) {
  const folder = React.useMemo(
    () => opts.folderOverride ?? assetFolder(opts.entity, opts.entityId, opts.slot),
    [opts.folderOverride, opts.entity, opts.entityId, opts.slot]
  );
  const bucket = opts.bucket ?? opts.entity;

  const upload = useStorageUpload({
    bucket,
    folder,
    ...(opts.metadata   !== undefined ? { metadata: opts.metadata }   : {}),
    ...(opts.imagesOnly !== undefined ? { imagesOnly: opts.imagesOnly } : {}),
    ...(opts.maxBytes   !== undefined ? { maxBytes: opts.maxBytes }   : {}),
  });

  const attachFiles = React.useCallback(
    async (files: UploadInput[] | UploadInput, startIndex: number = 0) => {
      const arr = Array.isArray(files) ? files : [files];
      const assets = await upload.uploadMany(arr);
      for (let i = 0; i < assets.length; i++) {
        await Promise.resolve(opts.attach(assets[i]!, { index: startIndex + i }));
      }
      return assets;
    },
    [upload, opts.attach]
  );

  const attachOne = React.useCallback(
    async (file: UploadInput, index?: number) => {
      const a = await upload.uploadOne(file);
      const ctx: { index?: number } = index !== undefined ? { index } : {};
      await Promise.resolve(opts.attach(a, ctx));
      return a;
    },
    [upload, opts.attach]
  );

  const detachOne = React.useCallback(
    async (assetId: string, options?: { deleteFromStorage?: boolean }) => {
      await Promise.resolve(opts.detach(assetId));
      if (options?.deleteFromStorage) {
        await upload.remove(assetId);
      }
      return true;
    },
    [opts.detach, upload]
  );

  const moveOneTo = React.useCallback(
    async (assetId: string, newSlot: string | null) => {
      const newFolder = newSlot
        ? assetFolder(opts.entity, opts.entityId, newSlot)
        : assetFolder(opts.entity, opts.entityId);
      return upload.moveToFolder(assetId, newFolder);
    },
    [opts.entity, opts.entityId, upload]
  );

  const reorder = React.useCallback(
    async (orderedIds: string[]) => {
      if (!opts.reorder) return;
      await Promise.resolve(opts.reorder(orderedIds));
    },
    [opts.reorder]
  );

  return {
    uploading: upload.uploading,
    lastError: upload.lastError,
    attachOne,
    attachFiles,
    detachOne,
    moveOneTo,
    reorder,
    buildFolder: assetFolder,
    buildPath: upload.buildPath,
  };
}
