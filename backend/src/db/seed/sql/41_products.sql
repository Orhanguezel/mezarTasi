-- Ürünler: price -> DECIMAL(10,2), images/tags JSON
-- Kategori/alt kategori ID’leri sabit
-- Üst kategori: MEZAR MODELLERİ => aaaa0001-1111-4111-8111-aaaaaaaa0001
-- Şema ile birebir: image_url LONGTEXT, storage_asset_id CHAR(36), alt VARCHAR(255),
-- images JSON, storage_image_ids JSON, tags JSON, specifications JSON

START TRANSACTION;

-- Üst kategori ve alt kategori değişkenleri
SET @CID_MEZAR_MODELLERI := 'aaaa0001-1111-4111-8111-aaaaaaaa0001';

SET @SC_TEK_MERMER   := 'bbbb0001-2222-4222-8222-bbbbbbbb0001'; -- Tek Kişilik Mermer Mezar
SET @SC_TEK_GRANIT   := 'bbbb0002-2222-4222-8222-bbbbbbbb0002'; -- Tek Kişilik Granit Mezar
SET @SC_CIFT_MERMER  := 'bbbb0003-2222-4222-8222-bbbbbbbb0003'; -- İki Kişilik Mermer Mezar
SET @SC_CIFT_GRANIT  := 'bbbb0004-2222-4222-8222-bbbbbbbb0004'; -- İki Kişilik Granit Mezar
SET @SC_KATLI_LAHIT  := 'bbbb0005-2222-4222-8222-bbbbbbbb0005'; -- Kullanılmıyor
SET @SC_OZEL_YAPIM   := 'bbbb0006-2222-4222-8222-bbbbbbbb0006'; -- Kullanılmıyor
SET @SC_SUTUNLU      := 'bbbb0007-2222-4222-8222-bbbbbbbb0007'; -- Sütunlu Mezar

INSERT INTO products
(id, title, slug, price, description,
 category_id, sub_category_id,
 image_url, storage_asset_id, alt,
 images, storage_image_ids,
 is_active, is_featured, tags, specifications,
 product_code, stock_quantity, rating, review_count,
 meta_title, meta_description)
