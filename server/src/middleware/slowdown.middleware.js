/**
 * @fileoverview Centralized request slowdown middleware.
 *
 * Instantiates express-slow-down middleware configurations using settings
 * established in rate-limit.config.js. Enforces progressive latencies,
 * headers compliance, and precise skipping predicates for independent buckets.
 *
 * @module middleware/slowdown.middleware
 */

import { slowDown } from 'express-slow-down';
import { rateLimitConfig } from '../config/index.js';
import { securityLogger } from '../utils/securityLogger.js';

/**
 * Creates a progressive delay function.
 *
 * @param {Object} config - Slowdown configuration containing delayMs
 * @returns {Function} express-slow-down delay function
 */
const makeProgressiveDelay = (config) => {
  return (used, req) => {
    const delayAfter = req.slowDown.limit;
    const delay = (used - delayAfter) * config.delayMs;
    if (delay > 0) {
      securityLogger.logSlowdownThrottling(req, { delay, used, limit: delayAfter });
    }
    return delay;
  };
};

/** Global API Slowdown Middleware */
export const globalSlowdown = slowDown({
  ...rateLimitConfig.globalSlowdownConfig,
  delayMs: makeProgressiveDelay(rateLimitConfig.globalSlowdownConfig),
  skip: (req) => {
    const path = req.path;
    const method = req.method;
    
    // Skip auth endpoints (handled by authSlowdown)
    if (path.startsWith('/api/v1/auth')) {
      return true;
    }
    
    // Skip book search / catalog query endpoints (handled by searchSlowdown)
    if ((path === '/api/v1/books' || path === '/api/v1/books/search') && method === 'GET') {
      return true;
    }
    
    // Skip administrative reporting / export endpoints (handled by report/export slowdowns)
    if (path.startsWith('/api/v1/admin/dashboard/reports')) {
      return true;
    }
    
    return false;
  }
});

/** Authentication Slowdown Middleware */
export const authSlowdown = slowDown({
  ...rateLimitConfig.authSlowdownConfig,
  delayMs: makeProgressiveDelay(rateLimitConfig.authSlowdownConfig)
});

/** Search Slowdown Middleware */
export const searchSlowdown = slowDown({
  ...rateLimitConfig.searchSlowdownConfig,
  delayMs: makeProgressiveDelay(rateLimitConfig.searchSlowdownConfig)
});

/** Reports Slowdown Middleware */
export const reportSlowdown = slowDown({
  ...rateLimitConfig.reportSlowdownConfig,
  delayMs: makeProgressiveDelay(rateLimitConfig.reportSlowdownConfig)
});

/** Export Slowdown Middleware */
export const exportSlowdown = slowDown({
  ...rateLimitConfig.exportSlowdownConfig,
  delayMs: makeProgressiveDelay(rateLimitConfig.exportSlowdownConfig)
});
