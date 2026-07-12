/**
 * @fileoverview Analytics module controller.
 *
 * Handles administrative requests for analytics.
 * Delegates execution directly to the analytics service layer.
 *
 * @module controllers/analytics
 */

import * as analyticsService from '../services/analytics.service.js';
import { sendSuccess } from '../utils/index.js';

/**
 * Handle retrieving borrowing analytics.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getBorrowingAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, limit } = req.query;
    const data = await analyticsService.getBorrowingAnalytics({ startDate, endDate, limit });
    return sendSuccess(res, 200, data, 'Borrowing analytics retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle retrieving member analytics.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getMemberAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, limit } = req.query;
    const data = await analyticsService.getMemberAnalytics({ startDate, endDate, limit });
    return sendSuccess(res, 200, data, 'Member analytics retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle retrieving rating analytics.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getRatingAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsService.getRatingAnalytics();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle retrieving time-series analytics.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getTimeSeriesAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsService.getTimeSeriesAnalytics();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
