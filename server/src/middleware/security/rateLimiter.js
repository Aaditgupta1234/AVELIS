/**
 * @fileoverview Rate limiting middleware.
 *
 * Configures express-rate-limit for general API protection and
 * stricter auth endpoint protection. Uses in-memory store by default,
 * which is compatible with future distributed stores (e.g., Redis).
 *
 * @module middleware/security/rateLimiter
 *
 * @example
 * import { apiLimiter, authLimiter } from '../middleware/security/rateLimiter.js';
 * app.use('/api', apiLimiter);
 * app.use('/api/v1/auth', authLimiter);
 */

import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter.
 *
 * Limits each IP to 150 requests per 15-minute window.
 * Applies to all API routes.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150,
  standardHeaders: true,  // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,   // Disable X-RateLimit-* headers
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  skipSuccessfulRequests: false,
});

/**
 * Stricter rate limiter for authentication endpoints.
 *
 * Limits each IP to 20 requests per 15-minute window.
 * Applies to login, register, and token refresh routes.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.'
  },
  skipSuccessfulRequests: false,
});
