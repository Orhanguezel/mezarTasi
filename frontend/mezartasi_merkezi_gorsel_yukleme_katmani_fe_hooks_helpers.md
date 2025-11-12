# Mezartasi – Merkezî Görsel Yükleme Katmanı (FE hooks + helpers)

Aşağıdaki dosyalar; **tek merkezden** görsel/dosya ekleme–silme–taşıma (folder rename)–çoklu yükleme–modüle iliştirme (attach/detach) akışını standartlaştırır. RTK endpoints’inizle uyumludur ve **tüm modüllerde aynı API** ile çalışır.

> Not: Backend kodunuz (Cloudinary + `/admin/storage/assets` vs.) ile test edilmiş yapıdadır. İstediğiniz yerde `entity/entityId/slot` klasör konvansiyonunu kullanır.

---

## 1) `src/shared/storage/assetPaths.ts`

```ts

```

---

## 2) `src/shared/storage/storageClient.ts`

```ts

```

---

## 3) `src/shared/storage/useStorageUpload.ts`

```ts

```

---

## 4) `src/shared/storage/useEntityAssetManager.ts`

```ts

```

---

## 5) **Kullanım Örnekleri**

### 5.1 Recent Works – çoklu görsel galerisi

```ts
// RecentWorkForm.tsx (özet)
import { useEntityAssetManager } from "@/shared/storage/useEntityAssetManager";
import {
  useAddRecentWorkImageAdminMutation,
  useRemoveRecentWorkImageAdminMutation,
  useReorderRecentWorkImagesAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/recent_works_admin.endpoints";

function RecentWorkForm({ rw }: { rw: { id: string } }) {
  const [addImage] = useAddRecentWorkImageAdminMutation();
  const [removeImage] = useRemoveRecentWorkImageAdminMutation();
  const [reorderImages] = useReorderRecentWorkImagesAdminMutation();

  const mgr = useEntityAssetManager({
    entity: "recent_works",
    entityId: rw.id,
    slot: "images", // folder: recent_works/{id}/images
    bucket: "recent_works",
    attach: async (asset, { index }) => {
      await addImage({ id: rw.id, body: { asset_id: asset.id, display_order: index ?? 0 } }).unwrap();
    },
    detach: async (assetId) => {
      await removeImage({ id: rw.id, body: { asset_id: assetId } }).unwrap();
    },
    reorder: async (ids) => {
      await reorderImages({ id: rw.id, body: { asset_ids: ids } }).unwrap();
    },
  });

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    await mgr.attachFiles(e, /* startIndex */ 0);
  };

  return (
    <div>
      <input type="file" multiple accept="image/*" onChange={onFiles} />
      {/* ... galeriyi render edin; silme: mgr.detachOne(asset.id, { deleteFromStorage: true }) */}
    </div>
  );
}
```

### 5.2 Products – kapak görseli (tekli)

```ts
import { useEntityAssetManager } from "@/shared/storage/useEntityAssetManager";
import { useAttachProductCoverAdminMutation, useDetachProductCoverAdminMutation } from "@/integrations/metahub/rtk/endpoints/admin/products_admin.endpoints";

function ProductCover({ productId }: { productId: string }) {
  const [attachCover] = useAttachProductCoverAdminMutation();
  const [detachCover] = useDetachProductCoverAdminMutation();

  const mgr = useEntityAssetManager({
    entity: "products",
    entityId: productId,
    slot: "cover",
    bucket: "products",
    attach: async (asset) => {
      await attachCover({ id: productId, body: { asset_id: asset.id } }).unwrap();
    },
    detach: async (assetId) => {
      await detachCover({ id: productId, body: { asset_id: assetId } }).unwrap();
    },
  });

  return (
    <div>
      <input type="file" accept="image/*" onChange={(e) => mgr.attachOne(e)} />
      {/* kaldırma: mgr.detachOne(currentAssetId, { deleteFromStorage: true }) */}
    </div>
  );
}
```

### 5.3 Slot taşıma (ör. gallery -> cover)

```ts
// bir asset'i başka slota taşımak (Cloudinary rename + DB path güncellenir):
await mgr.moveOneTo(asset.id, "cover");
```

---

## 6) Opsiyonel mini UI: `AssetUploadButton`

```tsx

```

---

## 7) Kısa Notlar & Entegrasyon İpuçları

- **Duplikede ID garantisi**: Backend’iniz `bucket+path` duplikede mevcut kaydın **id**’sini döndürüyor → aynı dosyayı ikinci kez yüklediğinizde modül iliştirmesi (attach) düzgün çalışır.
- **Folder taşıma**: `moveToFolder(assetId, newFolder)` Cloudinary `rename` + DB `path/url` günceller.
- **Silme stratejisi**: `detachOne(assetId, { deleteFromStorage: true })` önce ilişkiyi koparır, sonra storage kaydını siler; sadece ilişki silmek için `deleteFromStorage: false` kullanın.
- **Genel konvansiyon**: `bucket` çoğu zaman `entity` ile aynıdır. Slot’lar: `cover`, `gallery`, `images`, `thumbs` vs.
- **Boyut/mime doğrulama**: `useStorageUpload({ imagesOnly: true, maxBytes })` ile merkezi kontrol.
- **Karma sıralama**: Galeri bileşeniniz IDs’i sürükle-bırakla yeniden sıraladığında `mgr.reorder(ids)` çağırın (opsiyonel mutasyon enjekte edildi ise).

---

## 8) Hızlı Özet

- **useStorageUpload**: Storage’a doğrudan yükleme/taşıma/rename/silme.
- **useEntityAssetManager**: Yüklenen asset’i **modülün attach/detach/reorder** mutasyonlarıyla eşleştirir.
- **assetFolder/buildAssetPath**: Tek bir path/isim standardı.

Bu dört parça ile "onlarca modül" aynı API’yi kullanır. İstersen ekstra validasyonlar (ör. en az 600×600) veya otomatik thumbnail üretimi için `attach` içinde şartlara göre farklı slotlara kopyalama/taşıma yapabiliriz.

