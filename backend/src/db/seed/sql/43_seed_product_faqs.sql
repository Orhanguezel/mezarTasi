START TRANSACTION;

/* SSS #1 – yoksa ekle */
INSERT INTO product_faqs
  (id, product_id, question, answer, display_order, is_active, created_at, updated_at)
SELECT UUID(), p.id,
       'Teslimat süresi nedir?',
       'İstanbul içi ortalama 2–3 iş gününde kurulum yapılır. Hava koşulları ve mezarlık izin süreçlerine göre değişebilir.',
       10, 1, NOW(3), NOW(3)
FROM products p
LEFT JOIN product_faqs f
  ON f.product_id = p.id AND f.question = 'Teslimat süresi nedir?'
WHERE f.id IS NULL;

/* SSS #2 – yoksa ekle */
INSERT INTO product_faqs
  (id, product_id, question, answer, display_order, is_active, created_at, updated_at)
SELECT UUID(), p.id,
       'Garanti kapsamı nelerdir?',
       'Tüm modeller 10 yıl işçilik garantilidir. Doğal taşın yapısal özelliklerinden kaynaklı renk/ton farklılıkları garanti kapsamı dışındadır.',
       20, 1, NOW(3), NOW(3)
FROM products p
LEFT JOIN product_faqs f
  ON f.product_id = p.id AND f.question = 'Garanti kapsamı nelerdir?'
WHERE f.id IS NULL;

/* SSS #3 – yoksa ekle */
INSERT INTO product_faqs
  (id, product_id, question, answer, display_order, is_active, created_at, updated_at)
SELECT UUID(), p.id,
       'Özelleştirme yapılıyor mu?',
       'Yazı tipi, desen, ölçü ve taş cinsi özelleştirilebilir. Proje onayı sonrası üretime alınır.',
       30, 1, NOW(3), NOW(3)
FROM products p
LEFT JOIN product_faqs f
  ON f.product_id = p.id AND f.question = 'Özelleştirme yapılıyor mu?'
WHERE f.id IS NULL;

COMMIT;
