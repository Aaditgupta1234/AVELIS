/**
 * @fileoverview Dashboard module controller.
 *
 * Handles administrative requests for dashboard summaries, analytics, and reports.
 * Delegates execution directly to the dashboard service layer.
 *
 * @module controllers/dashboard
 */

import * as dashboardService from '../services/dashboard.service.js';
import { sendSuccess } from '../utils/index.js';

/**
 * Handle retrieving administrative dashboard summary stats.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getDashboardSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await dashboardService.getDashboardSummary({ startDate, endDate });
    return sendSuccess(res, 200, data, 'Dashboard summary retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle retrieving administrative analytics.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getAnalytics = async (req, res, next) => {
  try {
    const data = await dashboardService.getAnalytics();
    return sendSuccess(res, 200, data, 'Analytics retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle retrieving administrative reports.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getReports = async (req, res, next) => {
  try {
    const data = await dashboardService.getReports();
    return sendSuccess(res, 200, data, 'Reports retrieved successfully.');
  } catch (error) {
    next(error);
  }
};
