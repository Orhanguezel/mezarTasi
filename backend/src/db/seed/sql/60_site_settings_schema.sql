SET NAMES utf8mb4;
SET time_zone = '+00:00';

DROP TABLE IF EXISTS `site_settings`;

CREATE TABLE `site_settings` (
  `id` CHAR(36) NOT NULL,
  `key` VARCHAR(100) NOT NULL,
  `value` MEDIUMTEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `site_settings_key_uq` (`key`),
  KEY `site_settings_key_idx` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed (value alanları JSON uyumlu; JSON.parse ile çözülebilir)
INSERT INTO `site_settings` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES
(UUID(), 'home_blog_badge',        '"Blog Yazılarımız"', NOW(3), NOW(3)),
(UUID(), 'new_ticket_telegram',    'true',               NOW(3), NOW(3)),
(UUID(), 'bank_transfer_enabled',  'false',              NOW(3), NOW(3)),
(UUID(), 'seo_contact_title',      '"Bize Ulaşın - Dijimins"', NOW(3), NOW(3)),
(UUID(), 'home_featured_title',    '"En çok satan ürünlerimize göz atın"', NOW(3), NOW(3)),

-- örnek kompleks JSON:
(UUID(), 'contact_socials', '{"whatsapp":"+49 123 456","instagram":"@dijimins","youtube":"https://youtube.com/@dijimins"}', NOW(3), NOW(3)),
(UUID(), 'ui_theme', '{"color":"teal","darkMode":false,"navbarHeight":96}', NOW(3), NOW(3)),
(UUID(), 'home_banners', '[{"img":"https://.../a.jpg","href":"/tr/kampanyalar"},{"img":"https://.../b.jpg","href":"/tr/iletisim"}]', NOW(3), NOW(3));
