import { sendError } from '../utils/index.js';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

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
    return res.status(400).json({
      success: false,
      message: 'Invalid reservation ID.'
    });
  }

  req.params.id = id.trim();
  next();
};
