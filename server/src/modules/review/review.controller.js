/**
 * @fileoverview Review module controller.
 *
 * Thin controller layer for the Review module. Each controller method
 * extracts request parameters, delegates business logic to the
 * Review service, and returns a standardized API response.
 *
 * Controllers must remain thin — all business rules, data validation
 * beyond request parsing, and database interactions are handled
 * exclusively by the service layer.
 *
 * @module modules/review/review.controller
 */

import * as reviewService from './review.service.js';
import { sendSuccess } from '../../utils/index.js';

/**
 * Handle creating a book review.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const createReview = async (req, res, next) => {
  try {
    const { bookId, rating, comment } = req.body;

    const review = await reviewService.createReview({
      bookId,
      rating,
      comment,
      userId: req.user.id
    });

    return sendSuccess(res, 201, review, 'Review created successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle retrieving a review by ID.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getReviewById = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    const review = await reviewService.getReviewById(reviewId);

    return sendSuccess(res, 200, review, 'Review retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

