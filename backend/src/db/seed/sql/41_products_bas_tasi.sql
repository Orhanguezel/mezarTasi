-- 41_products_bas_tasi.sql
-- Ürünler: MEZAR BAŞ TAŞI MODELLERİ
-- Drizzle şemasına birebir uyumlu (storage_asset_id, alt, storage_image_ids dahil)

START TRANSACTION;

-- Üst kategori ve alt kategori değişkenleri
SET @CID_BAS_TASI   := 'aaaa0002-1111-4111-8111-aaaaaaaa0002';

SET @SC_BAS_MERMER  := 'cccc0001-3333-4333-8333-cccccccc0001'; -- Mermer Baş Taşı
SET @SC_BAS_GRANIT  := 'cccc0002-3333-4333-8333-cccccccc0002'; -- Granit Baş Taşı
SET @SC_BAS_SUTUNLU := 'cccc0003-3333-4333-8333-cccccccc0003'; -- Sütunlu Baş Taşı
SET @SC_BAS_OZEL    := 'cccc0004-3333-4333-8333-cccccccc0004'; -- Özel Tasarım Baş Taşları

INSERT INTO products
  (id, title, slug, price, description,
   category_id, sub_category_id,
   image_url, storage_asset_id, alt,
   images, storage_image_ids,
   is_active, is_featured, tags, specifications,
   product_code, stock_quantity, rating, review_count,
   meta_title, meta_description)
VALUES
-- 0) Tek kişilik sütunlu mermer baş taşı
('00000013-0000-4000-8000-000000000013',
 'TEK KİŞİLİK BAŞ TAŞI SÜTUNLU MERMER MEZAR',
 'tek-kisilik-bas-tasi-sutunlu-mermer-mezar',
 25000.00,
 'Klasik sütun detayları ile estetik görünüm.',
 @CID_BAS_TASI, @SC_BAS_SUTUNLU,
 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
 NULL, NULL,
 JSON_ARRAY(
   'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop'
 ),
 JSON_ARRAY(),
 1, 0, JSON_ARRAY(), NULL,
 'NO:13', 0, 5.00, 0, NULL, NULL),

-- 0.5) Tek kişilik baş taşı gövde granit mezar
('00000018-0000-4000-8000-000000000018',
 'TEK KİŞİLİK BAŞ TAŞI GÖVDE GRANİT MEZAR',
 'tek-kisilik-bas-tasi-govde-granit-mezar',
 31500.00,
 'Granit gövde ve baş taşı kombinasyonu.',
 @CID_BAS_TASI, @SC_BAS_GRANIT,
 'https://images.unsplash.com/photo-1750832444604-f793c5ad39bb?w=800&h=600&fit=crop',
 NULL, NULL,
 JSON_ARRAY(
   'https://images.unsplash.com/photo-1750832444604-f793c5ad39bb?w=800&h=600&fit=crop'
 ),
 JSON_ARRAY(),
 1, 0, JSON_ARRAY(), NULL,
 'NO:18', 0, 5.00, 0, NULL, NULL),

-- 1) Granit (Öne çıkan)
('00000023-0000-4000-8000-000000000023',
 'GÜNAY YAMAN – Siyah Granit Çerçeveli Mezar Baş Taşı',
 'bas-1-siyah-granit-cerceveli-mezar-bas-tasi',
 0.00,
 'Siyah granit çerçeve ve beyaz mermer kombinasyonu ile modern, şık ve dayanıklı baş taşı tasarımı.',
 @CID_BAS_TASI, @SC_BAS_GRANIT,
 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center',
 NULL, NULL,
 JSON_ARRAY(
   'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center',
   'https://images.unsplash.com/photo-1594736797933-d0401ba0af65?w=800&h=600&fit=crop&crop=center',
   'https://images.unsplash.com/photo-1654866489943-e1c6b3055146?w=800&h=600&fit=crop&crop=center'
 ),
 JSON_ARRAY(),
 1, 1, JSON_ARRAY(), NULL,
 'BAS:01', 0, 5.00, 0, NULL, NULL),

