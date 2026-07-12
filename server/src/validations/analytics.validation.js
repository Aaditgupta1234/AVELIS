import { sendError } from '../utils/index.js';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:?\d{2})?)?$/;

/**
 * Validator middleware for retrieving borrowing analytics.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const validateBorrowingAnalytics = (req, res, next) => {
  const errors = [];
  const { startDate, endDate, limit } = req.query;

  let validStartDate = null;
  let validEndDate = null;
  let parsedStartDate = null;
  let parsedEndDate = null;
  let validLimit = 10;

  if (startDate !== undefined && startDate !== null) {
    const trimmed = String(startDate).trim();
    if (trimmed === '') {
      errors.push({ field: 'startDate', message: 'startDate cannot be empty.' });
    } else {
      const parsed = Date.parse(trimmed);
      const isIso = ISO_DATE_REGEX.test(trimmed);
      let isValidDate = !isNaN(parsed) && isIso;

      if (isValidDate) {
        const [datePart] = trimmed.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const utcDate = new Date(Date.UTC(year, month - 1, day));
        if (utcDate.getUTCFullYear() !== year || (utcDate.getUTCMonth() + 1) !== month || utcDate.getUTCDate() !== day) {
          isValidDate = false;
        }
      }

      if (!isValidDate) {
        errors.push({ field: 'startDate', message: 'startDate must be a valid ISO-8601 date.' });
      } else {
        parsedStartDate = new Date(trimmed);
        validStartDate = trimmed;
      }
    }
  }

  if (endDate !== undefined && endDate !== null) {
    const trimmed = String(endDate).trim();
    if (trimmed === '') {
      errors.push({ field: 'endDate', message: 'endDate cannot be empty.' });
    } else {
      const parsed = Date.parse(trimmed);
      const isIso = ISO_DATE_REGEX.test(trimmed);
      let isValidDate = !isNaN(parsed) && isIso;

      if (isValidDate) {
        const [datePart] = trimmed.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const utcDate = new Date(Date.UTC(year, month - 1, day));
        if (utcDate.getUTCFullYear() !== year || (utcDate.getUTCMonth() + 1) !== month || utcDate.getUTCDate() !== day) {
          isValidDate = false;
        }
      }

      if (!isValidDate) {
        errors.push({ field: 'endDate', message: 'endDate must be a valid ISO-8601 date.' });
      } else {
        parsedEndDate = new Date(trimmed);
        validEndDate = trimmed;
      }
    }
  }

  if (parsedStartDate && parsedEndDate && parsedStartDate.getTime() > parsedEndDate.getTime()) {
    errors.push({ field: 'startDate', message: 'startDate cannot be after endDate.' });
  }

  if (limit !== undefined && limit !== null) {
    const trimmed = String(limit).trim();
    if (trimmed === '') {
      errors.push({ field: 'limit', message: 'limit cannot be empty.' });
    } else {
      const num = Number(trimmed);
      const isInteger = Number.isInteger(num);
      const isPositive = num > 0;
      const isValidNumber = /^\d+$/.test(trimmed);

      if (!isValidNumber || !isInteger || !isPositive) {
        errors.push({ field: 'limit', message: 'limit must be a positive integer.' });
      } else if (num > 100) {
        errors.push({ field: 'limit', message: 'limit cannot exceed 100.' });
      } else {
        validLimit = num;
      }
    }
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  // Clear query entirely and preserve only validated/sanitized parameters
  req.query = {};
  if (validStartDate !== null) req.query.startDate = validStartDate;
  if (validEndDate !== null) req.query.endDate = validEndDate;
  req.query.limit = validLimit;

  next();
};

/**
 * Validator middleware for retrieving member analytics.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const validateMemberAnalytics = (req, res, next) => {
  next();
};

/**
 * Validator middleware for retrieving rating analytics.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const validateRatingAnalytics = (req, res, next) => {
  next();
};

/**
 * Validator middleware for retrieving time-series analytics.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const validateTimeSeriesAnalytics = (req, res, next) => {
  next();
};
