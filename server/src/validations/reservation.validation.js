import { sendError } from '../utils/index.js';
import { ReservationStatus } from '@prisma/client';
import { UUID_REGEX } from '../helpers/validation.helper.js';

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

  if (bookId === undefined || bookId === null || typeof bookId !== 'string' || !UUID_REGEX.test(bookId.trim())) {
    errors.push({ field: 'bookId', message: 'bookId is required and must be a valid UUID.' });
  } else {
    req.body.bookId = bookId.trim();
  }

  if (userId !== undefined && userId !== null) {
    if (typeof userId !== 'string' || !UUID_REGEX.test(userId.trim())) {
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

  if (!id || typeof id !== 'string' || !UUID_REGEX.test(id.trim())) {
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
  const errors = [];
  const { page, limit, status, userId, bookId, sortBy, sortOrder } = req.query;

  // 1. page validation (Accept only positive integers, default to 1)
  if (page !== undefined && page !== null) {
    const pageStr = String(page).trim();
    if (pageStr === '' || !/^\d+$/.test(pageStr)) {
      errors.push({ field: 'page', message: 'Page must be a positive integer.' });
    } else {
      const pageNum = Number(pageStr);
      if (pageNum <= 0) {
        errors.push({ field: 'page', message: 'Page must be a positive integer.' });
      } else {
        req.query.page = pageNum;
      }
    }
  } else {
    req.query.page = 1;
  }

  // 2. limit validation (Accept only positive integers up to 100, default to 10)
  if (limit !== undefined && limit !== null) {
    const limitStr = String(limit).trim();
    if (limitStr === '' || !/^\d+$/.test(limitStr)) {
      errors.push({ field: 'limit', message: 'Limit must be a positive integer.' });
    } else {
      const limitNum = Number(limitStr);
      if (limitNum <= 0) {
        errors.push({ field: 'limit', message: 'Limit must be a positive integer.' });
      } else if (limitNum > 100) {
        errors.push({ field: 'limit', message: 'Limit must be a positive integer not exceeding 100.' });
      } else {
        req.query.limit = limitNum;
      }
    }
  } else {
    req.query.limit = 10;
  }

  // 3. status validation
  if (status !== undefined && status !== null) {
    const statusStr = String(status).trim();
    if (!ALLOWED_RESERVATION_STATUSES.includes(statusStr)) {
      errors.push({ field: 'status', message: `status must be a valid ReservationStatus: ${ALLOWED_RESERVATION_STATUSES.join(', ')}.` });
    } else {
      req.query.status = statusStr;
    }
  }

  // 4. userId validation
  if (userId !== undefined && userId !== null) {
    const userIdStr = String(userId).trim();
    if (userIdStr === '' || !UUID_REGEX.test(userIdStr)) {
      errors.push({ field: 'userId', message: 'userId must be a valid UUID.' });
    } else {
      req.query.userId = userIdStr;
    }
  }

  // 5. bookId validation
  if (bookId !== undefined && bookId !== null) {
    const bookIdStr = String(bookId).trim();
    if (bookIdStr === '' || !UUID_REGEX.test(bookIdStr)) {
      errors.push({ field: 'bookId', message: 'bookId must be a valid UUID.' });
    } else {
      req.query.bookId = bookIdStr;
    }
  }

  // 6. sortBy validation
  if (sortBy !== undefined && sortBy !== null) {
    const sortByStr = String(sortBy).trim();
    if (!ALLOWED_SORT_FIELDS.includes(sortByStr)) {
      errors.push({ field: 'sortBy', message: `sortBy must be one of: ${ALLOWED_SORT_FIELDS.join(', ')}.` });
    } else {
      req.query.sortBy = sortByStr;
    }
  } else {
    req.query.sortBy = 'createdAt';
  }

  // 7. sortOrder validation
  if (sortOrder !== undefined && sortOrder !== null) {
    const sortOrderStr = String(sortOrder).trim().toLowerCase();
    if (sortOrderStr !== 'asc' && sortOrderStr !== 'desc') {
      errors.push({ field: 'sortOrder', message: "sortOrder must be 'asc' or 'desc'." });
    } else {
      req.query.sortOrder = sortOrderStr;
    }
  } else {
    req.query.sortOrder = 'desc';
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  next();
};
