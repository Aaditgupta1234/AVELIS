import { Router } from 'express';
import * as reservationController from '../controllers/reservation.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { createReservationValidator, reservationIdParamValidator } from '../validations/reservation.validation.js';

const router = Router();

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

export default router;
