-- 40_catalog_categories.sql
-- Kategoriler (üst) ve Alt Kategoriler - FINAL

START TRANSACTION;

-- =========================
-- CATEGORIES (TOP LEVEL)
-- =========================
INSERT INTO categories (id, name, slug, description, image_url, icon, is_active, is_featured, display_order)
VALUES
  ('aaaa0001-1111-4111-8111-aaaaaaaa0001', 'MEZAR MODELLERİ',           'mezar-modelleri',           NULL, NULL, NULL, 1, 0, 10),
  ('aaaa0002-1111-4111-8111-aaaaaaaa0002', 'MEZAR BAŞ TAŞI MODELLERİ',  'mezar-bas-tasi-modelleri',  NULL, NULL, NULL, 1, 0, 20),
  ('aaaa0003-1111-4111-8111-aaaaaaaa0003', 'MEZAR AKSESUARLARI',        'mezar-aksesuarlari',        NULL, NULL, NULL, 1, 0, 30),
  ('aaaa0004-1111-4111-8111-aaaaaaaa0004', 'MEZAR ÇİÇEKLENDİRME',       'mezar-ciceklendirme',       NULL, NULL, NULL, 1, 0, 40),
  ('aaaa0005-1111-4111-8111-aaaaaaaa0005', 'MEZAR TOPRAK DOLUMU',       'mezar-toprak-dolumu',       NULL, NULL, NULL, 1, 0, 50)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- =========================
-- SUB CATEGORIES
-- =========================

-- mezar-modelleri
INSERT INTO sub_categories (id, category_id, name, slug, description, image_url, icon, is_active, is_featured, display_order)
VALUES
  ('bbbb0001-2222-4222-8222-bbbbbbbb0001', 'aaaa0001-1111-4111-8111-aaaaaaaa0001', 'Tek Kişilik Mermer Mezar',  'tek-kisilik-mermer-mezar',  NULL, NULL, NULL, 1, 0, 10),
  ('bbbb0002-2222-4222-8222-bbbbbbbb0002', 'aaaa0001-1111-4111-8111-aaaaaaaa0001', 'Tek Kişilik Granit Mezar',  'tek-kisilik-granit-mezar',  NULL, NULL, NULL, 1, 0, 20),
  ('bbbb0003-2222-4222-8222-bbbbbbbb0003', 'aaaa0001-1111-4111-8111-aaaaaaaa0001', 'İki Kişilik Mermer Mezar',  'iki-kisilik-mermer-mezar',  NULL, NULL, NULL, 1, 0, 30),
  ('bbbb0004-2222-4222-8222-bbbbbbbb0004', 'aaaa0001-1111-4111-8111-aaaaaaaa0001', 'İki Kişilik Granit Mezar',  'iki-kisilik-granit-mezar',  NULL, NULL, NULL, 1, 0, 40),
  ('bbbb0005-2222-4222-8222-bbbbbbbb0005', 'aaaa0001-1111-4111-8111-aaaaaaaa0001', 'Katlı Lahit Mezar',         'katli-lahit-mezar',         NULL, NULL, NULL, 1, 0, 50),
  ('bbbb0006-2222-4222-8222-bbbbbbbb0006', 'aaaa0001-1111-4111-8111-aaaaaaaa0001', 'Özel Yapım Mezar',          'ozel-yapim-mezar',          NULL, NULL, NULL, 1, 0, 60),
  ('bbbb0007-2222-4222-8222-bbbbbbbb0007', 'aaaa0001-1111-4111-8111-aaaaaaaa0001', 'Sütunlu Mezar',             'sutunlu-mezar',             NULL, NULL, NULL, 1, 0, 70)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- mezar-bas-tasi-modelleri
