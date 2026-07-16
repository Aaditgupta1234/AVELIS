/**
 * @fileoverview Book module routes.
 *
 * Mounts book endpoints to their matching controller handlers.
 * base endpoint: /api/books (mounted via routes/index.js)
 *
 * @module routes/book
 */

import { Router } from 'express';
import * as bookController from '../controllers/book.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import { createBookValidator, queryBookValidator, updateBookValidator, bookIdParamValidator, getBookRatingValidator } from '../validations/book.validation.js';
import { searchRateLimiter } from '../middleware/rate-limit.middleware.js';

const router = Router();

// POST   / — Create a new book (Admin only)
router.post('/', authMiddleware, adminMiddleware, createBookValidator, bookController.createBook);

// GET    / — Retrieve paginated/filtered list of books
router.get('/', searchRateLimiter, queryBookValidator, bookController.getBooks);

// GET    /:id — Retrieve specific book details
router.get('/:id', bookController.getBookById);

// GET    /:bookId/rating — Retrieve rating statistics for a book (Public)
router.get('/:bookId/rating', getBookRatingValidator, bookController.getBookRating);

// PATCH  /:id — Update details of a book
router.patch('/:id', authMiddleware, adminMiddleware, updateBookValidator, bookController.updateBook);

// DELETE /:id — Delete a book
router.delete('/:id', authMiddleware, adminMiddleware, bookIdParamValidator, bookController.softDeleteBook);

// PATCH  /:id/restore — Restore a deleted book
router.patch(
  '/:id/restore',
  authMiddleware,
  adminMiddleware,
  bookIdParamValidator,
  bookController.restoreBookController
);

// DELETE /:id/permanent — Permanently delete a soft-deleted book (Admin only)
router.delete(
  '/:id/permanent',
  authMiddleware,
  adminMiddleware,
  bookIdParamValidator,
  bookController.permanentDeleteBookController
);

export default router;
