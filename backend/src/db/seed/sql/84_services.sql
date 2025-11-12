DROP TABLE IF EXISTS `services`;
CREATE TABLE `services` (
  `id`               CHAR(36)      NOT NULL,
  `slug`             VARCHAR(255)  NOT NULL,
  `name`             VARCHAR(255)  NOT NULL,

  `type`             VARCHAR(32)   NOT NULL DEFAULT 'other',
  `category`         VARCHAR(64)   NOT NULL DEFAULT 'general',

  `material`         VARCHAR(255)           DEFAULT NULL,
  `price`            VARCHAR(128)           DEFAULT NULL,
  `description`      TEXT                   DEFAULT NULL,

  `featured`         TINYINT(1) UNSIGNED    NOT NULL DEFAULT 0,
  `is_active`        TINYINT(1) UNSIGNED    NOT NULL DEFAULT 1,
  `display_order`    INT UNSIGNED           NOT NULL DEFAULT 1,

  -- ✅ Görsel alanları (şemayla aynı)
  `image_url`        VARCHAR(500)           DEFAULT NULL,
  `image_asset_id`   CHAR(36)               DEFAULT NULL,
  `alt`              VARCHAR(255)           DEFAULT NULL,

  -- legacy
  `featured_image`   VARCHAR(500)           DEFAULT NULL,

  -- Gardening
  `area`             VARCHAR(64)            DEFAULT NULL,
  `duration`         VARCHAR(64)            DEFAULT NULL,
  `maintenance`      VARCHAR(64)            DEFAULT NULL,
  `season`           VARCHAR(64)            DEFAULT NULL,

  -- Soil
  `soil_type`        VARCHAR(128)           DEFAULT NULL,
  `thickness`        VARCHAR(64)            DEFAULT NULL,
  `equipment`        VARCHAR(128)           DEFAULT NULL,

  -- Common
  `warranty`         VARCHAR(128)           DEFAULT NULL,
  `includes`         VARCHAR(255)           DEFAULT NULL,

  `created_at`       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_services_slug`(`slug`),

  KEY `services_active_idx`(`is_active`),
  KEY `services_order_idx`(`display_order`),
  KEY `services_type_idx`(`type`),
  KEY `services_category_idx`(`category`),
  KEY `services_image_asset_idx`(`image_asset_id`),
  KEY `services_created_idx`(`created_at`),
  KEY `services_updated_idx`(`updated_at`),
  KEY `services_active_type_order_idx`(`is_active`,`type`,`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `services`
(`id`,`slug`,`name`,`type`,`category`,`material`,`price`,`description`,
 `featured`,`is_active`,`display_order`,
 `featured_image`,`image_url`,`image_asset_id`,`alt`,
 `area`,`duration`,`maintenance`,`season`,
 `soil_type`,`thickness`,`equipment`,
 `warranty`,`includes`,
 `created_at`,`updated_at`)
VALUES
-- =======================
-- GARDENING (Çiçeklendirme)
-- =======================
(UUID(),'mevsimlik-cicek-ekimi','Mevsimlik Çiçek Ekimi','gardening','mevsimlik','Mevsim Çiçekleri','Fiyat İçin Arayınız',
 'Mezar alanınıza mevsimlik çiçek ekimi ve düzenli bakım hizmeti',1,1,1,
 NULL,'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',NULL,'Mevsimlik çiçek ekimi',
 '2-5 m²','3-4 Ay','Haftalık Bakım','Mevsimlik',
 NULL,NULL,NULL,
 'Çiçek Sağlığı Garantisi','Çiçek + Toprak + Ekim + Bakım',
 '2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

(UUID(),'bahar-cicekleri-duzenlemesi','Bahar Çiçekleri Düzenlemesi','gardening','mevsimlik','Bahar Çiçekleri','Fiyat İçin Arayınız',
 'Lale, sümbül ve nergis gibi bahar çiçekleri ile düzenleme',0,1,2,
 NULL,'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=300&fit=crop',NULL,'Bahar çiçekleri düzenlemesi',
 '1-3 m²','2-3 Ay','Haftalık Bakım','Bahar',
 NULL,NULL,NULL,
 'Çiçek Sağlığı Garantisi','Soğan + Toprak + Ekim + Bakım',
 '2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

(UUID(),'yaz-cicekleri-ekimi','Yaz Çiçekleri Ekimi','gardening','mevsimlik','Yaz Çiçekleri','Fiyat İçin Arayınız',
 'Petunya, begonya ve diğer yaz çiçekleri ile renkli düzenleme',0,1,3,
 NULL,'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop',NULL,'Yaz çiçekleri ekimi',
 '2-4 m²','4-5 Ay','Haftalık Bakım','Yaz',
 NULL,NULL,NULL,
 'Çiçek Sağlığı Garantisi','Fide + Toprak + Ekim + Bakım',
 '2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

(UUID(),'cim-ekimi-ve-duzenlemesi','Çim Ekimi ve Düzenlemesi','gardening','surekli','Çim + Bitki','Fiyat İçin Arayınız',
 'Mezar alanında çim ekimi ve sürekli yeşil alan oluşturma',1,1,4,
 NULL,'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',NULL,'Çim ekimi ve düzenlemesi',
 '3-10 m²','Sürekli','Aylık Bakım','Tüm Mevsim',
 NULL,NULL,NULL,
 '1 Yıl Çim Garantisi','Çim Tohumu + Toprak + Ekim + Bakım',
 '2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

(UUID(),'sus-bitkisi-dikimi','Süs Bitkisi Dikimi','gardening','surekli','Süs Bitkileri','Fiyat İçin Arayınız',
 'Dayanıklı süs bitkileri ile kalıcı yeşil alan oluşturma',0,1,5,
 NULL,'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',NULL,'Süs bitkisi dikimi',
 '2-6 m²','Sürekli','Aylık Bakım','Tüm Mevsim',
 NULL,NULL,NULL,
 '6 Ay Bitki Garantisi','Bitki + Toprak + Dikim + Bakım',
 '2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

(UUID(),'cali-ve-agac-dikimi','Çalı ve Ağaç Dikimi','gardening','surekli','Ağaç + Çalı','Fiyat İçin Arayınız',
 'Küçük ağaç ve çalı dikimi ile doğal gölgelik alan',0,1,6,
 NULL,'https://images.unsplash.com/photo-1574263867128-dacbc0fc09ce?w=400&h=300&fit=crop',NULL,'Çalı ve ağaç dikimi',
 '1-4 m²','Sürekli','Mevsimlik Bakım','Tüm Mevsim',
 NULL,NULL,NULL,
 '1 Yıl Ağaç Garantisi','Ağaç/Çalı + Toprak + Dikim + Bakım',
 '2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

(UUID(),'ozel-peyzaj-tasarimi','Özel Peyzaj Tasarımı','gardening','ozel','Karma Peyzaj','Fiyat İçin Arayınız',
 'Özel tasarım peyzaj düzenlemesi ve sürekli bakım hizmeti',1,1,7,
 NULL,'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',NULL,'Özel peyzaj tasarımı',
 '5-15 m²','Sürekli','Haftalık Bakım','Tüm Mevsim',
 NULL,NULL,NULL,
 '2 Yıl Peyzaj Garantisi','Tasarım + Malzeme + Uygulama + Bakım',
 '2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

(UUID(),'cicek-bahcesi-duzenlemesi','Çiçek Bahçesi Düzenlemesi','gardening','ozel','Çiçek Bahçesi','Fiyat İçin Arayınız',
 'Karışık çiçek türleri ile özel bahçe düzenlemesi',0,1,8,
 NULL,'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop',NULL,'Çiçek bahçesi düzenlemesi',
 '3-8 m²','Mevsimlik','Haftalık Bakım','Bahar-Yaz',
 NULL,NULL,NULL,
 'Çiçek Sağlığı Garantisi','Çiçek + Tasarım + Ekim + Bakım',
 '2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

(UUID(),'tema-peyzaj-duzenlemesi','Tema Peyzaj Düzenlemesi','gardening','ozel','Tema Bitkileri','Fiyat İçin Arayınız',
 'Özel tema ile (Akdeniz, Japon vb.) peyzaj düzenlemesi',0,1,9,
 NULL,'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',NULL,'Tema peyzaj düzenlemesi',
 '4-12 m²','Sürekli','Aylık Bakım','Tüm Mevsim',
 NULL,NULL,NULL,
 '1 Yıl Peyzaj Garantisi','Tema Tasarım + Bitki + Uygulama + Bakım',
 '2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

-- =======================
-- SOIL (Toprak Doldurumu)
-- =======================
(UUID(),'standart-toprak-doldurumu','Standart Toprak Doldurumu','soil','temel','Kaliteli Bahçe Toprağı','Fiyat İçin Arayınız',
 'Mezar alanının temel toprak doldurumu ve düzeltme işlemi',1,1,1,
 NULL,'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',NULL,'Standart toprak doldurumu',
 '2-10 m²',NULL,NULL,NULL,
 'Kaliteli Bahçe Toprağı','20-30 cm','El Aletleri + Küçük Makine',
 '6 Ay Çöküntü Garantisi','Toprak + Nakliye + İşçilik + Düzeltme',
 '2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

(UUID(),'genis-alan-toprak-dolumu','Geniş Alan Toprak Dolumu','soil','temel','Büyük Hacim Toprak','Fiyat İçin Arayınız',
 'Geniş mezar alanları için büyük hacimli toprak doldurumu',0,1,2,
 NULL,'https://images.unsplash.com/photo-1574263867128-dacbc0fc09ce?w=400&h=300&fit=crop',NULL,'Geniş alan toprak dolumu',
 '10-50 m²',NULL,NULL,NULL,
 'Kaliteli Karma Toprak','30-50 cm','Makine Destekli',
 '1 Yıl Çöküntü Garantisi','Toprak + Nakliye + Makine + İşçilik',
 '2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

(UUID(),'hizli-toprak-doldurumu','Hızlı Toprak Doldurumu','soil','temel','Hazır Karışım Toprak','Fiyat İçin Arayınız',
 'Acil ihtiyaçlar için hızlı toprak doldurumu hizmeti',0,1,3,
 NULL,'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',NULL,'Hızlı toprak doldurumu',
 '1-5 m²',NULL,NULL,NULL,
 'Hazır Karışım','15-25 cm','El Aletleri',
 '3 Ay Garanti','Toprak + Hızlı Nakliye + İşçilik',
 '2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

(UUID(),'bitki-toprak-karisimi','Bitki Toprak Karışımı','soil','ozel','Bitki Toprak + Gübre','Fiyat İçin Arayınız',
 'Çiçek ve bitki ekimi için özel toprak karışımı',1,1,4,
 NULL,'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',NULL,'Bitki toprak karışımı',
 '2-8 m²',NULL,NULL,NULL,
 'Bitki Toprağı + Organik Gübre','25-35 cm','El Aletleri + Karıştırma',
 '1 Yıl Bitki Garantisi','Özel Toprak + Gübre + Karıştırma + İşçilik',
 '2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

(UUID(),'drenajli-toprak-sistemi','Drenajlı Toprak Sistemi','soil','ozel','Drenaj + Toprak','Fiyat İçin Arayınız',
 'Su baskını önleyici drenaj sistemi ile toprak doldurumu',0,1,5,
 NULL,'https://images.unsplash.com/photo-1574263867128-dacbc0fc09ce?w=400&h=300&fit=crop',NULL,'Drenajlı toprak sistemi',
 '3-12 m²',NULL,NULL,NULL,
 'Drenajlı Toprak Karışımı','35-45 cm','Drenaj Sistemi + Makine',
 '2 Yıl Drenaj Garantisi','Drenaj + Toprak + Sistem + İşçilik',
 '2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

(UUID(),'premium-toprak-karisimi','Premium Toprak Karışımı','soil','ozel','Premium Bahçe Toprağı','Fiyat İçin Arayınız',
 'En kaliteli malzemelerle hazırlanmış premium toprak',0,1,6,
 NULL,'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',NULL,'Premium toprak karışımı',
 '2-6 m²',NULL,NULL,NULL,
 'Premium Organik Toprak','30-40 cm','Özel Karıştırma Aletleri',
 '2 Yıl Kalite Garantisi','Premium Toprak + Organik Gübre + Özel İşçilik',
 '2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

(UUID(),'cokmus-alan-restorasyonu','Çökmüş Alan Restorasyonu','soil','restorasyon','Restorasyon Toprağı','Fiyat İçin Arayınız',
 'Çökmüş ve bozulmuş mezar alanlarının tamiri',1,1,7,
 NULL,'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop',NULL,'Çökmüş alan restorasyonu',
 '3-15 m²',NULL,NULL,NULL,
 'Sıkıştırılmış Kaliteli Toprak','40-60 cm','Ağır Makine + Sıkıştırma',
 '2 Yıl Restorasyon Garantisi','Kazı + Toprak + Sıkıştırma + Düzeltme',
 '2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

(UUID(),'eski-mezar-yenileme','Eski Mezar Yenileme','soil','restorasyon','Yenileme Toprağı','Fiyat İçin Arayınız',
 'Eski mezarların toprak yenileme ve düzeltme işlemi',0,1,8,
 NULL,'https://images.unsplash.com/photo-1574263867128-dacbc0fc09ce?w=400&h=300&fit=crop',NULL,'Eski mezar yenileme',
 '4-20 m²',NULL,NULL,NULL,
 'Kaliteli Yenileme Toprağı','30-50 cm','Tam Donanımlı Makine',
 '18 Ay Yenileme Garantisi','Eski Toprak Kaldırma + Yeni Toprak + İşçilik',
 '2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'),

(UUID(),'tam-restorasyon-paketi','Tam Restorasyon Paketi','soil','restorasyon','Komple Restorasyon','Fiyat İçin Arayınız',
 'Kapsamlı mezar alanı restorasyonu ve yenileme',0,1,9,
 NULL,'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop',NULL,'Tam restorasyon paketi',
 '5-25 m²',NULL,NULL,NULL,
 'Çoklu Toprak Sistemleri','50-80 cm','Tam Profesyonel Ekipman',
 '3 Yıl Kapsamlı Garanti','Kazı + Drenaj + Toprak + Düzenleme + Garanti',
 '2024-01-01 00:00:00.000','2024-01-01 00:00:00.000')
ON DUPLICATE KEY UPDATE
  `name`=VALUES(`name`),
  `type`=VALUES(`type`),
  `category`=VALUES(`category`),
  `material`=VALUES(`material`),
  `price`=VALUES(`price`),
  `description`=VALUES(`description`),
  `featured`=VALUES(`featured`),
  `is_active`=VALUES(`is_active`),
  `display_order`=VALUES(`display_order`),
  `featured_image`=VALUES(`featured_image`),
  `image_url`=VALUES(`image_url`),
  `image_asset_id`=VALUES(`image_asset_id`),
  `alt`=VALUES(`alt`),
  `area`=VALUES(`area`),
  `duration`=VALUES(`duration`),
  `maintenance`=VALUES(`maintenance`),
  `season`=VALUES(`season`),
  `soil_type`=VALUES(`soil_type`),
  `thickness`=VALUES(`thickness`),
  `equipment`=VALUES(`equipment`),
  `warranty`=VALUES(`warranty`),
  `includes`=VALUES(`includes`),
  `updated_at`=VALUES(`updated_at`);
