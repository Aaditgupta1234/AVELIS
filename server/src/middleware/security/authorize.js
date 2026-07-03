/**
 * @fileoverview Role-based authorization middleware.
 *
 * Placeholder for restricting route access based on user roles.
 * Depends on the auth middleware having already attached req.user.
 *
 * @module middleware/security/authorize
 *
 * @example
 * // Future usage:
 * // import { authorize } from '../middleware/security/authorize.js';
 * // router.delete('/books/:id', protect, authorize('admin', 'librarian'), deleteBook);
 */

/**
 * Restrict access to specified roles.
 *
 * @placeholder Not yet implemented.
 *
 * @param  {...string} _roles - Allowed role strings
 * @returns {import('express').RequestHandler} Middleware function
 */
export const authorize = (..._roles) => {
  return (_req, _res, next) => {
    // TODO: Implement role-based authorization
    // 1. Check if req.user.role is in the allowed roles
    // 2. Call next() if authorized
    // 3. Throw ApiError(403) if not authorized
    next();
  };
};
