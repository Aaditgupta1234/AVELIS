/**
 * @fileoverview 404 Not Found middleware.
 *
 * Catches all requests that don't match any defined route
 * and returns a structured JSON 404 response.
 *
 * @module middleware/error/notFound
 */

import { securityLogger } from '../../utils/securityLogger.js';

const SUSPICIOUS_PATTERNS = [
  /\.env/i,
  /wp-admin/i,
  /phpmyadmin/i,
  /xmlrpc/i,
  /cgi-bin/i,
  /console/i
];

/**
 * Not Found middleware.
 *
 * Responds with a 404 JSON error for any unmatched route.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} _next - Express next (unused)
 */
const notFound = (req, res, _next) => {
  const isSuspicious = SUSPICIOUS_PATTERNS.some(pattern => pattern.test(req.originalUrl));
  if (isSuspicious) {
    securityLogger.logSuspiciousRequest(req, 'Scan pattern matched on 404 route');
  }

  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

export { notFound };
