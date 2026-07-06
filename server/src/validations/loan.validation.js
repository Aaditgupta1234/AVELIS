import { sendError } from '../utils/index.js';
import { LoanStatus } from '@prisma/client';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Validator middleware for borrowing a book copy.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const borrowValidator = (req, res, next) => {
  const errors = [];
  const { userId, copyId } = req.body;

  if (userId === undefined || userId === null || typeof userId !== 'string' || !UUID_REGEX.test(userId.trim())) {
    errors.push({ field: 'userId', message: 'userId is required and must be a valid UUID.' });
  } else {
    req.body.userId = userId.trim();
  }

  if (copyId === undefined || copyId === null || typeof copyId !== 'string' || !UUID_REGEX.test(copyId.trim())) {
    errors.push({ field: 'copyId', message: 'copyId is required and must be a valid UUID.' });
  } else {
    req.body.copyId = copyId.trim();
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  next();
};

/**
 * Validator middleware for returning a book copy.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const returnValidator = (req, res, next) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string' || !UUID_REGEX.test(id.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid loan ID.'
    });
  }

  req.params.id = id.trim();
  next();
};

/**
 * Validator middleware for retrieving a loan by ID.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const loanIdParamValidator = (req, res, next) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string' || !UUID_REGEX.test(id.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid loan ID.'
    });
  }

  req.params.id = id.trim();
  next();
};

/**
 * Validator middleware for querying loans catalog.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const queryLoansValidator = (req, res, next) => {
  const errors = [];
  const { page, limit, sortBy, sortOrder, status, userId, copyId } = req.query;

  // 1. Pagination Validation & Casting
  if (page !== undefined && page !== null) {
    const pageNum = Number(page);
    if (!Number.isInteger(pageNum) || pageNum <= 0) {
      errors.push({ field: 'page', message: 'Page must be a positive integer.' });
    } else {
      req.query.page = pageNum;
    }
  } else {
    req.query.page = 1;
  }

  if (limit !== undefined && limit !== null) {
    const limitNum = Number(limit);
    if (!Number.isInteger(limitNum) || limitNum <= 0 || limitNum > 100) {
      errors.push({ field: 'limit', message: 'Limit must be a positive integer not exceeding 100.' });
    } else {
      req.query.limit = limitNum;
    }
  } else {
    req.query.limit = 10;
  }

  // 2. Sorting Parameter Validation & Normalization
  const allowedSortFields = ['issueDate', 'dueDate', 'returnDate', 'createdAt'];
  if (sortBy !== undefined && sortBy !== null) {
    if (!allowedSortFields.includes(sortBy)) {
      errors.push({ field: 'sortBy', message: `sortBy must be one of: ${allowedSortFields.join(', ')}.` });
    }
  } else {
    req.query.sortBy = 'createdAt';
  }

  if (sortOrder !== undefined && sortOrder !== null) {
    const normalizedOrder = String(sortOrder).toLowerCase();
    if (normalizedOrder !== 'asc' && normalizedOrder !== 'desc') {
      errors.push({ field: 'sortOrder', message: "sortOrder must be 'asc' or 'desc'." });
    } else {
      req.query.sortOrder = normalizedOrder;
    }
  } else {
    req.query.sortOrder = 'desc';
  }

  // 3. Filters Validation & Normalization
  if (status !== undefined && status !== null) {
    const allowedStatuses = Object.values(LoanStatus);
    if (!allowedStatuses.includes(status)) {
      errors.push({ field: 'status', message: `status must be a valid LoanStatus: ${allowedStatuses.join(', ')}.` });
    }
  }

  if (userId !== undefined && userId !== null) {
    if (typeof userId !== 'string' || !UUID_REGEX.test(userId.trim())) {
      errors.push({ field: 'userId', message: 'userId must be a valid UUID.' });
    } else {
      req.query.userId = userId.trim();
    }
  }

  if (copyId !== undefined && copyId !== null) {
    if (typeof copyId !== 'string' || !UUID_REGEX.test(copyId.trim())) {
      errors.push({ field: 'copyId', message: 'copyId must be a valid UUID.' });
    } else {
      req.query.copyId = copyId.trim();
    }
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  next();
};



