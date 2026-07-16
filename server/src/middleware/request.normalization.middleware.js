/**
 * @fileoverview Request normalization middleware.
 *
 * Sanitizes and normalizes incoming request parameters (body, query, params)
 * before validator middleware execution. Strips prototype pollution fields,
 * removes non-printable control characters, trims whitespace, and normalizes Unicode.
 *
 * @module middleware/request.normalization.middleware
 */

import { sanitizeObject, normalizeEmail, normalizeUsername } from '../utils/index.js';

/**
 * Express middleware to normalize and sanitize request inputs.
 * Ensures original request objects are deeply cloned rather than mutated directly.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const requestNormalizationMiddleware = (req, res, next) => {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
      for (const key of Object.keys(req.body)) {
        const kLower = key.toLowerCase();
        if (kLower.includes('email')) {
          req.body[key] = normalizeEmail(req.body[key]);
        } else if (kLower.includes('username')) {
          req.body[key] = normalizeUsername(req.body[key]);
        }
      }
    }

    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
      for (const key of Object.keys(req.query)) {
        const kLower = key.toLowerCase();
        if (kLower.includes('email')) {
          req.query[key] = normalizeEmail(req.query[key]);
        } else if (kLower.includes('username')) {
          req.query[key] = normalizeUsername(req.query[key]);
        }
      }
    }

    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
      for (const key of Object.keys(req.params)) {
        const kLower = key.toLowerCase();
        if (kLower.includes('email')) {
          req.params[key] = normalizeEmail(req.params[key]);
        } else if (kLower.includes('username')) {
          req.params[key] = normalizeUsername(req.params[key]);
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default requestNormalizationMiddleware;
