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
    let extension = 'webp';
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') extension = 'jpg';
    if (mimeType === 'image/png') extension = 'png';

    return await storageService.upload('book-covers', fileBuffer, mimeType, extension, 'cover');
  }

  /**
   * Upload a book PDF document.
   * Target bucket: 'book-pdfs'
   */
  async uploadBookPdf(fileBuffer, mimeType, originalName) {
    return await storageService.upload('book-pdfs', fileBuffer, mimeType, 'pdf', 'pdf');
  }
}

export const uploadService = new UploadService();
