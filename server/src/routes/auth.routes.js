/**
 * @fileoverview Auth routes.
 *
 * Placeholder router for authentication endpoints.
 * Future endpoints: register, login, logout, refresh token, etc.
 *
 * @module routes/auth
 */

import { Router } from 'express';
import { register, login, me, logout } from '../controllers/auth.controller.js';
import { registerValidator, loginValidator } from '../validators/auth.validator.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rate-limit.middleware.js';
import { authSlowdown } from '../middleware/slowdown.middleware.js';

const router = Router();

router.post('/register', authRateLimiter, authSlowdown, registerValidator, register);
router.post('/login', authRateLimiter, authSlowdown, loginValidator, login);
router.get('/me', authMiddleware, me);
router.post('/logout', logout);

export default router;
