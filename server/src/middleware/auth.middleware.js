/**
 * @fileoverview Authentication middleware.
 *
 * Extracts the JWT from the Authorization header (Bearer token format),
 * verifies it using the JWT utility, and attaches the decoded payload to req.user.
 *
 * @module middleware/auth.middleware
 */

import { verifyToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Middleware to authenticate requests via JWT.
 *
 * Expects Authorization header in format: Bearer <token>
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next(new ApiError(401, 'Authorization header is missing'));
    }

    if (!authHeader.startsWith('Bearer ')) {
      return next(
        new ApiError(401, 'Invalid Authorization format. Expected "Bearer <token>"')
      );
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(new ApiError(401, 'Token is missing'));
    }

    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      next();
    } catch (err) {
      return next(new ApiError(401, err.message || 'Invalid or expired token'));
    }
  } catch (err) {
    next(err);
  }
};
