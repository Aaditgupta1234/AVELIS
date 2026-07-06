/**
 * @fileoverview Book module controllers.
 *
 * Coordinates request flows for book registration, retrieval, updating,
 * soft-deletion, restoration, and permanent deletion.
 *
 * @module controllers/book
 */

import * as bookService from '../services/book.service.js';
import { sendSuccess } from '../utils/index.js';

/**
 * Handle creation of a new book catalog entry.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const createBook = async (req, res, next) => {
  try {
    const createdBook = await bookService.createBook(req.body);

    return sendSuccess(res, 201, createdBook, 'Book created successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle paginated book catalog retrieval.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getBooks = async (req, res, next) => {
  try {
    const result = await bookService.getBooks(req.query);

    return sendSuccess(res, 200, result, 'Books retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle retrieval of single book details.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const book = await bookService.getBookById(id);

    return sendSuccess(res, 200, book, 'Book retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle updates to an existing book.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedBook = await bookService.updateBook(id, req.body);

    return sendSuccess(res, 200, updatedBook, 'Book updated successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle permanent deletion of a soft-deleted book.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const permanentDeleteBookController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedBook = await bookService.permanentDeleteBook(id);

    return sendSuccess(res, 200, deletedBook, 'Book permanently deleted successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle soft deleting a book.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const softDeleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedBook = await bookService.softDeleteBook(id);

    return sendSuccess(res, 200, deletedBook, 'Book deleted successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle restoring a deleted book.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const restoreBookController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const restoredBook = await bookService.restoreBook(id);

    return sendSuccess(res, 200, restoredBook, 'Book restored successfully.');
  } catch (error) {
    next(error);
  }
};
