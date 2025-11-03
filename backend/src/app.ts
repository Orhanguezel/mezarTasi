import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import authPlugin from "./plugins/authPlugin";
import mysqlPlugin from '@/plugins/mysql';

import type { FastifyInstance } from 'fastify';
import { env } from '@/core/env';
import { registerErrorHandlers } from '@/core/error';

// Modüller
import { registerAuth } from '@/modules/auth/router';
import { registerStorage } from '@/modules/storage/router';
import { registerProfiles } from '@/modules/profiles/router';
import { registerCategories } from '@/modules/categories/router';
import { registerSubCategories } from '@/modules/subcategories/router';
import { registerProducts } from '@/modules/products/router';
import { registerCustomPages } from '@/modules/customPages/router';
import { registerMenuItems } from '@/modules/menuItems/router';
import { registerMenuItemsAdmin } from '@/modules/menuItems/admin.routes';
import { registerBlog } from '@/modules/blog/router';
import { registerSiteSettings } from '@/modules/siteSettings/router';
import { registerPopups } from '@/modules/popups/router';
import { registerUserRoles } from "@/modules/userRoles/router";
import { registerFooterSections } from "@/modules/footerSections/router";
import { registerProductsAdmin } from "@/modules/products/admin.routes";
import { registerBlogAdmin } from "@/modules/blog/admin.routes";
import { registerCustomPagesAdmin } from "@/modules/customPages/admin.routes";
import { registerSiteSettingsAdmin } from '@/modules/siteSettings/admin.routes';
import { registerPopupsAdmin } from '@/modules/popups/admin.routes';
import { registerUserAdmin } from "@/modules/auth/admin.routes";

function parseCorsOrigins(v?: string | string[]): boolean | string[] {
  if (!v) return true;
  if (Array.isArray(v)) return v;
  const s = String(v).trim();
  if (!s) return true;
  const arr = s.split(",").map(x => x.trim()).filter(Boolean);
  return arr.length ? arr : true;
}

export async function createApp() {
  const { default: buildFastify } =
    (await import('fastify')) as unknown as {
      default: (opts?: Parameters<FastifyInstance['log']['child']>[0]) => FastifyInstance
    };

  const app = buildFastify({
    logger: env.NODE_ENV !== 'production',
  }) as FastifyInstance;

  // --- CORS ---
  await app.register(cors, {
  origin: parseCorsOrigins(env.CORS_ORIGIN as any),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Prefer',
    'Accept',
    'Accept-Language',
    'x-skip-auth',
    'Range',
  ],
  exposedHeaders: ['x-total-count', 'content-range', 'range'],
});




  // --- Cookie ---
  const cookieSecret =
    (globalThis as any).Bun?.env?.COOKIE_SECRET ??
    process.env.COOKIE_SECRET ??
    'cookie-secret';

  await app.register(cookie, {
    secret: cookieSecret,
    hook: 'onRequest',
    parseOptions: {
      httpOnly: true,
      path: '/',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: env.NODE_ENV === 'production',
    },
  });

  // --- JWT ---
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: 'access_token', signed: false },
  });

  // 🔒 Guard
  await app.register(authPlugin);
  // 🗄️ MySQL
  await app.register(mysqlPlugin);

  // Public health
  app.get('/health', async () => ({ ok: true }));

  // Multipart
  await app.register(multipart, {
    throwFileSizeLimit: true,
    limits: { fileSize: 20 * 1024 * 1024 },
  });

  // Modüller
  await registerProductsAdmin(app);
  await registerBlogAdmin(app);
  await registerCustomPagesAdmin(app);
  await registerSiteSettingsAdmin(app);
  await registerPopupsAdmin(app);
  await registerUserAdmin(app);
  await registerMenuItems(app);
  await registerMenuItemsAdmin(app);
  await registerAuth(app);
  await registerStorage(app);
  await registerProfiles(app);
  await registerCategories(app);
  await registerSubCategories(app);
  await registerProducts(app);
  await registerCustomPages(app);
  await registerBlog(app);
  await registerSiteSettings(app);
  await registerPopups(app);
  await registerUserRoles(app);
  await registerFooterSections(app);

  registerErrorHandlers(app);
  return app;
}
