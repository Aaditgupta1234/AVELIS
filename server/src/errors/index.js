/**
 * @fileoverview Custom error classes barrel.
 *
 * Re-exports ApiError and provides a central location for
 * domain-specific error subclasses.
 *
 * @module errors
 *
 * @example
 * import { ApiError } from '../errors/index.js';
 * throw new ApiError(404, 'Book not found');
 */

export { ApiError } from '../utils/ApiError.js';

// -----------------------------------------------------------------------
// Future domain-specific error classes
// -----------------------------------------------------------------------

// TODO: Implement when needed
// export class NotFoundError extends ApiError { ... }
// export class ValidationError extends ApiError { ... }
// export class UnauthorizedError extends ApiError { ... }
// export class ForbiddenError extends ApiError { ... }
// export class ConflictError extends ApiError { ... }
