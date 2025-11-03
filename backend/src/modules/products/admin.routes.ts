import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
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
} from "./admin.controller";

export async function registerProductsAdmin(app: FastifyInstance) {
  // Products
  app.get("/admin/products", { preHandler: [requireAuth] }, adminListProducts);
  app.get("/admin/products/:id", { preHandler: [requireAuth] }, adminGetProduct);
  app.post("/admin/products", { preHandler: [requireAuth] }, adminCreateProduct);
  app.patch("/admin/products/:id", { preHandler: [requireAuth] }, adminUpdateProduct);
  app.delete("/admin/products/:id", { preHandler: [requireAuth] }, adminDeleteProduct);

  // Bulk & toggles
  app.post("/admin/products/bulk/active", { preHandler: [requireAuth] }, adminBulkSetActive);
  app.post("/admin/products/bulk/reorder", { preHandler: [requireAuth] }, adminReorderProducts);
  app.patch("/admin/products/:id/active", { preHandler: [requireAuth] }, adminToggleActive);
  app.patch("/admin/products/:id/homepage", { preHandler: [requireAuth] }, adminToggleHomepage);

  // Replace collections
  app.put("/admin/products/:id/faqs", { preHandler: [requireAuth] }, adminReplaceFaqs);
  app.put("/admin/products/:id/specs", { preHandler: [requireAuth] }, adminReplaceSpecs);

  // FE filtreleri için
  app.get("/admin/categories", { preHandler: [requireAuth] }, adminListCategories);
}
