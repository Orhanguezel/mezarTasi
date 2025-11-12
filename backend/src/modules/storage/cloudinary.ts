// src/modules/storage/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
import { env } from "@/core/env";

export type Cfg = {
  cloudName: string;
  apiKey?: string;
  apiSecret?: string;
  uploadPreset?: string;
  defaultFolder?: string;
};

export function getCloudinaryConfig(): Cfg | null {
  const cloudName     = env.CLOUDINARY_CLOUD_NAME || env.CLOUDINARY?.cloudName;
  const apiKey        = env.CLOUDINARY_API_KEY    || env.CLOUDINARY?.apiKey;
  const apiSecret     = env.CLOUDINARY_API_SECRET || env.CLOUDINARY?.apiSecret;
  const uploadPreset  = env.CLOUDINARY_UPLOAD_PRESET || undefined;
  const defaultFolder = env.CLOUDINARY_FOLDER || env.CLOUDINARY?.folder || undefined;

  if (!cloudName) return null;
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return { cloudName, apiKey, apiSecret, uploadPreset, defaultFolder };
}

type UpOpts = { folder?: string; publicId?: string; mime?: string };

function toDataUri(buffer: Buffer, mime?: string) {
  const m = mime && mime.trim() ? mime : "application/octet-stream";
  return `data:${m};base64,${buffer.toString("base64")}`;
}

/** İmzalı (signed) upload — data URI ile (stream yok) */
async function uploadSigned(cfg: Cfg, buffer: Buffer, opts: UpOpts) {
  if (!cfg.apiKey || !cfg.apiSecret) {
    throw Object.assign(new Error("Missing API key/secret for signed upload"), { code: "NO_SIGN_CREDS" });
  }
  const file = toDataUri(buffer, opts.mime);
  return cloudinary.uploader.upload(file, {
    folder: opts.folder ?? cfg.defaultFolder,
    public_id: opts.publicId,
    resource_type: "auto",
  });
}

/** Unsigned (preset ile) upload — data URI */
async function uploadUnsigned(cfg: Cfg, buffer: Buffer, opts: UpOpts) {
  if (!cfg.uploadPreset) {
    throw Object.assign(new Error("CLOUDINARY_UPLOAD_PRESET missing for unsigned upload"), { code: "NO_UNSIGNED_PRESET" });
  }
  const file = toDataUri(buffer, opts.mime);
  return cloudinary.uploader.upload(file, {
    upload_preset: cfg.uploadPreset,
    folder: opts.folder ?? cfg.defaultFolder,
    public_id: opts.publicId,
    resource_type: "auto",
  });
}

/** Basit ve sağlam strateji:
 * - preferSigned=true ve cred var → imzalı dener; 400 “unsigned preset” mesajı gelirse ve preset varsa → unsigned’a düş.
 * - aksi halde cred varsa signed; yoksa preset varsa unsigned; yoksa hata.
 */
export async function uploadBufferAuto(
  cfg: Cfg,
  buffer: Buffer,
  opts: UpOpts,
  preferSigned = false
) {
  if (preferSigned && cfg.apiKey && cfg.apiSecret) {
    try {
      return await uploadSigned(cfg, buffer, opts);
    } catch (e: any) {
      const http = Number(e?.http_code) || 0;
      const msg  = String(e?.message || "");
      const unsignedHint = http === 400 && /Upload preset must be specified/i.test(msg);
      if (unsignedHint && cfg.uploadPreset) {
        return uploadUnsigned(cfg, buffer, opts);
      }
      throw e;
    }
  }

  if (cfg.apiKey && cfg.apiSecret) return uploadSigned(cfg, buffer, opts);
  if (cfg.uploadPreset)           return uploadUnsigned(cfg, buffer, opts);

  throw Object.assign(new Error("Cloudinary not configured (no unsigned preset or api credentials)"), {
    code: "CLOUDINARY_NOT_CONFIGURED",
  });
}

/* Yardımcılar (değişmedi) */
export async function destroyCloudinaryById(publicId: string, resourceType?: string) {
  const tryTypes = resourceType ? [resourceType] : ["image", "video", "raw"];
  for (const rt of tryTypes) {
    try { await cloudinary.uploader.destroy(publicId, { resource_type: rt as any, invalidate: true }); return; }
    catch {}
  }
}

export async function renameCloudinaryPublicId(oldPublicId: string, newPublicId: string, resourceType: string = "image") {
  return cloudinary.uploader.rename(oldPublicId, newPublicId, { resource_type: resourceType as any, overwrite: true });
}

export function buildCloudinaryUrl(cloud: string, publicId: string, folder?: string) {
  const pid = (folder ? `${folder}/` : "") + publicId.replace(/^\/+/, "");
  return `https://res.cloudinary.com/${cloud}/image/upload/${pid}`;
}
