-- 52_catalog_stock.sql
-- Otomatik stok (e-pin vb.) verisi yok; şimdilik boş.
START TRANSACTION;
/*
INSERT INTO product_stock (id, product_id, stock_content, is_used, used_at, created_at, order_item_id)
VALUES
(UUID(), '00000018-0000-4000-8000-000000000018', 'STOK-KODU-001', 0, NULL, NOW(3), NULL);
*/
COMMIT;
