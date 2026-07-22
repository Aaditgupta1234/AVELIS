import { Router } from 'express';
import { uploadBookCoverController, uploadBookPdfController } from '../controllers/upload.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import { uploadSingleFile } from '../middleware/multer.middleware.js';
import { validateBookCoverUpload, validateBookPdfUpload } from '../middleware/upload.validation.js';

const router = Router();

// Protect all upload routes: Auth required + Admin role required
router.use(authMiddleware, adminMiddleware);

// POST /api/v1/uploads/book-cover
router.post(
  '/book-cover',
  uploadSingleFile('file'),
  validateBookCoverUpload,
  uploadBookCoverController
);

// POST /api/v1/uploads/book-pdf
router.post(
  '/book-pdf',
  uploadSingleFile('file'),
  validateBookPdfUpload,
  uploadBookPdfController
);

export default router;
