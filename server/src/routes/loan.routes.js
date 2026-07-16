/**
 * @fileoverview Loan module routes.
 *
 * Defines the Express router for the Loan module.
 * Base route: /loans (mounted via routes/index.js)
 *
 * @module routes/loan
 */

import { Router } from 'express';
import * as loanController from '../controllers/loan.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import { requireRole } from '../middleware/authorization.middleware.js';
import { ROLES } from '../config/index.js';
import {
  returnValidator,
  loanIdParamValidator,
  queryLoansValidator,
  renewLoanValidator,
  borrowBookValidator,
  validateReturnLoan,
  getLoanById,
  loanHistoryValidator
} from '../validations/loan.validation.js';

const router = Router();

// GET / - Retrieve a paginated list of all loans (Admin only)
router.get(
  '/',
  authMiddleware,
  adminMiddleware,
  queryLoansValidator,
  loanController.getLoans
);

// GET /me - Retrieve current user's active loans (Member only).
router.get(
  '/me',
  authMiddleware,
  requireRole(ROLES.MEMBER),
  queryLoansValidator,
  loanController.getMyActiveLoans
);

// GET /active - Retrieve the current user's active loans (Member only).
router.get(
  '/active',
  authMiddleware,
  requireRole(ROLES.MEMBER),
  loanController.getMyActiveLoans
);

// GET /history - Retrieve the current user's loan history (Member only).
router.get(
  '/history',
  authMiddleware,
  requireRole(ROLES.MEMBER),
  loanHistoryValidator,
  loanController.getLoanHistory
);

// POST /overdue/sync - Synchronize overdue loan statuses (Admin only).
router.post(
  '/overdue/sync',
  authMiddleware,
  adminMiddleware,
  loanController.syncOverdueLoans
);

// GET /:loanId - Retrieve details of a specific loan (Admin or Owner Member).
router.get(
  '/:loanId',
  authMiddleware,
  getLoanById,
  loanController.getLoanById
);

// POST / - Create a new loan for the authenticated member (Member Borrow).
router.post(
  '/',
  authMiddleware,
  borrowBookValidator,
  loanController.memberBorrowBook
);

/**
 * Route bypass middleware that delegates Admin return requests to the Admin Return route
 * registered below.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
const delegateAdminReturnRoute = (req, res, next) => {
  if (req.user?.role === ROLES.ADMIN) {
    return next('route');
  }
  next();
};

// POST /:loanId/return - Complete a loan for the authenticated member (Member Return).
router.post(
  '/:loanId/return',
  authMiddleware,
  delegateAdminReturnRoute,
  requireRole(ROLES.MEMBER),
  validateReturnLoan,
  loanController.memberReturnBook
);

// POST /:id/return - Complete an active loan (Admin only).
router.post(
  '/:id/return',
  authMiddleware,
  adminMiddleware,
  returnValidator,
  loanController.returnBook
);

// PATCH /:id/return - Complete an active loan (Admin only - PATCH alias).
router.patch(
  '/:id/return',
  authMiddleware,
  adminMiddleware,
  loanIdParamValidator,
  loanController.returnLoan
);

// PATCH /:loanId/renew - Renew an active loan (Member only).
router.patch(
  '/:loanId/renew',
  authMiddleware,
  requireRole(ROLES.MEMBER),
  renewLoanValidator,
  loanController.renewLoan
);

export default router;
