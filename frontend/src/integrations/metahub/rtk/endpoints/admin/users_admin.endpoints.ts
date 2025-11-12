import { baseApi } from "../../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type { UserRoleName } from "../../../db/types/users";

export type AdminSetUserEmailBody = { email: string };
export type AdminSetUserPasswordBody = { password: string; force_logout?: boolean };

/* ---------- helpers (type-safe) ---------- */
const toIso = (x: unknown): string => new Date(x as string | number | Date).toISOString();
const toBool = (x: unknown): boolean =>
  typeof x === "boolean" ? x : Number(x as unknown) === 1;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const tryParse = <T>(x: unknown): T => {
  if (typeof x === "string") {
    try {
      return JSON.parse(x) as T;
    } catch {
      /* keep original */
    }
  }
  return x as T;
};

const toRoleName = (v: unknown): UserRoleName | null => {
  const s = String(v ?? "").toLowerCase();
  return s === "admin" || s === "moderator" || s === "user" ? (s as UserRoleName) : null;
};

const joinComma = (ids: string[]) => ids.filter(Boolean).map(String).join(",");

type UnknownRec = Record<string, unknown>;
const asArrayOfRecord = (x: unknown): UnknownRec[] => {
  if (Array.isArray(x)) return x.filter(isRecord) as UnknownRec[];
  if (isRecord(x) && Array.isArray((x as { data?: unknown }).data)) {
    const arr = (x as { data: unknown[] }).data;
    return arr.filter(isRecord) as UnknownRec[];
  }
  return [];
};

/* ---------- Types ---------- */
export type User = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  is_active: boolean;
  roles: UserRoleName[];
  metadata: Record<string, unknown> | null;
  created_at: string;
  last_login_at: string | null;
};

export type ApiUser = {
  id: string | number;
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;

  is_active: boolean | 0 | 1 | "0" | "1";

  role?: UserRoleName | string | null;
  roles?: Array<UserRoleName | string> | string | null;

  metadata?: string | Record<string, unknown> | null;

  created_at: string | number | Date;

  last_login_at?: string | number | Date | null;
  last_sign_in_at?: string | number | Date | null;
};

/* ---------- Normalizer ---------- */
const normalizeUser = (u: ApiUser): User => {
  let roles: UserRoleName[] = [];
  if (Array.isArray(u.roles)) {
    roles = u.roles.map(toRoleName).filter((r): r is UserRoleName => Boolean(r));
  } else if (typeof u.roles === "string") {
    const parsed = tryParse<Array<string>>(u.roles);
    if (Array.isArray(parsed)) {
      roles = parsed.map(toRoleName).filter((r): r is UserRoleName => Boolean(r));
    } else {
      const single = toRoleName(parsed);
      if (single) roles = [single];
    }
  } else if (u.role) {
    const single = toRoleName(u.role);
    if (single) roles = [single];
  }

  const metadata =
    u.metadata == null
      ? null
      : (isRecord(u.metadata)
          ? (u.metadata as Record<string, unknown>)
          : tryParse<Record<string, unknown>>(u.metadata));

  const lastRaw = u.last_login_at ?? u.last_sign_in_at ?? null;

  return {
    id: String(u.id),
    email: String(u.email ?? ""),
    full_name: u.full_name ?? null,
    phone: u.phone ?? null,
    is_active: toBool(u.is_active),
    roles,
    metadata,
    created_at: toIso(u.created_at),
    last_login_at: lastRaw == null ? null : toIso(lastRaw),
  };
};

/* ---------- Queries/Mutations ---------- */
export type UsersListParams = {
  q?: string;
  role?: UserRoleName | string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  sort?: "created_at" | "email" | "last_login_at";
  order?: "asc" | "desc";
};

export type UpdateUserBody = Partial<
  Pick<User, "full_name" | "phone" | "metadata" | "is_active">
> & { roles?: UserRoleName[] };

export type InviteUserBody = { email: string; full_name?: string; roles?: UserRoleName[] };

