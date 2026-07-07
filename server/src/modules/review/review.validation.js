/**
 * @fileoverview Review module validation middleware.
 *
 * Contains validation middleware for Review module endpoints.
 * Each validator validates incoming request data before it reaches
 * the controller layer.
 *
 * @module modules/review/review.validation
 */

import { sendError } from '../../utils/index.js';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Validator middleware for creating a review.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const createReviewValidator = (req, res, next) => {
  const errors = [];
  const { bookId, rating, comment } = req.body;

  // 1. bookId Validation
  if (bookId === undefined || bookId === null || typeof bookId !== 'string' || !UUID_REGEX.test(bookId.trim())) {
    errors.push({ field: 'bookId', message: 'bookId is required and must be a valid UUID.' });
  } else {
    req.body.bookId = bookId.trim();
  }

  // 2. rating Validation
  if (rating === undefined || rating === null) {
    errors.push({ field: 'rating', message: 'rating is required.' });
  } else {
    const ratingVal = Number(rating);
    if (!Number.isInteger(rating) || ratingVal < 1 || ratingVal > 5) {
      errors.push({ field: 'rating', message: 'rating must be an integer between 1 and 5.' });
    } else {
      req.body.rating = ratingVal;
    }
  }

  // 3. comment Validation
  if (comment === undefined || comment === null || typeof comment !== 'string') {
    errors.push({ field: 'comment', message: 'comment is required and must be a string.' });
  } else {
    const trimmedComment = comment.trim();
    if (trimmedComment.length < 10 || trimmedComment.length > 1000) {
      errors.push({ field: 'comment', message: 'comment must be between 10 and 1000 characters.' });
    } else {
      req.body.comment = trimmedComment;
    }
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  next();
};

/**
 * Validator middleware for retrieving a review by ID.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getReviewByIdValidator = (req, res, next) => {
  const errors = [];
  const { reviewId } = req.params;

  if (reviewId === undefined || reviewId === null || typeof reviewId !== 'string' || !UUID_REGEX.test(reviewId.trim())) {
    errors.push({ field: 'reviewId', message: 'reviewId is required and must be a valid UUID.' });
  } else {
    req.params.reviewId = reviewId.trim();
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  next();
};

/**
 * Validator middleware for retrieving book reviews.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getBookReviewsValidator = (req, res, next) => {
  const errors = [];
  const { bookId } = req.params;

  if (bookId === undefined || bookId === null || typeof bookId !== 'string' || !UUID_REGEX.test(bookId.trim())) {
    errors.push({ field: 'bookId', message: 'bookId is required and must be a valid UUID.' });
  } else {
    req.params.bookId = bookId.trim();
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  next();
};

/**
 * Validator middleware for updating a review.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const updateReviewValidator = (req, res, next) => {
  const errors = [];
  const { reviewId } = req.params;
  const { rating, comment } = req.body;

  // 1. reviewId Validation
  if (reviewId === undefined || reviewId === null || typeof reviewId !== 'string' || !UUID_REGEX.test(reviewId.trim())) {
    errors.push({ field: 'reviewId', message: 'reviewId is required and must be a valid UUID.' });
  } else {
    req.params.reviewId = reviewId.trim();
  }

  // 2. rating Validation
  if (rating === undefined || rating === null) {
    errors.push({ field: 'rating', message: 'rating is required.' });
  } else {
    const ratingVal = Number(rating);
    if (!Number.isInteger(rating) || ratingVal < 1 || ratingVal > 5) {
      errors.push({ field: 'rating', message: 'rating must be an integer between 1 and 5.' });
    } else {
      req.body.rating = ratingVal;
    }
  }

  // 3. comment Validation
  if (comment === undefined || comment === null || typeof comment !== 'string') {
    errors.push({ field: 'comment', message: 'comment is required and must be a string.' });
  } else {
    const trimmedComment = comment.trim();
    if (trimmedComment.length < 10 || trimmedComment.length > 1000) {
      errors.push({ field: 'comment', message: 'comment must be between 10 and 1000 characters.' });
    } else {
      req.body.comment = trimmedComment;
    }
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  next();
};

/**
 * Validator middleware for deleting a review.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const deleteReviewValidator = (req, res, next) => {
  const errors = [];
  const { reviewId } = req.params;

  if (reviewId === undefined || reviewId === null || typeof reviewId !== 'string' || !UUID_REGEX.test(reviewId.trim())) {
    errors.push({ field: 'reviewId', message: 'reviewId is required and must be a valid UUID.' });
  } else {
    req.params.reviewId = reviewId.trim();
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  next();
};

/**
 * Validator middleware for admin review deletion.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const adminDeleteReviewValidator = (req, res, next) => {
  const errors = [];
  const { reviewId } = req.params;

  if (reviewId === undefined || reviewId === null || typeof reviewId !== 'string' || !UUID_REGEX.test(reviewId.trim())) {
    errors.push({ field: 'reviewId', message: 'reviewId is required and must be a valid UUID.' });
  } else {
    req.params.reviewId = reviewId.trim();
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  next();
};





