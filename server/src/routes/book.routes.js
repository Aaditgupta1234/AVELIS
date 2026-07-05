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

const router = Router();

// POST   / — Create a new book
router.post('/', bookController.createBook);

// GET    / — Retrieve paginated/filtered list of books
router.get('/', bookController.getBooks);

// GET    /:id — Retrieve specific book details
router.get('/:id', bookController.getBookById);

// PATCH  /:id — Update details of a book
router.patch('/:id', bookController.updateBook);

// DELETE /:id — Delete a book
router.delete('/:id', bookController.deleteBook);

// PATCH  /:id/restore — Restore a deleted book
router.patch('/:id/restore', bookController.restoreBook);

export default router;
