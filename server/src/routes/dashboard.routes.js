/**
 * @fileoverview Dashboard module routes.
 *
 * Defines routes for the administrative dashboard, analytics, and reports.
 * Protected by authMiddleware and adminMiddleware.
 *
 * @module routes/dashboard
 */

import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import {
  validateDashboardSummary,
  validateReports
} from '../validations/dashboard.validation.js';
import analyticsRouter from './analytics.routes.js';
import reportingRouter from '../modules/reporting/reporting.routes.js';
import { reportRateLimiter, exportRateLimiter } from '../middleware/rate-limit.middleware.js';
import { reportSlowdown, exportSlowdown } from '../middleware/slowdown.middleware.js';

const router = Router();

// GET /reports/export - Export reports (placed before auth middleware to run rate limiter first)
router.get('/reports/export', exportRateLimiter, exportSlowdown, authMiddleware, adminMiddleware, (req, res) => {
  res.json({ success: true, message: 'Report exported successfully.' });
});

/**
 * Retrieve administrative reports.
 * GET /admin/dashboard/reports
 */
router.get('/reports', reportRateLimiter, reportSlowdown, authMiddleware, adminMiddleware, validateReports, dashboardController.getReports);
router.use('/reports', authMiddleware, adminMiddleware, reportingRouter);

// Apply authentication and admin authorization middlewares globally to all subsequent routes in this sub-router
router.use(authMiddleware, adminMiddleware);

/**
 * Retrieve administrative dashboard summary stats.
 * GET /admin/dashboard/summary
 */
router.get('/summary', validateDashboardSummary, dashboardController.getDashboardSummary);

/**
 * Retrieve administrative administrative analytics.
 * GET /admin/dashboard/analytics
 */
router.use('/analytics', analyticsRouter);

export default router;
