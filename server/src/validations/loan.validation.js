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

import { UUID_REGEX } from '../helpers/validation.helper.js';
const ALLOWED_LOAN_STATUSES = Object.values(LoanStatus);

/**
 * Validator middleware for borrowing a book copy (Admin Borrow workflow).
 *
 * ARCHITECTURAL CONTEXT:
 * This validator requires both userId and copyId in the request body, supporting
 * the administrative borrow action.
 *
 * COEXISTENCE POLICY:
 * - borrowValidator: Dedicated exclusively to Admin Borrow.
 * - borrowBookValidator: Dedicated exclusively to Member Borrow (where userId is session-resolved).
 * Both co-exist because they validate different payload schemas.
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
 *
 * ARCHITECTURAL CONTEXT:
 * Validates the `:id` parameter for the Admin Return workflow.
 *
 * COEXISTENCE POLICY:
 * - returnValidator: Used by the Admin Return route.
 * - validateReturnLoan: Used by the Member Return route (validates `:loanId` and rejects body).
 * Both co-exist to support distinct route parameters and body payload policies.
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
  const errors = [];

  // Validate route parameter loanId (req.params.loanId)
  const loanId = req.params?.loanId;
  let validatedLoanId = null;

  if (loanId === undefined || loanId === null) {
    errors.push({ field: 'loanId', message: 'loanId parameter is required.' });
  } else if (typeof loanId !== 'string') {
    errors.push({ field: 'loanId', message: 'loanId must be a string.' });
  } else {
    const trimmed = loanId.trim();
    if (trimmed === '') {
      errors.push({ field: 'loanId', message: 'loanId parameter cannot be empty.' });
    } else if (!UUID_REGEX.test(trimmed)) {
      errors.push({ field: 'loanId', message: 'loanId parameter must be a valid UUID.' });
    } else {
      validatedLoanId = trimmed;
    }
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  // Assign normalized/trimmed value
  if (req.params) {
    req.params.loanId = validatedLoanId;
  }

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

/**
 * Validates requests for the Member Return workflow.
 *
 * Ensures the route parameter is valid and that the endpoint
 * receives no request payload before execution reaches the controller.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const validateReturnLoan = (req, res, next) => {
  const errors = [];

  // 1. Validate route parameter loanId (req.params.loanId)
  const loanId = req.params?.loanId;
  let validatedLoanId = null;

  if (loanId === undefined || loanId === null) {
    errors.push({ field: 'loanId', message: 'loanId parameter is required.' });
  } else if (typeof loanId !== 'string') {
    errors.push({ field: 'loanId', message: 'loanId must be a string.' });
  } else {
    const trimmed = loanId.trim();
    if (trimmed === '') {
      errors.push({ field: 'loanId', message: 'loanId parameter cannot be empty.' });
    } else if (!UUID_REGEX.test(trimmed)) {
      errors.push({ field: 'loanId', message: 'loanId parameter must be a valid UUID.' });
    } else {
      validatedLoanId = trimmed;
    }
  }

  // 2. The return endpoint currently accepts no request payload.
  // Reject any unexpected request body fields.
  if (req.body === null || typeof req.body !== 'object' || Array.isArray(req.body)) {
    errors.push({
      field: 'body',
      message: 'Request body must be a JSON object.'
    });
  } else {
    const bodyKeys = Object.keys(req.body);
    if (bodyKeys.length > 0) {
      errors.push({
        field: 'body',
        message: `Unknown request fields are not allowed: ${bodyKeys.join(', ')}`
      });
    }
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  // Assign normalized/trimmed value
  if (req.params) {
    req.params.loanId = validatedLoanId;
  }

  next();
};

/**
 * Validates request parameters for retrieving a loan by ID (GET /loans/:loanId).
 *
 * Ensures the route parameter is valid before execution reaches the controller.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getLoanById = (req, res, next) => {
  const errors = [];

  // Validate route parameter loanId (req.params.loanId)
  const loanId = req.params?.loanId;
  let validatedLoanId = null;

  if (loanId === undefined || loanId === null) {
    errors.push({ field: 'loanId', message: 'loanId parameter is required.' });
  } else if (typeof loanId !== 'string') {
    errors.push({ field: 'loanId', message: 'loanId must be a string.' });
  } else {
    const trimmed = loanId.trim();
    if (trimmed === '') {
      errors.push({ field: 'loanId', message: 'loanId parameter cannot be empty.' });
    } else if (!UUID_REGEX.test(trimmed)) {
      errors.push({ field: 'loanId', message: 'loanId parameter must be a valid UUID.' });
    } else {
      validatedLoanId = trimmed;
    }
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  // Assign normalized/trimmed value
  if (req.params) {
    req.params.loanId = validatedLoanId;
  }

  next();
};

/**
 * Validator middleware for retrieving loan history.
 *
 * Validates optional query parameters: page, limit, status, and sort.
 * Does not apply default values for page or limit; defaults are deferred to the service layer.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const loanHistoryValidator = (req, res, next) => {
  const errors = [];
  const { page, limit, status, sort } = req.query;

  // 1. Validate page (optional, integer >= 1)
  if (page !== undefined && page !== null) {
    const trimmed = String(page).trim();
    if (trimmed === '') {
      errors.push({ field: 'page', message: 'page cannot be empty.' });
    } else {
      const pageNum = Number(trimmed);
      if (!Number.isInteger(pageNum) || pageNum < 1) {
        errors.push({ field: 'page', message: 'Page must be a positive integer.' });
      } else {
        req.query.page = pageNum;
      }
    }
  }

  // 2. Validate limit (optional, integer 1 to 100)
  if (limit !== undefined && limit !== null) {
    const trimmed = String(limit).trim();
    if (trimmed === '') {
      errors.push({ field: 'limit', message: 'limit cannot be empty.' });
    } else {
      const limitNum = Number(trimmed);
      if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
        errors.push({ field: 'limit', message: 'Limit must be a positive integer between 1 and 100.' });
      } else {
        req.query.limit = limitNum;
      }
    }
  }

  // 3. Validate status (optional, must be a valid LoanStatus enum value)
  if (status !== undefined && status !== null) {
    const trimmed = String(status).trim();
    if (trimmed === '') {
      errors.push({ field: 'status', message: 'status cannot be empty.' });
    } else {
      if (!ALLOWED_LOAN_STATUSES.includes(trimmed)) {
        errors.push({ field: 'status', message: `status must be a valid LoanStatus: ${ALLOWED_LOAN_STATUSES.join(', ')}.` });
      } else {
        req.query.status = trimmed;
      }
    }
  }

  // 4. Validate sort (optional, must be 'asc' or 'desc')
  if (sort !== undefined && sort !== null) {
    const trimmed = String(sort).trim();
    if (trimmed === '') {
      errors.push({ field: 'sort', message: 'sort cannot be empty.' });
    } else {
      const normalizedSort = trimmed.toLowerCase();
      if (normalizedSort !== 'asc' && normalizedSort !== 'desc') {
        errors.push({ field: 'sort', message: "sort must be 'asc' or 'desc'." });
      } else {
        req.query.sort = normalizedSort;
      }
    }
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  next();
};

const ALLOWED_ADMIN_SORT_FIELDS = ['loanDate', 'dueDate', 'returnDate', 'status', 'createdAt'];

/**
 * Validator middleware for administrative loan queries.
 *
 * Validates optional query parameters: status, memberId, bookId, startDate, endDate, page, limit, sortBy, sortOrder.
 * Does not apply default values; defaults are deferred to the service layer.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const adminLoanQueryValidator = (req, res, next) => {
  const errors = [];
  const { status, memberId, bookId, startDate, endDate, page, limit, sortBy, sortOrder } = req.query;

  let validStatus = null;
  let validMemberId = null;
  let validBookId = null;
  let validStartDate = null;
  let validEndDate = null;
  let validPage = null;
  let validLimit = null;
  let validSortBy = null;
  let validSortOrder = null;

  // 1. status (optional, must be a valid LoanStatus enum value)
  if (status !== undefined && status !== null) {
    const trimmed = String(status).trim();
    if (trimmed === '') {
      errors.push({ field: 'status', message: 'status cannot be empty.' });
    } else if (!ALLOWED_LOAN_STATUSES.includes(trimmed)) {
      errors.push({ field: 'status', message: `status must be a valid LoanStatus: ${ALLOWED_LOAN_STATUSES.join(', ')}.` });
    } else {
      validStatus = trimmed;
    }
  }

  // 2. memberId (optional, valid UUID)
  if (memberId !== undefined && memberId !== null) {
    const trimmed = String(memberId).trim();
    if (trimmed === '') {
      errors.push({ field: 'memberId', message: 'memberId cannot be empty.' });
    } else if (!UUID_REGEX.test(trimmed)) {
      errors.push({ field: 'memberId', message: 'memberId must be a valid UUID.' });
    } else {
      validMemberId = trimmed;
    }
  }

  // 3. bookId (optional, valid UUID)
  if (bookId !== undefined && bookId !== null) {
    const trimmed = String(bookId).trim();
    if (trimmed === '') {
      errors.push({ field: 'bookId', message: 'bookId cannot be empty.' });
    } else if (!UUID_REGEX.test(trimmed)) {
      errors.push({ field: 'bookId', message: 'bookId must be a valid UUID.' });
    } else {
      validBookId = trimmed;
    }
  }

  // 4. startDate (optional, valid ISO-8601 date)
  let parsedStartDate = null;
  if (startDate !== undefined && startDate !== null) {
    const trimmed = String(startDate).trim();
    if (trimmed === '') {
      errors.push({ field: 'startDate', message: 'startDate cannot be empty.' });
    } else {
      const parsed = Date.parse(trimmed);
      const isIso = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:?\d{2})?)?$/.test(trimmed);
      if (isNaN(parsed) || !isIso) {
        errors.push({ field: 'startDate', message: 'startDate must be a valid ISO-8601 date.' });
      } else {
        parsedStartDate = new Date(trimmed);
        validStartDate = trimmed;
      }
    }
  }

  // 5. endDate (optional, valid ISO-8601 date)
  let parsedEndDate = null;
  if (endDate !== undefined && endDate !== null) {
    const trimmed = String(endDate).trim();
    if (trimmed === '') {
      errors.push({ field: 'endDate', message: 'endDate cannot be empty.' });
    } else {
      const parsed = Date.parse(trimmed);
      const isIso = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:?\d{2})?)?$/.test(trimmed);
      if (isNaN(parsed) || !isIso) {
        errors.push({ field: 'endDate', message: 'endDate must be a valid ISO-8601 date.' });
      } else {
        parsedEndDate = new Date(trimmed);
        validEndDate = trimmed;
      }
    }
  }

  // 6. Date Range Check (if both valid)
  if (parsedStartDate && parsedEndDate && parsedStartDate.getTime() > parsedEndDate.getTime()) {
    errors.push({ field: 'startDate', message: 'startDate cannot be after endDate.' });
  }

  // 7. page (optional, positive integer >= 1)
  if (page !== undefined && page !== null) {
    const trimmed = String(page).trim();
    if (trimmed === '') {
      errors.push({ field: 'page', message: 'page cannot be empty.' });
    } else {
      const pageNum = Number(trimmed);
      if (!Number.isInteger(pageNum) || pageNum < 1) {
        errors.push({ field: 'page', message: 'Page must be a positive integer.' });
      } else {
        validPage = pageNum;
      }
    }
  }

  // 8. limit (optional, positive integer 1 to 100)
  if (limit !== undefined && limit !== null) {
    const trimmed = String(limit).trim();
    if (trimmed === '') {
      errors.push({ field: 'limit', message: 'limit cannot be empty.' });
    } else {
      const limitNum = Number(trimmed);
      if (!Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
        errors.push({ field: 'limit', message: 'Limit must be a positive integer between 1 and 100.' });
      } else {
        validLimit = limitNum;
      }
    }
  }

  // 9. sortBy (optional, whitelisted fields, case-sensitive)
  if (sortBy !== undefined && sortBy !== null) {
    const trimmed = String(sortBy).trim();
    if (trimmed === '') {
      errors.push({ field: 'sortBy', message: 'sortBy cannot be empty.' });
    } else if (!ALLOWED_ADMIN_SORT_FIELDS.includes(trimmed)) {
      errors.push({ field: 'sortBy', message: `sortBy must be one of: ${ALLOWED_ADMIN_SORT_FIELDS.join(', ')}.` });
    } else {
      validSortBy = trimmed;
    }
  }

  // 10. sortOrder (optional, 'asc' or 'desc', case-insensitive)
  if (sortOrder !== undefined && sortOrder !== null) {
    const trimmed = String(sortOrder).trim();
    if (trimmed === '') {
      errors.push({ field: 'sortOrder', message: 'sortOrder cannot be empty.' });
    } else {
      const normalized = trimmed.toLowerCase();
      if (normalized !== 'asc' && normalized !== 'desc') {
        errors.push({ field: 'sortOrder', message: "sortOrder must be 'asc' or 'desc'." });
      } else {
        validSortOrder = normalized;
      }
    }
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  // Normalize/Commit only after all validations have passed
  if (status !== undefined && status !== null) req.query.status = validStatus;
  if (memberId !== undefined && memberId !== null) req.query.memberId = validMemberId;
  if (bookId !== undefined && bookId !== null) req.query.bookId = validBookId;
  if (startDate !== undefined && startDate !== null) req.query.startDate = validStartDate;
  if (endDate !== undefined && endDate !== null) req.query.endDate = validEndDate;
  if (page !== undefined && page !== null) req.query.page = validPage;
  if (limit !== undefined && limit !== null) req.query.limit = validLimit;
  if (sortBy !== undefined && sortBy !== null) req.query.sortBy = validSortBy;
  if (sortOrder !== undefined && sortOrder !== null) req.query.sortOrder = validSortOrder;

  next();
};








