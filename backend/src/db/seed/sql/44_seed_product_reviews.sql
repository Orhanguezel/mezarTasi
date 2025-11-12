START TRANSACTION;

/* Her ürüne örnek onaylı 1 yorum; ürünün hiç yorumu yoksa ekle */
INSERT INTO product_reviews
  (id, product_id, user_id, rating, comment, is_active, customer_name, review_date, created_at, updated_at)
SELECT UUID(), p.id, NULL,
       5,
       'Zamanında teslim edildi, işçilikten memnun kaldık.',
       1,
       'A. Yılmaz',
       NOW(3), NOW(3), NOW(3)
FROM products p
WHERE NOT EXISTS (SELECT 1 FROM product_reviews r WHERE r.product_id = p.id);

/* Verilen 3 yorumu son 3 ürüne sırayla dağıt */
INSERT INTO product_reviews
  (id, product_id, user_id, rating, comment, is_active, customer_name, review_date, created_at, updated_at)
SELECT
  UUID(),
  p.id,
  NULL,
  s.rating,
  CONCAT(s.comment, ' — ', s.location) AS comment_with_location,
  1,
  s.customer_name,
  NOW(3), NOW(3), NOW(3)
FROM
(
  SELECT 1 AS idx, 'Mehmet KARATAŞ' AS customer_name,
         'İhlamurkuyu Mezarlığı' AS location, 5 AS rating,
         'Çok kaliteli işçilik ve malzeme kullanılmış. Personel çok ilgili ve profesyoneldi. Tavsiye ederim.' AS comment
  UNION ALL
  SELECT 2, 'Ayşe YILMAZ',
         'Zincirlikuyu Mezarlığı', 5,
         'Mezar taşımız çok güzel oldu. Zamanında teslim edildi ve kalitesi çok iyi. Memnun kaldık.'
  UNION ALL
  SELECT 3, 'Ali DEMIR',
         'Karacaahmet Mezarlığı', 5,
         'Profesyonel hizmet ve uygun fiyat. Ailece çok memnun kaldık. Teşekkür ederiz.'
) AS s
JOIN
(
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC, id) AS idx
  FROM products
) AS p
  ON p.idx = s.idx
/* idempotent: aynı ürün+müşteri+yorum varsa ekleme */
WHERE NOT EXISTS (
  SELECT 1
  FROM product_reviews r
  WHERE r.product_id = p.id
    AND r.customer_name = s.customer_name
    AND r.comment = CONCAT(s.comment, ' — ', s.location)
);

COMMIT;
