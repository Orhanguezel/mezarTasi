-- 0xx_accessories.sql
DROP TABLE IF EXISTS `accessories`;
CREATE TABLE `accessories` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid`              CHAR(36)     NOT NULL,
  `name`              VARCHAR(255) NOT NULL,
  `slug`              VARCHAR(255) NOT NULL,
  `category`          VARCHAR(16)  NOT NULL,
  `material`          VARCHAR(127) NOT NULL,
  `price`             VARCHAR(127) NOT NULL,
  `description`       LONGTEXT,
  `image_url`         LONGTEXT,
  `storage_asset_id`  CHAR(36),

  `featured`          TINYINT(1)   NOT NULL DEFAULT 0,
  `is_active`         TINYINT(1)   NOT NULL DEFAULT 1,

  `dimensions`        VARCHAR(127),
  `weight`            VARCHAR(127),
  `thickness`         VARCHAR(127),
  `finish`            VARCHAR(127),
  `warranty`          VARCHAR(127),
  `installation_time` VARCHAR(127),

  `display_order`     INT UNSIGNED NOT NULL DEFAULT 0,

  `created_at`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_accessories_slug` (`slug`),
  UNIQUE KEY `uniq_accessories_uuid` (`uuid`),
  KEY `idx_accessories_category` (`category`),
  KEY `idx_accessories_active` (`is_active`),
  KEY `idx_accessories_order`  (`display_order`),
  KEY `idx_accessories_storage`(`storage_asset_id`),
  KEY `idx_accessories_created`(`created_at`),
  KEY `idx_accessories_updated`(`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `accessories`
(`id`,`uuid`,`name`,`slug`,`category`,`material`,`price`,`description`,`image_url`,`storage_asset_id`,
 `featured`,`is_active`,`dimensions`,`weight`,`thickness`,`finish`,`warranty`,`installation_time`,
 `display_order`,`created_at`,`updated_at`)
VALUES
(1, UUID(), 'Klasik Granit Şuluk Modeli','klasik-granit-suluk-modeli','suluk','Siyah Granit','Fiyat İçin Arayınız',
 'Geleneksel tasarım granit şuluk modeli, dayanıklı ve estetik',
 'https://images.unsplash.com/photo-1589894403421-1c4b0c6b3b6e?w=400&h=300&fit=crop', NULL,
 1,1,'30cm x 15cm x 40cm','25 kg','4 cm','Parlak Granit Cilalı','5 Yıl Garanti','1 Gün',
 1,'2024-01-10 00:00:00.000','2024-01-10 00:00:00.000'),

(2, UUID(), 'Mermer Şuluk Modeli','mermer-suluk-modeli','suluk','Beyaz Mermer','Fiyat İçin Arayınız',
 'Beyaz mermer malzemeden üretilen zarif şuluk modeli',
 'https://images.unsplash.com/photo-1578948856697-db91d246b7b8?w=400&h=300&fit=crop', NULL,
 0,1,'32cm x 16cm x 42cm','28 kg','5 cm','Doğal Mermer Cilalı','8 Yıl Garanti','1 Gün',
 2,'2024-01-11 00:00:00.000','2024-01-11 00:00:00.000'),

(3, UUID(), 'Özel Tasarım Şuluk','ozel-tasarim-suluk','suluk','Granit + Süsleme','Fiyat İçin Arayınız',
 'Özel desenli ve süslemeli şuluk modeli',
 'https://images.unsplash.com/photo-1589894403421-1c4b0c6b3b6e?w=400&h=300&fit=crop', NULL,
 0,1,'35cm x 18cm x 45cm','32 kg','6 cm','Özel İşçilik Süsleme','10 Yıl Garanti','2 Gün',
 3,'2024-01-12 00:00:00.000','2024-01-12 00:00:00.000'),

(4, UUID(), 'Doruk Sütun Modeli','doruk-sutun-modeli','sutun','Beyaz Mermer','Fiyat İçin Arayınız',
 'Klasik sütun tasarımı, mermer malzemeden üretilmiş',
 'https://images.unsplash.com/photo-1578948854345-1b9b2e5f3b9c?w=400&h=300&fit=crop', NULL,
 1,1,'20cm x 20cm x 120cm','85 kg','20 cm','Klasik Mermer Cilalı','15 Yıl Garanti','1-2 Gün',
 4,'2024-01-13 00:00:00.000','2024-01-13 00:00:00.000'),

(5, UUID(), 'Modern Granit Sütun','modern-granit-sutun','sutun','Siyah Granit','Fiyat İçin Arayınız',
 'Modern tasarım granit sütun modeli',
 'https://images.unsplash.com/photo-1578948856894-9f5f2e5c8b2a?w=400&h=300&fit=crop', NULL,
 0,1,'25cm x 25cm x 140cm','95 kg','25 cm','Modern Granit İşçilik','12 Yıl Garanti','2 Gün',
 5,'2024-01-14 00:00:00.000','2024-01-14 00:00:00.000'),

(6, UUID(), 'Süslü Sütun Modeli','suslu-sutun-modeli','sutun','Mermer + Süsleme','Fiyat İçin Arayınız',
 'Oymalı ve süslemeli sütun modeli',
 'https://images.unsplash.com/photo-1578948856893-2f3e2c5b8a1b?w=400&h=300&fit=crop', NULL,
 0,1,'22cm x 22cm x 130cm','90 kg','22 cm','El İşçiliği Süsleme','20 Yıl Garanti','2-3 Gün',
 6,'2024-01-15 00:00:00.000','2024-01-15 00:00:00.000'),

(7, UUID(), 'Çiçek Vazo Modeli','cicek-vazo-modeli','vazo','Granit','Fiyat İçin Arayınız',
 'Mezar için özel tasarım çiçek vazosu',
 'https://images.unsplash.com/photo-1589894403421-1c4b0c6b3b6e?w=400&h=300&fit=crop', NULL,
 1,1,'25cm x 25cm x 35cm','15 kg','3 cm','Mat Granit Yüzey','5 Yıl Garanti','1 Gün',
 7,'2024-01-16 00:00:00.000','2024-01-16 00:00:00.000'),

(8, UUID(), 'Mermer Vazo Modeli','mermer-vazo-modeli','vazo','Beyaz Mermer','Fiyat İçin Arayınız',
 'Zarif mermer vazo modeli',
 'https://images.unsplash.com/photo-1578948856697-db91d246b7b8?w=400&h=300&fit=crop', NULL,
 0,1,'28cm x 28cm x 40cm','18 kg','4 cm','Parlak Mermer Cilalı','8 Yıl Garanti','1 Gün',
 8,'2024-01-17 00:00:00.000','2024-01-17 00:00:00.000'),

(9, UUID(), 'Süslü Vazo Modeli','suslu-vazo-modeli','vazo','Granit + Oyma','Fiyat İçin Arayınız',
 'El oyması süslemeli vazo modeli',
 'https://images.unsplash.com/photo-1578948854345-1b9b2e5f3b9c?w=400&h=300&fit=crop', NULL,
 0,1,'30cm x 30cm x 45cm','22 kg','5 cm','Oymalı Sanat İşçiliği','10 Yıl Garanti','1-2 Gün',
 9,'2024-01-18 00:00:00.000','2024-01-18 00:00:00.000');
