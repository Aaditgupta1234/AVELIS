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

/**
 * Handle retrieving all reviews for a specific book.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getBookReviews = async (req, res, next) => {
  try {
    const { bookId } = req.params;

    const reviews = await reviewService.getBookReviews(bookId);

    return sendSuccess(res, 200, reviews, 'Book reviews retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle retrieving all reviews submitted by the currently authenticated user.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getCurrentUserReviews = async (req, res, next) => {
  try {
    const reviews = await reviewService.getCurrentUserReviews(req.user.id);

    return sendSuccess(res, 200, reviews, 'User reviews retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle updating an existing review.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const updatedReview = await reviewService.updateReview({
      reviewId,
      rating,
      comment,
      userId: req.user.id
    });

    return sendSuccess(res, 200, updatedReview, 'Review updated successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle deleting a review by its ID.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    await reviewService.deleteReview(reviewId, req.user.id);

    return sendSuccess(res, 200, null, 'Review deleted successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle admin deleting any review by its ID.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const adminDeleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    await reviewService.adminDeleteReview(reviewId);

    return sendSuccess(res, 200, null, 'Review moderated successfully.');
  } catch (error) {
    next(error);
  }
};

export const getAllPublicReviews = async (req, res, next) => {
  try {
    const reviews = await reviewService.getAllPublicReviews();
    return sendSuccess(res, 200, reviews, 'Public reviews retrieved successfully.');
  } catch (error) {
    next(error);
  }
};






