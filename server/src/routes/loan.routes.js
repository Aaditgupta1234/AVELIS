import { Router } from 'express';
import * as loanController from '../controllers/loan.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import { borrowValidator, returnValidator, loanIdParamValidator, queryLoansValidator } from '../validations/loan.validation.js';

const router = Router();

// GET / — Retrieve a paginated list of all loans (Admin only)
router.get(
  '/',
  queryLoansValidator,
  authMiddleware,
  adminMiddleware,
  loanController.getLoans
);

// GET /me — Retrieve a paginated list of the current authenticated user's loans
router.get(
  '/me',
  authMiddleware,
  queryLoansValidator,
  loanController.getCurrentUserLoans
);

// GET /:id — Retrieve details of a specific loan (Admin or Member with ownership)
router.get(
  '/:id',
  loanIdParamValidator,
  authMiddleware,
  loanController.getLoanById
);

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
