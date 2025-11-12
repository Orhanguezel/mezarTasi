// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/admin/db_admin.endpoints.ts
// =============================================================
import { baseApi } from "../../baseApi";

/* -------- Types -------- */
export type DbImportResponse = {
  ok: boolean;
  dryRun?: boolean;
  message?: string;
  error?: string;
};

export type SqlImportCommon = {
  /** Varolan verileri temizleyip içe aktar */
  truncateBefore?: boolean;
  /** İşlemi prova olarak çalıştır (yalnızca /import-sql ve /import-url destekler) */
  dryRun?: boolean;
};

export type SqlImportTextParams = SqlImportCommon & {
  /** Tam SQL script (utf8) */
  sql: string;
};

export type SqlImportUrlParams = SqlImportCommon & {
  /** .sql veya .sql.gz URL */
  url: string;
};

export type SqlImportFileParams = {
  /** .sql veya .gz dosya */
  file: File;
  /** Varolan verileri temizleyip içe aktar */
  truncateBefore?: boolean;
};

/* (ESKİ) Geriye dönük: bazı yerlerde bu tip adı geçiyorsa bozulmasın. */
export type SqlImportParams = {
  tenant?: string; // tenantsızda yok sayılır
  truncate_before_import?: boolean; // eski alan adı
};

export const dbAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /* ---------------------------------------------------------
     * EXPORT: GET /admin/db/export  -> Blob (.sql)
     * --------------------------------------------------------- */
    exportSql: b.mutation<Blob, void>({
      query: () => ({
        url: "/admin/db/export",
        method: "GET",
        // Blob'u TS uyumlu almak için arrayBuffer + transform
        // @rtk: responseHandler function kullanımı desteklenir
        responseHandler: (resp: Response) => resp.arrayBuffer(),
      }),
      transformResponse: (ab: ArrayBuffer) =>
        new Blob([ab], { type: "application/sql" }),
    }),

    /* ---------------------------------------------------------
     * IMPORT (TEXT): POST /admin/db/import-sql
     * body: { sql, dryRun?, truncateBefore? }
     * --------------------------------------------------------- */
    importSqlText: b.mutation<DbImportResponse, SqlImportTextParams>({
      query: (body) => ({
        url: "/admin/db/import-sql",
        method: "POST",
        body,
      }),
    }),

    /* ---------------------------------------------------------
     * IMPORT (URL): POST /admin/db/import-url
     * body: { url, dryRun?, truncateBefore? }  (gzip destekli)
     * --------------------------------------------------------- */
    importSqlUrl: b.mutation<DbImportResponse, SqlImportUrlParams>({
      query: (body) => ({
        url: "/admin/db/import-url",
        method: "POST",
        body,
      }),
    }),

    /* ---------------------------------------------------------
     * IMPORT (FILE): POST /admin/db/import-file
     * multipart: file(.sql|.gz) + fields: truncateBefore?
     * (BE eski alan adı truncate_before_import'u da kabul ediyor)
     * --------------------------------------------------------- */
    importSqlFile: b.mutation<DbImportResponse, SqlImportFileParams>({
      query: ({ file, truncateBefore }) => {
        const form = new FormData();
        form.append("file", file, file.name);
        if (typeof truncateBefore !== "undefined") {
          form.append("truncateBefore", String(!!truncateBefore));
          // eski alan adına da yazalım (tam uyumluluk)
          form.append("truncate_before_import", String(!!truncateBefore));
        }
        return {
          url: "/admin/db/import-file",
          method: "POST",
          body: form,
        };
      },
    }),

    /* ---------------------------------------------------------
     * (GERİYE DÖNÜK ALIAS)
     * importSql: eski kullanımda file upload bekliyordu.
     * İçeride /admin/db/import-file'a yönlendiriyoruz.
     * --------------------------------------------------------- */
    importSql: b.mutation<
      DbImportResponse,
      { file: File } & Partial<SqlImportParams>
    >({
      query: ({ file, truncate_before_import }) => {
        const form = new FormData();
        form.append("file", file, file.name);
        if (typeof truncate_before_import !== "undefined") {
          form.append("truncateBefore", String(!!truncate_before_import));
          form.append("truncate_before_import", String(!!truncate_before_import));
        }
        return {
          url: "/admin/db/import-file",
          method: "POST",
          body: form,
        };
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useExportSqlMutation,
  useImportSqlTextMutation,
  useImportSqlUrlMutation,
  useImportSqlFileMutation,
  // geriye dönük:
  useImportSqlMutation,
} = dbAdminApi;
