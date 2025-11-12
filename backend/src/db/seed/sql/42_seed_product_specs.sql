START TRANSACTION;

/* Her ürün için temel teknik özellik seti; yoksa ekler */
INSERT INTO product_specs
  (id, product_id, name, value, category, order_num, created_at, updated_at)
SELECT
  UUID(), p.id, d.name, d.value, d.category, d.order_num, NOW(3), NOW(3)
FROM products p
JOIN (
  SELECT 'dimensions'      AS name, '60×180 cm'              AS value, 'physical' AS category, 10 AS order_num
  UNION ALL SELECT 'weight',           '250 kg',                         'physical',               20
  UNION ALL SELECT 'thickness',        '3 cm',                           'physical',               30
  UNION ALL SELECT 'surfaceFinish',    'Parlak / Honlu',                 'material',               40
  UNION ALL SELECT 'warranty',         '10 Yıl İşçilik Garantisi',       'service',                50
  UNION ALL SELECT 'installationTime', '2–3 İş Günü (hava şartlarına bağlı)', 'service',         60
) AS d
LEFT JOIN product_specs s
  ON s.product_id = p.id AND s.name = d.name
WHERE s.id IS NULL;

COMMIT;
