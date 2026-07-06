import * as loanService from '../services/loan.service.js';
import { sendSuccess } from '../utils/index.js';

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

    return sendSuccess(res, 201, loan, 'Book borrowed successfully.');
  } catch (error) {
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

    return sendSuccess(res, 200, loan, 'Book returned successfully.');
  } catch (error) {
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



