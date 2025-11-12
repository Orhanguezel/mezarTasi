-- =========================
-- CATEGORIES (TOP LEVEL)
-- =========================
CREATE TABLE IF NOT EXISTS categories (
  id              CHAR(36)      NOT NULL,
  name            VARCHAR(255)  NOT NULL,
  slug            VARCHAR(255)  NOT NULL,

  description     TEXT          DEFAULT NULL,

  -- Tekil storage pattern (şema ile birebir)
  image_url       LONGTEXT      DEFAULT NULL,
  storage_asset_id CHAR(36)     DEFAULT NULL,
  alt             VARCHAR(255)  DEFAULT NULL,

  icon            VARCHAR(100)  DEFAULT NULL,

  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  is_featured     TINYINT(1)    NOT NULL DEFAULT 0,
  display_order   INT(11)       NOT NULL DEFAULT 0,

  created_at      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),

  UNIQUE KEY categories_slug_uq (slug),
  KEY categories_active_idx (is_active),
  KEY categories_order_idx (display_order),
  KEY categories_storage_asset_idx (storage_asset_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =========================
-- SUB CATEGORIES
-- =========================
CREATE TABLE IF NOT EXISTS sub_categories (
  id               CHAR(36)      NOT NULL,
  category_id      CHAR(36)      NOT NULL,

  name             VARCHAR(255)  NOT NULL,
  slug             VARCHAR(255)  NOT NULL,

  description      TEXT          DEFAULT NULL,

  -- Tekil storage pattern (şema ile birebir)
  image_url        LONGTEXT      DEFAULT NULL,
  storage_asset_id CHAR(36)      DEFAULT NULL,
  alt              VARCHAR(255)  DEFAULT NULL,

  icon             VARCHAR(100)  DEFAULT NULL,

  is_active        TINYINT(1)    NOT NULL DEFAULT 1,
  is_featured      TINYINT(1)    NOT NULL DEFAULT 0,
  display_order    INT(11)       NOT NULL DEFAULT 0,

  created_at       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),

  -- Aynı parent içinde slug benzersiz
  UNIQUE KEY sub_categories_parent_slug_uq (category_id, slug),
  KEY sub_categories_category_id_idx (category_id),
  KEY sub_categories_active_idx (is_active),
  KEY sub_categories_order_idx (display_order),
  KEY sub_categories_storage_asset_idx (storage_asset_id),

  CONSTRAINT fk_sub_categories_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =========================
-- PRODUCTS (Drizzle ile birebir)
-- =========================
CREATE TABLE IF NOT EXISTS products (
  id                 CHAR(36)      NOT NULL,
  title              VARCHAR(255)  NOT NULL,
  slug               VARCHAR(255)  NOT NULL,

  price              DECIMAL(10,2) NOT NULL,
  description        TEXT          DEFAULT NULL,

  category_id        CHAR(36)      NOT NULL,
  sub_category_id    CHAR(36)      DEFAULT NULL,

  -- Kapak + galeri (tekil kapak + çoklu galeri)
  image_url          LONGTEXT      DEFAULT NULL,
  storage_asset_id   CHAR(36)      DEFAULT NULL,
  alt                VARCHAR(255)  DEFAULT NULL,
  images             JSON          DEFAULT (JSON_ARRAY()),
  storage_image_ids  JSON          DEFAULT (JSON_ARRAY()),

  is_active          TINYINT(1)    NOT NULL DEFAULT 1,
  is_featured        TINYINT(1)    NOT NULL DEFAULT 0,

  tags               JSON          DEFAULT (JSON_ARRAY()),
  specifications     JSON          DEFAULT NULL,

  product_code       VARCHAR(64)   DEFAULT NULL,
  stock_quantity     INT(11)       NOT NULL DEFAULT 0,
  rating             DECIMAL(3,2)  NOT NULL DEFAULT 5.00,
  review_count       INT(11)       NOT NULL DEFAULT 0,

  meta_title         VARCHAR(255)  DEFAULT NULL,
  meta_description   VARCHAR(500)  DEFAULT NULL,

  created_at         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),

  UNIQUE KEY products_slug_uq (slug),
  UNIQUE KEY products_code_uq (product_code),

  KEY products_category_id_idx (category_id),
  KEY products_sub_category_id_idx (sub_category_id),
  KEY products_active_idx (is_active),
  KEY products_asset_idx (storage_asset_id),

  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_products_subcategory
    FOREIGN KEY (sub_category_id) REFERENCES sub_categories(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =========================
-- PRODUCT SPECS (technicalSpecs)
-- =========================
CREATE TABLE IF NOT EXISTS product_specs (
  id          CHAR(36)     NOT NULL,
  product_id  CHAR(36)     NOT NULL,
  name        VARCHAR(255) NOT NULL,
  value       TEXT         NOT NULL,
  category    ENUM('physical','material','service','custom') NOT NULL DEFAULT 'custom',
  order_num   INT(11)      NOT NULL DEFAULT 0,

  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  KEY product_specs_product_id_idx (product_id),

  CONSTRAINT fk_product_specs_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =========================
-- PRODUCT FAQS
-- =========================
CREATE TABLE IF NOT EXISTS product_faqs (
  id            CHAR(36)     NOT NULL,
  product_id    CHAR(36)     NOT NULL,
  question      VARCHAR(500) NOT NULL,
  answer        TEXT         NOT NULL,
  display_order INT(11)      NOT NULL DEFAULT 0,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  KEY product_faqs_product_id_idx (product_id),
  KEY product_faqs_order_idx (display_order),

  CONSTRAINT fk_product_faqs_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =========================
-- PRODUCT REVIEWS
-- =========================
CREATE TABLE IF NOT EXISTS product_reviews (
  id            CHAR(36)     NOT NULL,
  product_id    CHAR(36)     NOT NULL,
  user_id       CHAR(36)     DEFAULT NULL,
  rating        INT(11)      NOT NULL,
  comment       TEXT         DEFAULT NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  customer_name VARCHAR(255) DEFAULT NULL,
  review_date   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  KEY product_reviews_product_id_idx (product_id),
  KEY product_reviews_approved_idx (product_id, is_active),
  KEY product_reviews_rating_idx (rating),

  CONSTRAINT fk_product_reviews_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =========================
-- PRODUCT OPTIONS
-- =========================
CREATE TABLE IF NOT EXISTS product_options (
  id            CHAR(36)     NOT NULL,
  product_id    CHAR(36)     NOT NULL,
  option_name   VARCHAR(100) NOT NULL,
  option_values JSON         NOT NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  KEY product_options_product_id_idx (product_id),

  CONSTRAINT fk_product_options_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =========================
-- PRODUCT STOCK
-- =========================
CREATE TABLE IF NOT EXISTS product_stock (
  id             CHAR(36)     NOT NULL,
  product_id     CHAR(36)     NOT NULL,
  stock_content  VARCHAR(255) NOT NULL,
  is_used        TINYINT(1)   NOT NULL DEFAULT 0,
  used_at        DATETIME(3)  DEFAULT NULL,
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  order_item_id  CHAR(36)     DEFAULT NULL,

  PRIMARY KEY (id),
  KEY product_stock_product_id_idx (product_id),
  KEY product_stock_is_used_idx (product_id, is_used),
  KEY product_stock_order_item_id_idx (order_item_id),

  CONSTRAINT fk_product_stock_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
