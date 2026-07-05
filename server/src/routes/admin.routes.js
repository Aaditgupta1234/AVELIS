import { Router } from 'express';
import { getDashboardStats } from '../controllers/admin.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';

const router = Router();

// GET /dashboard — Retrieve admin dashboard statistics
router.get('/dashboard', authMiddleware, adminMiddleware, getDashboardStats);

export default router;
