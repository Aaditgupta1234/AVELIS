import * as reservationService from '../services/reservation.service.js';
import { sendSuccess } from '../utils/index.js';

/**
 * Handle creating a reservation.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const createReservation = async (req, res, next) => {
  try {
    const { bookId, userId } = req.body;

    // Pass the provided userId (if any), otherwise default to current authenticated user's ID.
    // The service layer will enforce the authorization/ownership check.
    const targetUserId = userId || req.user.id;

    const reservation = await reservationService.createReservation({
      userId: targetUserId,
      bookId,
      currentUser: req.user
    });

    return sendSuccess(res, 201, reservation, 'Reservation created successfully.');
  } catch (error) {
    next(error);
  }
};
