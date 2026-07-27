import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
} from '../controllers/category.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';

const router = Router();

// GET /api/v1/categories
router.get('/', getCategories);

// POST /api/v1/categories (Admin only)
router.post('/', authMiddleware, adminMiddleware, createCategory);

// PATCH /api/v1/categories/:id (Admin only)
router.patch('/:id', authMiddleware, adminMiddleware, updateCategory);

// DELETE /api/v1/categories/:id (Admin only)
router.delete('/:id', authMiddleware, adminMiddleware, deleteCategory);

// PATCH /api/v1/categories/:id/restore (Admin only)
router.patch('/:id/restore', authMiddleware, adminMiddleware, restoreCategory);

export default router;
