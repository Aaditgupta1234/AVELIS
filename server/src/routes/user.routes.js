import { Router } from 'express';
import { getMe, updateMe, changePassword } from '../controllers/users/user.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { updateUserValidator, changePasswordValidator } from '../validators/users/user.validator.js';

const router = Router();

// GET /me — Get currently authenticated user profile
router.get('/me', authMiddleware, getMe);

// PATCH /me — Update currently authenticated user profile
router.patch('/me', authMiddleware, updateUserValidator, updateMe);

// PATCH /me/password — Change user password
router.patch('/me/password', authMiddleware, changePasswordValidator, changePassword);

export default router;
