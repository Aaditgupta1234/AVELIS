import { apiClient } from './client.js';

/**
 * Get categories list (active, archived, or all).
 */
export const getCategoriesApi = async (params = {}) => {
  const response = await apiClient.get('/categories', { params });
  return response.data;
};

/**
 * Create a new category or restore soft-deleted matching category.
 */
export const createCategoryApi = async (data) => {
  const response = await apiClient.post('/categories', data);
  return response.data;
};

/**
 * Update an existing category.
 */
export const updateCategoryApi = async (id, data) => {
  const response = await apiClient.patch(`/categories/${id}`, data);
  return response.data;
};

/**
 * Soft delete a category.
 */
export const deleteCategoryApi = async (id) => {
  const response = await apiClient.delete(`/categories/${id}`);
  return response.data;
};

/**
 * Restore an archived category.
 */
export const restoreCategoryApi = async (id) => {
  const response = await apiClient.patch(`/categories/${id}/restore`);
  return response.data;
};
