-- 0xx_slider.sql
DROP TABLE IF EXISTS `slider`;
CREATE TABLE `slider` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid`              CHAR(36)     NOT NULL,
  `name`              VARCHAR(255) NOT NULL,
  `slug`              VARCHAR(255) NOT NULL,
  `description`       LONGTEXT,

  `image_url`         LONGTEXT,
  `storage_asset_id`  CHAR(36),
  `alt`               VARCHAR(255),
  `button_text`       VARCHAR(100),
  `button_link`       VARCHAR(255),

  `featured`          TINYINT(1)   NOT NULL DEFAULT 0,
  `is_active`         TINYINT(1)   NOT NULL DEFAULT 1,

  `display_order`     INT UNSIGNED NOT NULL DEFAULT 0,

  `created_at`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_slider_slug` (`slug`),
  UNIQUE KEY `uniq_slider_uuid` (`uuid`),
  KEY `idx_slider_active` (`is_active`),
  KEY `idx_slider_order`  (`display_order`),
  KEY `idx_slider_storage`(`storage_asset_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `slider`
(`id`,`uuid`,`name`,`slug`,`description`,`image_url`,`storage_asset_id`,`alt`,`button_text`,`button_link`,
 `featured`,`is_active`,`display_order`,`created_at`,`updated_at`)
VALUES
-- slide-1
(1, UUID(),
 'İstanbul''un En Deneyimli Mezar Yapım Firması',
 'istanbulun-en-deneyimli-mezar-yapim-firmasi',
 '25 yıllık deneyimimizle kaliteli mezar yapımı, mezar taşı ve restorasyon hizmetleri',
 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=600&fit=crop',
 NULL,
 'İstanbul mezar yapım firması - Kaliteli mezar modelleri',
 'Hemen Arayın',
 'tel:05334838971',
 0, 1, 1,
 '2024-01-20 00:00:00.000','2024-01-20 00:00:00.000'),

-- slide-2
(2, UUID(),
 'Premium Mermer ve Granit Mezar Modelleri',
 'premium-mermer-ve-granit-mezar-modelleri',
 'A+ kalite doğal taşlar, özel tasarım ve profesyonel işçilik garantisi',
 'https://images.unsplash.com/photo-1566737236500-c8ac43014a8e?w=1200&h=600&fit=crop',
 NULL,
 'Premium mermer granit mezar modelleri',
 'Modelleri İncele',
 'models',
 0, 1, 2,
 '2024-01-21 00:00:00.000','2024-01-21 00:00:00.000'),

-- slide-3
(3, UUID(),
 'Ücretsiz Keşif ve Proje Çizimi',
 'ucretsiz-kesif-ve-proje-cizimi',
 'Mezar projeleriniz için profesyonel keşif hizmeti ve detaylı fiyat teklifi',
 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=600&fit=crop',
 NULL,
 'Ücretsiz mezar keşif hizmeti',
 'Keşif Talep Et',
 'contact',
 0, 1, 3,
 '2024-01-22 00:00:00.000','2024-01-22 00:00:00.000'),

-- slide-4
(4, UUID(),
 'Mezar Onarım ve Restorasyon Hizmetleri',
 'mezar-onarim-ve-restorasyon-hizmetleri',
 'Çökmüş, çatlak veya eski mezarların profesyonel onarımı ve yenilenmesi',
 'https://images.unsplash.com/photo-1544024994-27c5b7b22c55?w=1200&h=600&fit=crop',
 NULL,
 'Mezar onarım restorasyon hizmetleri',
 'Onarım Talebi',
 'contact',
 0, 0, 4,
 '2024-01-23 00:00:00.000','2024-01-23 00:00:00.000'),

-- slide-5
(5, UUID(),
 'Mezar Çiçeklendirme ve Peyzaj Hizmetleri',
 'mezar-ciceklendirme-ve-peyzaj-hizmetleri',
 'Mezar çevresi düzenleme, çiçeklendirme ve sürekli bakım hizmetleri',
 'https://images.unsplash.com/photo-1589677216159-5c27977717ed?w=1200&h=600&fit=crop',
 NULL,
 'Mezar çiçeklendirme peyzaj hizmetleri',
 'Bakım Hizmeti',
 'gardening',
 0, 0, 5,
 '2024-01-24 00:00:00.000','2024-01-24 00:00:00.000');
