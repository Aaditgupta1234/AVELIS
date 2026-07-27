import * as authorService from '../services/author.service.js';
import { sendSuccess, sendError } from '../utils/index.js';

/**
 * Get authors with optional filter (active, archived, all) and pagination.
 */
export const getAuthors = async (req, res) => {
  try {
    const { filter, page, limit } = req.query;
    const authors = await authorService.getAllAuthorsService({ filter, page, limit });
    return sendSuccess(res, 200, authors, 'Authors retrieved successfully.');
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Failed to retrieve authors.');
  }
};

/**
 * Create a new author or restore soft-deleted matching author.
 */
export const createAuthor = async (req, res) => {
  try {
    const userId = req.user?.id;
    const author = await authorService.createAuthorService(req.body, userId);
    return sendSuccess(res, 201, author, 'Author saved successfully.');
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Failed to save author.');
  }
};

/**
 * Update an existing author.
 */
export const updateAuthor = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, biography, photo, expectedUpdatedAt } = req.body;
    const userId = req.user?.id;
    const author = await authorService.updateAuthorService(id, { fullName, biography, photo }, expectedUpdatedAt, userId);
    return sendSuccess(res, 200, author, 'Author updated successfully.');
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Failed to update author.');
  }
};

/**
 * Soft delete an author.
 */
export const deleteAuthor = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const result = await authorService.deleteAuthorService(id, userId);
    return sendSuccess(res, 200, null, result.message);
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Failed to delete author.');
  }
};

/**
 * Restore an archived author.
 */
export const restoreAuthor = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const author = await authorService.restoreAuthorService(id, userId);
    return sendSuccess(res, 200, author, 'Author restored successfully.');
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Failed to restore author.');
  }
};
