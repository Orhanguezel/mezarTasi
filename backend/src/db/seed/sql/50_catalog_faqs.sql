-- 50_catalog_faqs.sql
-- Ürün özel SSS verisi sağlanmadı; şimdilik boş bırakıldı.
START TRANSACTION;
/*
-- Örnek (aktif edersen):
INSERT INTO product_faqs (id, product_id, question, answer, display_order, is_active)
VALUES
(UUID(), '00000001-0000-4000-8000-000000000001', 'Garanti süresi kaç yıl?', 'Modeline göre 8-25 yıl arası.', 1, 1);
*/
COMMIT;
