import { apiClient } from '../api/client.js';

/**
 * Service to retrieve all reviews for a specific book.
 *
 * @param {string} bookId - The UUID of the book
 * @param {Object} [options] - Additional request options (e.g. signal)
 * @returns {Promise<Array>}
 */
export const getBookReviews = async (bookId, options = {}) => {
  const response = await apiClient.get(`/reviews/book/${bookId}`, options);
  return response.data.data;
};

/**
 * Service to retrieve rating statistics for a specific book.
 *
 * @param {string} bookId - The UUID of the book
 * @param {Object} [options] - Additional request options (e.g. signal)
 * @returns {Promise<{ averageRating: number|null, totalReviews: number, ratingDistribution: Object }>}
 */
export const getBookRating = async (bookId, options = {}) => {
  const response = await apiClient.get(`/books/${bookId}/rating`, options);
  return response.data.data;
};

/**
 * Service to create a new review.
 *
 * @param {Object} reviewData - { bookId, rating, comment }
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>} The created review DTO
 */
export const createReview = async (reviewData, options = {}) => {
  const response = await apiClient.post('/reviews', reviewData, options);
  return response.data.data;
};

/**
 * Service to delete a review by its ID.
 *
 * @param {string} reviewId - The UUID of the review
 * @param {Object} [options] - Additional request options
 * @returns {Promise<void>}
 */
export const deleteReview = async (reviewId, options = {}) => {
  const response = await apiClient.delete(`/reviews/${reviewId}`, options);
  return response.data.data;
};

/**
 * Service to retrieve all reviews submitted by the current authenticated user.
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Array>}
 */
export const getUserReviews = async (options = {}) => {
  const response = await apiClient.get('/reviews/me', options);
  return response.data.data;
};

/**
 * Service to retrieve all public reviews across books.
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Array>}
 */
export const getAllPublicReviews = async (options = {}) => {
  const response = await apiClient.get('/reviews/public', options);
  return response.data.data;
};
