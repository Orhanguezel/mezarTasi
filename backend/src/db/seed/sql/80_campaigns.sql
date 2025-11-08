-- Tam kurulum (no ALTER): tabloyu düşür → yeniden oluştur → seed

SET NAMES utf8mb4;

DROP TABLE IF EXISTS `simple_campaigns`;

-- ===================== simple_campaigns =====================
CREATE TABLE `simple_campaigns` (
  `id`                CHAR(36)     NOT NULL,
  `title`             VARCHAR(255) NOT NULL,
  `description`       VARCHAR(500) NOT NULL,

  -- Tek görsel (services pattern)
  `image_url`         VARCHAR(500)     NULL,
  `storage_asset_id`  CHAR(36)         NULL,
  `alt`               VARCHAR(255)     NULL,

  -- SEO JSON
  `seo_keywords`      LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (JSON_VALID(`seo_keywords`)),

  `is_active`         TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  `meta_title`        VARCHAR(255)  DEFAULT NULL,
  `meta_description`  VARCHAR(500)  DEFAULT NULL,

  PRIMARY KEY (`id`),
  KEY `simple_campaigns_active_idx` (`is_active`),
  KEY `simple_campaigns_asset_idx` (`storage_asset_id`),
  KEY `simple_campaigns_created_idx` (`created_at`),
  KEY `simple_campaigns_updated_idx` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================== SEED =====================
SET @cmp1 := UUID();
SET @cmp2 := UUID();
SET @cmp3 := UUID();

INSERT INTO `simple_campaigns`
(`id`,`title`,`description`,`image_url`,`storage_asset_id`,`alt`,`seo_keywords`,`is_active`,`created_at`,`updated_at`,`meta_title`,`meta_description`)
VALUES
(@cmp1,'Yazlık Mezar Bakım Kampanyası','Yaz aylarında mezarlarınızın bakımı için özel indirimli paketlerimizden faydalanın!',
 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=1200&h=630&fit=crop',
 NULL, NULL,
 JSON_ARRAY('yazlık mezar bakımı','mezar temizlik hizmeti','yaz bakım kampanyası','mezar onarımı','istanbul mezar bakımı','mezar restorasyon','mezar çiçeklendirme','mezar toprak doldurumu','profesyonel mezar bakımı'),
 1,'2024-06-01 00:00:00.000','2024-06-01 00:00:00.000',
 'Yazlık Mezar Bakım Kampanyası - Mezarisim.com','Yaz aylarında mezarlarınızın bakımı için özel indirimli paketler. Mezar temizlik, onarım, çiçeklendirme hizmetleri.'
),
(@cmp2,'Mermer Mezar Taşları %25 İndirim','Kaliteli mermer mezar taşlarında özel indirim fırsatı! Sınırlı süreyle geçerli.',
 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=630&fit=crop',
 NULL, NULL,
 JSON_ARRAY('mermer mezar taşı','mermer indirim','doğal mermer mezar','kaliteli mermer taşı','mermer mezar modelleri','istanbul mermer mezar','mermer taş işçiliği','özel mermer tasarım','mermer mezar fiyatları'),
 1,'2024-05-01 00:00:00.000','2024-05-01 00:00:00.000',
 'Mermer Mezar Taşları %25 İndirim - Mezarisim.com','Kaliteli mermer mezar taşlarında özel indirim fırsatı. Doğal mermer, profesyonel işçilik, sınırlı süre.'
),
(@cmp3,'Aile Mezarı Özel Paket Kampanyası','Aile mezarları için komplet çözüm paketi! İnşaat, taş işçiliği ve peyzaj dahil.',
 'https://images.unsplash.com/photo-1606761503207-8b1ff1e11610?w=1200&h=630&fit=crop',
 NULL, NULL,
 JSON_ARRAY('aile mezarı','büyük mezar yapımı','çoklu mezar inşaatı','aile mezar modelleri','geniş mezar tasarımı','istanbul aile mezarı','mezar kompleksi','büyük mezar taşı','aile mezar fiyatları'),
 1,'2024-04-01 00:00:00.000','2024-04-01 00:00:00.000',
 'Aile Mezarı Özel Paket Kampanyası - Mezarisim.com','Aile mezarları için komplet çözüm paketi. İnşaat, taş işçiliği ve peyzaj dahil.'
);
