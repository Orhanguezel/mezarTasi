-- 82_recent_works.sql
DROP TABLE IF EXISTS `recent_works`;
CREATE TABLE `recent_works` (
  `id`              CHAR(36)      NOT NULL,
  `title`           VARCHAR(255)  NOT NULL,
  `slug`            VARCHAR(255)  NOT NULL,
  `description`     VARCHAR(500)  NOT NULL,

  `image_url`       VARCHAR(500)  DEFAULT NULL,
  `storage_asset_id` CHAR(36)     DEFAULT NULL,
  `alt`             VARCHAR(255)  DEFAULT NULL,

  `category`        VARCHAR(255)  NOT NULL,
  `seo_keywords`    LONGTEXT      NOT NULL,

  `date`            VARCHAR(64)   NOT NULL,  -- örn: '2024'
  `location`        VARCHAR(255)  NOT NULL,
  `material`        VARCHAR(255)  NOT NULL,
  `price`           VARCHAR(255)  DEFAULT NULL,

  `details`         JSON          NOT NULL,

  `is_active`       TINYINT(1)    NOT NULL DEFAULT 1,
  `display_order`   INT           NOT NULL DEFAULT 0,

  `created_at`      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_recent_works_slug` (`slug`),
  KEY `recent_works_category_idx` (`category`),
  KEY `recent_works_active_idx` (`is_active`),
  KEY `recent_works_updated_idx` (`updated_at`),
  KEY `recent_works_display_idx` (`display_order`),
  KEY `recent_works_asset_idx` (`storage_asset_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `recent_works`
(`id`,`title`,`slug`,`description`,
 `image_url`,`storage_asset_id`,`alt`,
 `category`,`seo_keywords`,
 `date`,`location`,`material`,`price`,
 `details`,
 `is_active`,`display_order`,`created_at`,`updated_at`)
VALUES
(
  UUID(),
  'Şile Mezar Yapım İşleri / Ağva mezar yapımı',
  'sile-mezar-yapim-isleri-agva-mezar-yapimi',
  'Şile Mezar Yapım / Şile Mermer Mezar Fiyatları Şile Mezar Yapım işleri / Ağva mezar yapımı / şile mezar modelleri',
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
  NULL,
  NULL,
  'Şile Mezar Yapım',
  '["şile mezar yapım","şile mezar modelleri","şile mezar fiyatları","şile köy mezarlığı","şile mermer mezar yapım","şile-ağva mezar yapımı"]',
  '2024',
  'Şile, İstanbul',
  'Granit ve Mermer',
  NULL,
  JSON_OBJECT(
    'dimensions','200x100 cm',
    'workTime','3 gün',
    'specialFeatures', JSON_ARRAY('Özel gravür işleme','Dayanıklı malzeme','Profesyonel montaj'),
    'customerReview','Çok memnun kaldık, titiz çalışma için teşekkürler.'
  ),
  1,1,'2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'
),
(
  UUID(),
  'şile mezar yapım / şile mezar modelleri / şile mezar fiyatları',
  'sile-mezar-yapim-sile-mezar-modelleri-sile-mezar-fiyatlari',
  'şile mezar yapım / şile mezar modelleri / şile mezar fiyatları / şile köy mezarlığı / şile mermer mezar yapım / şile mermer mezar fiyatları / şile mezar modelleri',
  'https://images.unsplash.com/photo-1620121684840-17e4edc4a24c?w=800&h=600&fit=crop',
  NULL,
  NULL,
  'Şile Mezar Modelleri',
  '["şile mezar yapım","şile mezar modelleri","şile mezar fiyatları","şile köy mezarlığı","şile mermer mezar yapım","şile mermer mezar fiyatları","şile mezar modelleri"]',
  '2024',
  'Şile, İstanbul',
  'Mermer',
  NULL,
  JSON_OBJECT(
    'dimensions','180x90 cm',
    'workTime','2 gün',
    'specialFeatures', JSON_ARRAY('Klasik tasarım','El işçiliği','Özel yazıt')
  ),
  1,2,'2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'
),
(
  UUID(),
  'ucuz mezar modelleri / mezar fiyatları / İstanbul Mezar Yapım İşleri',
  'ucuz-mezar-modelleri-mezar-fiyatlari-istanbul-mezar-yapim-isleri',
  'ucuz mezar modelleri / mezar fiyatları / İstanbul Mezar Yapım İşleri',
  'https://images.unsplash.com/photo-1589578228447-e1a4e481c6c8?w=800&h=600&fit=crop',
  NULL,
  NULL,
  'Uygun Fiyatlı Modeller',
  '["ucuz mezar modelleri","mezar fiyatları","İstanbul Mezar Yapım İşleri"]',
  '2024',
  'İstanbul',
  'Granit',
  'Uygun fiyat seçenekleri',
  JSON_OBJECT(
    'dimensions','160x80 cm',
    'workTime','1-2 gün',
    'specialFeatures', JSON_ARRAY('Ekonomik çözüm','Kaliteli malzeme','Hızlı teslimat')
  ),
  1,3,'2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'
),
(
  UUID(),
  'Mezar Yapımı Fiyatları mezarisi.com''da!',
  'mezar-yapimi-fiyatlari-mezarisi-com-da',
  'Mezar Yapımı Fiyatları mezarisi.com''da!',
  'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop',
  NULL,
  NULL,
  'Özel Tasarım',
  '["Mezar Yapımı Fiyatları","mezarisi.com"]',
  '2024',
  'İstanbul',
  'Doğal Taş',
  NULL,
  JSON_OBJECT(
    'dimensions','220x120 cm',
    'workTime','4-5 gün',
    'specialFeatures', JSON_ARRAY('Özel tasarım','İtalyan mermeri','Profesyonel işçilik')
  ),
  1,4,'2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'
),
(
  UUID(),
  'Mermer, granit, mozaik mezar modelleri ve mezar baş taşı çeşitleri',
  'mermer-granit-mozaik-mezar-modelleri-ve-mezar-bas-tasi-cesitleri',
  'Mermer, granit, mozaik mezar modelleri ve mezar baş taşı çeşitleri',
  'https://images.unsplash.com/photo-1578847585232-7d95065b2df3?w=800&h=600&fit=crop',
  NULL,
  NULL,
  'Karma Modeller',
  '["Mermer","granit","mozaik mezar modelleri","mezar baş taşı çeşitleri"]',
  '2024',
  'İstanbul',
  'Mermer, Granit, Mozaik',
  NULL,
  JSON_OBJECT(
    'dimensions','Çeşitli boyutlar',
    'workTime','3-7 gün',
    'specialFeatures', JSON_ARRAY('Çok materyal seçeneği','Mozaik süsleme','Özel baş taşı tasarımları')
  ),
  1,5,'2024-01-01 00:00:00.000','2024-01-01 00:00:00.000'
)
ON DUPLICATE KEY UPDATE
  `title`=VALUES(`title`),
  `description`=VALUES(`description`),
  `image_url`=VALUES(`image_url`),
  `storage_asset_id`=VALUES(`storage_asset_id`),
  `alt`=VALUES(`alt`),
  `category`=VALUES(`category`),
  `seo_keywords`=VALUES(`seo_keywords`),
  `date`=VALUES(`date`),
  `location`=VALUES(`location`),
  `material`=VALUES(`material`),
  `price`=VALUES(`price`),
  `details`=VALUES(`details`),
  `is_active`=VALUES(`is_active`),
  `display_order`=VALUES(`display_order`),
  `updated_at`=VALUES(`updated_at`);
