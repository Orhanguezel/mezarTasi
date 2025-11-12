// =============================================================
// Admin Storage — list/get/create(multipart)/bulkCreate/patch/delete/bulkDelete/folders/diag
// =============================================================
import { baseApi } from "@/integrations/metahub/rtk/baseApi";
import type {
  StorageAsset,
  StorageUpdateInput,
  StorageListQuery,
} from "@/integrations/metahub/db/types/storage";

type ListResponse = { items: StorageAsset[]; total: number };

// NULL-güvenli tag helper (concat yerine düz dizi literal → TS uyumlu)
const listTags = (items?: StorageAsset[]) =>
  items && items.length
    ? [
        { type: "Storage" as const, id: "LIST" as const },
        ...items.map((r) => ({ type: "Storage" as const, id: r.id })),
      ]
    : [{ type: "Storage" as const, id: "LIST" as const }];

export const storageAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listAssetsAdmin: builder.query<ListResponse, Partial<StorageListQuery> | void>({
      query: (q) => ({
        url: "/admin/storage/assets",
        method: "GET",
        params: q ?? {},
      }),
      transformResponse: (data: StorageAsset[], meta) => {
        const headers = meta?.response?.headers;
        const totalStr =
          headers?.get?.("x-total-count") ||
          headers?.get?.("X-Total-Count") ||
          undefined;
        const total = totalStr ? Number(totalStr) : data?.length ?? 0;
        return { items: data ?? [], total };
      },
      providesTags: (res) => listTags(res?.items),
    }),

    getAssetAdmin: builder.query<StorageAsset, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/storage/assets/${encodeURIComponent(id)}`,
        method: "GET",
      }),
      providesTags: (res) => (res ? [{ type: "Storage", id: res.id }] : []),
    }),

    // Tekli create (multipart)
    createAssetAdmin: builder.mutation<
      StorageAsset,
      { file: File; bucket: string; folder?: string; metadata?: Record<string, string> | null }
    >({
      async queryFn(args, _api, _extra, baseQuery) {
        try {
          const fd = new FormData();
          fd.append("file", args.file, args.file.name);
          fd.append("bucket", args.bucket);
          if (args.folder) fd.append("folder", args.folder);
          if (args.metadata) fd.append("metadata", JSON.stringify(args.metadata));

          const res = await baseQuery({
            url: "/admin/storage/assets",
            method: "POST",
            body: fd,
          });

          if (res.error) return { error: res.error as any };
          return { data: res.data as StorageAsset };
        } catch (e: any) {
          return {
            error: {
              status: e?.status || 500,
              data: e?.data || { message: e?.message || "create_failed" },
            } as any,
          };
        }
      },
      invalidatesTags: (res) =>
        res
          ? [{ type: "Storage", id: res.id }, { type: "Storage", id: "LIST" }]
          : [{ type: "Storage", id: "LIST" }],
    }),

    // Çoklu create (multipart; form-level bucket/folder/metadata + birden çok file)
    bulkCreateAssetsAdmin: builder.mutation<
      { count: number; items: Array<StorageAsset | { file: string; error: any }> },
      { files: File[]; bucket: string; folder?: string; metadata?: Record<string, string> | null }
    >({
      async queryFn(args, _api, _extra, baseQuery) {
        try {
          const fd = new FormData();
          fd.append("bucket", args.bucket);
          if (args.folder) fd.append("folder", args.folder);
          if (args.metadata) fd.append("metadata", JSON.stringify(args.metadata));
          for (const f of args.files) fd.append("files", f, f.name);

          const res = await baseQuery({
            url: "/admin/storage/assets/bulk",
            method: "POST",
            body: fd,
          });

          if (res.error) return { error: res.error as any };
          return { data: res.data as any };
        } catch (e: any) {
          return {
            error: {
              status: e?.status || 500,
              data: e?.data || { message: e?.message || "bulk_create_failed" },
            } as any,
          };
        }
      },
      invalidatesTags: () => [{ type: "Storage", id: "LIST" }],
    }),

    patchAssetAdmin: builder.mutation<StorageAsset, { id: string; body: StorageUpdateInput }>({
      query: ({ id, body }) => ({
        url: `/admin/storage/assets/${encodeURIComponent(id)}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "Storage", id: arg.id },
        { type: "Storage", id: "LIST" },
      ],
    }),

    deleteAssetAdmin: builder.mutation<{ ok: true } | void, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/storage/assets/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "Storage", id: arg.id },
        { type: "Storage", id: "LIST" },
      ],
    }),

    bulkDeleteAssetsAdmin: builder.mutation<{ deleted: number }, { ids: string[] }>({
      query: ({ ids }) => ({
        url: "/admin/storage/assets/bulk-delete",
        method: "POST",
        body: { ids },
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "Storage", id: "LIST" },
        ...arg.ids.map((id) => ({ type: "Storage" as const, id })),
      ],
    }),

    listFoldersAdmin: builder.query<string[], void>({
      query: () => ({ url: "/admin/storage/folders", method: "GET" }),
      providesTags: () => [{ type: "Storage", id: "FOLDERS" }],
    }),

    diagCloudinaryAdmin: builder.query<
      { ok: boolean; cloud: string; uploaded?: { public_id: string; secure_url: string } },
      void
    >({
      query: () => ({ url: "/admin/storage/_diag/cloud", method: "GET" }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useListAssetsAdminQuery,
  useGetAssetAdminQuery,
  useCreateAssetAdminMutation,
  useBulkCreateAssetsAdminMutation,
  usePatchAssetAdminMutation,
  useDeleteAssetAdminMutation,
  useBulkDeleteAssetsAdminMutation,
  useListFoldersAdminQuery,
  useDiagCloudinaryAdminQuery,
} = storageAdminApi;
