import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/common/middleware/auth';
import { requireAdmin } from '@/common/middleware/roles';

import {
  listSubCategories,
  getSubCategoryById,
  getSubCategoryBySlug,
} from './controller';

import type { SubCategoryCreateInput, SubCategoryUpdateInput } from './validation';
import {
  adminCreateSubCategory,
  adminPutSubCategory,
  adminPatchSubCategory,
  adminDeleteSubCategory,
  adminReorderSubCategories,
  adminToggleSubActive,
  adminToggleSubFeatured,
} from './admin.controller';

export async function registerSubCategories(app: FastifyInstance) {
  // PUBLIC READ
  app.get('/sub-categories', { config: { public: true } }, listSubCategories);
  app.get<{ Params: { id: string } }>('/sub-categories/:id', { config: { public: true } }, getSubCategoryById);
  app.get<{ Params: { slug: string }; Querystring: { category_id?: string } }>(
    '/sub-categories/by-slug/:slug',
    { config: { public: true } },
    getSubCategoryBySlug,
  );

  // ADMIN WRITE
  app.post<{ Body: SubCategoryCreateInput }>(
    '/sub-categories',
    { preHandler: [requireAuth, requireAdmin] },
    adminCreateSubCategory,
  );

  app.put<{ Params: { id: string }; Body: SubCategoryUpdateInput }>(
    '/sub-categories/:id',
    { preHandler: [requireAuth, requireAdmin] },
    adminPutSubCategory,
  );

  app.patch<{ Params: { id: string }; Body: SubCategoryUpdateInput }>(
    '/sub-categories/:id',
    { preHandler: [requireAuth, requireAdmin] },
    adminPatchSubCategory,
  );

  app.delete<{ Params: { id: string } }>(
    '/sub-categories/:id',
    { preHandler: [requireAuth, requireAdmin] },
    adminDeleteSubCategory,
  );

  app.post<{ Body: { items: Array<{ id: string; display_order: number }> } }>(
    '/sub-categories/reorder',
    { preHandler: [requireAuth, requireAdmin] },
    adminReorderSubCategories,
  );

  app.patch<{ Params: { id: string }; Body: { is_active: boolean } }>(
    '/sub-categories/:id/active',
    { preHandler: [requireAuth, requireAdmin] },
    adminToggleSubActive,
  );

  app.patch<{ Params: { id: string }; Body: { is_featured: boolean } }>(
    '/sub-categories/:id/featured',
    { preHandler: [requireAuth, requireAdmin] },
    adminToggleSubFeatured,
  );
}
