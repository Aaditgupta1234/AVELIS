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
import { createBookValidator, queryBookValidator, updateBookValidator } from '../validations/book.validation.js';

const router = Router();

// POST   / — Create a new book (Admin only)
router.post('/', authMiddleware, adminMiddleware, createBookValidator, bookController.createBook);

// GET    / — Retrieve paginated/filtered list of books
router.get('/', queryBookValidator, bookController.getBooks);

// GET    /:id — Retrieve specific book details
router.get('/:id', bookController.getBookById);

// PATCH  /:id — Update details of a book
router.patch('/:id', updateBookValidator, bookController.updateBook);

// DELETE /:id — Delete a book
router.delete('/:id', bookController.deleteBook);

// PATCH  /:id/restore — Restore a deleted book
router.patch('/:id/restore', bookController.restoreBook);

export default router;
