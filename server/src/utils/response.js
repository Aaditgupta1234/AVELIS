/**
 * @fileoverview Standardized API response helpers.
 *
 * Provides helper functions for controllers to send success and error HTTP responses
 * conforming to a consistent JSON structure.
 *
 * @module utils/response
 */

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
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
