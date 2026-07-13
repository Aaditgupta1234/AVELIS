/**
 * @fileoverview Reporting module validations.
 *
 * Provides validator middlewares for reporting endpoints.
 * Implements common query, date range, UUID, enum, and schema validations.
 *
 * @module modules/reporting/validation
 */

import { sendError } from '../../utils/index.js';
import {
  UserRole,
  CopyStatus,
  LoanStatus,
  ReservationStatus,
  OrderStatus,
  PaymentStatus
} from '@prisma/client';
import { UUID_REGEX, EMAIL_REGEX } from '../../helpers/validation.helper.js';

// Project-standard regex definitions
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:?\d{2})?)?$/;

const INVENTORY_AVAILABILITY = ['all', 'available', 'borrowed', 'reserved', 'lost', 'damaged', 'maintenance'];
const INVENTORY_SORT_FIELDS = [
  'title',
  'totalCopies',
  'availableCopies',
  'borrowedCopies',
  'reservedCopies',
  'lostCopies',
  'damagedCopies',
  'maintenanceCopies',
  'availabilityPercentage',
  'createdAt'
];

const MEMBER_REPORT_ACTIVITY_TYPES = ['all', 'loans', 'reservations', 'orders', 'reviews'];
const MEMBER_REPORT_SORT_FIELDS = ['createdAt'];

/**
 * Validator helper for common search and pagination query parameters.
 *
 * @param {import('express').Request} req - Express request
 * @param {Object} sanitizedQuery - Target object to populate with validated values
 * @param {Array} errors - Accumulated errors array
 */
const validateCommonQueries = (req, sanitizedQuery, errors) => {
  const { page, limit, sortBy, sortOrder, search } = req.query;

  // page validation (optional, positive integer >= 1)
  if (page !== undefined && page !== null) {
    const trimmed = String(page).trim();
    if (trimmed === '') {
      errors.push({ field: 'page', message: 'page cannot be empty.' });
    } else if (!/^\d+$/.test(trimmed)) {
      errors.push({ field: 'page', message: 'Page must be a positive integer.' });
    } else {
      const pageNum = Number(trimmed);
      if (pageNum < 1) {
        errors.push({ field: 'page', message: 'Page must be a positive integer.' });
      } else {
        sanitizedQuery.page = pageNum;
      }
    }
  }

  // limit validation (optional, positive integer 1 to 100)
  if (limit !== undefined && limit !== null) {
    const trimmed = String(limit).trim();
    if (trimmed === '') {
      errors.push({ field: 'limit', message: 'limit cannot be empty.' });
    } else if (!/^\d+$/.test(trimmed)) {
      errors.push({ field: 'limit', message: 'limit must be a positive integer.' });
    } else {
      const limitNum = Number(trimmed);
      if (limitNum < 1 || limitNum > 100) {
        errors.push({ field: 'limit', message: 'limit must be between 1 and 100.' });
      } else {
        sanitizedQuery.limit = limitNum;
      }
    }
  }

  // sortBy validation (optional, trimmed string)
  if (sortBy !== undefined && sortBy !== null) {
    const trimmed = String(sortBy).trim();
    if (trimmed === '') {
      errors.push({ field: 'sortBy', message: 'sortBy cannot be empty.' });
    } else {
      sanitizedQuery.sortBy = trimmed;
    }
  }

  // sortOrder validation (optional, 'asc' or 'desc' case-insensitive)
  if (sortOrder !== undefined && sortOrder !== null) {
    const trimmed = String(sortOrder).trim().toLowerCase();
    if (trimmed === '') {
      errors.push({ field: 'sortOrder', message: 'sortOrder cannot be empty.' });
    } else if (trimmed !== 'asc' && trimmed !== 'desc') {
      errors.push({ field: 'sortOrder', message: 'sortOrder must be either asc or desc.' });
    } else {
      sanitizedQuery.sortOrder = trimmed;
    }
  }

  // search keyword validation (optional, max 100 characters)
  if (search !== undefined && search !== null) {
    const trimmed = String(search).trim();
    if (trimmed === '') {
      errors.push({ field: 'search', message: 'search cannot be empty.' });
    } else if (trimmed.length > 100) {
      errors.push({ field: 'search', message: 'search must be 100 characters or less.' });
    } else {
      sanitizedQuery.search = trimmed;
    }
  }
};

