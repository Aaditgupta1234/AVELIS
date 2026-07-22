import { sendError } from '../utils/index.js';

/**
 * Helper to inspect raw buffer header bytes (magic bytes).
 */
const verifyMagicBytes = (buffer, type) => {
  if (!buffer || buffer.length < 12) return false;

  if (type === 'pdf') {
    // %PDF- signature: 0x25 0x50 0x44 0x46 0x2D
    return (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46
    );
  }

  if (type === 'png') {
    // PNG signature: 0x89 0x50 0x4E 0x47
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }

  if (type === 'jpeg') {
    // JPEG signature: 0xFF 0xD8 0xFF
    return (
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  }

  if (type === 'webp') {
    // WEBP signature: RIFF at [0..3] and WEBP at [8..11]
    const isRiff =
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
    const isWebp =
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    return isRiff && isWebp;
  }

  return false;
};

/**
 * Validate Book Cover Image upload.
 * Rules: Required file, max 5 MB, MIME types: jpeg, png, webp, verified magic bytes.
 */
export const validateBookCoverUpload = (req, res, next) => {
  if (!req.file) {
    return sendError(res, 400, 'No cover image file provided.', [
      { field: 'file', message: 'A file is required for cover upload.' },
    ]);
  }

  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
  if (req.file.size > MAX_SIZE) {
    return sendError(res, 400, 'Cover image file size exceeds the 5 MB limit.', [
      { field: 'file', message: 'Maximum cover image file size is 5 MB.' },
    ]);
  }

  const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!ALLOWED_MIMES.includes(req.file.mimetype)) {
    return sendError(res, 400, 'Invalid cover image file type. Allowed: JPEG, PNG, WEBP.', [
      { field: 'file', message: 'File format not supported.' },
    ]);
  }

  // Magic byte inspection
  const isValidImage =
    verifyMagicBytes(req.file.buffer, 'png') ||
    verifyMagicBytes(req.file.buffer, 'jpeg') ||
    verifyMagicBytes(req.file.buffer, 'webp');

  if (!isValidImage) {
    return sendError(res, 400, 'File content does not match expected image signature.', [
      { field: 'file', message: 'Security validation failed: File extension spoofing detected.' },
    ]);
  }

  next();
};

/**
 * Validate Book PDF Document upload.
 * Rules: Required file, max 50 MB, MIME type: application/pdf, verified magic bytes (%PDF-).
 */
export const validateBookPdfUpload = (req, res, next) => {
  if (!req.file) {
    return sendError(res, 400, 'No PDF document file provided.', [
      { field: 'file', message: 'A file is required for PDF upload.' },
    ]);
  }

  const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
  if (req.file.size > MAX_SIZE) {
    return sendError(res, 400, 'PDF document file size exceeds the 50 MB limit.', [
      { field: 'file', message: 'Maximum PDF file size is 50 MB.' },
    ]);
  }

  if (req.file.mimetype !== 'application/pdf') {
    return sendError(res, 400, 'Invalid document file type. Only PDF files are permitted.', [
      { field: 'file', message: 'Only application/pdf files are supported.' },
    ]);
  }

  // Magic byte inspection for PDF
  const isValidPdf = verifyMagicBytes(req.file.buffer, 'pdf');
  if (!isValidPdf) {
    return sendError(res, 400, 'File content does not match expected PDF signature.', [
      { field: 'file', message: 'Security validation failed: File extension spoofing detected.' },
    ]);
  }

  next();
};
