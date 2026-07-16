/**
 * @fileoverview Centralized rate limiting middleware.
 *
 * Instantiates express-rate-limit middleware configurations using settings
 * established in rate-limit.config.js. Enforces standardized JSON error payloads,
 * headers compliance, and precise skipping predicates for independent buckets.
 *
 * @module middleware/rate-limit.middleware
 */

import rateLimit from 'express-rate-limit';
import { rateLimitConfig } from '../config/index.js';

/** Standard Rate Limit Exceeded Error Handler */
const standardLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  });
};

/** Global API Rate Limiter */
export const globalRateLimiter = rateLimit({
  ...rateLimitConfig.globalLimiterConfig,
  handler: standardLimitHandler,
  skip: (req) => {
    const path = req.path;
    const method = req.method;
    
    // Skip auth endpoints (handled by authRateLimiter)
    if (path.startsWith('/api/v1/auth')) {
      return true;
    }
    
    // Skip book search / catalog query endpoints (handled by searchRateLimiter)
    if ((path === '/api/v1/books' || path === '/api/v1/books/search') && method === 'GET') {
      return true;
    }
    
    // Skip administrative reporting / export endpoints (handled by report/export limiters)
    if (path.startsWith('/api/v1/admin/dashboard/reports')) {
      return true;
    }
    
    return false;
  }
});

/** Authentication Rate Limiter */
export const authRateLimiter = rateLimit({
  ...rateLimitConfig.authLimiterConfig,
  handler: standardLimitHandler
});

/** Search Rate Limiter */
export const searchRateLimiter = rateLimit({
  ...rateLimitConfig.searchLimiterConfig,
  handler: standardLimitHandler
});

/** Reports Rate Limiter */
export const reportRateLimiter = rateLimit({
  ...rateLimitConfig.reportLimiterConfig,
  handler: standardLimitHandler
});

/** Export Rate Limiter */
export const exportRateLimiter = rateLimit({
  ...rateLimitConfig.exportLimiterConfig,
  handler: standardLimitHandler
});
