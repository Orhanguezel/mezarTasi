// =============================================================
// FILE: src/modules/products/admin.routes.ts
// =============================================================
import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import { requireAdmin } from "@/common/middleware/roles";
import {
  adminListProducts,
  adminGetProduct,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminBulkSetActive,
  adminReorderProducts,
  adminToggleActive,
  adminToggleHomepage,
  adminReplaceFaqs,
  adminReplaceSpecs,
  adminListCategories,
  adminSetProductImages,
} from "./admin.controller";

export async function registerProductsAdmin(app: FastifyInstance) {
  // ÖNEMLİ: Bu modül üstten `app.register(registerProductsAdmin, { prefix: "/admin" })`
  // ile mount ediliyorsa, burada BASE **/products** olmalı. (/admin/**products** şeklinde birleşir)
  // Eğer prefix YOKSA, BASE'i "/admin/products" yap.
  const BASE = "/products";

  // Products
  app.get(BASE, { preHandler: [requireAuth, requireAdmin] }, adminListProducts);
  app.get(`${BASE}/:id`, { preHandler: [requireAuth, requireAdmin] }, adminGetProduct);
  app.post(BASE, { preHandler: [requireAuth, requireAdmin] }, adminCreateProduct);
  app.patch(`${BASE}/:id`, { preHandler: [requireAuth, requireAdmin] }, adminUpdateProduct);
  app.delete(`${BASE}/:id`, { preHandler: [requireAuth, requireAdmin] }, adminDeleteProduct);

  // Images (storage ile eşleme)
  app.put(`${BASE}/:id/images`, { preHandler: [requireAuth, requireAdmin] }, adminSetProductImages);

  // Bulk & toggles
  app.post(`${BASE}/bulk/active`, { preHandler: [requireAuth, requireAdmin] }, adminBulkSetActive);
  app.post(`${BASE}/bulk/reorder`, { preHandler: [requireAuth, requireAdmin] }, adminReorderProducts);
  app.patch(`${BASE}/:id/active`, { preHandler: [requireAuth, requireAdmin] }, adminToggleActive);
  app.patch(`${BASE}/:id/homepage`, { preHandler: [requireAuth, requireAdmin] }, adminToggleHomepage);

  // Replace collections
  app.put(`${BASE}/:id/faqs`, { preHandler: [requireAuth, requireAdmin] }, adminReplaceFaqs);
  app.put(`${BASE}/:id/specs`, { preHandler: [requireAuth, requireAdmin] }, adminReplaceSpecs);

  // FE filtreleri için
  // prefix "/admin" ile birleşince => /admin/categories
  app.get("/categories", { preHandler: [requireAuth, requireAdmin] }, adminListCategories);
}
