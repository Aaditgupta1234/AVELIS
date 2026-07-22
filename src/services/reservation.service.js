import { apiClient } from '../api/client.js';

/**
 * Service to retrieve the current user's reservations.
 *
 * @param {Object} [params] - Query parameters (page, limit, status, sort)
 * @param {Object} [options] - Additional request options (e.g. signal)
 * @returns {Promise<{ reservations: Array, pagination: Object }>}
 */
export const getMyReservations = async (params = {}, options = {}) => {
  const response = await apiClient.get('/reservations/me', {
    params,
    ...options,
  });
  return response.data.data;
};

/**
 * Service to create a new reservation for a book.
 *
 * @param {string} bookId - UUID of the book to reserve
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>} The created raw reservation DTO
 */
export const createReservation = async (bookId, options = {}) => {
  const response = await apiClient.post('/reservations', { bookId }, options);
  return response.data.data;
};

/**
 * Service to cancel an active reservation.
 *
 * @param {string} reservationId - UUID of the reservation
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>} The updated raw reservation DTO
 */
export const cancelReservation = async (reservationId, options = {}) => {
  const response = await apiClient.patch(`/reservations/${reservationId}/cancel`, {}, options);
  return response.data.data;
};

/**
 * Service to retrieve a specific reservation by ID.
 *
 * @param {string} reservationId - UUID of the reservation
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>} The raw reservation DTO
 */
export const getReservationById = async (reservationId, options = {}) => {
  const response = await apiClient.get(`/reservations/${reservationId}`, options);
  return response.data.data;
};