/**
 * Validator helper for range queries fromDate and toDate.
 *
 * @param {import('express').Request} req - Express request
 * @param {Object} sanitizedQuery - Target object to populate with validated values
 * @param {Array} errors - Accumulated errors array
 */
const validateDateRange = (req, sanitizedQuery, errors) => {
  const { fromDate, toDate } = req.query;
  let parsedFrom = null;
  let validFrom = null;
  let parsedTo = null;
  let validTo = null;

  // Validate fromDate
  if (fromDate !== undefined && fromDate !== null) {
    const trimmed = String(fromDate).trim();
    if (trimmed === '') {
      errors.push({ field: 'fromDate', message: 'fromDate cannot be empty.' });
    } else {
      const parsed = Date.parse(trimmed);
      const isIso = ISO_DATE_REGEX.test(trimmed);
      let isValidDate = !isNaN(parsed) && isIso;

      if (isValidDate) {
        const [datePart] = trimmed.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const utcDate = new Date(Date.UTC(year, month - 1, day));
        if (
          utcDate.getUTCFullYear() !== year ||
          utcDate.getUTCMonth() + 1 !== month ||
          utcDate.getUTCDate() !== day
        ) {
          isValidDate = false;
        }
      }

      if (!isValidDate) {
        errors.push({ field: 'fromDate', message: 'fromDate must be a valid ISO-8601 date.' });
      } else {
        parsedFrom = new Date(trimmed);
        validFrom = trimmed;
      }
    }
  }

  // Validate toDate
  if (toDate !== undefined && toDate !== null) {
    const trimmed = String(toDate).trim();
    if (trimmed === '') {
      errors.push({ field: 'toDate', message: 'toDate cannot be empty.' });
    } else {
      const parsed = Date.parse(trimmed);
      const isIso = ISO_DATE_REGEX.test(trimmed);
      let isValidDate = !isNaN(parsed) && isIso;

      if (isValidDate) {
        const [datePart] = trimmed.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const utcDate = new Date(Date.UTC(year, month - 1, day));
        if (
          utcDate.getUTCFullYear() !== year ||
          utcDate.getUTCMonth() + 1 !== month ||
          utcDate.getUTCDate() !== day
        ) {
          isValidDate = false;
        }
      }

      if (!isValidDate) {
        errors.push({ field: 'toDate', message: 'toDate must be a valid ISO-8601 date.' });
      } else {
        parsedTo = new Date(trimmed);
        validTo = trimmed;
      }
    }
  }

  // Compare chronology
  if (parsedFrom && parsedTo && parsedFrom.getTime() > parsedTo.getTime()) {
    errors.push({ field: 'fromDate', message: 'fromDate cannot be after toDate.' });
  } else {
    if (validFrom !== null) sanitizedQuery.fromDate = validFrom;
    if (validTo !== null) sanitizedQuery.toDate = validTo;
  }
};

/**
 * Validator helper to validate UUID values.
 *
 * @param {string} value - String value to check
 * @param {string} fieldName - Field identifier for error reporting
 * @param {Array} errors - Accumulated errors array
 * @returns {string|null} Trimmed validated UUID string, or null
 */
const validateUUID = (value, fieldName, errors) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  if (trimmed === '') {
    errors.push({ field: fieldName, message: `${fieldName} cannot be empty.` });
    return null;
  }
  if (!UUID_REGEX.test(trimmed)) {
    errors.push({ field: fieldName, message: `${fieldName} must be a valid UUID.` });
    return null;
  }
  return trimmed;
};

