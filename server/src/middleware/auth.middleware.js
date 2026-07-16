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
      return next(new ApiError(401, 'Invalid or expired authentication token'));
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return next(new ApiError(401, 'Invalid or expired authentication token'));
    }

    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      next();
    } catch (err) {
      // Sanitize all token verification errors to return a unified message
      return next(new ApiError(401, 'Invalid or expired authentication token'));
    }
  } catch (err) {
    next(new ApiError(401, 'Invalid or expired authentication token'));
  }
};
