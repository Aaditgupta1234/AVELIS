/**
 * @fileoverview JSDoc type definitions barrel.
 *
 * Central location for shared JSDoc typedefs used
 * across the application. Improves IDE autocompletion
 * and code documentation.
 *
 * @module types
 *
 * @example
 * // Import types for JSDoc usage:
 * // /** @typedef {import('../types/index.js').PaginatedResult} PaginatedResult *\/
 */

// -----------------------------------------------------------------------
// Shared Type Definitions
// -----------------------------------------------------------------------

/**
 * @typedef {Object} PaginatedResult
 * @property {Array} data - Array of results
 * @property {Object} meta - Pagination metadata
 * @property {number} meta.page - Current page
 * @property {number} meta.limit - Items per page
 * @property {number} meta.totalResults - Total matching items
 * @property {number} meta.totalPages - Total number of pages
 */

/**
 * @typedef {Object} ServiceResult
 * @property {boolean} success - Whether the operation succeeded
 * @property {*} data - Result data
 * @property {string} [message] - Optional message
 */

/**
 * @typedef {Object} QueryOptions
 * @property {number} [page=1] - Page number
 * @property {number} [limit=10] - Items per page
 * @property {string} [sort] - Sort field and direction
 * @property {string} [search] - Search query
 */
