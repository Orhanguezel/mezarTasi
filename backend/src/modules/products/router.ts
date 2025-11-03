// =============================================================
// FILE: src/modules/products/routes.ts
// =============================================================
import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import {
  listProducts,
  getProductByIdOrSlug,
  getProductById,
  getProductBySlug,
  // Public lists
  listProductFaqs,
  listProductSpecs,
  listProductReviews,   
  listProductOptions,  
  listProductStock,     
  // Optional CRUD (auth)
  createProductFaq,
  updateProductFaq,
  deleteProductFaq,
  createProductSpec,
  updateProductSpec,
  deleteProductSpec,
  // Optional product CRUD (auth)
  createProduct,
  updateProduct,
  deleteProduct,
} from "./controller";

export async function registerProducts(app: FastifyInstance) {
  // List + detail
  app.get("/products", { config: { public: true } }, listProducts);
  app.get("/products/:idOrSlug", { config: { public: true } }, getProductByIdOrSlug);
  app.get("/products/by-slug/:slug", { config: { public: true } }, getProductBySlug);
  app.get("/products/id/:id", { config: { public: true } }, getProductById);

  // Public lists
  app.get("/product_faqs",   { config: { public: true } }, listProductFaqs);
  app.get("/product_specs",  { config: { public: true } }, listProductSpecs);
  app.get("/product_reviews",{ config: { public: true } }, listProductReviews); 
  app.get("/product_options",{ config: { public: true } }, listProductOptions); 
  app.get("/product_stock",  { config: { public: true } }, listProductStock);   

  // Optional product CRUD
  app.post("/products",        { preHandler: [requireAuth] }, createProduct);
  app.patch("/products/:id",   { preHandler: [requireAuth] }, updateProduct);
  app.delete("/products/:id",  { preHandler: [requireAuth] }, deleteProduct);

  // Optional FAQ CRUD
  app.post("/product_faqs",       { preHandler: [requireAuth] }, createProductFaq);
  app.patch("/product_faqs/:id",  { preHandler: [requireAuth] }, updateProductFaq);
  app.delete("/product_faqs/:id", { preHandler: [requireAuth] }, deleteProductFaq);

  // Optional Spec CRUD
  app.post("/product_specs",       { preHandler: [requireAuth] }, createProductSpec);
  app.patch("/product_specs/:id",  { preHandler: [requireAuth] }, updateProductSpec);
  app.delete("/product_specs/:id", { preHandler: [requireAuth] }, deleteProductSpec);
}
