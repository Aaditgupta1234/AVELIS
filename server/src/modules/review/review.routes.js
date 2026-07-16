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
import { createReviewValidator, getReviewByIdValidator, getBookReviewsValidator, updateReviewValidator, deleteReviewValidator } from './review.validation.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/authorization.middleware.js';
import { ROLES } from '../../config/index.js';

const router = Router();

// POST / — Create a new book review (Member only)
router.post(
  '/',
  createReviewValidator,
  authMiddleware,
  requireRole(ROLES.MEMBER),
  reviewController.createReview
);

// GET /me — Retrieve a list of the current authenticated user's reviews (Member only)
router.get(
  '/me',
  authMiddleware,
  requireRole(ROLES.MEMBER),
  reviewController.getCurrentUserReviews
);

// GET /book/:bookId — Retrieve all reviews for a specific book (Member only)
router.get(
  '/book/:bookId',
  getBookReviewsValidator,
  authMiddleware,
  requireRole(ROLES.MEMBER),
  reviewController.getBookReviews
);

// GET /:reviewId — Get a review by its ID (Member only)
router.get(
  '/:reviewId',
  getReviewByIdValidator,
  authMiddleware,
  requireRole(ROLES.MEMBER),
  reviewController.getReviewById
);

// PATCH /:reviewId — Update a review by its ID (Member only)
router.patch(
  '/:reviewId',
  updateReviewValidator,
  authMiddleware,
  requireRole(ROLES.MEMBER),
  reviewController.updateReview
);

// DELETE /:reviewId — Delete a review by its ID (Member only)
router.delete(
  '/:reviewId',
  authMiddleware,
  deleteReviewValidator,
  reviewController.deleteReview
);

export default router;
