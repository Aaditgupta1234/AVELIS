/**
 * @fileoverview Dashboard module validations.
 *
 * Provides validator middlewares for dashboard and analytics endpoints.
 *
 * @module validations/dashboard
 */

import { sendError } from '../utils/index.js';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:?\d{2})?)?$/;

/**
 * Validator middleware for retrieving dashboard summary.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const validateDashboardSummary = (req, res, next) => {
  const errors = [];
  const { startDate, endDate } = req.query;

  let validStartDate = null;
  let validEndDate = null;
  let parsedStartDate = null;
  let parsedEndDate = null;

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

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  // Clear query entirely and preserve only validated/sanitized parameters
  req.query = {};
  if (validStartDate !== null) req.query.startDate = validStartDate;
  if (validEndDate !== null) req.query.endDate = validEndDate;

  next();
};

/**
 * Validator middleware for retrieving dashboard analytics.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const validateAnalytics = (req, res, next) => {
  // Placeholder: validations will be added in future Phase 13 sub-phases
  next();
};

/**
 * Validator middleware for retrieving dashboard reports.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const validateReports = (req, res, next) => {
  // Placeholder: validations will be added in future Phase 13 sub-phases
  next();
};
