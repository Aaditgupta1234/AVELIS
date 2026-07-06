import { sendError } from '../utils/index.js';

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


