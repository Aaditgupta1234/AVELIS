/**
 * @fileoverview Standardized API success response class.
 *
 * Provides a consistent response structure for all successful
 * API responses throughout the application.
 *
 * @module utils/ApiResponse
 */

/**
 * Represents a standardized API success response.
 *
 * @class ApiResponse
 *
 * @example
 * const response = new ApiResponse(200, { user }, 'User fetched');
 * res.status(response.statusCode).json(response);
 *
 * @example
 * // With pagination meta
 * const response = new ApiResponse(200, books, 'Books fetched', {
 *   page: 1,
 *   totalPages: 5,
 *   totalResults: 50,
 * });
 */
class ApiResponse {
  /**
   * Create an ApiResponse.
   *
   * @param {number} statusCode - HTTP status code
   * @param {*}      [data=null] - Response payload
   * @param {string} [message='Success'] - Human-readable message
   * @param {Object} [meta={}] - Additional metadata (pagination, etc.)
   */
  constructor(statusCode, data = null, message = 'Success', meta = {}) {
    /** @type {number} HTTP status code */
    this.statusCode = statusCode;

    /** @type {boolean} True for successful responses */
    this.success = statusCode < 400;

    /** @type {string} Human-readable message */
    this.message = message;

    /** @type {*} Response data payload */
    this.data = data;

    /** @type {Object} Additional metadata */
    this.meta = meta;
  }
}

export { ApiResponse };