INSERT INTO sub_categories (id, category_id, name, slug, description, image_url, icon, is_active, is_featured, display_order)
VALUES
  ('cccc0001-3333-4333-8333-cccccccc0001', 'aaaa0002-1111-4111-8111-aaaaaaaa0002', 'Mermer Baş Taşı',            'mermer-bas-tasi',            NULL, NULL, NULL, 1, 0, 10),
  ('cccc0002-3333-4333-8333-cccccccc0002', 'aaaa0002-1111-4111-8111-aaaaaaaa0002', 'Granit Baş Taşı',            'granit-bas-tasi',            NULL, NULL, NULL, 1, 0, 20),
  ('cccc0003-3333-4333-8333-cccccccc0003', 'aaaa0002-1111-4111-8111-aaaaaaaa0002', 'Sütunlu Baş Taşı',           'sutunlu-bas-tasi',           NULL, NULL, NULL, 1, 0, 30),
  ('cccc0004-3333-4333-8333-cccccccc0004', 'aaaa0002-1111-4111-8111-aaaaaaaa0002', 'Özel Tasarım Baş Taşları',   'ozel-tasarim-bas-taslari',   NULL, NULL, NULL, 1, 0, 40)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- mezar-aksesuarlari
INSERT INTO sub_categories (id, category_id, name, slug, description, image_url, icon, is_active, is_featured, display_order)
VALUES
  ('dddd0001-4444-4444-8444-dddddddd0001', 'aaaa0003-1111-4111-8111-aaaaaaaa0003', 'Mezar Süsleri',   'mezar-susleri',   NULL, NULL, NULL, 1, 0, 10),
  ('dddd0002-4444-4444-8444-dddddddd0002', 'aaaa0003-1111-4111-8111-aaaaaaaa0003', 'Sütun Modelleri', 'sutun-modelleri', NULL, NULL, NULL, 1, 0, 20),
  ('dddd0003-4444-4444-8444-dddddddd0003', 'aaaa0003-1111-4111-8111-aaaaaaaa0003', 'Vazo Modelleri',  'vazo-modelleri',  NULL, NULL, NULL, 1, 0, 30),
  ('dddd0004-4444-4444-8444-dddddddd0004', 'aaaa0003-1111-4111-8111-aaaaaaaa0003', 'Diğer Modeller',  'diger-modeller',  NULL, NULL, NULL, 1, 0, 40)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- mezar-ciceklendirme
INSERT INTO sub_categories (id, category_id, name, slug, description, image_url, icon, is_active, is_featured, display_order)
VALUES
  ('eeee0001-5555-4555-8555-eeeeeeee0001', 'aaaa0004-1111-4111-8111-aaaaaaaa0004', 'Mevsimlik Bitki', 'mevsimlik-bitki', NULL, NULL, NULL, 1, 0, 10),
  ('eeee0002-5555-4555-8555-eeeeeeee0002', 'aaaa0004-1111-4111-8111-aaaaaaaa0004', 'Sürekli Bitki',   'surekli-bitki',   NULL, NULL, NULL, 1, 0, 20),
  ('eeee0003-5555-4555-8555-eeeeeeee0003', 'aaaa0004-1111-4111-8111-aaaaaaaa0004', 'Topik Peyzaj',    'topik-peyzaj',    NULL, NULL, NULL, 1, 0, 30)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- mezar-toprak-dolumu
INSERT INTO sub_categories (id, category_id, name, slug, description, image_url, icon, is_active, is_featured, display_order)
VALUES
  ('ffff0001-6666-4666-8666-ffffffff0001', 'aaaa0005-1111-4111-8111-aaaaaaaa0005', 'Toprak Dolumu',        'toprak-dolumu',        NULL, NULL, NULL, 1, 0, 10),
  ('ffff0002-6666-4666-8666-ffffffff0002', 'aaaa0005-1111-4111-8111-aaaaaaaa0005', 'Özel Toprak Karışımı', 'ozel-toprak-karisimi', NULL, NULL, NULL, 1, 0, 20),
  ('ffff0003-6666-4666-8666-ffffffff0003', 'aaaa0005-1111-4111-8111-aaaaaaaa0005', 'Restorasyon',          'restorasyon',          NULL, NULL, NULL, 1, 0, 30)
ON DUPLICATE KEY UPDATE name=VALUES(name);

COMMIT;
