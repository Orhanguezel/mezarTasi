-- 041_info_cards.sql
DROP TABLE IF EXISTS `info_cards`;
CREATE TABLE `info_cards` (
  `id`            CHAR(36)     NOT NULL,
  `title`         VARCHAR(255) NOT NULL,
  `description`   VARCHAR(500) NOT NULL,
  `icon`          VARCHAR(32)  NOT NULL,
  `icon_type`     ENUM('emoji','lucide') NOT NULL DEFAULT 'emoji',
  `lucide_icon`   VARCHAR(64)  DEFAULT NULL,
  `link`          VARCHAR(255) NOT NULL,
  `bg_color`      VARCHAR(64)  NOT NULL,
  `hover_color`   VARCHAR(64)  NOT NULL,
  `icon_color`    VARCHAR(64)  NOT NULL,
  `text_color`    VARCHAR(64)  NOT NULL,
  `border_color`  VARCHAR(64)  NOT NULL,
  `is_active`     TINYINT(1)   NOT NULL DEFAULT 1,
  `display_order` INT          NOT NULL DEFAULT 1,
  `created_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `info_cards_active_idx`(`is_active`),
  KEY `info_cards_order_idx`(`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `info_cards`
(`id`,`title`,`description`,`icon`,`icon_type`,`lucide_icon`,`link`,
 `bg_color`,`hover_color`,`icon_color`,`text_color`,`border_color`,
 `is_active`,`display_order`)
VALUES
(UUID(),'Mezar Yapımı Konusunda Sıkça Sorulan Sorular','Mezar inşaatı, fiyatlar, malzemeler ve süreçler hakkında sık sorulan sorular','❓','emoji',NULL,'faq','bg-teal-50','hover:bg-teal-100','text-teal-600','text-teal-700','border-teal-200',1,1),
(UUID(),'İstanbul İl Genelinde Bulunan Mezarlıklar','İstanbul''daki tüm mezarlıkların listesi ve bölge bilgileri','🗂️','emoji',NULL,'cemeteries','bg-teal-50','hover:bg-teal-100','text-teal-600','text-teal-700','border-teal-200',1,2),
(UUID(),'Mezarlık Müdürlükleri Adres ve Telefon Bilgileri','14 mezarlık müdürlüğünün detaylı adres ve iletişim bilgileri','📞','emoji',NULL,'cemeteries','bg-teal-50','hover:bg-teal-100','text-teal-600','text-teal-700','border-teal-200',1,3)
ON DUPLICATE KEY UPDATE
 `title`=VALUES(`title`),`description`=VALUES(`description`),`icon`=VALUES(`icon`),
 `icon_type`=VALUES(`icon_type`),`lucide_icon`=VALUES(`lucide_icon`),`link`=VALUES(`link`),
 `bg_color`=VALUES(`bg_color`),`hover_color`=VALUES(`hover_color`),
 `icon_color`=VALUES(`icon_color`),`text_color`=VALUES(`text_color`),`border_color`=VALUES(`border_color`),
 `is_active`=VALUES(`is_active`),`display_order`=VALUES(`display_order`);
