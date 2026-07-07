import { Router } from 'express';
import * as reservationController from '../controllers/reservation.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import { UserRole } from '@prisma/client';
import { ApiError } from '../utils/index.js';
import {
  createReservationValidator,
  reservationIdParamValidator,
  reservationQueryValidator
} from '../validations/reservation.validation.js';

const router = Router();

// Local memberMiddleware to restrict access to MEMBER role only
const memberMiddleware = (req, res, next) => {
  try {
    if (!req.user || !req.user.role || req.user.role !== UserRole.MEMBER) {
      return next(new ApiError(403, 'Access denied. Member privileges required.'));
    }
    next();
  } catch (error) {
    next(error);
  }
};

// GET / - Retrieve a paginated list of all reservations (Admin only)
router.get(
  '/',
  authMiddleware,
  adminMiddleware,
  reservationQueryValidator,
  reservationController.getReservations
);

// GET /me - Retrieve current user's reservations (Member only)
router.get(
  '/me',
  authMiddleware,
  memberMiddleware,
  reservationQueryValidator,
  reservationController.getCurrentUserReservations
);

// POST / - Create a new reservation
router.post(
  '/',
  authMiddleware,
  createReservationValidator,
  reservationController.createReservation
);

// GET /:id - Retrieve a specific reservation by ID
router.get(
  '/:id',
  authMiddleware,
  reservationIdParamValidator,
  reservationController.getReservationById
);

// PATCH /:id/cancel - Cancel an active reservation (Admin or Member with ownership)
router.patch(
  '/:id/cancel',
  authMiddleware,
  reservationIdParamValidator,
  reservationController.cancelReservation
);

export default router;
