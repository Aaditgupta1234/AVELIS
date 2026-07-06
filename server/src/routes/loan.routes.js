import { Router } from 'express';
import * as loanController from '../controllers/loan.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import { borrowValidator, returnValidator } from '../validations/loan.validation.js';

const router = Router();

// POST / — Create a new loan transaction (Admin only)
router.post(
  '/',
  borrowValidator,
  authMiddleware,
  adminMiddleware,
  loanController.borrowBook
);

// POST /:id/return — Complete an active loan (Admin only)
router.post(
  '/:id/return',
  returnValidator,
  authMiddleware,
  adminMiddleware,
  loanController.returnBook
);

export default router;