-- 2) Granit
('00000024-0000-4000-8000-000000000024',
 'Tek Kişilik Granit Mezar Baş Taşı Modeli',
 'bas-2-tek-kisilik-granit-mezar-bas-tasi',
 0.00,
 'Dayanıklı siyah granit malzeme ile tek kişilik modern baş taşı.',
 @CID_BAS_TASI, @SC_BAS_GRANIT,
 'https://images.unsplash.com/photo-1675488367379-b2f761bfacef?w=800&h=600&fit=crop&crop=center',
 NULL, NULL,
 JSON_ARRAY(
   'https://images.unsplash.com/photo-1675488367379-b2f761bfacef?w=800&h=600&fit=crop&crop=center',
   'https://images.unsplash.com/photo-1717399244709-1325f90e1594?w=800&h=600&fit=crop&crop=center',
   'https://images.unsplash.com/photo-1549573822-0ee3701de11d?w=800&h=600&fit=crop&crop=center'
 ),
 JSON_ARRAY(),
 1, 0, JSON_ARRAY(), NULL,
 'BAS:02', 0, 5.00, 0, NULL, NULL),

-- 3) Mermer
('00000025-0000-4000-8000-000000000025',
 'Çift Kişilik Mermer Mezar Baş Taşı',
 'bas-3-cift-kisilik-mermer-mezar-bas-tasi',
 0.00,
 'Klasik beyaz mermerden çift kişilik baş taşı; doğal mermer cila ile uzun ömür.',
 @CID_BAS_TASI, @SC_BAS_MERMER,
 'https://images.unsplash.com/photo-1578948856697-db91d246b7b8?w=800&h=600&fit=crop&crop=center',
 NULL, NULL,
 JSON_ARRAY(
   'https://images.unsplash.com/photo-1578948856697-db91d246b7b8?w=800&h=600&fit=crop&crop=center',
   'https://images.unsplash.com/photo-1654866489943-e1c6b3055146?w=800&h=600&fit=crop&crop=center'
 ),
 JSON_ARRAY(),
 1, 0, JSON_ARRAY(), NULL,
 'BAS:03', 0, 5.00, 0, NULL, NULL),

-- 4) Özel Tasarım
('00000026-0000-4000-8000-000000000026',
 'Özel Tasarım Tek Kişilik Mezar Baş Taşı',
 'bas-4-ozel-tasarim-tek-kisilik-mezar-bas-tasi',
 0.00,
 'Mozaik ve özel işçilik seçenekleriyle kişiye özel tasarlanmış baş taşı.',
 @CID_BAS_TASI, @SC_BAS_OZEL,
 'https://images.unsplash.com/photo-1589894403421-1c4b0c6b3b6e?w=800&h=600&fit=crop&crop=center',
 NULL, NULL,
 JSON_ARRAY(
   'https://images.unsplash.com/photo-1589894403421-1c4b0c6b3b6e?w=800&h=600&fit=crop&crop=center',
   'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center'
 ),
 JSON_ARRAY(),
 1, 0, JSON_ARRAY(), NULL,
 'BAS:04', 0, 5.00, 0, NULL, NULL),

-- 5) Sütunlu (Öne çıkan)
('00000027-0000-4000-8000-000000000027',
 'Sütunlu Mermer Baş Taşı',
 'bas-5-sutunlu-mermer-bas-tasi',
 0.00,
 'Klasik sütun detaylı mermer baş taşı; gösterişli ve zarif görünüm.',
 @CID_BAS_TASI, @SC_BAS_SUTUNLU,
 'https://images.unsplash.com/photo-1549573822-0ee3701de11d?w=800&h=600&fit=crop&crop=center',
 NULL, NULL,
 JSON_ARRAY(
   'https://images.unsplash.com/photo-1549573822-0ee3701de11d?w=800&h=600&fit=crop&crop=center',
   'https://images.unsplash.com/photo-1578948856697-db91d246b7b8?w=800&h=600&fit=crop&crop=center'
 ),
 JSON_ARRAY(),
 1, 1, JSON_ARRAY(), NULL,
 'BAS:05', 0, 5.00, 0, NULL, NULL),