export const usersAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
   listUsersAdmin: b.query<User[], UsersListParams | void>({
  query: (params) => {
    const args: FetchArgs = { url: "/admin/users" };
    if (params) {
      const raw: Record<string, unknown> = {
        ...params,
        ...(params.is_active == null ? {} : { is_active: params.is_active ? 1 : 0 }),
      };

      // ❗ undefined/null/"" değerleri at
      const qp = Object.fromEntries(
        Object.entries(raw).filter(([, v]) => v !== undefined && v !== null && v !== "")
      );

      if (Object.keys(qp).length > 0) {
        args.params = qp as Record<string, any>;
      }
    }
    return args;
  },
      transformResponse: (res: unknown): User[] => {
        const rows = asArrayOfRecord(res);
        return rows.map((r) =>
          normalizeUser({
            id: r.id as string | number,
            email: (typeof r.email === "string" ? r.email : null) ?? null,
            full_name: (typeof r.full_name === "string" ? r.full_name : null) ?? null,
            phone: (typeof r.phone === "string" ? r.phone : null) ?? null,
            is_active:
              typeof r.is_active === "string" || typeof r.is_active === "number" || typeof r.is_active === "boolean"
                ? (r.is_active as boolean | 0 | 1 | "0" | "1")
                : 1,
            role: typeof r.role === "string" ? r.role : null,
            roles: Array.isArray(r.roles)
              ? (r.roles as Array<string>)
              : (typeof r.roles === "string" ? r.roles : null),
            metadata: isRecord(r.metadata) || typeof r.metadata === "string" ? r.metadata : null,
            created_at: (r.created_at as string | number | Date) ?? new Date().toISOString(),
            last_login_at: (r as { last_login_at?: unknown }).last_login_at as
              | string
              | number
              | Date
              | null,
            last_sign_in_at: (r as { last_sign_in_at?: unknown }).last_sign_in_at as
              | string
              | number
              | Date
              | null,
          })
        );
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((u) => ({ type: "User" as const, id: u.id })),
              { type: "Users" as const, id: "LIST" },
            ]
          : [{ type: "Users" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getUserAdmin: b.query<User, string>({
      query: (id) => ({ url: `/admin/users/${encodeURIComponent(id)}` }),
      transformResponse: (res: unknown): User => {
        const [row] = asArrayOfRecord([res]).length ? asArrayOfRecord([res]) : [res as unknown];
        const r = isRecord(row) ? row : {};
        return normalizeUser({
          id: (r.id as string | number) ?? "",
          email: (typeof r.email === "string" ? r.email : null) ?? null,
          full_name: (typeof r.full_name === "string" ? r.full_name : null) ?? null,
          phone: (typeof r.phone === "string" ? r.phone : null) ?? null,
          is_active:
            typeof r.is_active === "string" || typeof r.is_active === "number" || typeof r.is_active === "boolean"
              ? (r.is_active as boolean | 0 | 1 | "0" | "1")
              : 1,
          role: typeof r.role === "string" ? r.role : null,
          roles: Array.isArray(r.roles)
            ? (r.roles as Array<string>)
            : (typeof r.roles === "string" ? r.roles : null),
          metadata: isRecord(r.metadata) || typeof r.metadata === "string" ? r.metadata : null,
          created_at: (r.created_at as string | number | Date) ?? new Date().toISOString(),
          last_login_at: (r as { last_login_at?: unknown }).last_login_at as
            | string
            | number
            | Date
            | null,
          last_sign_in_at: (r as { last_sign_in_at?: unknown }).last_sign_in_at as
            | string
            | number
            | Date
            | null,
        });
      },
      providesTags: (_r, _e, id) => [{ type: "User", id }],
    }),

    // (opsiyonel; BE'de route yoksa kullanma)
   inviteUserAdmin: b.mutation<{ ok: true; id?: string }, InviteUserBody>({
  query: (body) => ({ url: "/admin/users/invite", method: "POST", body }),
  transformResponse: (r: unknown): { ok: true; id?: string } => {
    const rec = isRecord(r) ? (r as Record<string, unknown>) : {};
    const raw = rec.id;
    const id =
      typeof raw === "string" ? raw :
      raw != null ? String(raw) :
      undefined;

    // id yoksa hiç ekleme (undefined property gönderme!)
    return { ok: true as const, ...(id ? { id } : {}) };
  },
  invalidatesTags: [{ type: "Users" as const, id: "LIST" }],
}),


    updateUserAdmin: b.mutation<User, { id: string; body: UpdateUserBody }>({
      query: ({ id, body }) => ({
        url: `/admin/users/${encodeURIComponent(id)}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: unknown): User => {
        const r = isRecord(res) ? (res as Record<string, unknown>) : {};
        return normalizeUser({
          id: (r.id as string | number) ?? "",
          email: (typeof r.email === "string" ? r.email : null) ?? null,
          full_name: (typeof r.full_name === "string" ? r.full_name : null) ?? null,
          phone: (typeof r.phone === "string" ? r.phone : null) ?? null,
          is_active:
            typeof r.is_active === "string" || typeof r.is_active === "number" || typeof r.is_active === "boolean"
              ? (r.is_active as boolean | 0 | 1 | "0" | "1")
              : 1,
          role: typeof r.role === "string" ? r.role : null,
          roles: Array.isArray(r.roles)
            ? (r.roles as Array<string>)
            : (typeof r.roles === "string" ? r.roles : null),
          metadata: isRecord(r.metadata) || typeof r.metadata === "string" ? r.metadata : null,
          created_at: (r.created_at as string | number | Date) ?? new Date().toISOString(),
          last_login_at: (r as { last_login_at?: unknown }).last_login_at as
            | string
            | number
            | Date
            | null,
          last_sign_in_at: (r as { last_sign_in_at?: unknown }).last_sign_in_at as
            | string
            | number
            | Date
            | null,
        });
      },
      invalidatesTags: (_r, _e, arg) => [
        { type: "User", id: arg.id },
        { type: "Users", id: "LIST" },
      ],
    }),

    setUserActiveAdmin: b.mutation<{ ok: true }, { id: string; is_active: boolean }>({
      query: ({ id, is_active }) => ({
        url: `/admin/users/${encodeURIComponent(id)}/active`,
        method: "POST",
        body: { is_active: is_active ? 1 : 0 },
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "User", id: arg.id },
        { type: "Users", id: "LIST" },
      ],
    }),

    setUserRolesAdmin: b.mutation<{ ok: true }, { id: string; roles: UserRoleName[] }>({
      query: ({ id, roles }) => ({
        url: `/admin/users/${encodeURIComponent(id)}/roles`,
        method: "POST",
        body: { roles },
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "User", id: arg.id },
        { type: "Users", id: "LIST" },
        { type: "Roles", id: "LIST" },
      ],
    }),

    /** Mini liste: sadece id, full_name, email (ids ile filtre) */
    listUsersAdminMini: b.query<
      Array<{ id: string; full_name: string | null; email: string }>,
      string[]
    >({
      query: (ids) => {
        const args: FetchArgs = { url: "/admin/users" };
        const qp = { ids: joinComma(ids), fields: "id,full_name,email" };
        if (qp.ids) args.params = qp as Record<string, any>;
        return args;
      },
      transformResponse: (res: unknown) => {
        const rows = asArrayOfRecord(res);
        return rows.map((u) => ({
          id: String(u.id ?? ""),
          full_name: typeof u.full_name === "string" ? u.full_name : null,
          email: String(u.email ?? ""),
        }));
      },
      keepUnusedDataFor: 30,
      providesTags: (result) =>
        result
          ? result.map((u) => ({ type: "User" as const, id: u.id }))
          : [],
    }),

/** EMAIL değiştir (PATCH /admin/users/:id/email) */
    adminSetUserEmail: b.mutation<
      { ok: true; email: string },
      { id: string; body: AdminSetUserEmailBody }
    >({
      query: ({ id, body }): FetchArgs => ({
        url: `/admin/users/${encodeURIComponent(id)}/email`,
        method: "PATCH",
        body,
      }),
      transformResponse: (r: unknown): { ok: true; email: string } => {
        const rec = (r ?? {}) as Record<string, unknown>;
        const emailVal =
          typeof rec.email === "string" ? rec.email :
          typeof rec.new_email === "string" ? rec.new_email :
          "";
        return { ok: true as const, email: emailVal };
      },
      invalidatesTags: (_r, _e, arg) => [{ type: "User", id: arg.id }, { type: "Users", id: "LIST" }],
    }),

    /** ŞİFRE değiştir (PATCH /admin/users/:id/password) */
    adminSetUserPassword: b.mutation<
      { ok: true },
      { id: string; body: AdminSetUserPasswordBody }
    >({
      query: ({ id, body }): FetchArgs => ({
        url: `/admin/users/${encodeURIComponent(id)}/password`,
        method: "PATCH",
        body,
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [{ type: "User", id: arg.id }],
    }),




    deleteUserAdmin: b.mutation<{ ok: true }, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/users/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "User", id: arg.id },
        { type: "Users", id: "LIST" },
        { type: "AdminUsers", id: arg.id },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListUsersAdminQuery,
  useGetUserAdminQuery,
  useInviteUserAdminMutation,
  useUpdateUserAdminMutation,
  useSetUserActiveAdminMutation,
  useSetUserRolesAdminMutation,
  useListUsersAdminMiniQuery,
  useDeleteUserAdminMutation,
  useAdminSetUserEmailMutation,
  useAdminSetUserPasswordMutation,
} = usersAdminApi;
