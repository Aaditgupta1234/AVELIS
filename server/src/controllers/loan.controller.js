/**
 * @fileoverview Loan module controller.
 *
 * Handles HTTP requests related to borrowing, returning, renewing, and querying book loans.
 * Delegates business logic to the loan service and returns standardized API responses.
 *
 * @module controllers/loan
 */

import * as loanService from '../services/loan.service.js';
import { sendSuccess, ApiError } from '../utils/index.js';
import { logger } from '../config/logger.js';

/**
 * Handle borrowing a book copy.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const borrowBook = async (req, res, next) => {
  try {
    const { userId, copyId } = req.body;
    const loan = await loanService.borrowBook({ userId, copyId });

    logger.info(`[LOAN] Book borrowed: loanId=${loan.id} userId=${userId} copyId=${copyId}`);

    return sendSuccess(res, 201, loan, 'Book borrowed successfully.');
  } catch (error) {
    logger.warn(`[LOAN] Borrow failed: copyId=${req.body?.copyId} userId=${req.body?.userId} reason=${error.message}`);
    next(error);
  }
};

/**
 * Handle returning a book copy.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const returnBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const loan = await loanService.returnBook({ loanId: id });

    logger.info(`[LOAN] Book returned: loanId=${id}`);

    return sendSuccess(res, 200, loan, 'Book returned successfully.');
  } catch (error) {
    logger.warn(`[LOAN] Return failed: loanId=${req.params?.id} reason=${error.message}`);
    next(error);
  }
};

/**
 * Handle retrieving a single loan by its ID.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getLoanById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const loan = await loanService.getLoanById({ loanId: id, currentUser: req.user });

    return sendSuccess(res, 200, loan, 'Loan retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle paginated retrieval of loans.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getLoans = async (req, res, next) => {
  try {
    const result = await loanService.getLoans(req.query);

    return sendSuccess(
      res,
      200,
      result.loans,
      'Loans retrieved successfully.',
      result.pagination
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Handle paginated retrieval of loans for the current authenticated user.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getCurrentUserLoans = async (req, res, next) => {
  try {
    const result = await loanService.getLoans({
      ...req.query,
      userId: req.user.id
    });

    return sendSuccess(
      res,
      200,
      result.loans,
      'Loans retrieved successfully.',
      result.pagination
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Handle completing an active loan (returning a book copy) for Phase 9.7.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const returnLoan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedLoan = await loanService.returnLoan({ loanId: id });

    return sendSuccess(res, 200, updatedLoan, 'Book returned successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle synchronizing overdue loan statuses for Phase 9.8.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const syncOverdueLoans = async (req, res, next) => {
  try {
    const result = await loanService.syncOverdueLoans();

    return sendSuccess(res, 200, result, 'Overdue loans synchronized successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle retrieving active loans for the current authenticated user.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getMyActiveLoans = async (req, res, next) => {
  try {
    throw new ApiError(501, 'Not implemented.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle retrieving loan history for the current authenticated user.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getLoanHistory = async (req, res, next) => {
  try {
    throw new ApiError(501, 'Not implemented.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle renewing an active loan.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const renewLoan = async (req, res, next) => {
  try {
    throw new ApiError(501, 'Not implemented.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle a member borrowing a book copy.
 *
 * ARCHITECTURAL CONTEXT:
 * This controller orchestrates the Member Borrow workflow by receiving the validated
 * request, extracting the parameters, delegating the operation to the service layer,
 * and returning the standardized success response. It contains no business logic.
 *
 * Eligibility, availability, transactions, and loan creation are handled in later roadmap phases.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const memberBorrowBook = async (req, res, next) => {
  try {
    const { bookCopyId } = req.body;
    const userId = req.user.id;

    const loan = await loanService.memberBorrowBook({ userId, bookCopyId });

    return sendSuccess(res, 201, loan, 'Book borrowed successfully.');
  } catch (error) {
    next(error);
  }
};








