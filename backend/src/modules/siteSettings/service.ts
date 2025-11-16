// =============================================================
// FILE: src/modules/siteSettings/service.ts
// =============================================================

import { db } from "@/db/client";
import { siteSettings } from "./schema";
import { inArray } from "drizzle-orm";
import { env } from "@/core/env";

const SMTP_KEYS = [
  "smtp_host",
  "smtp_port",
  "smtp_username",
  "smtp_password",
  "smtp_from_email",
  "smtp_from_name",
  "smtp_ssl",
] as const;

// ÖRNEK: src/modules/siteSettings/service.ts
export type SmtpSettings = {
  host: string | null;
  port: number | null;
  username: string | null;
  password: string | null;
  fromEmail: string | null;
  fromName: string | null;
  secure: boolean; // smtp_ssl
};

const toBool = (v: string | null | undefined): boolean => {
  if (!v) return false;
  const s = v.toLowerCase();
  return ["1", "true", "yes", "on"].includes(s);
};

export async function getSmtpSettings(): Promise<SmtpSettings> {
  const keys = [
    "smtp_host",
    "smtp_port",
    "smtp_username",
    "smtp_password",
    "smtp_from_email",
    "smtp_from_name",
    "smtp_ssl",
  ] as const;

  const rows = await db
    .select()
    .from(siteSettings)
    .where(inArray(siteSettings.key, keys));

  const map = new Map<string, string>();
  for (const r of rows) {
    // value JSON-string olabilir, onu düz string’e indir.
    let v = r.value as string;
    try {
      const parsed = JSON.parse(v);
      if (typeof parsed === "string" || typeof parsed === "number") {
        v = String(parsed);
      }
    } catch {
      // value zaten plain string
    }
    map.set(r.key, v);
  }

  const host = map.get("smtp_host") ?? null;
  const portStr = map.get("smtp_port") ?? "";
  const port = portStr ? Number(portStr) : null;
  const username = map.get("smtp_username") ?? null;
  const password = map.get("smtp_password") ?? null;
  const fromEmail = map.get("smtp_from_email") ?? null;
  const fromName = map.get("smtp_from_name") ?? null;
  const secure = toBool(map.get("smtp_ssl"));

  return { host, port, username, password, fromEmail, fromName, secure };
}


// ---------------------------------------------------------------------------
// STORAGE SETTINGS (Cloudinary / Local) - site_settings tablosundan
// ---------------------------------------------------------------------------

const STORAGE_KEYS = [
  "storage_driver",
  "storage_local_root",
  "storage_local_base_url",
  "cloudinary_cloud_name",
  "cloudinary_api_key",
  "cloudinary_api_secret",
  "cloudinary_folder",
  "cloudinary_unsigned_preset",
] as const;

export type StorageDriver = "local" | "cloudinary";

export type StorageSettings = {
  driver: StorageDriver;
  localRoot: string | null;
  localBaseUrl: string | null;
  cloudName: string | null;
  apiKey: string | null;
  apiSecret: string | null;
  folder: string | null;
  unsignedUploadPreset: string | null;
};

const toDriver = (raw: string | null | undefined): StorageDriver => {
  const v = (raw || "").trim().toLowerCase();
  if (v === "local") return "local";
  if (v === "cloudinary") return "cloudinary";

  const envDriver = (env.STORAGE_DRIVER || "").toLowerCase();
  if (envDriver === "local") return "local";
  return "cloudinary";
};

export async function getStorageSettings(): Promise<StorageSettings> {
  const rows = await db
    .select()
    .from(siteSettings)
    .where(inArray(siteSettings.key, STORAGE_KEYS));

  const map = new Map<string, string>();
  for (const r of rows) {
    let v = r.value as string;
    try {
      const parsed = JSON.parse(v);
      if (typeof parsed === "string" || typeof parsed === "number") {
        v = String(parsed);
      }
    } catch {
      // plain string ise aynen bırak
    }
    map.set(r.key, v);
  }

  const driver = toDriver(map.get("storage_driver"));

  const localRoot =
    map.get("storage_local_root") ??
    env.LOCAL_STORAGE_ROOT ??
    null;

  const localBaseUrl =
    map.get("storage_local_base_url") ??
    env.LOCAL_STORAGE_BASE_URL ??
    null;

  const cloudName =
    map.get("cloudinary_cloud_name") ??
    env.CLOUDINARY_CLOUD_NAME ??
    env.CLOUDINARY?.cloudName ??
    null;

  const apiKey =
    map.get("cloudinary_api_key") ??
    env.CLOUDINARY_API_KEY ??
    env.CLOUDINARY?.apiKey ??
    null;

  const apiSecret =
    map.get("cloudinary_api_secret") ??
    env.CLOUDINARY_API_SECRET ??
    env.CLOUDINARY?.apiSecret ??
    null;

  const folder =
    map.get("cloudinary_folder") ??
    env.CLOUDINARY_FOLDER ??
    env.CLOUDINARY?.folder ??
    null;

  const unsignedUploadPreset =
    map.get("cloudinary_unsigned_preset") ??
    env.CLOUDINARY_UNSIGNED_PRESET ??
    (env.CLOUDINARY as any)?.unsignedUploadPreset ??
    (env.CLOUDINARY as any)?.uploadPreset ??
    null;

  return {
    driver,
    localRoot,
    localBaseUrl,
    cloudName,
    apiKey,
    apiSecret,
    folder,
    unsignedUploadPreset,
  };
}

