// =============================================================
// FILE: src/routes/admin/registerDbAdmin.ts
// =============================================================
import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import {
  adminExportSql,
  adminImportSqlText,      // NEW
  adminImportSqlFromUrl,   // NEW
  adminImportSqlFromFile,  // NEW
} from "./admin.controller";

export async function registerDbAdmin(app: FastifyInstance) {
  // Export (aynı)
  app.get("/db/export", { preHandler: [requireAuth] }, adminExportSql);

  // Import seçenekleri (yeni)
  app.post("/db/import-sql",  { preHandler: [requireAuth] }, adminImportSqlText);
  app.post("/db/import-url",  { preHandler: [requireAuth] }, adminImportSqlFromUrl);
  app.post("/db/import-file", { preHandler: [requireAuth] }, adminImportSqlFromFile);
}
