/**
 * @fileoverview Review module routes.
 *
 * Defines the Express router for the Review module.
 *
 * Base route: /reviews (mounted via routes/index.js)
 *
 * @module modules/review/review.routes
 */

import { Router } from 'express';
import * as reviewController from './review.controller.js';
import { createReviewValidator, getReviewByIdValidator } from './review.validation.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { UserRole } from '@prisma/client';
import { ApiError } from '../../utils/index.js';

const router = Router();

/**
 * Local memberMiddleware to restrict access to MEMBER role only,
 * consistent with reservation.routes.js.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
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

// POST / — Create a new book review (Member only)
router.post(
  '/',
  createReviewValidator,
  authMiddleware,
  memberMiddleware,
  reviewController.createReview
);

// GET /:reviewId — Get a review by its ID (Member only)
router.get(
  '/:reviewId',
  getReviewByIdValidator,
  authMiddleware,
  memberMiddleware,
  reviewController.getReviewById
);


export default router;
