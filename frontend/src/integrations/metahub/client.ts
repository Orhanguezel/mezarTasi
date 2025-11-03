// =============================================================
// FILE: src/integrations/metahub/client.ts
// =============================================================
import { auth } from "./client/auth/client";
import { user_roles } from "./client/user_roles/client";
import { categories } from "./client/categories/client";
import { settings } from "./client/settings/client";
import { storage} from "./client/storage/client";
import { coupons } from "./client/coupons/client";
import { blog } from "./client/blog/client";
import { settings2 } from "./client/site-settings/client";


import * as qa from "./qa/checklist";
import * as cachePolicy from "./rtk/helpers/cachePolicy";
import { enableAutoRefetch } from "./rtk/helpers/autorefresh";
import * as selectUtil from "./rtk/helpers/selectFromResult";
import * as featureFlags from "./feature-flags/featureFlags";
import { useFeatureFlag } from "./feature-flags/useFeatureFlag";
import { health } from "./client/health/client";
import * as notify from "./ui/toast/helpers";
import * as bulk from "./utils/bulk";
import * as dsl from "./search/dsl";
import * as routePrefetch from "./rtk/helpers/routePrefetch";
import { notifications } from "./client/notifications/client";
import * as exportsUtil from "./utils/exports";
import * as rbac from "./utils/rbac";
import * as seoMeta from "./seo/meta";
import * as seoJsonld from "./seo/jsonld";
import { uploader } from "./client/uploader/client";
import { menu_items } from "./client/menu_items/client";
import { popups } from "./client/popup/client";
import { topbar_settings } from "./client/topbar_settings/client";
import { footer_sections } from "./client/footerSections/client";
import { custom_pages } from "./client/customPages/client";
import { support_tickets } from "./client/support/client";
import { profilesClient } from "./client/profiles/client";

import { siteSettingsAdmin } from "./client/admin/siteSettings";
import { categoriesAdmin } from "./client/admin/categories";
import { productsAdmin } from "./client/admin/products";
import { blogAdmin } from "./client/admin/blog";
import { couponsAdmin } from "./client/admin/coupons";
import { campaignsAdmin } from "./client/admin/campaigns";

import { usersAdmin } from "./client/admin/users";
import { storageAdmin } from "./client/admin/storage";

import { baseApi } from "./rtk/baseApi";
import * as rtk from "./rtk";
import { from as fromDb, type FromFn } from "./db/from";

export const metahub = {
  // Facades
  auth,
  categories,
  settings,
  storage,
  coupons,
  blog,
  settings2,
  uploader,
  qa,
  cachePolicy,
  enableAutoRefetch,
  selectUtil,
  featureFlags,
  useFeatureFlag,
  health,
  notify,
  bulk,
  dsl,
  routePrefetch,
  notifications,
  exports: exportsUtil,
  rbac,
  seo: { meta: seoMeta, jsonld: seoJsonld },
  menu_items,
  popups,
  user_roles,
  topbar_settings,
  footer_sections,
  custom_pages,
  support_tickets,
  profiles: profilesClient,

  admin: {
    siteSettings: siteSettingsAdmin,
    categories: categoriesAdmin,
    products: productsAdmin,
    blog: blogAdmin,
    coupons: couponsAdmin,
    campaigns: campaignsAdmin,
    users: usersAdmin,
    storage: storageAdmin,
  },

  // RTK + helpers
  api: rtk,
  baseApi,
  from: fromDb as FromFn,
} as const;

export type Metahub = typeof metahub;
