import { ApiError } from '../utils/index.js';
import { UserRole } from '@prisma/client';

/**
 * Middleware to restrict access to administrator users only.
 *
 * Assumes the request has already passed through the auth middleware,
 * which decodes the JWT and attaches the user details to req.user.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const adminMiddleware = (req, res, next) => {
  try {
    if (!req.user || !req.user.role || req.user.role !== UserRole.ADMIN) {
      return next(
        new ApiError(403, 'Access denied. Administrator privileges required.')
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
