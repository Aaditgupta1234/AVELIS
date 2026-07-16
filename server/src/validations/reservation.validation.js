import { sendError } from '../utils/index.js';
import { ReservationStatus } from '@prisma/client';
import { validateUUID, validatePagination, validateSort } from '../utils/index.js';

/** Module-level constant: hoisted to avoid per-request allocation in reservationQueryValidator. */
const ALLOWED_RESERVATION_STATUSES = Object.freeze(Object.values(ReservationStatus));

/** Module-level constant: hoisted to avoid per-request array allocation in reservationQueryValidator. */
const ALLOWED_SORT_FIELDS = Object.freeze(['createdAt', 'expiresAt', 'status']);

/**
 * Validator middleware for creating a reservation.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const createReservationValidator = (req, res, next) => {
  const errors = [];
  const { bookId, userId } = req.body;

  if (bookId === undefined || bookId === null || !validateUUID(bookId)) {
    errors.push({ field: 'bookId', message: 'bookId is required and must be a valid UUID.' });
  } else {
    req.body.bookId = bookId.trim();
  }

  if (userId !== undefined && userId !== null) {
    if (!validateUUID(userId)) {
      errors.push({ field: 'userId', message: 'userId must be a valid UUID.' });
    } else {
      req.body.userId = userId.trim();
    }
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  next();
};

/**
 * Validator middleware for retrieving a reservation by ID.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const reservationIdParamValidator = (req, res, next) => {
  const { id } = req.params;

  if (!id || !validateUUID(id)) {
    return sendError(res, 400, 'Invalid reservation ID.');
  }

  req.params.id = id.trim();
  next();
};

/**
 * Validator middleware for querying reservations.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const reservationQueryValidator = (req, res, next) => {
  const { page, limit, status, userId, bookId, sortBy, sortOrder } = req.query;

  // 1. Pagination Validation & Normalization
  const pageRes = validatePagination(page, limit);
  const errors = pageRes.errors;
  req.query.page = pageRes.pageVal;
  req.query.limit = pageRes.limitVal;

  // 2. status validation
  if (status !== undefined && status !== null) {
    const statusStr = String(status).trim();
    if (!ALLOWED_RESERVATION_STATUSES.includes(statusStr)) {
      errors.push({ field: 'status', message: `status must be a valid ReservationStatus: ${ALLOWED_RESERVATION_STATUSES.join(', ')}.` });
    } else {
      req.query.status = statusStr;
    }
  }

  // 3. userId validation
  if (userId !== undefined && userId !== null) {
    if (!validateUUID(userId)) {
      errors.push({ field: 'userId', message: 'userId must be a valid UUID.' });
    } else {
      req.query.userId = String(userId).trim();
    }
  }

  // 4. bookId validation
  if (bookId !== undefined && bookId !== null) {
    if (!validateUUID(bookId)) {
      errors.push({ field: 'bookId', message: 'bookId must be a valid UUID.' });
    } else {
      req.query.bookId = String(bookId).trim();
    }
  }

  // 5. Sort Validation
  const sortRes = validateSort(sortBy, sortOrder, ALLOWED_SORT_FIELDS);
  errors.push(...sortRes.errors);
  req.query.sortBy = sortBy !== undefined && sortBy !== null ? String(sortBy).trim() : 'createdAt';
  req.query.sortOrder = sortRes.sortOrderNormalized;

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  next();
};
