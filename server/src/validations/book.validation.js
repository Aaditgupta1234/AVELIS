/**
 * @fileoverview Book module request validations placeholder.
 *
 * Export no-op middleware hooks to establish validation boundaries.
 * Schema validation logic will be integrated in Phase 8.2.
 *
 * @module validations/book
 */

import { sendError } from '../utils/index.js';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, DEFAULT_SORT_FIELD, DEFAULT_SORT_ORDER } from '../constants/book.constants.js';

/**
 * Validator middleware for creating a book.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const createBookValidator = (req, res, next) => {
  const errors = [];
  const { title, isbn, publisher, language, authorIds, categoryIds, publicationYear, sellingPrice, stockQuantity, isBorrowable, isForSale } = req.body;

  // Title validation
  if (title === undefined || title === null || typeof title !== 'string' || title.trim() === '') {
    errors.push({ field: 'title', message: 'Title is required and must be a non-empty string.' });
  } else {
    req.body.title = title.trim();
  }

  // ISBN validation
  if (isbn === undefined || isbn === null || typeof isbn !== 'string' || isbn.trim() === '') {
    errors.push({ field: 'isbn', message: 'ISBN is required and must be a non-empty string.' });
  } else {
    req.body.isbn = isbn.trim();
  }

  // Publisher validation
  if (publisher === undefined || publisher === null || typeof publisher !== 'string' || publisher.trim() === '') {
    errors.push({ field: 'publisher', message: 'Publisher is required and must be a non-empty string.' });
  } else {
    req.body.publisher = publisher.trim();
  }

  // Language validation
  if (language === undefined || language === null || typeof language !== 'string' || language.trim() === '') {
    errors.push({ field: 'language', message: 'Language is required and must be a non-empty string.' });
  } else {
    req.body.language = language.trim();
  }

  // Author IDs validation
  if (!authorIds || !Array.isArray(authorIds) || authorIds.length === 0) {
    errors.push({ field: 'authorIds', message: 'authorIds must be a non-empty array.' });
  } else {
    // Check duplicate IDs before existence checks
    if (new Set(authorIds).size !== authorIds.length) {
      errors.push({ field: 'authorIds', message: 'authorIds cannot contain duplicate IDs.' });
    }
    authorIds.forEach((id, index) => {
      if (typeof id !== 'string' || id.trim() === '') {
        errors.push({ field: `authorIds[${index}]`, message: 'Author ID must be a non-empty string.' });
      }
    });
  }

  // Category IDs validation
  if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
    errors.push({ field: 'categoryIds', message: 'categoryIds must be a non-empty array.' });
  } else {
    // Check duplicate IDs before existence checks
    if (new Set(categoryIds).size !== categoryIds.length) {
      errors.push({ field: 'categoryIds', message: 'categoryIds cannot contain duplicate IDs.' });
    }
    categoryIds.forEach((id, index) => {
      if (typeof id !== 'string' || id.trim() === '') {
        errors.push({ field: `categoryIds[${index}]`, message: 'Category ID must be a non-empty string.' });
      }
    });
  }

  // Optional fields validation
  if (publicationYear !== undefined && publicationYear !== null) {
    if (!Number.isInteger(publicationYear)) {
      errors.push({ field: 'publicationYear', message: 'Publication year must be an integer.' });
    }
  }

  if (sellingPrice !== undefined && sellingPrice !== null) {
    if (typeof sellingPrice !== 'number' || sellingPrice < 0) {
      errors.push({ field: 'sellingPrice', message: 'Selling price must be a non-negative number.' });
    }
  }

  if (stockQuantity !== undefined && stockQuantity !== null) {
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      errors.push({ field: 'stockQuantity', message: 'Stock quantity must be a non-negative integer.' });
    }
  }

  if (isBorrowable !== undefined && isBorrowable !== null) {
    if (typeof isBorrowable !== 'boolean') {
      errors.push({ field: 'isBorrowable', message: 'isBorrowable must be a boolean.' });
    }
  }

  if (isForSale !== undefined && isForSale !== null) {
    if (typeof isForSale !== 'boolean') {
      errors.push({ field: 'isForSale', message: 'isForSale must be a boolean.' });
    }
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  next();
};

/**
 * Validator middleware for updating a book.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const updateBookValidator = (req, res, next) => {
  next();
};

/**
 * Validator middleware for querying book catalogs.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const queryBookValidator = (req, res, next) => {
  const errors = [];
  const { page, limit, search, sortBy, order, language, publicationYear, isBorrowable, isForSale } = req.query;

  // 1. Pagination Validation & Casting
  if (page !== undefined && page !== null) {
    const pageNum = Number(page);
    if (!Number.isInteger(pageNum) || pageNum <= 0) {
      errors.push({ field: 'page', message: 'Page must be a positive integer.' });
    } else {
      req.query.page = pageNum;
    }
  } else {
    req.query.page = 1;
  }

  if (limit !== undefined && limit !== null) {
    const limitNum = Number(limit);
    if (!Number.isInteger(limitNum) || limitNum <= 0 || limitNum > MAX_PAGE_SIZE) {
      errors.push({ field: 'limit', message: `Limit must be a positive integer not exceeding ${MAX_PAGE_SIZE}.` });
    } else {
      req.query.limit = limitNum;
    }
  } else {
    req.query.limit = DEFAULT_PAGE_SIZE;
  }

  // 2. Search Parameter Normalization
  if (search !== undefined && search !== null) {
    if (typeof search !== 'string') {
      errors.push({ field: 'search', message: 'Search query must be a string.' });
    } else {
      const trimmedSearch = search.trim();
      req.query.search = trimmedSearch !== '' ? trimmedSearch : undefined;
    }
  }

  // 3. Sorting Parameter Validation & Normalization
  const allowedSortFields = ['title', 'isbn', 'publisher', 'publicationYear', 'language', 'sellingPrice', 'stockQuantity', 'createdAt'];
  if (sortBy !== undefined && sortBy !== null) {
    if (!allowedSortFields.includes(sortBy)) {
      errors.push({ field: 'sortBy', message: `sortBy must be one of: ${allowedSortFields.join(', ')}.` });
    }
  } else {
    req.query.sortBy = DEFAULT_SORT_FIELD;
  }

  if (order !== undefined && order !== null) {
    const normalizedOrder = String(order).toLowerCase();
    if (normalizedOrder !== 'asc' && normalizedOrder !== 'desc') {
      errors.push({ field: 'order', message: "Order must be 'asc' or 'desc'." });
    } else {
      req.query.order = normalizedOrder;
    }
  } else {
    req.query.order = DEFAULT_SORT_ORDER;
  }

  // 4. Filters Validation & Normalization
  if (language !== undefined && language !== null) {
    if (typeof language !== 'string') {
      errors.push({ field: 'language', message: 'Language must be a string.' });
    } else {
      const trimmedLanguage = language.trim();
      req.query.language = trimmedLanguage !== '' ? trimmedLanguage : undefined;
    }
  }

  if (publicationYear !== undefined && publicationYear !== null) {
    const yearNum = Number(publicationYear);
    if (!Number.isInteger(yearNum)) {
      errors.push({ field: 'publicationYear', message: 'publicationYear must be a valid integer.' });
    } else {
      req.query.publicationYear = yearNum;
    }
  }

  if (isBorrowable !== undefined && isBorrowable !== null) {
    if (isBorrowable === 'true') {
      req.query.isBorrowable = true;
    } else if (isBorrowable === 'false') {
      req.query.isBorrowable = false;
    } else {
      errors.push({ field: 'isBorrowable', message: "isBorrowable must be 'true' or 'false'." });
    }
  }

  if (isForSale !== undefined && isForSale !== null) {
    if (isForSale === 'true') {
      req.query.isForSale = true;
    } else if (isForSale === 'false') {
      req.query.isForSale = false;
    } else {
      errors.push({ field: 'isForSale', message: "isForSale must be 'true' or 'false'." });
    }
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  next();
};
