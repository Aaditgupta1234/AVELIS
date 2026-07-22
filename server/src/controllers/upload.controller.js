import { uploadService } from '../services/upload.service.js';
import { sendSuccess, sendError } from '../utils/index.js';

/**
 * Controller: Handle Book Cover Image Upload (Admin Only)
 */
export const uploadBookCoverController = async (req, res) => {
  try {
    const result = await uploadService.uploadBookCover(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    return sendSuccess(res, 200, result, 'Book cover uploaded successfully.');
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Unable to upload book cover.');
  }
};

/**
 * Controller: Handle Book PDF Document Upload (Admin Only)
 */
export const uploadBookPdfController = async (req, res) => {
  try {
    const result = await uploadService.uploadBookPdf(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    return sendSuccess(res, 200, result, 'Book PDF document uploaded successfully.');
  } catch (error) {
    return sendError(res, error.statusCode || 500, error.message || 'Unable to upload PDF document.');
  }
};
