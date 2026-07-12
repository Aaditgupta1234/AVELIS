/**
 * @fileoverview Analytics module routes.
 *
 * Defines routes for borrowing, member, ratings, and time-series analytics.
 *
 * @module routes/analytics
 */

import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import * as dashboardController from '../controllers/dashboard.controller.js';
import {
  validateBorrowingAnalytics,
  validateMemberAnalytics,
  validateRatingAnalytics,
  validateTimeSeriesAnalytics
} from '../validations/analytics.validation.js';
import { validateAnalytics } from '../validations/dashboard.validation.js';

const router = Router();

/**
 * Retrieve root analytics (preserves the original GET /admin/dashboard/analytics endpoint).
 * GET /admin/dashboard/analytics
 */
router.get('/', validateAnalytics, dashboardController.getAnalytics);

/**
 * Retrieve borrowing analytics.
 * GET /admin/dashboard/analytics/borrowing
 */
router.get('/borrowing', validateBorrowingAnalytics, analyticsController.getBorrowingAnalytics);

/**
 * Retrieve member analytics.
 * GET /admin/dashboard/analytics/members
 */
router.get('/members', validateMemberAnalytics, analyticsController.getMemberAnalytics);

/**
 * Retrieve rating analytics.
 * GET /admin/dashboard/analytics/ratings
 */
router.get('/ratings', validateRatingAnalytics, analyticsController.getRatingAnalytics);

/**
 * Retrieve time-series analytics.
 * GET /admin/dashboard/analytics/timeseries
 */
router.get('/timeseries', validateTimeSeriesAnalytics, analyticsController.getTimeSeriesAnalytics);

export default router;
