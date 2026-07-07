import { Router } from 'express';
import * as reservationController from '../controllers/reservation.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { createReservationValidator } from '../validations/reservation.validation.js';

const router = Router();

// POST / - Create a new reservation
router.post(
  '/',
  authMiddleware,
  createReservationValidator,
  reservationController.createReservation
);

export default router;
