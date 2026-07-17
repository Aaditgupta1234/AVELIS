/**
 * @fileoverview Standardized API response helpers.
 *
 * Provides helper functions for controllers to send success and error HTTP responses
 * conforming to a consistent JSON structure.
 *
 * @module utils/response
 */

import { securityLogger } from './securityLogger.js';

/**
 * Send a standardized success API response.
 *
 * @param {import('express').Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {*} [data=null] - Payload data
 * @param {string} [message='Success'] - Response message
 * @param {Object} [meta={}] - Additional response metadata
 * @returns {import('express').Response} Express response
 */
export const sendSuccess = (res, statusCode, data = null, message = 'Success', meta = {}) => {
  const req = res.req;
  if (req && req.originalUrl) {
    if (req.originalUrl.endsWith('/auth/login') && req.method === 'POST') {
      securityLogger.logAuthenticationSuccess(req, { userId: data?.user?.id });
    } else if (req.originalUrl.endsWith('/auth/register') && req.method === 'POST') {
      securityLogger.logAuthenticationSuccess(req, { userId: data?.id, action: 'register' });
    }
  }

  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
  });
};

/**
 * Send a standardized error API response.
 *
 * @param {import('express').Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} [message='Error'] - Error message
 * @param {Array} [errors=[]] - Array of error details
 * @returns {import('express').Response} Express response
 */
export const sendError = (res, statusCode, message = 'Error', errors = []) => {
  const req = res.req;
  if (req && statusCode === 400 && message === 'Validation failed.') {
    securityLogger.logValidationFailure(req, errors);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
