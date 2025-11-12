-- =============================================================
-- FILE: 0xx_simple_campaigns.sql
-- =============================================================
SET NAMES utf8mb4;

DROP TABLE IF EXISTS `simple_campaigns`;

CREATE TABLE `simple_campaigns` (
  `id`                CHAR(36)       NOT NULL,
  `title`             VARCHAR(255)   NOT NULL,
  `description`       VARCHAR(500)   NOT NULL,

  -- Tek görsel (storage pattern)
  `image_url`         VARCHAR(500)   DEFAULT NULL,
  `storage_asset_id`  CHAR(36)       DEFAULT NULL,
  `alt`               VARCHAR(255)   DEFAULT NULL,

  -- SEO JSON (Drizzle: longtext)
  `seo_keywords`      LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL
                      CHECK (JSON_VALID(`seo_keywords`)),

  `is_active`         TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,

  `created_at`        DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`        DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  KEY `simple_campaigns_active_idx`  (`is_active`),
  KEY `simple_campaigns_asset_idx`   (`storage_asset_id`),
  KEY `simple_campaigns_created_idx` (`created_at`),
  KEY `simple_campaigns_updated_idx` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================== SEED =====================
SET @cmp1 := UUID();
SET @cmp2 := UUID();
SET @cmp3 := UUID();

INSERT INTO `simple_campaigns`
(`id`,`title`,`description`,`image_url`,`storage_asset_id`,`alt`,`seo_keywords`,`is_active`,`created_at`,`updated_at`)
VALUES
(@cmp1,'Yazlık Mezar Bakım Kampanyası',
 'Yaz aylarında mezarlarınızın bakımı için özel indirimli paketlerimizden faydalanın!',
 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1762878680/custom_pages/609da17f-bee8-11f0-947f-e7685059cf04/cover/mezartasi.png',
 NULL, NULL,
 JSON_ARRAY(
   'yazlık mezar bakımı','mezar temizlik hizmeti','yaz bakım kampanyası','mezar onarımı',
   'istanbul mezar bakımı','mezar restorasyon','mezar çiçeklendirme','mezar toprak doldurumu',
   'profesyonel mezar bakımı'
 ),
 1,'2024-06-01 00:00:00.000','2024-06-01 00:00:00.000'),

(@cmp2,'Mermer Mezar Taşları %25 İndirim',
 'Kaliteli mermer mezar taşlarında özel indirim fırsatı! Sınırlı süreyle geçerli.',
 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1762878680/custom_pages/609da17f-bee8-11f0-947f-e7685059cf04/cover/mezartasi.png',
 NULL, NULL,
 JSON_ARRAY(
   'mermer mezar taşı','mermer indirim','doğal mermer mezar','kaliteli mermer taşı',
   'mermer mezar modelleri','istanbul mermer mezar','mermer taş işçiliği',
   'özel mermer tasarım','mermer mezar fiyatları'
 ),
 1,'2024-05-01 00:00:00.000','2024-05-01 00:00:00.000'),

(@cmp3,'Aile Mezarı Özel Paket Kampanyası',
 'Aile mezarları için komplet çözüm paketi! İnşaat, taş işçiliği ve peyzaj dahil.',
 'https://res.cloudinary.com/dbozv7wqd/image/upload/v1762878680/custom_pages/609da17f-bee8-11f0-947f-e7685059cf04/cover/mezartasi.png',
 NULL, NULL,
 JSON_ARRAY(
   'aile mezarı','büyük mezar yapımı','çoklu mezar inşaatı','aile mezar modelleri',
   'geniş mezar tasarımı','istanbul aile mezarı','mezar kompleksi',
   'büyük mezar taşı','aile mezar fiyatları'
 ),
 1,'2024-04-01 00:00:00.000','2024-04-01 00:00:00.000');