VALUES
('00000001-0000-4000-8000-000000000001','TEK KİŞİLİK DİKDÖRTGEN MEZAR','no-1-tek-kisilik-dikdortgen-mezar',26400.00,'İstanbul mezar yapım işlerinde en çok tercih edilen tek kişilik dikdörtgen mezar modelimiz, birinci sınıf Afyon beyaz mermerinden üretilmektedir. Kaliteli mezar taşı işçiliği ile 10 yıl garanti kapsamındadır. Mezarlık düzenlemelerinde klasik ve şık görünüm sağlar.',@CID_MEZAR_MODELLERI,@SC_TEK_MERMER,'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center',NULL,NULL,JSON_ARRAY('https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop','https://images.unsplash.com/photo-1594736797933-d0401ba0af65?w=800&h=600&fit=crop','https://images.unsplash.com/photo-1654866489943-e1c6b3055146?w=800&h=600&fit=crop','https://images.unsplash.com/photo-1717399244709-1325f90e1594?w=800&h=600&fit=crop'),JSON_ARRAY(),1,0,JSON_ARRAY(),NULL,'NO:1',0,5.00,0,NULL,NULL),
('00000002-0000-4000-8000-000000000002','TEK KİŞİLİK KARE MEZAR','no-2-tek-kisilik-kare-mezar',26400.00,'Modern mezar tasarımı arayanlar için özel olarak hazırlanan kare mezar modelimiz, çağdaş mezarlık mimarisine uygun şekilde üretilmiştir. Afyon mermerinden imal edilen mezar taşı modeli, dayanıklı yapısı ve şık görünümü ile öne çıkar.',@CID_MEZAR_MODELLERI,@SC_TEK_MERMER,'https://images.unsplash.com/photo-1594736797933-d0401ba0af65?w=800&h=600&fit=crop&crop=center',NULL,NULL,JSON_ARRAY('https://images.unsplash.com/photo-1594736797933-d0401ba0af65?w=800&h=600&fit=crop','https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop','https://images.unsplash.com/photo-1654866489943-e1c6b3055146?w=800&h=600&fit=crop'),JSON_ARRAY(),1,0,JSON_ARRAY(),NULL,'NO:2',0,5.00,0,NULL,NULL),
('00000003-0000-4000-8000-000000000003','TEK KİŞİLİK SÜTUNLU MEZAR','no-3-tek-kisilik-sutunlu-mezar',34500.00,'Klasik mimari tarzını seven aileler için özel tasarlanan sütunlu mezar modelimiz.',@CID_MEZAR_MODELLERI,@SC_SUTUNLU,'https://images.unsplash.com/photo-1549573822-0ee3701de11d?w=800&h=600&fit=crop&crop=center',NULL,NULL,JSON_ARRAY('https://images.unsplash.com/photo-1549573822-0ee3701de11d?w=800&h=600&fit=crop','https://images.unsplash.com/photo-1627694241584-78b5a9c3e714?w=800&h=600&fit=crop','https://images.unsplash.com/photo-1559366682-b24d010f6d65?w=800&h=600&fit=crop','https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop'),JSON_ARRAY(),1,0,JSON_ARRAY(),NULL,'NO:3',0,5.00,0,NULL,NULL),
('00000004-0000-4000-8000-000000000004','TEK KİŞİLİK BEYAZ MERMER MEZAR','no-4-tek-kisilik-beyaz-mermer-mezar',28900.00,'Saf beyaz mermerden üretilen premium mezar modelimiz.',@CID_MEZAR_MODELLERI,@SC_TEK_MERMER,'https://images.unsplash.com/photo-1627694241584-78b5a9c3e714?w=800&h=600&fit=crop',NULL,NULL,JSON_ARRAY('https://images.unsplash.com/photo-1627694241584-78b5a9c3e714?w=800&h=600&fit=crop'),JSON_ARRAY(),1,0,JSON_ARRAY(),NULL,'NO:4',0,5.00,0,NULL,NULL),
('00000005-0000-4000-8000-000000000005','TEK KİŞİLİK ÇİFT TAŞLI MEZAR','no-5-tek-kisilik-cift-tasli-mezar',31000.00,'Ekonomik mezar çözümleri arayanlar için geliştirilen çift taşlı mezar modelimiz.',@CID_MEZAR_MODELLERI,@SC_TEK_MERMER,'https://images.unsplash.com/photo-1559366682-b24d010f6d65?w=800&h=600&fit=crop',NULL,NULL,JSON_ARRAY('https://images.unsplash.com/photo-1559366682-b24d010f6d65?w=800&h=600&fit=crop'),JSON_ARRAY(),1,0,JSON_ARRAY(),NULL,'NO:5',0,5.00,0,NULL,NULL),
('00000006-0000-4000-8000-000000000006','TEK KİŞİLİK MEZAR - EKONOMİK','no-6-tek-kisilik-mezar-ekonomik',24600.00,'Bütçe dostu mezar modelleri arasında kaliteli seçenek.',@CID_MEZAR_MODELLERI,@SC_TEK_MERMER,'https://images.unsplash.com/photo-1717399244709-1325f90e1594?w=800&h=600&fit=crop',NULL,NULL,JSON_ARRAY('https://images.unsplash.com/photo-1717399244709-1325f90e1594?w=800&h=600&fit=crop'),JSON_ARRAY(),1,0,JSON_ARRAY(),NULL,'NO:6',0,5.00,0,NULL,NULL),
('00000007-0000-4000-8000-000000000007','TEK KİŞİLİK TAM SİZE MEZAR','no-7-tek-kisilik-tam-size-mezar',42600.00,'Premium mezar kategorisinde yer alan geniş boyutlu tasarım.',@CID_MEZAR_MODELLERI,@SC_TEK_MERMER,'https://images.unsplash.com/photo-1654866489943-e1c6b3055146?w=800&h=600&fit=crop',NULL,NULL,JSON_ARRAY('https://images.unsplash.com/photo-1654866489943-e1c6b3055146?w=800&h=600&fit=crop'),JSON_ARRAY(),1,0,JSON_ARRAY(),NULL,'NO:7',0,5.00,0,NULL,NULL),
('00000008-0000-4000-8000-000000000008','TEK KİŞİLİK YUVARLAK MEZAR','no-8-tek-kisilik-yuvarlak-mezar',28900.00,'Yuvarlak formda çağdaş estetik.',@CID_MEZAR_MODELLERI,@SC_TEK_MERMER,'https://images.unsplash.com/photo-1675488367379-b2f761bfacef?w=800&h=600&fit=crop',NULL,NULL,JSON_ARRAY('https://images.unsplash.com/photo-1675488367379-b2f761bfacef?w=800&h=600&fit=crop'),JSON_ARRAY(),1,0,JSON_ARRAY(),NULL,'NO:8',0,5.00,0,NULL,NULL),
('00000009-0000-4000-8000-000000000009','TEK KİŞİLİK MİNİMALİST MEZAR','no-9-tek-kisilik-minimalist-mezar',22900.00,'Sade ve modern tasarım anlayışı.',@CID_MEZAR_MODELLERI,@SC_TEK_MERMER,'https://images.unsplash.com/photo-1750832444604-f793c5ad39bb?w=800&h=600&fit=crop',NULL,NULL,JSON_ARRAY('https://images.unsplash.com/photo-1750832444604-f793c5ad39bb?w=800&h=600&fit=crop'),JSON_ARRAY(),1,0,JSON_ARRAY(),NULL,'NO:9',0,5.00,0,NULL,NULL),
('00000010-0000-4000-8000-000000000010','TEK KİŞİLİK YÜKSEK MEZAR','no-10-tek-kisilik-yuksek-mezar',44200.00,'Yüksek profilli gösterişli tasarım.',@CID_MEZAR_MODELLERI,@SC_TEK_MERMER,'https://images.unsplash.com/photo-1594736797933-d0401ba0af65?w=800&h=600&fit=crop',NULL,NULL,JSON_ARRAY('https://images.unsplash.com/photo-1594736797933-d0401ba0af65?w=800&h=600&fit=crop'),JSON_ARRAY(),1,0,JSON_ARRAY(),NULL,'NO:10',0,5.00,0,NULL,NULL),
('00000011-0000-4000-8000-000000000011','TEK KİŞİLİK GRANİT MEZAR','no-11-tek-kisilik-granit-mezar',35600.00,'Birinci sınıf ithal granit, uzun ömür.',@CID_MEZAR_MODELLERI,@SC_TEK_GRANIT,'https://images.unsplash.com/photo-1750832444604-f793c5ad39bb?w=800&h=600&fit=crop&crop=center',NULL,NULL,JSON_ARRAY('https://images.unsplash.com/photo-1750832444604-f793c5ad39bb?w=800&h=600&fit=crop','https://images.unsplash.com/photo-1675488367379-b2f761bfacef?w=800&h=600&fit=crop'),JSON_ARRAY(),1,0,JSON_ARRAY(),NULL,'NO:11',0,5.00,0,NULL,NULL),
('00000012-0000-4000-8000-000000000012','ÇİFT KİŞİLİK DİKDÖRTGEN MEZAR','no-12-cift-kisilik-dikdortgen-mezar',33600.00,'Aile mezarları için geniş boyutlu tasarım.',@CID_MEZAR_MODELLERI,@SC_CIFT_MERMER,'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=center',NULL,NULL,JSON_ARRAY('https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop'),JSON_ARRAY(),1,0,JSON_ARRAY(),NULL,'NO:12',0,5.00,0,NULL,NULL),
('00000013-0000-4000-8000-000000000013','TEK KİŞİLİK BAŞ TAŞI SÜTUNLU MERMER MEZAR','no-13-tek-kisilik-bas-tasi-sutunlu-mermer-mezar',25000.00,'Klasik sütun detayları ile estetik görünüm.',@CID_MEZAR_MODELLERI,@SC_SUTUNLU,'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',NULL,NULL,JSON_ARRAY('https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop'),JSON_ARRAY(),1,0,JSON_ARRAY(),NULL,'NO:13',0,5.00,0,NULL,NULL),
('00000014-0000-4000-8000-000000000014','TEK KİŞİLİK SÜTUNLU MEZAR','no-14-tek-kisilik-sutunlu-mezar',23000.00,'Klasik görünüm, uygun fiyat.',@CID_MEZAR_MODELLERI,@SC_SUTUNLU,'https://images.unsplash.com/photo-1549573822-0ee3701de11d?w=800&h=600&fit=crop',NULL,NULL,JSON_ARRAY('https://images.unsplash.com/photo-1549573822-0ee3701de11d?w=800&h=600&fit=crop'),JSON_ARRAY(),1,0,JSON_ARRAY(),NULL,'NO:14',0,5.00,0,NULL,NULL),
('00000015-0000-4000-8000-000000000015','TEK KİŞİLİK KOMPLE MERMER MEZAR','no-15-tek-kisilik-komple-mermer-mezar',22000.00,'Tek parça mermer işçiliği ile ekonomik çözüm.',@CID_MEZAR_MODELLERI,@SC_TEK_MERMER,'https://images.unsplash.com/photo-1594736797933-d0401ba0af65?w=800&h=600&fit=crop',NULL,NULL,JSON_ARRAY('https://images.unsplash.com/photo-1594736797933-d0401ba0af65?w=800&h=600&fit=crop'),JSON_ARRAY(),1,0,JSON_ARRAY(),NULL,'NO:15',0,5.00,0,NULL,NULL),
('00000016-0000-4000-8000-000000000016','TEK KİŞİLİK MERMER MEZAR','no-16-tek-kisilik-mermer-mezar',21000.00,'Geleneksel, sade ve şık.',@CID_MEZAR_MODELLERI,@SC_TEK_MERMER,'https://images.unsplash.com/photo-1627694241584-78b5a9c3e714?w=800&h=600&fit=crop',NULL,NULL,JSON_ARRAY('https://images.unsplash.com/photo-1627694241584-78b5a9c3e714?w=800&h=600&fit=crop'),JSON_ARRAY(),1,0,JSON_ARRAY(),NULL,'NO:16',0,5.00,0,NULL,NULL),
('00000017-0000-4000-8000-000000000017','TEK KİŞİLİK MEZAR','no-17-tek-kisilik-mezar',34000.00,'Kaliteli işçilik ve uygun fiyat.',@CID_MEZAR_MODELLERI,@SC_TEK_MERMER,'https://images.unsplash.com/photo-1559366682-b24d010f6d65?w=800&h=600&fit=crop',NULL,NULL,JSON_ARRAY('https://images.unsplash.com/photo-1559366682-b24d010f6d65?w=800&h=600&fit=crop'),JSON_ARRAY(),1,0,JSON_ARRAY(),NULL,'NO:17',0,5.00,0,NULL,NULL),
('00000018-0000-4000-8000-000000000018','TEK KİŞİLİK BAŞ TAŞI GÖVDE GRANİT MEZAR','no-18-tek-kisilik-bas-tasi-govde-granit-mezar',31500.00,'Granit gövde ve baş taşı kombinasyonu.',@CID_MEZAR_MODELLERI,@SC_TEK_GRANIT,'https://images.unsplash.com/photo-1750832444604-f793c5ad39bb?w=800&h=600&fit=crop',NULL,NULL,JSON_ARRAY('https://images.unsplash.com/photo-1750832444604-f793c5ad39bb?w=800&h=600&fit=crop'),JSON_ARRAY(),1,0,JSON_ARRAY(),NULL,'NO:18',0,5.00,0,NULL,NULL),
('00000019-0000-4000-8000-000000000019','TEK KİŞİLİK GRANİT MEZAR (PREMIUM)','no-19-tek-kisilik-granit-mezar-premium',37000.00,'Premium granit malzeme.',@CID_MEZAR_MODELLERI,@SC_TEK_GRANIT,'https://images.unsplash.com/photo-1675488367379-b2f761bfacef?w=800&h=600&fit=crop',NULL,NULL,JSON_ARRAY('https://images.unsplash.com/photo-1675488367379-b2f761bfacef?w=800&h=600&fit=crop'),JSON_ARRAY(),1,0,JSON_ARRAY(),NULL,'NO:19',0,5.00,0,NULL,NULL),
('00000020-0000-4000-8000-000000000020','TEK KİŞİLİK KOMPLE GRANİT MEZAR','no-20-tek-kisilik-komple-granit-mezar',0.00,'Özel ölçü/tasarım → fiyat için iletişime geçiniz.',@CID_MEZAR_MODELLERI,@SC_TEK_GRANIT,'https://images.unsplash.com/photo-1717399244709-1325f90e1594?w=800&h=600&fit=crop',NULL,NULL,JSON_ARRAY('https://images.unsplash.com/photo-1717399244709-1325f90e1594?w=800&h=600&fit=crop'),JSON_ARRAY(),1,0,JSON_ARRAY(),NULL,'NO:20',0,5.00,0,NULL,NULL),
('00000021-0000-4000-8000-000000000021','İKİ KİŞİLİK BAŞ TAŞI ÖZEL KESİM GRANİT MEZAR YAPIMI','no-21-iki-kisilik-bas-tasi-ozel-kesim-granit-mezar-yapimi',0.00,'Kişiye özel tasarım ve ölçüler.',@CID_MEZAR_MODELLERI,@SC_CIFT_GRANIT,'https://images.unsplash.com/photo-1654866489943-e1c6b3055146?w=800&h=600&fit=crop',NULL,NULL,JSON_ARRAY('https://images.unsplash.com/photo-1654866489943-e1c6b3055146?w=800&h=600&fit=crop'),JSON_ARRAY(),1,0,JSON_ARRAY(),NULL,'NO:21',0,5.00,0,NULL,NULL),
('00000022-0000-4000-8000-000000000022','TEK KİŞİLİK SÜTUNLU GRANİT MERMER MEZAR','no-22-tek-kisilik-sutunlu-granit-mermer-mezar',38500.00,'Granit ve mermer kombinasyonu ile sütunlu tasarım.',@CID_MEZAR_MODELLERI,@SC_SUTUNLU,'https://images.unsplash.com/photo-1594736797933-d0401ba0af65?w=800&h=600&fit=crop',NULL,NULL,JSON_ARRAY('https://images.unsplash.com/photo-1594736797933-d0401ba0af65?w=800&h=600&fit=crop'),JSON_ARRAY(),1,0,JSON_ARRAY(),NULL,'NO:22',0,5.00,0,NULL,NULL)
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
