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
    const { loanId } = req.params;
    const loan = await loanService.getLoanById({ loanId, currentUser: req.user });

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
    const loans = await loanService.getMyActiveLoans({ currentUser: req.user });
    return sendSuccess(res, 200, loans, 'Active loans retrieved successfully.');
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
    const currentUser = req.user;
    const { page, limit, status, sort } = req.query;

    const history = await loanService.getLoanHistory({
      currentUser,
      page,
      limit,
      status,
      sort
    });

    return sendSuccess(res, 200, history, 'Loan history retrieved successfully.');
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
    const { loanId } = req.params;
    const currentUser = req.user;

    const renewedLoan = await loanService.renewLoan({
      loanId,
      currentUser
    });

    return sendSuccess(res, 200, renewedLoan, 'Loan renewed successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle a member borrowing a book copy.
 *
 * @param {import('express').Request} req - Express request with validated bookCopyId in body and authenticated user in req.user
 * @param {import('express').Response} res - Express response returning the created loan
 * @param {import('express').NextFunction} next - Express next function for error handling
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

/**
 * Handle a member returning a borrowed book copy.
 *
 * Extracts the member's user ID and the validated loan ID, delegates
 * execution to the service layer, and returns the standardized success response.
 *
 * @param {import('express').Request} req - Express request with authenticated user and validated loanId
 * @param {import('express').Response} res - Express response returning the returned loan record
 * @param {import('express').NextFunction} next - Express next function for error propagation
 */
export const memberReturnBook = async (req, res, next) => {
  try {
    const { loanId } = req.params;
    const userId = req.user.id;

    const loan = await loanService.memberReturnBook({ userId, loanId });

    return sendSuccess(res, 200, loan, 'Book returned successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve all loans for administrative management.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getAllLoans = async (req, res, next) => {
  try {
    const result = await loanService.getAllLoans(req.query);

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








