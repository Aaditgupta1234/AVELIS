/**
 * @fileoverview Loan module routes.
 *
 * Defines the Express router for the Loan module.
 *
 * Base route: /loans (mounted via routes/index.js)
 *
 * @module routes/loan
 */

import { Router } from 'express';
import * as loanController from '../controllers/loan.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import { UserRole } from '@prisma/client';
import { ApiError } from '../utils/index.js';
import {
  returnValidator,
  loanIdParamValidator,
  queryLoansValidator,
  renewLoanValidator,
  getLoanHistoryValidator,
  borrowBookValidator
} from '../validations/loan.validation.js';

const router = Router();

/**
 * Local memberMiddleware to restrict access to MEMBER role only,
 * consistent with reservation.routes.js.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
const memberMiddleware = (req, res, next) => {
  try {
    if (!req.user || !req.user.role || req.user.role !== UserRole.MEMBER) {
      return next(new ApiError(403, 'Access denied. Member privileges required.'));
    }
    next();
  } catch (error) {
    next(error);
  }
};

// GET / — Retrieve a paginated list of all loans (Admin only)
router.get(
  '/',
  authMiddleware,
  adminMiddleware,
  queryLoansValidator,
  loanController.getLoans
);

// GET /me — Retrieve a list of the current authenticated user's active loans (Member only)
router.get(
  '/me',
  authMiddleware,
  memberMiddleware,
  queryLoansValidator,
  loanController.getMyActiveLoans
);

// GET /history — Retrieve the current authenticated user's loan history (Member only)
router.get(
  '/history',
  authMiddleware,
  memberMiddleware,
  getLoanHistoryValidator,
  loanController.getLoanHistory
);

// POST /overdue/sync — Synchronize overdue loan statuses (Admin only) for Phase 9.8
router.post(
  '/overdue/sync',
  authMiddleware,
  adminMiddleware,
  loanController.syncOverdueLoans
);

// GET /:id — Retrieve details of a specific loan (Admin or Member with ownership)
router.get(
  '/:id',
  authMiddleware,
  loanIdParamValidator,
  loanController.getLoanById
);

// POST / — Member Borrow: create a new loan for the authenticated member
router.post(
  '/',
  authMiddleware,
  borrowBookValidator,
  loanController.memberBorrowBook
);


// POST /:id/return — Complete an active loan (Admin only)
router.post(
  '/:id/return',
  authMiddleware,
  adminMiddleware,
  returnValidator,
  loanController.returnBook
);

// PATCH /:id/return — Complete an active loan (Admin only) for Phase 9.7
router.patch(
  '/:id/return',
  authMiddleware,
  adminMiddleware,
  loanIdParamValidator,
  loanController.returnLoan
);

// PATCH /:id/renew — Renew an active loan (Member only)
router.patch(
  '/:id/renew',
  authMiddleware,
  memberMiddleware,
  renewLoanValidator,
  loanController.renewLoan
);

export default router;
