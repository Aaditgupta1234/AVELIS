/**
 * @fileoverview Book module request validations placeholder.
 *
 * Export no-op middleware hooks to establish validation boundaries.
 * Schema validation logic will be integrated in Phase 8.2.
 *
 * @module validations/book
 */

import { sendError, validateUUID, validatePagination, validateSort, validateSearch } from '../utils/index.js';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, DEFAULT_SORT_FIELD, DEFAULT_SORT_ORDER } from '../constants/book.constants.js';

const validatePublicationYear = (publicationYear, errors) => {
  if (publicationYear !== undefined && publicationYear !== null) {
    if (!Number.isInteger(publicationYear)) {
      errors.push({ field: 'publicationYear', message: 'Publication year must be an integer.' });
    }
  }
};

const validateSellingPrice = (sellingPrice, errors) => {
  if (sellingPrice !== undefined && sellingPrice !== null) {
    if (typeof sellingPrice !== 'number' || sellingPrice < 0) {
      errors.push({ field: 'sellingPrice', message: 'Selling price must be a non-negative number.' });
    }
  }
};

const validateStockQuantity = (stockQuantity, errors) => {
  if (stockQuantity !== undefined && stockQuantity !== null) {
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      errors.push({ field: 'stockQuantity', message: 'Stock quantity must be a non-negative integer.' });
    }
  }
};

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
  validatePublicationYear(publicationYear, errors);
  validateSellingPrice(sellingPrice, errors);
  validateStockQuantity(stockQuantity, errors);

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
  const { id } = req.params;

  if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
    return sendError(res, 400, 'Invalid book ID.');
  }

  const errors = [];
  const {
    title,
    isbn,
    publisher,
    publicationYear,
    language,
    description,
    coverImage,
    sellingPrice,
    stockQuantity,
    isBorrowable,
    isForSale,
    authorIds,
    categoryIds
  } = req.body;

  // Title validation (if provided)
  if (title !== undefined && title !== null) {
    if (typeof title !== 'string' || title.trim() === '') {
      errors.push({ field: 'title', message: 'Title must be a non-empty string.' });
    } else {
      req.body.title = title.trim();
    }
  }

  // ISBN validation (if provided)
  if (isbn !== undefined && isbn !== null) {
    if (typeof isbn !== 'string' || isbn.trim() === '') {
      errors.push({ field: 'isbn', message: 'ISBN must be a non-empty string.' });
    } else {
      req.body.isbn = isbn.trim();
    }
  }

  // Publisher validation (if provided)
  if (publisher !== undefined && publisher !== null) {
    if (typeof publisher !== 'string' || publisher.trim() === '') {
      errors.push({ field: 'publisher', message: 'Publisher must be a non-empty string.' });
    } else {
      req.body.publisher = publisher.trim();
    }
  }

  // Language validation (if provided)
  if (language !== undefined && language !== null) {
    if (typeof language !== 'string' || language.trim() === '') {
      errors.push({ field: 'language', message: 'Language must be a non-empty string.' });
    } else {
      req.body.language = language.trim();
    }
  }

  // Description validation (if provided)
  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      errors.push({ field: 'description', message: 'Description must be a string.' });
    } else {
      req.body.description = description.trim();
    }
  }

  // Cover Image validation (if provided)
  if (coverImage !== undefined && coverImage !== null) {
    if (typeof coverImage !== 'string') {
      errors.push({ field: 'coverImage', message: 'Cover image must be a string.' });
    } else {
      const trimmedUrl = coverImage.trim();
      try {
        new URL(trimmedUrl);
        req.body.coverImage = trimmedUrl;
      } catch (_) {
        errors.push({ field: 'coverImage', message: 'Cover image must be a valid URL.' });
      }
    }
  }

  // Publication Year validation (if provided)
  validatePublicationYear(publicationYear, errors);

  // Selling Price validation (if provided)
  validateSellingPrice(sellingPrice, errors);

  // Stock Quantity validation (if provided)
  validateStockQuantity(stockQuantity, errors);

  // Helper for boolean fields
  const validateBoolean = (val, fieldName) => {
    if (val !== undefined && val !== null) {
      if (val === 'true' || val === true) {
        req.body[fieldName] = true;
      } else if (val === 'false' || val === false) {
        req.body[fieldName] = false;
      } else {
        errors.push({ field: fieldName, message: `${fieldName} must be a boolean.` });
      }
    }
  };

  validateBoolean(isBorrowable, 'isBorrowable');
  validateBoolean(isForSale, 'isForSale');

  // Helper for ID array validations (UUID arrays)
  const validateIdArray = (ids, fieldName) => {
    if (ids !== undefined && ids !== null) {
      if (!Array.isArray(ids) || ids.length === 0) {
        errors.push({ field: fieldName, message: `${fieldName} must be a non-empty array.` });
      } else {
        if (new Set(ids).size !== ids.length) {
          errors.push({ field: fieldName, message: `${fieldName} cannot contain duplicate IDs.` });
        }
        ids.forEach((id, index) => {
          if (typeof id !== 'string' || id.trim() === '' || !UUID_REGEX.test(id.trim())) {
            errors.push({ field: `${fieldName}[${index}]`, message: `${fieldName.slice(0, -3)} ID must be a valid UUID string.` });
          } else {
            ids[index] = id.trim();
          }
        });
      }
    }
  };

  validateIdArray(authorIds, 'authorIds');
  validateIdArray(categoryIds, 'categoryIds');

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', [errors[0]]);
  }

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
  const { page, limit, search, sortBy, order, language, publicationYear, isBorrowable, isForSale } = req.query;

  // 1. Pagination Validation & Casting
  const pageRes = validatePagination(page, limit);
  const errors = pageRes.errors;
  req.query.page = pageRes.pageVal;
  req.query.limit = pageRes.limitVal;

  // 2. Search Parameter Normalization
  const searchRes = validateSearch(search);
  errors.push(...searchRes.errors);
  if (search !== undefined && search !== null) {
    req.query.search = String(search).trim() !== '' ? String(search).trim() : undefined;
  }

  // 3. Sorting Parameter Validation & Normalization
  const allowedSortFields = ['title', 'isbn', 'publisher', 'publicationYear', 'language', 'sellingPrice', 'stockQuantity', 'createdAt'];
  const sortRes = validateSort(sortBy, order, allowedSortFields);
  errors.push(...sortRes.errors);
  req.query.sortBy = sortBy !== undefined && sortBy !== null ? String(sortBy).trim() : DEFAULT_SORT_FIELD;
  req.query.order = sortRes.sortOrderNormalized;

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

/**
 * Validator middleware for validating Book UUID parameter.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const bookIdParamValidator = (req, res, next) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string' || !UUID_REGEX.test(id.trim())) {
    return sendError(res, 400, 'Invalid book ID.');
  }

  req.params.id = id.trim();
  next();
};

/**
 * Validator middleware for book rating statistics.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getBookRatingValidator = (req, res, next) => {
  const errors = [];
  const { bookId } = req.params;

  if (bookId === undefined || bookId === null || typeof bookId !== 'string' || !UUID_REGEX.test(bookId.trim())) {
    errors.push({ field: 'bookId', message: 'bookId is required and must be a valid UUID.' });
  } else {
    req.params.bookId = bookId.trim();
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  next();
};


