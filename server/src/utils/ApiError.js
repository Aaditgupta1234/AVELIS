/**
 * @fileoverview Custom API error class.
 *
 * Extends the native Error class with HTTP status codes and
 * structured error details. Used throughout the application
 * to throw consistent, API-friendly errors.
 *
 * @module utils/ApiError
 */

/**
 * Represents an operational API error.
 *
 * @class ApiError
 * @extends Error
 *
 * @example
 * throw new ApiError(404, 'User not found');
 * throw new ApiError(422, 'Validation failed', [
 *   { field: 'email', message: 'Email is required' },
 * ]);
 */
class ApiError extends Error {
  /**
   * Create an ApiError.
   *
   * @param {number} statusCode - HTTP status code
   * @param {string} [message='Something went wrong'] - Error message
   * @param {Array}  [errors=[]] - Additional error details
   * @param {string} [stack=''] - Optional stack trace override
   */
  constructor(
    statusCode,
    message = 'Something went wrong',
    errors = [],
    stack = ''
  ) {
    super(message);

    /** @type {number} HTTP status code */
    this.statusCode = statusCode;

    /** @type {boolean} Always false for errors */
    this.success = false;

    /** @type {Array} Detailed error information */
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else if (process.env.NODE_ENV !== 'production' || statusCode >= 500) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
