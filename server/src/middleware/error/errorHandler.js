/**
 * @fileoverview Global error handler middleware.
 *
 * Catches all errors thrown or passed via next(err) and
 * returns a consistent JSON error response.
 *
 * @module middleware/error/errorHandler
 */

import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../config/logger.js';
import { securityLogger } from '../../utils/securityLogger.js';

/**
 * Global error handling middleware.
 *
 * Differentiates between operational ApiErrors and unexpected
 * errors. Logs the error and returns a structured JSON response.
 *
 * @param {Error} err - The error object
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} _next - Express next (unused)
 */
const errorHandler = (err, req, res, _next) => {
  // Default to 500 if no status code is set
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Handle Mongoose cast errors (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue).join(', ');
    message = `Duplicate value for: ${field}`;
  }

  // Log the error
  if (statusCode >= 500) {
    logger.error(`[${statusCode}] ${message}`, err.stack);
    securityLogger.logSecurityException(req, err);
  } else {
    logger.warn(`[${statusCode}] ${message}`);
    
    // Log authentication failures on auth endpoints
    if (req && req.originalUrl && (req.originalUrl.endsWith('/auth/login') || req.originalUrl.endsWith('/auth/register')) && req.method === 'POST') {
      securityLogger.logAuthenticationFailure(req, message, { statusCode, errors });
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export { errorHandler };
