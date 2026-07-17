/**
 * @fileoverview Utilities barrel file.
 *
 * Re-exports all utility modules for clean, centralized imports.
 *
 * @module utils
 *
 * @example
 * import { ApiError, ApiResponse, getPagination } from '../utils/index.js';
 */

export { ApiError } from './ApiError.js';
export { ApiResponse } from './ApiResponse.js';
export { getPagination, getPaginationMeta, buildPaginationMetadata } from './pagination.js';
export { generateToken, verifyToken } from './jwt.js';
export { hashPassword, comparePassword } from './hash.js';
export { sendSuccess, sendError } from './response.js';
export { securityLogger, redactSensitiveData, EVENT_TYPES, SEVERITIES } from './securityLogger.js';
export { slugify } from './slugify.js';
export {
  resolveRoleLevel,
  hasRole,
  hasAnyRole,
  hasMinimumRole,
  isAdmin,
  isOwner,
  canAccessResource
} from './authorization.js';
export {
  sanitizeString,
  sanitizeSearchString,
  sanitizeObject,
  trimObject,
  normalizeEmail,
  normalizeUsername
} from './request.sanitizer.js';
export {
  validateUUID,
  validatePagination,
  validateSort,
  validateSearch,
  validateArray,
  validatePositiveInteger,
  validateEnum,
  validateDateRange
} from './request.validation.js';
