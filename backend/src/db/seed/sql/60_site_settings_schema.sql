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

/* ====== BRAND / UI / ROUTES ====== */
INSERT INTO `site_settings` (`id`,`key`,`value`,`created_at`,`updated_at`) VALUES
(UUID(), 'brand_name',             '"mezarisim.com"', NOW(3), NOW(3)),
(UUID(), 'brand_tagline',          '"online mezar yapımı"', NOW(3), NOW(3)),
(UUID(), 'ui_theme',               '{"color":"teal","primaryHex":"#009688","darkMode":false,"navbarHeight":96}', NOW(3), NOW(3)),
(UUID(), 'site_version',           '"1.0.0"', NOW(3), NOW(3)),
(UUID(), 'admin_path',             '"/adminkotrol"', NOW(3), NOW(3));

/* ====== CONTACT ====== */
INSERT INTO `site_settings` (`id`,`key`,`value`,`created_at`,`updated_at`) VALUES
(UUID(), 'contact_phone_display',  '"0533 483 89 71"', NOW(3), NOW(3)),
(UUID(), 'contact_phone_tel',      '"05334838971"', NOW(3), NOW(3)),
(UUID(), 'contact_email',          '"mezarisim.com@gmail.com"', NOW(3), NOW(3)),
(UUID(), 'contact_address',        '"Hekimbaşı Mah. Yıldıztepe Cad. No:41 Ümraniye/İstanbul"', NOW(3), NOW(3)),
(UUID(), 'contact_whatsapp_link',  '"https://wa.me/905334838971"', NOW(3), NOW(3));

/* ====== HEADER METINLER ====== */
INSERT INTO `site_settings` (`id`,`key`,`value`,`created_at`,`updated_at`) VALUES
(UUID(), 'header_info_text',       '"Ürünlerimiz Hakkında Detaylı Bilgi İçin"', NOW(3), NOW(3)),
(UUID(), 'header_cta_label',       '"HEMEN ARA"', NOW(3), NOW(3));

/* ====== FOOTER ====== */
INSERT INTO `site_settings` (`id`,`key`,`value`,`created_at`,`updated_at`) VALUES
(UUID(), 'footer_keywords',        '["Ucuz Mezar Yapımı","Mezar Yapımı İşleri","Mezar Yapımı Fiyatları","Mezar Baş Taşı Fiyatı","Mezar Taşına Resim","Ucuz Mezar İşleri","İstanbul Mezar Yapım","Mezar Taşı Fiyatları"]', NOW(3), NOW(3)),
(UUID(), 'footer_services',        '["Mezar Yapımı","Mezar Onarımı","Mezar Bakımı","Çiçeklendirme"]', NOW(3), NOW(3)),
(UUID(), 'footer_quick_links',     '[{"title":"Anasayfa","path":"/","pageKey":"home"},{"title":"Hakkımızda","path":"/about","pageKey":"about"},{"title":"Ürünlerimiz","path":"/pricing","pageKey":"pricing"},{"title":"İletişim","path":"/contact","pageKey":"contact"}]', NOW(3), NOW(3));

/* ====== MENU (Header dropdown içerikleri) ====== */
INSERT INTO `site_settings` (`id`,`key`,`value`,`created_at`,`updated_at`) VALUES
(UUID(), 'menu_kurumsal',          '[{"title":"HAKKIMIZDA","path":"/about","pageKey":"about"},{"title":"MİSYONUMUZ - VİZYONUMUZ","path":"/mission","pageKey":"mission"},{"title":"KALİTE POLİTİKAMIZ","path":"/quality","pageKey":"quality"},{"title":"S.S.S.","path":"/faq","pageKey":"faq"}]', NOW(3), NOW(3)),
(UUID(), 'menu_other_services',    '[{"title":"MEZAR ÇİÇEKLENDİRME","path":"/gardening","pageKey":"gardening"},{"title":"MEZAR TOPRAK DOLDURUMU","path":"/soilfilling","pageKey":"soilfilling"}]', NOW(3), NOW(3));

/* ====== SEO GLOBAL / DEFAULTS ====== */
INSERT INTO `site_settings` (`id`,`key`,`value`,`created_at`,`updated_at`) VALUES
(UUID(), 'seo_defaults',            '{"canonicalBase":"https://mezarisim.com","siteName":"Mezarisim.com - Mezar Taşı Uzmanları","ogLocale":"tr_TR","author":"Mezarisim.com - Mezar Taşı Uzmanları","themeColor":"#14b8a6","twitterCard":"summary_large_image","robots":"index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1","googlebot":"index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"}', NOW(3), NOW(3)),
(UUID(), 'seo_social_same_as',      '["https://www.facebook.com/mezarisim","https://www.instagram.com/mezarisim"]', NOW(3), NOW(3)),
(UUID(), 'seo_app_icons',           '{"appleTouchIcon":"/apple-touch-icon.png","favicon32":"/favicon-32x32.png","favicon16":"/favicon-16x16.png"}', NOW(3), NOW(3)),
(UUID(), 'seo_amp_google_client_id_api', '"googleanalytics"', NOW(3), NOW(3));

