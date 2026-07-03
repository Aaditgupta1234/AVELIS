/**
 * @fileoverview Authentication middleware.
 *
 * Placeholder for JWT-based route protection.
 * Will verify the Bearer token from the Authorization header
 * and attach the authenticated user to req.user.
 *
 * @module middleware/security/auth
 *
 * @example
 * // Future usage:
 * // import { protect } from '../middleware/security/auth.js';
 * // router.get('/profile', protect, getProfile);
 */

/**
 * Protect routes by verifying JWT token.
 *
 * @placeholder Not yet implemented.
 *
 * @param {import('express').Request} _req
 * @param {import('express').Response} _res
 * @param {import('express').NextFunction} next
 */
export const protect = (_req, _res, next) => {
  // TODO: Implement JWT verification
  // 1. Extract token from Authorization header
  // 2. Verify token using jsonwebtoken
  // 3. Attach user to req.user
  // 4. Call next() or throw ApiError(401)
  next();
};
