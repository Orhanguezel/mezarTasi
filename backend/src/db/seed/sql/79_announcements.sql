-- =============================================================
-- FILE: 042_announcements.sql
-- =============================================================
DROP TABLE IF EXISTS `announcements`;
CREATE TABLE `announcements` (
  `id`              CHAR(36)     NOT NULL,
  `title`           VARCHAR(255) NOT NULL,
  `description`     VARCHAR(500) NOT NULL,

  -- JSON-string: {"html":"..."}
  `content`         LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL
                    CHECK (JSON_VALID(`content`)),

  `link`            VARCHAR(255) NOT NULL,

  `bg_color`        VARCHAR(64)  NOT NULL,
  `hover_color`     VARCHAR(64)  NOT NULL,
  `icon_color`      VARCHAR(64)  NOT NULL,
  `text_color`      VARCHAR(64)  NOT NULL,
  `border_color`    VARCHAR(64)  NOT NULL,

  `badge_text`      VARCHAR(64)  DEFAULT NULL,
  `badge_color`     VARCHAR(64)  DEFAULT NULL,
  `button_text`     VARCHAR(64)  DEFAULT NULL,
  `button_color`    VARCHAR(64)  DEFAULT NULL,

  `image_url`        VARCHAR(500) DEFAULT NULL,
  `storage_asset_id` CHAR(36)     DEFAULT NULL,
  `alt`              VARCHAR(255) DEFAULT NULL,

  `is_active`       TINYINT(1)   NOT NULL DEFAULT 1,
  `is_published`    TINYINT(1)   NOT NULL DEFAULT 1,
  `display_order`   INT          NOT NULL DEFAULT 1,

  `created_at`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `published_at`    DATETIME(3)  DEFAULT NULL,
  `expires_at`      DATETIME(3)  DEFAULT NULL,

  `meta_title`         VARCHAR(255) DEFAULT NULL,
  `meta_description`   VARCHAR(500) DEFAULT NULL,

  PRIMARY KEY (`id`),

  KEY `announcements_active_idx` (`is_active`,`is_published`),
  KEY `announcements_order_idx`  (`display_order`),
  KEY `announcements_expires_idx`(`expires_at`),
  KEY `announcements_asset_idx`  (`storage_asset_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Opsiyonel) Basit seed örnekleri
INSERT INTO `announcements`
(`id`,`title`,`description`,`content`,`link`,
 `bg_color`,`hover_color`,`icon_color`,`text_color`,`border_color`,
 `badge_text`,`badge_color`,`button_text`,`button_color`,
 `is_active`,`is_published`,`display_order`,
 `created_at`,`updated_at`,`published_at`,`expires_at`,
 `meta_title`,`meta_description`)
VALUES
(UUID(),'Ramazan Kampanyası','Ramazan ayına özel mezar yapımı ve işçilik kampanyası',
 JSON_OBJECT('html','<h2>Ramazan Ayına Özel Mezar Yapımı Kampanyası</h2>...'),
 '/kampanyalar/ramazan',
 'bg-amber-50','hover:bg-amber-100','text-amber-600','text-amber-700','border-amber-200',
 'Kampanya','bg-amber-500','Kampanya Detayları','bg-amber-600 hover:bg-amber-700',
 1,1,1,'2024-01-15 00:00:00.000','2024-01-15 00:00:00.000','2024-01-15 00:00:00.000','2024-05-15 00:00:00.000',
 'Ramazan Kampanyası - %20 İndirim','Ramazan ayına özel kampanya...'),

(UUID(),'Ücretsiz Keşif','Ücretsiz keşif ve fiyat teklifi alın',
 JSON_OBJECT('html','<h2>Ücretsiz Keşif Hizmeti</h2>...'),
 '/ucretsiz-kesif',
 'bg-green-50','hover:bg-green-100','text-green-600','text-green-700','border-green-200',
 'Hizmet','bg-green-500','Keşif Talep Et','bg-green-600 hover:bg-green-700',
 1,1,2,'2024-01-05 00:00:00.000','2024-01-25 00:00:00.000','2024-01-05 00:00:00.000',NULL,
 'Ücretsiz Keşif Hizmeti','Ücretsiz keşif hizmeti...')
;