/* ====== SEO SAYFA BAZLI ====== */
INSERT INTO `site_settings` (`id`,`key`,`value`,`created_at`,`updated_at`) VALUES
(UUID(), 'seo_pages_home',         '{"title":"Mezar Taşı Modelleri & Mezar Yapımı - Mezarisim.com | İstanbul","description":"İstanbul\'da kaliteli mezar taşı modelleri ve mezar yapım hizmetleri. Mermer, granit mezar taşları, mezar aksesuarları ve çiçeklendirme hizmetleri. Ücretsiz keşif!","keywords":"mezar taşı, mezar modelleri, mermer mezar, granit mezar, mezar yapımı, İstanbul mezar taşı, mezar aksesuarları, mezar çiçeklendirme","ogImage":"/og/home.jpg"}', NOW(3), NOW(3)),
(UUID(), 'seo_pages_models',       '{"title":"Mezar Baş Taşı Modelleri - Mermer & Granit | Mezarisim.com","description":"Özel tasarım mezar baş taşı modelleri. Mermer ve granit malzemeden kaliteli mezar taşları. İstanbul geneli hizmet, ücretsiz keşif ve montaj.","keywords":"mezar baş taşı, mezar taşı modelleri, mermer mezar taşı, granit mezar taşı, özel tasarım mezar","ogImage":"/og/models.jpg"}', NOW(3), NOW(3)),
(UUID(), 'seo_pages_accessories',  '{"title":"Mezar Aksesuarları & Süsleri - Mezarisim.com | İstanbul","description":"Mezar aksesuarları, vazo, çiçeklik, mezar süsleri ve dekoratif ürünler. Kaliteli malzeme, uygun fiyat, hızlı teslimat.","keywords":"mezar aksesuarları, mezar vazosu, mezar çiçekliği, mezar süsleri, mezar dekorasyonu","ogImage":"/og/accessories.jpg"}', NOW(3), NOW(3)),
(UUID(), 'seo_pages_gardening',    '{"title":"Mezar Çiçeklendirme Hizmetleri - Peyzaj & Bahçıvanlık | Mezarisim","description":"Profesyonel mezar çiçeklendirme ve peyzaj hizmetleri. Mevsimlik çiçek dikimi, bakım ve düzenleme hizmetleri. İstanbul geneli hizmet.","keywords":"mezar çiçeklendirme, mezar peyzajı, mezar bahçıvanlığı, çiçek dikimi, mezar bakımı","ogImage":"/og/gardening.jpg"}', NOW(3), NOW(3)),
(UUID(), 'seo_pages_soilfilling',  '{"title":"Mezar Toprak Doldurumu Hizmetleri - Mezarisim.com | İstanbul","description":"Mezar toprak doldurumu, düzenleme ve bakım hizmetleri. Kaliteli toprak, profesyonel uygulama, uygun fiyatlar.","keywords":"mezar toprak doldurumu, mezar düzenleme, mezar bakımı, toprak dolgulu mezar","ogImage":"/og/soilfilling.jpg"}', NOW(3), NOW(3)),
(UUID(), 'seo_pages_contact',      '{"title":"İletişim - Mezar Taşı & Mezar Yapımı Hizmetleri | Mezarisim.com","description":"Mezar taşı ve mezar yapımı hizmetleri için bizimle iletişime geçin. İstanbul geneli hizmet, ücretsiz keşif ve danışmanlık.","keywords":"mezar taşı iletişim, mezar yapımı İstanbul, mezar taşı fiyatları, ücretsiz keşif","ogImage":"/og/contact.jpg"}', NOW(3), NOW(3)),
(UUID(), 'seo_pages_about',        '{"title":"Hakkımızda - Mezar Taşı Uzmanları | Mezarisim.com","description":"Mezar taşı ve mezar yapımında uzman ekibimiz ile kaliteli hizmet. Yılların deneyimi, güvenilir iş ortaklığı.","keywords":"mezar taşı uzmanları, mezar yapımı deneyimi, kaliteli mezar hizmeti","ogImage":"/og/about.jpg"}', NOW(3), NOW(3)),
(UUID(), 'seo_pages_pricing',      '{"title":"Mezar Taşı Fiyatları & Paketler - Uygun Fiyatlar | Mezarisim.com","description":"Mezar taşı fiyatları, mezar yapım paketleri ve hizmet ücretleri. Şeffaf fiyatlandırma, kaliteli hizmet, uygun ödeme seçenekleri.","keywords":"mezar taşı fiyatları, mezar yapım ücreti, mezar taşı paketleri, uygun mezar fiyatları","ogImage":"/og/pricing.jpg"}', NOW(3), NOW(3));

/* ====== JSON-LD (LocalBusiness) ====== */
INSERT INTO `site_settings` (`id`,`key`,`value`,`created_at`,`updated_at`) VALUES
(UUID(), 'seo_local_business',     '{"@context":"https://schema.org","@type":"LocalBusiness","name":"Mezarisim.com","description":"İstanbul\'da kaliteli mezar taşı modelleri ve mezar yapım hizmetleri","url":"https://mezarisim.com","telephone":"+90-533-483-8971","address":{"@type":"PostalAddress","addressLocality":"İstanbul","addressCountry":"TR"},"geo":{"@type":"GeoCoordinates","latitude":41.0082,"longitude":28.9784},"sameAs":["https://www.facebook.com/mezarisim","https://www.instagram.com/mezarisim"],"priceRange":"$$","serviceArea":{"@type":"GeoCircle","geoMidpoint":{"@type":"GeoCoordinates","latitude":41.0082,"longitude":28.9784},"geoRadius":50000}}', NOW(3), NOW(3));

/* ====== SEO (örnek ekstra) ====== */
INSERT INTO `site_settings` (`id`,`key`,`value`,`created_at`,`updated_at`) VALUES
(UUID(), 'seo_contact_title',      '"İletişim - mezarisim.com"', NOW(3), NOW(3));
