import { storageService } from './storage.service.js';

/**
 * Upload Service — High-level domain upload manager.
 */
class UploadService {
  /**
   * Upload a book cover image.
   * Target bucket: 'book-covers'
   */
  async uploadBookCover(fileBuffer, mimeType, originalName) {
    return await storageService.upload('book-covers', fileBuffer, mimeType, originalName);
  }

  /**
   * Upload a book PDF document.
   * Target bucket: 'book-pdfs'
   */
  async uploadBookPdf(fileBuffer, mimeType, originalName) {
    return await storageService.upload('book-pdfs', fileBuffer, mimeType, originalName);
  }
}

export const uploadService = new UploadService();
