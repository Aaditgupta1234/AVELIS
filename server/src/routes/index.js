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

const router = Router();

/**
 * Mount sub-routers.
 *
 * Base path: /api/v1 (set in app.js)
 *
 * /api/v1/auth   → Auth routes
 * /api/v1/books  → Book routes
 * /api/v1/users  → User routes
 * /api/v1/admin  → Admin routes
 */
router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

export default router;
