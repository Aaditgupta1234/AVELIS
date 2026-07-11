/**
 * @fileoverview Dashboard module service.
 *
 * Scaffolds the business logic interface for admin dashboard stats, analytics, and reports.
 *
 * @module services/dashboard
 */

import { ApiError } from '../utils/index.js';

/**
 * Retrieve administrative dashboard summary stats.
 *
 * @returns {Promise<Object>} Placeholder that throws 501 Not Implemented
 * @throws {ApiError} 501 Not implemented
 */
export const getDashboardSummary = async () => {
  throw new ApiError(501, 'Dashboard summary endpoint not implemented yet.');
};

/**
 * Retrieve administrative analytics.
 *
 * @returns {Promise<Object>} Placeholder that throws 501 Not Implemented
 * @throws {ApiError} 501 Not implemented
 */
export const getAnalytics = async () => {
  throw new ApiError(501, 'Analytics endpoint not implemented yet.');
};

/**
 * Retrieve administrative reports.
 *
 * @returns {Promise<Object>} Placeholder that throws 501 Not Implemented
 * @throws {ApiError} 501 Not implemented
 */
export const getReports = async () => {
  throw new ApiError(501, 'Reports endpoint not implemented yet.');
};