/**
 * Validator middleware for book search reporting.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const validateSearchBooks = (req, res, next) => {
  const errors = [];
  const sanitizedQuery = {};

  // Common pagination, sort, search, and dates
  validateCommonQueries(req, sanitizedQuery, errors);
  validateDateRange(req, sanitizedQuery, errors);

  const { title, author, isbn, categoryId, status } = req.query;

  // title (optional string)
  if (title !== undefined && title !== null) {
    const trimmed = String(title).trim();
    if (trimmed === '') {
      errors.push({ field: 'title', message: 'title cannot be empty.' });
    } else {
      sanitizedQuery.title = trimmed;
    }
  }

  // author (optional string)
  if (author !== undefined && author !== null) {
    const trimmed = String(author).trim();
    if (trimmed === '') {
      errors.push({ field: 'author', message: 'author cannot be empty.' });
    } else {
      sanitizedQuery.author = trimmed;
    }
  }

  // isbn (optional string)
  if (isbn !== undefined && isbn !== null) {
    const trimmed = String(isbn).trim();
    if (trimmed === '') {
      errors.push({ field: 'isbn', message: 'isbn cannot be empty.' });
    } else {
      sanitizedQuery.isbn = trimmed;
    }
  }

  // categoryId (optional UUID)
  const validCategoryId = validateUUID(categoryId, 'categoryId', errors);
  if (validCategoryId !== null) {
    sanitizedQuery.categoryId = validCategoryId;
  }

  // status (optional CopyStatus enum)
  if (status !== undefined && status !== null) {
    const trimmed = String(status).trim().toUpperCase();
    if (trimmed === '') {
      errors.push({ field: 'status', message: 'status cannot be empty.' });
    } else if (!Object.values(CopyStatus).includes(trimmed)) {
      errors.push({ field: 'status', message: `status must be one of: ${Object.values(CopyStatus).join(', ')}.` });
    } else {
      sanitizedQuery.status = trimmed;
    }
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  req.query = sanitizedQuery;
  next();
};

/**
 * Validator middleware for member search reporting.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const validateSearchMembers = (req, res, next) => {
  const errors = [];
  const sanitizedQuery = {};

  // Common pagination, sort, search, and dates
  validateCommonQueries(req, sanitizedQuery, errors);
  validateDateRange(req, sanitizedQuery, errors);

  const { username, email, role, isActive } = req.query;

  // username (optional string)
  if (username !== undefined && username !== null) {
    const trimmed = String(username).trim();
    if (trimmed === '') {
      errors.push({ field: 'username', message: 'username cannot be empty.' });
    } else {
      sanitizedQuery.username = trimmed;
    }
  }

  // email (optional valid email)
  if (email !== undefined && email !== null) {
    const trimmed = String(email).trim();
    if (trimmed === '') {
      errors.push({ field: 'email', message: 'email cannot be empty.' });
    } else if (!EMAIL_REGEX.test(trimmed)) {
      errors.push({ field: 'email', message: 'email must be a valid email address.' });
    } else {
      sanitizedQuery.email = trimmed;
    }
  }

  // role (optional UserRole enum)
  if (role !== undefined && role !== null) {
    const trimmed = String(role).trim().toUpperCase();
    if (trimmed === '') {
      errors.push({ field: 'role', message: 'role cannot be empty.' });
    } else if (!Object.values(UserRole).includes(trimmed)) {
      errors.push({ field: 'role', message: `role must be one of: ${Object.values(UserRole).join(', ')}.` });
    } else {
      sanitizedQuery.role = trimmed;
    }
  }

  // isActive (optional boolean string)
  if (isActive !== undefined && isActive !== null) {
    const trimmed = String(isActive).trim().toLowerCase();
    if (trimmed === '') {
      errors.push({ field: 'isActive', message: 'isActive cannot be empty.' });
    } else if (trimmed !== 'true' && trimmed !== 'false') {
      errors.push({ field: 'isActive', message: 'isActive must be a boolean (true or false).' });
    } else {
      sanitizedQuery.isActive = trimmed === 'true';
    }
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  req.query = sanitizedQuery;
  next();
};

/**
 * Validator middleware for loan search reporting.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const validateSearchLoans = (req, res, next) => {
  const errors = [];
  const sanitizedQuery = {};

  validateCommonQueries(req, sanitizedQuery, errors);
  validateDateRange(req, sanitizedQuery, errors);

  const { memberId, bookId, copyId, status } = req.query;

  // IDs checks (optional UUIDs)
  const validMemberId = validateUUID(memberId, 'memberId', errors);
  if (validMemberId !== null) sanitizedQuery.memberId = validMemberId;

  const validBookId = validateUUID(bookId, 'bookId', errors);
  if (validBookId !== null) sanitizedQuery.bookId = validBookId;

  const validCopyId = validateUUID(copyId, 'copyId', errors);
  if (validCopyId !== null) sanitizedQuery.copyId = validCopyId;

  // status (optional LoanStatus enum)
  if (status !== undefined && status !== null) {
    const trimmed = String(status).trim().toUpperCase();
    if (trimmed === '') {
      errors.push({ field: 'status', message: 'status cannot be empty.' });
    } else if (!Object.values(LoanStatus).includes(trimmed)) {
      errors.push({ field: 'status', message: `status must be one of: ${Object.values(LoanStatus).join(', ')}.` });
    } else {
      sanitizedQuery.status = trimmed;
    }
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  req.query = sanitizedQuery;
  next();
};

/**
 * Validator middleware for reservation search reporting.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const validateSearchReservations = (req, res, next) => {
  const errors = [];
  const sanitizedQuery = {};

  validateCommonQueries(req, sanitizedQuery, errors);
  validateDateRange(req, sanitizedQuery, errors);

  const { memberId, bookId, status } = req.query;

  const validMemberId = validateUUID(memberId, 'memberId', errors);
  if (validMemberId !== null) sanitizedQuery.memberId = validMemberId;

  const validBookId = validateUUID(bookId, 'bookId', errors);
  if (validBookId !== null) sanitizedQuery.bookId = validBookId;

  // status (optional ReservationStatus enum)
  if (status !== undefined && status !== null) {
    const trimmed = String(status).trim().toUpperCase();
    if (trimmed === '') {
      errors.push({ field: 'status', message: 'status cannot be empty.' });
    } else if (!Object.values(ReservationStatus).includes(trimmed)) {
      errors.push({ field: 'status', message: `status must be one of: ${Object.values(ReservationStatus).join(', ')}.` });
    } else {
      sanitizedQuery.status = trimmed;
    }
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  req.query = sanitizedQuery;
  next();
};

/**
 * Validator middleware for order search reporting.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const validateSearchOrders = (req, res, next) => {
  const errors = [];
  const sanitizedQuery = {};

  validateCommonQueries(req, sanitizedQuery, errors);
  validateDateRange(req, sanitizedQuery, errors);

  const { memberId, status, paymentStatus } = req.query;

  const validMemberId = validateUUID(memberId, 'memberId', errors);
  if (validMemberId !== null) sanitizedQuery.memberId = validMemberId;

  // status (optional OrderStatus enum)
  if (status !== undefined && status !== null) {
    const trimmed = String(status).trim().toUpperCase();
    if (trimmed === '') {
      errors.push({ field: 'status', message: 'status cannot be empty.' });
    } else if (!Object.values(OrderStatus).includes(trimmed)) {
      errors.push({ field: 'status', message: `status must be one of: ${Object.values(OrderStatus).join(', ')}.` });
    } else {
      sanitizedQuery.status = trimmed;
    }
  }

  // paymentStatus (optional PaymentStatus enum)
  if (paymentStatus !== undefined && paymentStatus !== null) {
    const trimmed = String(paymentStatus).trim().toUpperCase();
    if (trimmed === '') {
      errors.push({ field: 'paymentStatus', message: 'paymentStatus cannot be empty.' });
    } else if (!Object.values(PaymentStatus).includes(trimmed)) {
      errors.push({ field: 'paymentStatus', message: `paymentStatus must be one of: ${Object.values(PaymentStatus).join(', ')}.` });
    } else {
      sanitizedQuery.paymentStatus = trimmed;
    }
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  req.query = sanitizedQuery;
  next();
};

/**
 * Validator middleware for overdue report.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const validateOverdueReport = (req, res, next) => {
  const errors = [];
  const sanitizedQuery = {};

  validateCommonQueries(req, sanitizedQuery, errors);
  validateDateRange(req, sanitizedQuery, errors);

  const { memberId, bookId, severity } = req.query;

  const validMemberId = validateUUID(memberId, 'memberId', errors);
  if (validMemberId !== null) sanitizedQuery.memberId = validMemberId;

  const validBookId = validateUUID(bookId, 'bookId', errors);
  if (validBookId !== null) sanitizedQuery.bookId = validBookId;

  // severity (optional; LOW, MEDIUM, HIGH)
  if (severity !== undefined && severity !== null) {
    const trimmed = String(severity).trim().toUpperCase();
    if (trimmed === '') {
      errors.push({ field: 'severity', message: 'severity cannot be empty.' });
    } else if (trimmed !== 'LOW' && trimmed !== 'MEDIUM' && trimmed !== 'HIGH') {
      errors.push({ field: 'severity', message: 'severity must be one of: LOW, MEDIUM, HIGH.' });
    } else {
      sanitizedQuery.severity = trimmed;
    }
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  req.query = sanitizedQuery;
  next();
};

/**
 * Validator middleware for inventory report.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const validateInventoryReport = (req, res, next) => {
  const errors = [];
  const sanitizedQuery = {};

  // Common pagination, sort, search, and dates
  validateCommonQueries(req, sanitizedQuery, errors);

  // Set defaults for page and limit if not provided
  if (sanitizedQuery.page === undefined) {
    sanitizedQuery.page = 1;
  }
  if (sanitizedQuery.limit === undefined) {
    sanitizedQuery.limit = 20;
  }

  // Validate sortBy against inventory sort fields allow-list
  if (sanitizedQuery.sortBy === undefined) {
    sanitizedQuery.sortBy = 'title';
  } else if (!INVENTORY_SORT_FIELDS.includes(sanitizedQuery.sortBy)) {
    errors.push({
      field: 'sortBy',
      message: `sortBy must be one of: ${INVENTORY_SORT_FIELDS.join(', ')}.`
    });
  }

  // Set default for sortOrder if omitted. validateCommonQueries already handles validation if present
  if (sanitizedQuery.sortOrder === undefined) {
    sanitizedQuery.sortOrder = 'asc';
  }

  const { categoryId, authorId, publisher, availability, includeZeroAvailable } = req.query;

  // Validate categoryId UUID
  const validCategoryId = validateUUID(categoryId, 'categoryId', errors);
  if (validCategoryId !== null) {
    sanitizedQuery.categoryId = validCategoryId;
  }

  // Validate authorId UUID
  const validAuthorId = validateUUID(authorId, 'authorId', errors);
  if (validAuthorId !== null) {
    sanitizedQuery.authorId = validAuthorId;
  }

  // Validate publisher (optional trimmed string, max 100)
  if (publisher != null) {
    const trimmed = String(publisher).trim();
    if (trimmed === '') {
      errors.push({ field: 'publisher', message: 'publisher cannot be empty.' });
    } else if (trimmed.length > 100) {
      errors.push({ field: 'publisher', message: 'publisher must be 100 characters or less.' });
    } else {
      sanitizedQuery.publisher = trimmed;
    }
  }

  // Validate availability enum
  if (availability !== undefined && availability !== null) {
    const trimmed = String(availability).trim().toLowerCase();
    if (trimmed === '') {
      errors.push({ field: 'availability', message: 'availability cannot be empty.' });
    } else if (!INVENTORY_AVAILABILITY.includes(trimmed)) {
      errors.push({ field: 'availability', message: `availability must be one of: ${INVENTORY_AVAILABILITY.join(', ')}.` });
    } else {
      sanitizedQuery.availability = trimmed;
    }
  } else {
    sanitizedQuery.availability = 'all';
  }

  // Validate includeZeroAvailable boolean string
  if (includeZeroAvailable !== undefined && includeZeroAvailable !== null) {
    const trimmed = String(includeZeroAvailable).trim().toLowerCase();
    if (trimmed === '') {
      errors.push({ field: 'includeZeroAvailable', message: 'includeZeroAvailable cannot be empty.' });
    } else if (trimmed !== 'true' && trimmed !== 'false') {
      errors.push({ field: 'includeZeroAvailable', message: 'includeZeroAvailable must be a boolean (true or false).' });
    } else {
      sanitizedQuery.includeZeroAvailable = trimmed === 'true';
    }
  } else {
    sanitizedQuery.includeZeroAvailable = false;
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  req.query = sanitizedQuery;
  next();
};

/**
 * Validator middleware for member report.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const validateMemberReport = (req, res, next) => {
  const errors = [];
  const sanitizedParams = {};
  const sanitizedQuery = {};

  // Validate memberId param (required, valid UUID)
  const { memberId } = req.params;
  if (memberId === undefined || memberId === null) {
    errors.push({ field: 'memberId', message: 'memberId parameter is required.' });
  } else {
    const trimmed = String(memberId).trim();
    if (trimmed === '') {
      errors.push({ field: 'memberId', message: 'memberId parameter cannot be empty.' });
    } else if (!UUID_REGEX.test(trimmed)) {
      errors.push({ field: 'memberId', message: 'memberId must be a valid UUID.' });
    } else {
      sanitizedParams.memberId = trimmed;
    }
  }

  // Validate standard query parameters (page, limit, sortBy, sortOrder, search)
  validateCommonQueries(req, sanitizedQuery, errors);

  // Apply default page/limit values if not present
  if (sanitizedQuery.page === undefined) {
    sanitizedQuery.page = 1;
  }
  if (sanitizedQuery.limit === undefined) {
    sanitizedQuery.limit = 20;
  }

  // Validate and normalize sortBy
  if (sanitizedQuery.sortBy !== undefined) {
    if (!MEMBER_REPORT_SORT_FIELDS.includes(sanitizedQuery.sortBy)) {
      errors.push({ field: 'sortBy', message: `sortBy must be one of: ${MEMBER_REPORT_SORT_FIELDS.join(', ')}.` });
    }
  } else {
    sanitizedQuery.sortBy = 'createdAt';
  }

  // Validate and normalize sortOrder
  if (sanitizedQuery.sortOrder === undefined) {
    sanitizedQuery.sortOrder = 'desc';
  }

  // Validate and normalize activityType
  const { activityType } = req.query;
  if (activityType !== undefined && activityType !== null) {
    const trimmed = String(activityType).trim().toLowerCase();
    if (trimmed === '') {
      errors.push({ field: 'activityType', message: 'activityType cannot be empty.' });
    } else if (!MEMBER_REPORT_ACTIVITY_TYPES.includes(trimmed)) {
      errors.push({ field: 'activityType', message: `activityType must be one of: ${MEMBER_REPORT_ACTIVITY_TYPES.join(', ')}.` });
    } else {
      sanitizedQuery.activityType = trimmed;
    }
  } else {
    sanitizedQuery.activityType = 'all';
  }

  // Validate optional date ranges in query
  validateDateRange(req, sanitizedQuery, errors);

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  // Sanitized req.params writes back only the validated memberId
  req.params = {
    memberId: sanitizedParams.memberId
  };
  req.query = sanitizedQuery;
  next();
};

