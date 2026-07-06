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
