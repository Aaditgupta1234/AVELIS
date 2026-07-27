import { Router } from 'express';
import {
  getAuthors,
  createAuthor,
  updateAuthor,
  deleteAuthor,
  restoreAuthor,
} from '../controllers/author.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';

const router = Router();

// GET /api/v1/authors
router.get('/', getAuthors);

// POST /api/v1/authors (Admin only)
router.post('/', authMiddleware, adminMiddleware, createAuthor);

// PATCH /api/v1/authors/:id (Admin only)
router.patch('/:id', authMiddleware, adminMiddleware, updateAuthor);

// DELETE /api/v1/authors/:id (Admin only)
router.delete('/:id', authMiddleware, adminMiddleware, deleteAuthor);

// PATCH /api/v1/authors/:id/restore (Admin only)
router.patch('/:id/restore', authMiddleware, adminMiddleware, restoreAuthor);

export default router;
