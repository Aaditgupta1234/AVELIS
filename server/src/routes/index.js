/**
 * @fileoverview API routes entry point.
 *
 * Single entry point for all API routes. Mounts feature-specific
 * sub-routers under their respective base paths.
 *
 * This is the only router imported by app.js.
 *
 * @module routes
 */

import { Router } from 'express';
import authRoutes from './auth.routes.js';
import bookRoutes from './book.routes.js';
import userRoutes from './user.routes.js';
import adminRoutes from './admin.routes.js';
import loanRoutes from './loan.routes.js';
import reservationRoutes from './reservation.routes.js';
import reviewRoutes from '../modules/review/review.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import orderRoutes from './order.routes.js';
import healthRoutes from './health.routes.js';
import { noCacheMiddleware } from '../middleware/nocache.middleware.js';

const router = Router();

/**
 * Mount sub-routers.
 *
 * Base path: /api/v1 (set in app.js)
 *
 * /api/v1/auth         → Auth routes
 * /api/v1/books        → Book routes
 * /api/v1/users        → User routes
 * /api/v1/admin        → Admin routes
 * /api/v1/loans        → Loan routes
 * /api/v1/reservations → Reservation routes
 * /api/v1/reviews      → Review routes
 * /api/v1/orders       → Order routes
 */
router.use('/auth', noCacheMiddleware, authRoutes);
router.use('/books', bookRoutes);
router.use('/users', noCacheMiddleware, userRoutes);
router.use('/admin', noCacheMiddleware, adminRoutes);
router.use('/loans', noCacheMiddleware, loanRoutes);
router.use('/reservations', noCacheMiddleware, reservationRoutes);
router.use('/reviews', reviewRoutes);
router.use('/orders', noCacheMiddleware, orderRoutes);
router.use('/admin/dashboard', noCacheMiddleware, dashboardRoutes);
router.use('/', healthRoutes);

export default router;

