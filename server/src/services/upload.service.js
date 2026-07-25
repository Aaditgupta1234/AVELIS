export function extractPdfPageCount(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) return null;
  const content = buffer.toString('binary');

  const pagesMatches = content.match(/\/Type\s*\/Pages[^]*?\/Count\s+(\d+)/g) || 
                       content.match(/\/Count\s+(\d+)[^]*?\/Type\s*\/Pages/g);

  if (pagesMatches && pagesMatches.length > 0) {
    const counts = pagesMatches.map(m => {
      const match = m.match(/\/Count\s+(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    }).filter(n => n > 0);
    if (counts.length > 0) return Math.max(...counts);
  }

  const pageObjMatches = content.match(/\/Type\s*\/Page\b/g);
  if (pageObjMatches && pageObjMatches.length > 0) {
    return pageObjMatches.length;
  }

  const countMatches = content.match(/\/Count\s+(\d+)/g);
  if (countMatches && countMatches.length > 0) {
    const counts = countMatches
      .map(m => parseInt(m.replace(/\/Count\s+/, ''), 10))
      .filter(n => !isNaN(n) && n > 0 && n < 10000);
    if (counts.length > 0) return Math.max(...counts);
  }

  return null;
}

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
    const result = await storageService.upload('book-pdfs', fileBuffer, mimeType, originalName);
    const pageCount = extractPdfPageCount(fileBuffer);
    return {
      ...result,
      pageCount: pageCount || undefined,
      totalPages: pageCount || undefined,
    };
  }
}

export const uploadService = new UploadService();

