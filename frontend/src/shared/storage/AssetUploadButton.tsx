// =============================================================
// FILE: src/shared/storage/AssetUploadButton.tsx
// Basit bir buton + gizli input ile mgr.attachFiles kullanımı (çoklu destekli)
// =============================================================
import * as React from "react";
import { useEntityAssetManager } from "./useEntityAssetManager";

type Props = {
  mgr: ReturnType<typeof useEntityAssetManager>;
  multiple?: boolean;
  accept?: string;
  children?: React.ReactNode;
};

export function AssetUploadButton({ mgr, multiple, accept = "image/*", children }: Props) {
  const ref = React.useRef<HTMLInputElement>(null);

  return (
    <>
      <button type="button" onClick={() => ref.current?.click()} disabled={mgr.uploading}>
        {children ?? (mgr.uploading ? "Yükleniyor..." : "Görsel Ekle")}
      </button>
      <input
        ref={ref}
        type="file"
        hidden
        multiple={!!multiple}
        accept={accept}
        onChange={(e) => {
          const files = Array.from(e.currentTarget.files ?? []);
          if (files.length) void mgr.attachFiles(files);
          // input reset (aynı dosyayı tekrar seçebilmek için)
          e.currentTarget.value = "";
        }}
      />
    </>
  );
}
