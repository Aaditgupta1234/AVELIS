import { Router } from 'express';
import { getDashboardStats, getUsers, getUserById, updateUserRole, updateUserStatus } from '../controllers/admin.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import { updateUserRoleValidator, updateUserStatusValidator } from '../validators/users/user.validator.js';
import { adminDeleteReviewValidator } from '../modules/review/review.validation.js';
import { adminDeleteReview } from '../modules/review/review.controller.js';
import { queryLoansValidator, borrowValidator } from '../validations/loan.validation.js';
import { getLoans as adminGetLoans, borrowBook } from '../controllers/loan.controller.js';

const router = Router();


// GET /dashboard — Retrieve admin dashboard statistics
router.get('/dashboard', authMiddleware, adminMiddleware, getDashboardStats);

// GET /users — Retrieve paginated users list
router.get('/users', authMiddleware, adminMiddleware, getUsers);

// GET /users/:id — Retrieve single user details
router.get('/users/:id', authMiddleware, adminMiddleware, getUserById);

// PATCH /users/:id/role — Update user role
router.patch('/users/:id/role', authMiddleware, adminMiddleware, updateUserRoleValidator, updateUserRole);

// PATCH /users/:id/status — Update user active status
router.patch('/users/:id/status', authMiddleware, adminMiddleware, updateUserStatusValidator, updateUserStatus);

// DELETE /reviews/:reviewId — Moderation: permanently delete any review (Admin only)
router.delete('/reviews/:reviewId', authMiddleware, adminMiddleware, adminDeleteReviewValidator, adminDeleteReview);

// GET /loans — Retrieve paginated loans list (Admin only)
router.get('/loans', authMiddleware, adminMiddleware, queryLoansValidator, adminGetLoans);

// POST /loans — Create a new loan transaction (Admin only)
router.post('/loans', authMiddleware, adminMiddleware, borrowValidator, borrowBook);

export default router;


