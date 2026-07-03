/**
 * @fileoverview Pagination utility.
 *
 * Provides helper functions to compute pagination parameters
 * for database queries and API responses.
 *
 * @module utils/pagination
 *
 * @example
 * import { getPagination } from '../utils/pagination.js';
 *
 * const { skip, limit, page } = getPagination(req.query);
 * const results = await Model.find().skip(skip).limit(limit);
 */

/**
 * Compute pagination parameters from query input.
 *
 * @param {Object} query - Request query object
 * @param {number|string} [query.page=1] - Current page number
 * @param {number|string} [query.limit=10] - Items per page
 * @returns {{ page: number, limit: number, skip: number }}
 */
export const getPagination = (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Build pagination metadata for API responses.
 *
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} totalResults - Total number of matching documents
 * @returns {{ page: number, limit: number, totalResults: number, totalPages: number }}
 */
export const getPaginationMeta = (page, limit, totalResults) => {
  const totalPages = Math.ceil(totalResults / limit);

  return {
    page,
    limit,
    totalResults,
    totalPages,
  };
};