-- 6) Mermer
('00000028-0000-4000-8000-000000000028',
 'Tek Kişilik Mermer Mezar Baş Taşı',
 'bas-6-tek-kisilik-mermer-mezar-bas-tasi',
 0.00,
 'Geleneksel beyaz mermer tek kişilik baş taşı; sade ve şık.',
 @CID_BAS_TASI, @SC_BAS_MERMER,
 'https://images.unsplash.com/photo-1578948854345-1b9b2e5f3b9c?w=800&h=600&fit=crop&crop=center',
 NULL, NULL,
 JSON_ARRAY(
   'https://images.unsplash.com/photo-1578948854345-1b9b2e5f3b9c?w=800&h=600&fit=crop&crop=center',
   'https://images.unsplash.com/photo-1594736797933-d0401ba0af65?w=800&h=600&fit=crop&crop=center'
 ),
 JSON_ARRAY(),
 1, 0, JSON_ARRAY(), NULL,
 'BAS:06', 0, 5.00, 0, NULL, NULL),

-- 7) Granit
('00000029-0000-4000-8000-000000000029',
 'Tek Kişilik Granit Mezar Baş Taşı',
 'bas-7-tek-kisilik-granit-mezar-bas-tasi',
 0.00,
 'Modern çizgilere sahip parlak granit yüzeyli tek kişilik baş taşı.',
 @CID_BAS_TASI, @SC_BAS_GRANIT,
 'https://images.unsplash.com/photo-1750832444604-f793c5ad39bb?w=800&h=600&fit=crop&crop=center',
 NULL, NULL,
 JSON_ARRAY(
   'https://images.unsplash.com/photo-1750832444604-f793c5ad39bb?w=800&h=600&fit=crop&crop=center',
   'https://images.unsplash.com/photo-1675488367379-b2f761bfacef?w=800&h=600&fit=crop&crop=center'
 ),
 JSON_ARRAY(),
 1, 0, JSON_ARRAY(), NULL,
 'BAS:07', 0, 5.00, 0, NULL, NULL),

-- 8) Özel Tasarım (Öne çıkan)
('00000030-0000-4000-8000-000000000030',
 'Özel Yapım Granit Baş Taşı',
 'bas-8-ozel-yapim-granit-bas-tasi',
 0.00,
 'Müşteri talebine göre ölçü ve detayları belirlenen özel yapım granit baş taşı.',
 @CID_BAS_TASI, @SC_BAS_OZEL,
 'https://images.unsplash.com/photo-1654866489943-e1c6b3055146?w=800&h=600&fit=crop&crop=center',
 NULL, NULL,
 JSON_ARRAY(
   'https://images.unsplash.com/photo-1654866489943-e1c6b3055146?w=800&h=600&fit=crop&crop=center',
   'https://images.unsplash.com/photo-1594736797933-d0401ba0af65?w=800&h=600&fit=crop&crop=center'
 ),
 JSON_ARRAY(),
 1, 1, JSON_ARRAY(), NULL,
 'BAS:08', 0, 5.00, 0, NULL, NULL)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  price = VALUES(price),
  description = VALUES(description),
  category_id = VALUES(category_id),
  sub_category_id = VALUES(sub_category_id),
  image_url = VALUES(image_url),
  storage_asset_id = VALUES(storage_asset_id),
  alt = VALUES(alt),
  images = VALUES(images),
  storage_image_ids = VALUES(storage_image_ids),
  is_active = VALUES(is_active),
  is_featured = VALUES(is_featured),
  tags = VALUES(tags),
  specifications = VALUES(specifications),
  product_code = VALUES(product_code),
  stock_quantity = VALUES(stock_quantity),
  rating = VALUES(rating),
  review_count = VALUES(review_count),
  meta_title = VALUES(meta_title),
  meta_description = VALUES(meta_description),
  updated_at = CURRENT_TIMESTAMP(3);

COMMIT;
