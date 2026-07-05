import { Router } from 'express';
import { getMe } from '../controllers/users/user.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// GET /me — Get currently authenticated user profile
router.get('/me', authMiddleware, getMe);

export default router;
