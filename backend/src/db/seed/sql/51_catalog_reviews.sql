-- 51_catalog_reviews.sql
-- Review verisi sağlanmadı; şimdilik boş.
START TRANSACTION;
/*
INSERT INTO product_reviews (id, product_id, user_id, rating, comment, is_active, customer_name, review_date, created_at, updated_at)
VALUES
(UUID(), '00000001-0000-4000-8000-000000000001', NULL, 5, 'Çok memnun kaldık.', 1, 'A. Yılmaz', NOW(3), NOW(3), NOW(3));
*/
COMMIT;
