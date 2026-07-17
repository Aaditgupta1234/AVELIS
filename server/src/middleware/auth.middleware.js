/**
 * @fileoverview Authentication middleware.
 *
 * Extracts the JWT from the Authorization header (Bearer token format),
 * verifies it using the hardened JWT utility, and attaches the decoded payload to req.user.
 * Sanitizes all authentication errors to prevent implementation details leakage.
 *
 * @module middleware/auth.middleware
 */

import { verifyToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import { securityLogger } from '../utils/securityLogger.js';

/**
 * Middleware to authenticate requests via JWT.
 *
 * Expects Authorization header in format: Bearer <token>
 * Returns standardized client-facing errors for all authentication failures.
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('import').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      securityLogger.logJwtFailure(req, 'Missing or malformed Authorization header');
      return next(new ApiError(401, 'Invalid or expired authentication token'));
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      securityLogger.logJwtFailure(req, 'Empty Bearer token');
      return next(new ApiError(401, 'Invalid or expired authentication token'));
    }

    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      next();
    } catch (err) {
      // Sanitize all token verification errors to return a unified message
      securityLogger.logJwtFailure(req, err.message);
      return next(new ApiError(401, 'Invalid or expired authentication token'));
    }
  } catch (err) {
    securityLogger.logJwtFailure(req, err.message);
    next(new ApiError(401, 'Invalid or expired authentication token'));
  }
};
