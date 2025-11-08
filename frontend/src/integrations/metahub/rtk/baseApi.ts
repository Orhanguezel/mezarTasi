// =============================================================
// FILE: src/integrations/metahub/rtk/baseApi.ts
// =============================================================
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from "@reduxjs/toolkit/query";
import { metahubTags } from "./tags";
import { tokenStore } from "@/integrations/metahub/core/token";
import { BASE_URL as DB_BASE_URL } from "@/integrations/metahub/db/from/constants";

/* ---------- Base URL resolve ---------- */
function trimSlash(x: string) {
  return x.replace(/\/+$/, "");
}
function guessDevBackend(): string {
  try {
    const loc = typeof window !== "undefined" ? window.location : null;
    const host = loc?.hostname || "localhost";
    const proto = loc?.protocol || "http:";
    return `${proto}//${host}:8081`;
  } catch {
    return "http://localhost:8081";
  }
}
const BASE_URL = trimSlash(DB_BASE_URL || (import.meta.env.DEV ? guessDevBackend() : "/api"));

/* ---------- helpers & guards ---------- */
type AnyArgs = string | FetchArgs;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// Cross-realm FormData guard
function isProbablyFormData(b: unknown): boolean {
  return !!b && typeof b === "object" && typeof (b as any).append === "function";
}

// JSON body tespiti (FormData/Blob/ArrayBuffer hariç)
function isJsonLikeBody(b: unknown): b is Record<string, unknown> {
  if (typeof FormData !== "undefined" && b instanceof FormData) return false;
  if (typeof Blob !== "undefined" && b instanceof Blob) return false;
  if (typeof ArrayBuffer !== "undefined" && b instanceof ArrayBuffer) return false;
  if (isProbablyFormData(b)) return false;
  return isRecord(b);
}

const AUTH_SKIP_REAUTH = new Set<string>([
  "/auth/v1/token",
  "/auth/v1/signup",
  "/auth/v1/google",
  "/auth/v1/google/start",
  "/auth/v1/token/refresh",
  "/auth/v1/logout",
]);

function extractPath(u: string): string {
  try {
    if (/^https?:\/\//i.test(u)) {
      const url = new URL(u);
      return url.pathname.replace(/\/+$/, "");
    }
    return u.replace(/^https?:\/\/[^/]+/i, "").replace(/\/+$/, "");
  } catch {
    return u.replace(/\/+$/, "");
  }
}

/* ---------- Base Query ---------- */
type RBQ = BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, unknown, FetchBaseQueryMeta>;

const rawBaseQuery: RBQ = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    // x-skip-auth → Authorization ekleme
    if (headers.get("x-skip-auth") === "1") {
      headers.delete("x-skip-auth");
      if (!headers.has("Accept")) headers.set("Accept", "application/json");
      if (!headers.has("Accept-Language")) {
        const lang =
          (import.meta.env.VITE_DEFAULT_LOCALE as string | undefined) ??
          (typeof navigator !== "undefined" ? navigator.language : "tr");
        headers.set("Accept-Language", lang || "tr");
      }
      return headers;
    }

    // Bearer token
    const token =
      tokenStore.get() || (typeof window !== "undefined" ? localStorage.getItem("mh_access_token") || "" : "");
    if (token && !headers.has("authorization")) {
      headers.set("authorization", `Bearer ${token}`);
    }

    if (!headers.has("Accept")) headers.set("Accept", "application/json");
    if (!headers.has("Accept-Language")) {
      const lang =
        (import.meta.env.VITE_DEFAULT_LOCALE as string | undefined) ??
        (typeof navigator !== "undefined" ? navigator.language : "tr");
      headers.set("Accept-Language", lang || "tr");
    }
    return headers;
  },
  responseHandler: async (response) => {
    const ct = response.headers.get("content-type") || "";
    if (ct.includes("application/json")) return response.json();
    if (ct.includes("text/")) return response.text();
    try {
      const t = await response.text();
      return t || null;
    } catch {
      return null;
    }
  },
  validateStatus: (res) => res.ok,
}) as RBQ;

/* ---------- 401 → refresh → retry ---------- */
type RawResult = Awaited<ReturnType<typeof rawBaseQuery>>;

// Body tipine göre doğru Content-Type davranışı
function ensureProperHeaders(fa: FetchArgs): FetchArgs {
  const next: FetchArgs = { ...fa };
  const hdr = (next.headers as Record<string, string>) ?? {};

  if (isJsonLikeBody(next.body)) {
    next.headers = { ...hdr, "Content-Type": "application/json" };
  } else {
    // FormData/Blob ise, boundary'yi fetch ayarlasın diye Content-Type'ı zorlamayalım
    if (hdr["Content-Type"]) {
      const { ["Content-Type"]: _omit, ...rest } = hdr;
      next.headers = rest;
    }
  }
  return next;
}

const baseQueryWithReauth: RBQ = async (args, _api, extra) => {
  let req: AnyArgs = args;
  const path = typeof req === "string" ? req : req.url || "";
  const cleanPath = extractPath(path);

  if (typeof req !== "string") {
    if (AUTH_SKIP_REAUTH.has(cleanPath)) {
      const orig = (req.headers as Record<string, string> | undefined) ?? {};
      req.headers = { ...orig, "x-skip-auth": "1" };
    }
    req = ensureProperHeaders(req);
  }

  let result: RawResult = await rawBaseQuery(req, _api, extra);

  if (result.error?.status === 401 && !AUTH_SKIP_REAUTH.has(cleanPath)) {
    const refreshRes = await rawBaseQuery(
      { url: "/auth/v1/token/refresh", method: "POST", headers: { "x-skip-auth": "1", Accept: "application/json" } },
      _api,
      extra
    );

    if (!refreshRes.error) {
      const access_token = (refreshRes.data as { access_token?: string } | undefined)?.access_token;

      if (access_token) {
        tokenStore.set(access_token);
        try {
          localStorage.setItem("mh_access_token", access_token);
        } catch {}

        let retry: AnyArgs = args;
        if (typeof retry !== "string") {
          if (AUTH_SKIP_REAUTH.has(cleanPath)) {
            const orig = (retry.headers as Record<string, string> | undefined) ?? {};
            retry.headers = { ...orig, "x-skip-auth": "1" };
          }
          retry = ensureProperHeaders(retry);
        }
        result = await rawBaseQuery(retry, _api, extra);
      } else {
        tokenStore.set(null);
        try {
          localStorage.removeItem("mh_access_token");
          localStorage.removeItem("mh_refresh_token");
        } catch {}
      }
    } else {
      tokenStore.set(null);
      try {
        localStorage.removeItem("mh_access_token");
        localStorage.removeItem("mh_refresh_token");
      } catch {}
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "metahubApi",
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
  tagTypes: metahubTags,
});

export { rawBaseQuery };
