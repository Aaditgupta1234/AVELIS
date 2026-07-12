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

const router = Router();

/**
 * Search APIs
 * GET /api/v1/admin/dashboard/reports/search/books
 * GET /api/v1/admin/dashboard/reports/search/members
 * GET /api/v1/admin/dashboard/reports/search/loans
 * GET /api/v1/admin/dashboard/reports/search/reservations
 * GET /api/v1/admin/dashboard/reports/search/orders
 */
router.get('/search/books', reportingValidation.validateSearchBooks, reportingController.searchBooks);
router.get('/search/members', reportingValidation.validateSearchMembers, reportingController.searchMembers);
router.get('/search/loans', reportingValidation.validateSearchLoans, reportingController.searchLoans);
router.get('/search/reservations', reportingValidation.validateSearchReservations, reportingController.searchReservations);
router.get('/search/orders', reportingValidation.validateSearchOrders, reportingController.searchOrders);

/**
 * Reports
 * GET /api/v1/admin/dashboard/reports/overdue
 * GET /api/v1/admin/dashboard/reports/inventory
 * GET /api/v1/admin/dashboard/reports/members/:memberId
 */
router.get('/overdue', reportingValidation.validateOverdueReport, reportingController.getOverdueReport);
router.get('/inventory', reportingValidation.validateInventoryReport, reportingController.getInventoryReport);
router.get('/members/:memberId', reportingValidation.validateMemberReport, reportingController.getMemberReport);
router.get('/member/:memberId', reportingValidation.validateMemberReport, reportingController.getMemberReport);

export default router;
