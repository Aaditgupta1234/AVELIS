import { Router } from 'express';
import { getDashboardStats, getUsers, getUserById, updateUserRole } from '../controllers/admin.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import { updateUserRoleValidator } from '../validators/users/user.validator.js';

const router = Router();

// GET /dashboard — Retrieve admin dashboard statistics
router.get('/dashboard', authMiddleware, adminMiddleware, getDashboardStats);

// GET /users — Retrieve paginated users list
router.get('/users', authMiddleware, adminMiddleware, getUsers);

// GET /users/:id — Retrieve single user details
router.get('/users/:id', authMiddleware, adminMiddleware, getUserById);

// PATCH /users/:id/role — Update user role
router.patch('/users/:id/role', authMiddleware, adminMiddleware, updateUserRoleValidator, updateUserRole);

export default router;
