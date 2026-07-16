/**
 * @fileoverview Reporting module routes.
 *
 * Scaffolds routes for searching and generating administrative reports.
 * Protected by authMiddleware and adminMiddleware (inherited from parent).
 *
 * @module modules/reporting/routes
 */

import { Router } from 'express';
import * as reportingController from './reporting.controller.js';
import * as reportingValidation from './reporting.validation.js';
import { reportRateLimiter, exportRateLimiter } from '../../middleware/rate-limit.middleware.js';
import { reportSlowdown, exportSlowdown } from '../../middleware/slowdown.middleware.js';

const router = Router();

/**
 * Search APIs
 * GET /api/v1/admin/dashboard/reports/search/books
 * GET /api/v1/admin/dashboard/reports/search/members
 * GET /api/v1/admin/dashboard/reports/search/loans
 * GET /api/v1/admin/dashboard/reports/search/reservations
 * GET /api/v1/admin/dashboard/reports/search/orders
 */
router.get('/search/books', reportRateLimiter, reportSlowdown, reportingValidation.validateSearchBooks, reportingController.searchBooks);
router.get('/search/members', reportRateLimiter, reportSlowdown, reportingValidation.validateSearchMembers, reportingController.searchMembers);
router.get('/search/loans', reportRateLimiter, reportSlowdown, reportingValidation.validateSearchLoans, reportingController.searchLoans);
router.get('/search/reservations', reportRateLimiter, reportSlowdown, reportingValidation.validateSearchReservations, reportingController.searchReservations);
router.get('/search/orders', reportRateLimiter, reportSlowdown, reportingValidation.validateSearchOrders, reportingController.searchOrders);

/**
 * Reports
 * GET /api/v1/admin/dashboard/reports/overdue
 * GET /api/v1/admin/dashboard/reports/inventory
 * GET /api/v1/admin/dashboard/reports/members/:memberId
 */
router.get('/overdue', reportRateLimiter, reportSlowdown, reportingValidation.validateOverdueReport, reportingController.getOverdueReport);
router.get('/inventory', reportRateLimiter, reportSlowdown, reportingValidation.validateInventoryReport, reportingController.getInventoryReport);
router.get('/members/:memberId', reportRateLimiter, reportSlowdown, reportingValidation.validateMemberReport, reportingController.getMemberReport);
router.get('/member/:memberId', reportRateLimiter, reportSlowdown, reportingValidation.validateMemberReport, reportingController.getMemberReport);

// GET /export - Export reports (protected by exportRateLimiter and exportSlowdown)
router.get('/export', exportRateLimiter, exportSlowdown, (req, res) => {
  res.json({ success: true, message: 'Report exported successfully.' });
});

export default router;
