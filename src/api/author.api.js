import { apiClient } from './client.js';

/**
 * Get authors list (active, archived, or all).
 */
export const getAuthorsApi = async (params = {}) => {
  const response = await apiClient.get('/authors', { params });
  return response.data;
};

/**
 * Create a new author or restore soft-deleted matching author.
 */
export const createAuthorApi = async (data) => {
  const response = await apiClient.post('/authors', data);
  return response.data;
};

/**
 * Update an existing author.
 */
export const updateAuthorApi = async (id, data) => {
  const response = await apiClient.patch(`/authors/${id}`, data);
  return response.data;
};

/**
 * Soft delete an author.
 */
export const deleteAuthorApi = async (id) => {
  const response = await apiClient.delete(`/authors/${id}`);
  return response.data;
};

/**
 * Restore an archived author.
 */
export const restoreAuthorApi = async (id) => {
  const response = await apiClient.patch(`/authors/${id}/restore`);
  return response.data;
};
