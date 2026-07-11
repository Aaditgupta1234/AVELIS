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
import { UserRole } from '@prisma/client';
import { ApiError } from '../utils/index.js';
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

/**
 * Local memberMiddleware to restrict access to MEMBER role only.
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

/**
 * Retrieve a paginated list of all loans (Admin only).
 *
 * Query parameters (validated via queryLoansValidator):
 * - page: positive integer (default: 1)
 * - limit: positive integer not exceeding 100 (default: 10)
 * - sortBy: sort field (default: 'createdAt', allowed: 'issueDate', 'dueDate', 'returnDate', 'createdAt')
 * - sortOrder: sort direction (default: 'desc', allowed: 'asc', 'desc')
 * - status: filter by LoanStatus enum
 * - userId: filter by user UUID
 * - copyId: filter by copy UUID
 *
 * Response shapes:
 * - 200 Success: { success: true, message: string, data: Loan[], pagination: { page, limit, totalResults, totalPages } }
 * - 400 Bad Request: Validation failed
 * - 401 Unauthorized: Invalid credentials
 * - 403 Forbidden: Admin privileges required
 */
router.get(
  '/',
  authMiddleware,
  adminMiddleware,
  queryLoansValidator,
  loanController.getLoans
);

/**
 * Retrieve the current user's active loans (Member only).
 *
 * Note: Placeholder returning 501 Not Implemented.
 */
router.get(
  '/me',
  authMiddleware,
  memberMiddleware,
  queryLoansValidator,
  loanController.getMyActiveLoans
);

/**
 * Retrieve the current user's active loans (Member only).
 *
 * NOTE:
 * This endpoint currently accepts no client-supplied body,
 * route parameters, or query parameters, so no validation
 * middleware is required. If future roadmap phases introduce
 * optional query parameters (for example pagination,
 * sorting, or filtering), validation should be added
 * during those dedicated implementation phases.
 *
 * Response shapes:
 * - 200 Success: { success: true, message: string, data: Loan[] }
 * - 401 Unauthorized: Invalid credentials
 * - 403 Forbidden: Member privileges required
 */
router.get(
  '/active',
  authMiddleware,
  memberMiddleware,
  loanController.getMyActiveLoans
);


/**
 * Retrieve the current user's loan history (Member only).
 *
 * GET /api/v1/loans/history
 *
 * Query parameters (validated via loanHistoryValidator):
 * - page: optional integer >= 1
 * - limit: optional integer (1 to 100)
 * - status: optional valid LoanStatus enum value
 * - sort: optional sorting direction ('asc' or 'desc')
 *
 * Response shapes:
 * - 200 Success: { success: true, message: string, data: Loan[] }
 * - 400 Bad Request: Validation failed
 * - 401 Unauthorized: Invalid credentials
 * - 403 Forbidden: Member privileges required
 */
router.get(
  '/history',
  authMiddleware,
  memberMiddleware,
  loanHistoryValidator,
  loanController.getLoanHistory
);

/**
 * Synchronize overdue loan statuses (Admin only).
 *
 * Response shapes:
 * - 200 Success: { success: true, message: string, data: { updatedCount: number, checkedAt: Date } }
 * - 401 Unauthorized: Invalid credentials
 * - 403 Forbidden: Admin privileges required
 */
router.post(
  '/overdue/sync',
  authMiddleware,
  adminMiddleware,
  loanController.syncOverdueLoans
);

/**
 * Retrieve details of a specific loan (Admin or Owner Member).
 *
 * Parameters:
 * - loanId: Valid UUID of the loan
 *
 * Response shapes:
 * - 200 Success: { success: true, message: string, data: Loan }
 * - 400 Bad Request: Invalid loan ID
 * - 401 Unauthorized: Invalid credentials
 * - 403 Forbidden: Member accessing another user's loan
 * - 404 Not Found: Loan not found
 */
router.get(
  '/:loanId',
  authMiddleware,
  getLoanById,
  loanController.getLoanById
);

/**
 * Create a new loan for the authenticated member (Member Borrow).
 *
 * Request body (validated via borrowBookValidator):
 * - bookCopyId: Valid UUID of the physical book copy
 *
 * Response shapes:
 * - 201 Success: { success: true, message: string, data: Loan }
 * - 400 Bad Request: Validation failed
 * - 401 Unauthorized: Invalid credentials
 * - 403 Forbidden: Member ineligible (inactive or active limit reached)
 * - 404 Not Found: Book copy or parent book not found/soft-deleted
 * - 409 Conflict: Book copy is not available
 */
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
  if (req.user?.role === UserRole.ADMIN) {
    return next('route');
  }
  next();
};

/**
 * Complete a loan for the authenticated member (Member Return).
 *
 * IMPORTANT:
 * This route must remain above the Admin Return route.
 * Admin requests intentionally bypass this handler via delegateAdminReturnRoute.
 *
 * Parameters:
 * - loanId: Valid UUID of the loan
 *
 * Response shapes:
 * - 200 Success: { success: true, message: string, data: Loan }
 * - 400 Bad Request: Validation failed
 * - 401 Unauthorized: Invalid credentials
 * - 403 Forbidden: Member privileges required
 * - 501 Not Implemented: Endpoint placeholder
 */
router.post(
  '/:loanId/return',
  authMiddleware,
  delegateAdminReturnRoute,
  memberMiddleware,
  validateReturnLoan,
  loanController.memberReturnBook
);

/**
 * Complete an active loan (Admin only).
 *
 * Parameters:
 * - id: Valid UUID of the loan
 *
 * Response shapes:
 * - 200 Success: { success: true, message: string, data: Loan }
 * - 400 Bad Request: Invalid loan ID or already returned
 * - 401 Unauthorized: Invalid credentials
 * - 403 Forbidden: Admin privileges required
 * - 404 Not Found: Loan or associated copy not found
 */
router.post(
  '/:id/return',
  authMiddleware,
  adminMiddleware,
  returnValidator,
  loanController.returnBook
);

/**
 * Complete an active loan (Admin only - PATCH alias).
 */
router.patch(
  '/:id/return',
  authMiddleware,
  adminMiddleware,
  loanIdParamValidator,
  loanController.returnLoan
);

/**
 * Renew an active loan (Member only).
 *
 * PATCH /api/v1/loans/:loanId/renew
 *
 * Parameters:
 * - loanId: Valid UUID of the loan to renew
 *
 * Response shapes:
 * - 200 Success: { success: true, message: string, data: Loan }
 * - 400 Bad Request: Invalid loan ID
 * - 401 Unauthorized: Invalid credentials
 * - 403 Forbidden: Member privileges required
 * - 501 Not Implemented: Endpoint placeholder
 */
router.patch(
  '/:loanId/renew',
  authMiddleware,
  memberMiddleware,
  renewLoanValidator,
  loanController.renewLoan
);

export default router;
