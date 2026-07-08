/**
 * @fileoverview Loan module validations.
 *
 * Provides Express middleware for validating request bodies, parameters, and queries
 * related to loan operations.
 *
 * @module validations/loan
 */

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
 * Validator middleware for retrieving a loan by ID.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const loanIdParamValidator = (req, res, next) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string' || !UUID_REGEX.test(id.trim())) {
    return sendError(res, 400, 'Invalid loan ID.');
  }

  req.params.id = id.trim();
  next();
};

/**
 * Validator middleware for returning a book copy (alias of loanIdParamValidator).
 */
export const returnValidator = loanIdParamValidator;


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

/**
 * Validator middleware placeholder for renewing a loan.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const renewLoanValidator = (req, res, next) => {
  // TODO Phase 12.x: implement loanId param and renewal validation
  next();
};

/**
 * Validator middleware placeholder for loan history.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getLoanHistoryValidator = (req, res, next) => {
  // TODO Phase 12.x: implement pagination and filter validation
  next();
};

/**
 * Request validator middleware for the Member Borrow Book workflow.
 *
 * ARCHITECTURAL CONTEXT:
 * This validator is introduced during Phase 12.2.1 of the AVELIS roadmap to validate the 
 * request payload accepted by the future Member Borrow endpoint.
 *
 * COEXISTENCE POLICY:
 * - borrowValidator: Retained unchanged to support the existing Admin Borrow workflow.
 * - borrowBookValidator: Dedicated exclusively to the new Member Borrow workflow.
 * Both validators co-exist to ensure backward compatibility.
 *
 * ROUTING POLICY:
 * This validator will not be attached to any Express routes in Phase 12.2.1. It will be 
 * wired to the Member Borrow route during Phase 12.2.2. This separation follows the 
 * roadmap's step-by-step sequencing constraints.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const borrowBookValidator = (req, res, next) => {
  const errors = [];
  const allowedKeys = ['bookCopyId'];

  // Defensively ensure req.body is a writable plain object before validation or assignment
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    req.body = {};
  }
  const requestBody = req.body;

  // 1. Reject unknown request fields
  const bodyKeys = Object.keys(requestBody);
  const unknownKeys = bodyKeys.filter(key => !allowedKeys.includes(key));
  if (unknownKeys.length > 0) {
    errors.push({
      field: unknownKeys.join(', '),
      message: `Unknown request fields are not allowed: ${unknownKeys.join(', ')}`
    });
  }

  // 2. Validate bookCopyId
  const { bookCopyId } = requestBody;
  let validatedBookCopyId = null;

  if (bookCopyId === undefined || bookCopyId === null) {
    errors.push({ field: 'bookCopyId', message: 'bookCopyId is required.' });
  } else if (typeof bookCopyId !== 'string') {
    errors.push({ field: 'bookCopyId', message: 'bookCopyId must be a string.' });
  } else {
    const trimmed = bookCopyId.trim();
    if (trimmed === '') {
      errors.push({ field: 'bookCopyId', message: 'bookCopyId cannot be empty.' });
    } else if (!UUID_REGEX.test(trimmed)) {
      errors.push({ field: 'bookCopyId', message: 'bookCopyId must be a valid UUID.' });
    } else {
      validatedBookCopyId = trimmed;
    }
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  // 3. Assign normalized/trimmed value after validation successfully completes
  req.body.bookCopyId = validatedBookCopyId;

  next();
};





