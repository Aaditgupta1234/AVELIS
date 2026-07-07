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

/**
 * Standardized Review API Response Selection Object.
 * Exposes only properties allowed in the public API contract.
 */
const REVIEW_SELECT = {
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      username: true,
      email: true
    }
  },
  book: {
    select: {
      id: true,
      title: true,
      isbn: true
    }
  }
};

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
    where: { id: bookId }
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
    where: { id: bookId }
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
    where: { userId },
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




