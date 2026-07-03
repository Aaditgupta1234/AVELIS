/**
 * @fileoverview File upload middleware.
 *
 * Placeholder configuration for Multer file uploads.
 * Configures storage, file filtering, and size limits.
 *
 * @module middleware/upload/upload
 *
 * @example
 * // Future usage:
 * // import { uploadSingle, uploadMultiple } from '../middleware/upload/upload.js';
 * // router.post('/books/:id/cover', uploadSingle('cover'), uploadBookCover);
 */

// TODO: Uncomment and configure when file uploads are needed
// import multer from 'multer';
// import path from 'path';

/**
 * Upload a single file.
 *
 * @placeholder Not yet configured.
 *
 * @param {string} _fieldName - Form field name for the file
 * @returns {import('express').RequestHandler} Middleware function
 */
export const uploadSingle = (_fieldName) => {
  return (_req, _res, next) => {
    // TODO: Configure multer storage and file filter
    // const storage = multer.diskStorage({
    //   destination: 'src/uploads/',
    //   filename: (req, file, cb) => {
    //     const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    //     cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    //   },
    // });
    next();
  };
};

/**
 * Upload multiple files.
 *
 * @placeholder Not yet configured.
 *
 * @param {string} _fieldName - Form field name for the files
 * @param {number} [_maxCount=5] - Maximum number of files
 * @returns {import('express').RequestHandler} Middleware function
 */
export const uploadMultiple = (_fieldName, _maxCount = 5) => {
  return (_req, _res, next) => {
    // TODO: Configure multer for multiple file uploads
    next();
  };
};
