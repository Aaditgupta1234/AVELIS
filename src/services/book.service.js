import { apiClient } from '../api/client.js';

/**
 * Service to retrieve a paginated, filtered, and sorted list of books.
 *
 * @param {Object} [params] - Query parameters (page, limit, search, sortBy, order, etc.)
 * @param {Object} [options] - Additional request options (e.g. signal)
 * @returns {Promise<{ books: Array, pagination: Object }>}
 */
export const getBooks = async (params = {}, options = {}) => {
  const response = await apiClient.get('/books', {
    params,
    ...options,
  });
  return response.data.data; // Returns { books, pagination }
};

/**
 * Service to retrieve a specific book by its UUID.
 *
 * @param {string} id - The book's UUID
 * @param {Object} [options] - Additional request options (e.g. signal)
 * @returns {Promise<Object>}
 */
export const getBookById = async (id, options = {}) => {
  const response = await apiClient.get(`/books/${id}`, options);
  return response.data.data; // Returns the raw book object
};

/**
 * Service to create a new book (Admin-only).
 *
 * @param {Object} bookData - Book details (title, isbn, publisher, etc.)
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>} The created book DTO
 */
export const createBook = async (bookData, options = {}) => {
  const response = await apiClient.post('/books', bookData, options);
  return response.data.data; // Returns the created book object
};

/**
 * Service to update an existing book's details (Admin-only).
 *
 * @param {string} id - The book's UUID
 * @param {Object} bookData - Partial book details to update
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>} The updated book DTO
 */
export const updateBook = async (id, bookData, options = {}) => {
  const response = await apiClient.patch(`/books/${id}`, bookData, options);
  return response.data.data; // Returns the updated book object
};

/**
 * Service to soft delete a book (Admin-only).
 *
 * @param {string} id - The book's UUID
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>} The soft-deleted book DTO
 */
export const deleteBook = async (id, options = {}) => {
  const response = await apiClient.delete(`/books/${id}`, options);
  return response.data.data; // Returns the deleted book object
};
