/**
 * @fileoverview Review module service.
 *
 * Business logic layer for the Review module. All review-related
 * operations are implemented here, keeping controllers thin and
 * focused on request/response handling.
 *
 * @module modules/review/review.service
 */

import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/index.js';
import { REVIEW_SELECT } from '../../shared/selects/review.select.js';

/**
 * Service to create a book review.
 *
 * @param {Object} reviewData - Input data containing userId, bookId, rating, and comment
 * @returns {Promise<Object>} The created review record
 * @throws {ApiError} 404 if book not found
 * @throws {ApiError} 400 if user has not borrowed the book
 * @throws {ApiError} 409 if user has already reviewed the book
 */
export const createReview = async ({ userId, bookId, rating, comment }) => {
  // 1. Verify book exists and is not soft-deleted
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { id: true, isDeleted: true }
  });

  if (!book || book.isDeleted) {
    throw new ApiError(404, 'Book not found.');
  }

  // 2. Verify borrowing eligibility: must have at least one loan record for this book
  const loanCount = await prisma.loan.count({
    where: {
      userId,
      bookCopy: {
        bookId
      }
    }
  });

  if (loanCount === 0) {
    throw new ApiError(400, 'You must borrow this book before writing a review.');
  }

  // 3. Duplicate prevention: check if user has already reviewed this book
  const existingReview = await prisma.review.findUnique({
    where: {
      userId_bookId: {
        userId,
        bookId
      }
    }
  });

  if (existingReview) {
    throw new ApiError(409, 'You have already reviewed this book.');
  }

  // 4. Create and persist the review using Prisma selecting only response fields
  const review = await prisma.review.create({
    data: {
      userId,
      bookId,
      rating,
      comment
    },
    select: REVIEW_SELECT
  });

  return review;
};

/**
 * Service to retrieve a single review by its unique identifier.
 *
 * @param {string} reviewId - The UUID of the review to retrieve
 * @returns {Promise<Object>} The retrieved review record
 * @throws {ApiError} 404 if review not found
 */
export const getReviewById = async (reviewId) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: REVIEW_SELECT
  });

  if (!review) {
    throw new ApiError(404, 'Review not found.');
  }

  return review;
};

/**
 * Service to retrieve all reviews for a specific book.
 *
 * @param {string} bookId - The UUID of the book
 * @returns {Promise<Array>} List of reviews for the book
 * @throws {ApiError} 404 if book not found or is soft-deleted
 */
export const getBookReviews = async (bookId) => {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { id: true, isDeleted: true }
  });

  if (!book || book.isDeleted) {
    throw new ApiError(404, 'Book not found.');
  }

  const reviews = await prisma.review.findMany({
    where: { bookId },
    select: REVIEW_SELECT,
    orderBy: { createdAt: 'desc' }
  });

  return reviews;
};

/**
 * Service to retrieve all reviews written by the currently authenticated user.
 *
 * @param {string} userId - The UUID of the authenticated user
 * @returns {Promise<Array>} List of reviews written by the user
 */
export const getCurrentUserReviews = async (userId) => {
  const reviews = await prisma.review.findMany({
    where: {
      userId,
      book: {
        isDeleted: false
      }
    },
    select: REVIEW_SELECT,
    orderBy: { createdAt: 'desc' }
  });

  return reviews;
};

/**
 * Service to update an existing review.
 *
 * @param {Object} updateData - Data object containing reviewId, rating, comment, and userId
 * @returns {Promise<Object>} The updated review record
 * @throws {ApiError} 404 if review not found
 * @throws {ApiError} 403 if user is not the owner of the review
 */
export const updateReview = async ({ reviewId, rating, comment, userId }) => {
  const existingReview = await prisma.review.findUnique({
    where: { id: reviewId }
  });

  if (!existingReview) {
    throw new ApiError(404, 'Review not found.');
  }

  if (existingReview.userId !== userId) {
    throw new ApiError(403, 'You can only update your own reviews.');
  }

  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: {
      rating,
      comment
    },
    select: REVIEW_SELECT
  });

  return updatedReview;
};

/**
 * Service to permanently delete an existing review.
 *
 * @param {string} reviewId - The UUID of the review to delete
 * @param {string} userId - The UUID of the authenticated user attempting the deletion
 * @returns {Promise<void>} Returns void upon successful deletion
 * @throws {ApiError} 404 if review not found
 * @throws {ApiError} 403 if user is not the owner of the review
 */
export const deleteReview = async (reviewId, userId) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      userId: true
    }
  });

  if (!review) {
    throw new ApiError(404, 'Review not found.');
  }

  if (review.userId !== userId) {
    throw new ApiError(403, 'You can only delete your own reviews.');
  }

  await prisma.review.delete({
    where: { id: reviewId }
  });
};

/**
 * Service for administrator to permanently delete any review.
 *
 * @param {string} reviewId - The UUID of the review to delete
 * @returns {Promise<void>} Returns void upon successful deletion
 * @throws {ApiError} 404 if review not found
 */
export const adminDeleteReview = async (reviewId) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true }
  });

  if (!review) {
    throw new ApiError(404, 'Review not found.');
  }

  await prisma.review.delete({
    where: { id: reviewId }
  });
};






