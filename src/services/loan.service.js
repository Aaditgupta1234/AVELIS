import { apiClient } from "../api/client.js";

/**
 * Service to request borrowing a specific book copy.
 *
 * @param {string} bookCopyId - The UUID of the book copy
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>} The created loan object
 */
export const borrowBook = async (bookCopyId, options = {}) => {
  const response = await apiClient.post("/loans", { bookCopyId }, options);
  return response.data.data;
};

/**
 * Service to return a borrowed book copy.
 *
 * @param {string} loanId - The UUID of the active loan
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>} The updated loan object
 */
export const returnBook = async (loanId, options = {}) => {
  const response = await apiClient.post(`/loans/${loanId}/return`, {}, options);
  return response.data.data;
};

/**
 * Service to renew an active loan.
 *
 * @param {string} loanId - The UUID of the active loan
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>} The renewed loan object
 */
export const renewLoan = async (loanId, options = {}) => {
  const response = await apiClient.patch(`/loans/${loanId}/renew`, {}, options);
  return response.data.data;
};

/**
 * Service to retrieve the current user's active loans.
 *
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Array>} List of raw active loan objects
 */
export const getActiveLoans = async (options = {}) => {
  const response = await apiClient.get("/loans/active", options);
  return response.data.data;
};

/**
 * Service to retrieve the current user's loan history.
 *
 * @param {Object} [params] - Query parameters (page, limit, status, sort)
 * @param {Object} [options] - Additional request options
 * @returns {Promise<{ loans: Array, pagination: Object }>} Loan history and pagination metadata
 */
export const getLoanHistory = async (params = {}, options = {}) => {
  const response = await apiClient.get("/loans/history", {
    params,
    ...options,
  });
  return response.data.data;
};

/**
 * Service to retrieve details of a specific loan by its ID.
 *
 * @param {string} loanId - The UUID of the loan
 * @param {Object} [options] - Additional request options
 * @returns {Promise<Object>} The loan details object
 */
export const getLoanById = async (loanId, options = {}) => {
  const response = await apiClient.get(`/loans/${loanId}`, options);
  return response.data.data;
};
