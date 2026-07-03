/**
 * @fileoverview HTTP status code constants.
 *
 * Provides named constants for commonly used HTTP status codes.
 * Avoids magic numbers throughout the codebase.
 *
 * @module constants/statusCodes
 */

/**
 * HTTP status codes used in the application.
 *
 * @readonly
 * @enum {number}
 */
export const STATUS_CODES = Object.freeze({
  // 2xx Success
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  // 3xx Redirection
  NOT_MODIFIED: 304,

  // 4xx Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
});
