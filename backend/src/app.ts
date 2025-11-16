// src/app.ts
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import authPlugin from "./plugins/authPlugin";
import mysqlPlugin from '@/plugins/mysql';

import type { FastifyInstance } from 'fastify';
import { env } from '@/core/env';
import { registerErrorHandlers } from '@/core/error';

// Public modüller
import { registerAuth } from '@/modules/auth/router';
import { registerStorage } from '@/modules/storage/router';
import { registerProfiles } from '@/modules/profiles/router';
import { registerCategories } from '@/modules/categories/router';
import { registerSubCategories } from '@/modules/subcategories/router';
import { registerProducts } from '@/modules/products/router';
import { registerCustomPages } from '@/modules/customPages/router';
import { registerSiteSettings } from '@/modules/siteSettings/router';
import { registerUserRoles } from "@/modules/userRoles/router";
import { registerInfoCards } from "@/modules/info_cards/router";
import { registerAnnouncements } from "@/modules/announcements/router";
import { registerSimpleCampaigns } from "@/modules/campaigns/router";
import { registerCemeteries } from "@/modules/cemeteries/router";
import { registerRecentWorks } from "@/modules/recent_works/router";
import { registerFaqs } from "@/modules/faqs/router";
import { registerServices } from "@/modules/services/router";
import { registerReviews } from "@/modules/review/router";
import { registerContacts } from "@/modules/contact/router";
import { registerAccessories } from "@/modules/accessories/router";
import { registerSlider } from "@/modules/slider/router";
import { registerMail } from "@/modules/mail/router";

// Admin modüller
import { registerProductsAdmin } from "@/modules/products/admin.routes";
import { registerCustomPagesAdmin } from "@/modules/customPages/admin.routes";
import { registerSiteSettingsAdmin } from '@/modules/siteSettings/admin.routes';
import { registerUserAdmin } from "@/modules/auth/admin.routes";
import { registerCampaignsAdmin } from "@/modules/campaigns/admin.routes";
import { registerAnnouncementsAdmin } from "@/modules/announcements/admin.routes";
import { registerInfoCardsAdmin } from "@/modules/info_cards/admin.routes";
import { registerCemeteriesAdmin } from "@/modules/cemeteries/admin.routes";
import { registerRecentWorksAdmin } from "@/modules/recent_works/admin.routes";
import { registerFaqsAdmin } from "@/modules/faqs/admin.routes";
import { registerServicesAdmin } from "@/modules/services/admin.routes";
import { registerReviewsAdmin } from "@/modules/review/admin.routes";
import { registerContactsAdmin } from "@/modules/contact/admin.routes";
import { registerAccessoriesAdmin } from "@/modules/accessories/admin.routes";
import { registerSliderAdmin } from "@/modules/slider/admin.routes";
import { registerStorageAdmin } from '@/modules/storage/admin.routes';
import { registerCategoriesAdmin } from '@/modules/categories/admin.routes';
import { registerSubCategoriesAdmin } from '@/modules/subcategories/admin.routes';
import { registerDbAdmin } from "@/modules/db_admin/admin.routes";

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
      'Content-Type', 'Authorization', 'Prefer', 'Accept', 'Accept-Language',
      'x-skip-auth', 'Range',
    ],
    exposedHeaders: ['x-total-count', 'content-range', 'range'],
  });

  // --- Cookie ---
  const cookieSecret =
    (globalThis as any).Bun?.env?.COOKIE_SECRET ??
    process.env.COOKIE_SECRET ?? 'cookie-secret';

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

  // 🔒 Guard & 🗄️ MySQL
  await app.register(authPlugin);
  await app.register(mysqlPlugin);

  // Health hem kökte hem /api altında
  app.get('/health', async () => ({ ok: true }));
  app.get('/api/health', async () => ({ ok: true }));

  // Multipart
  await app.register(multipart, {
    throwFileSizeLimit: true,
    limits: { fileSize: 20 * 1024 * 1024 },
  });

  // === TÜM ROUTER’LARI /api ALTINDA TOPLA ===
  await app.register(async (api) => {
    // --- Admin modüller → /api/admin/...
    await api.register(registerProductsAdmin, { prefix: "/admin" });
    await api.register(registerCustomPagesAdmin, { prefix: "/admin" });
    await api.register(registerSiteSettingsAdmin, { prefix: "/admin" });
    await api.register(registerUserAdmin, { prefix: "/admin" });
    await api.register(registerCampaignsAdmin, { prefix: "/admin" });
    await api.register(registerAnnouncementsAdmin, { prefix: "/admin" });
    await api.register(registerInfoCardsAdmin, { prefix: "/admin" });
    await api.register(registerCemeteriesAdmin, { prefix: "/admin" });
    await api.register(registerRecentWorksAdmin, { prefix: "/admin" });
    await api.register(registerFaqsAdmin, { prefix: "/admin" });
    await api.register(registerServicesAdmin, { prefix: "/admin" });
    await api.register(registerReviewsAdmin, { prefix: "/admin" });
    await api.register(registerContactsAdmin, { prefix: "/admin" });
    await api.register(registerAccessoriesAdmin, { prefix: "/admin" });
    await api.register(registerSliderAdmin, { prefix: "/admin" });
    await api.register(registerStorageAdmin, { prefix: "/admin" });
    await api.register(registerCategoriesAdmin, { prefix: "/admin" });
    await api.register(registerSubCategoriesAdmin, { prefix: "/admin" });
    await api.register(registerDbAdmin, { prefix: "/admin" });


    // --- Public modüller → /api/...
    await registerAuth(api);
    await registerStorage(api);
    await registerProfiles(api);
    await registerCategories(api);
    await registerSubCategories(api);
    await registerProducts(api);
    await registerCustomPages(api);
    await registerSiteSettings(api);
    await registerUserRoles(api);
    await registerInfoCards(api);
    await registerAnnouncements(api);
    await registerSimpleCampaigns(api);
    await registerCemeteries(api);
    await registerRecentWorks(api);
    await registerFaqs(api);
    await registerServices(api);
    await registerReviews(api);
    await registerContacts(api);
    await registerAccessories(api);
    await registerSlider(api);
    await registerMail(api);
  }, { prefix: "/api" });

  registerErrorHandlers(app);
  return app;
}
