import * as categoryService from '../services/category.service.js';
import { sendSuccess, sendError } from '../utils/index.js';

/**
 * Get categories with optional filter (active, archived, all) and pagination.
 */
export const getCategories = async (req, res) => {
  try {
    const { filter, page, limit } = req.query;
    const categories = await categoryService.getAllCategoriesService({ filter, page, limit });
    return sendSuccess(res, 200, categories, 'Categories retrieved successfully.');
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Failed to retrieve categories.');
  }
};

/**
 * Create a new category or restore soft-deleted matching category.
 */
export const createCategory = async (req, res) => {
  try {
    const userId = req.user?.id;
    const category = await categoryService.createCategoryService(req.body, userId);
    return sendSuccess(res, 201, category, 'Category saved successfully.');
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Failed to save category.');
  }
};

/**
 * Update an existing category.
 */
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, expectedUpdatedAt } = req.body;
    const userId = req.user?.id;
    const category = await categoryService.updateCategoryService(id, { name, description }, expectedUpdatedAt, userId);
    return sendSuccess(res, 200, category, 'Category updated successfully.');
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Failed to update category.');
  }
};

/**
 * Soft delete a category.
 */
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const result = await categoryService.deleteCategoryService(id, userId);
    return sendSuccess(res, 200, null, result.message);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Failed to delete category.');
  }
};

/**
 * Restore an archived category.
 */
export const restoreCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const category = await categoryService.restoreCategoryService(id, userId);
    return sendSuccess(res, 200, category, 'Category restored successfully.');
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Failed to restore category.');
  }
};
