import crypto from 'crypto';
import path from 'path';
import { supabase } from '../lib/supabase.js';
import { config } from '../config/index.js';
import { ApiError } from '../utils/index.js';
import { logger } from '../config/logger.js';

// Configuration & Validation Rules
const ALLOWED_MIME_TYPES = {
  'book-covers': ['image/jpeg', 'image/png', 'image/webp'],
  'book-pdfs': ['application/pdf'],
};

const ALLOWED_EXTENSIONS = {
  'book-covers': ['.jpg', '.jpeg', '.png', '.webp'],
  'book-pdfs': ['.pdf'],
};

const MAX_FILE_SIZES = {
  'book-covers': 5 * 1024 * 1024,   // 5 MB
  'book-pdfs': 100 * 1024 * 1024,   // 100 MB
};

let isInitialized = false;

/**
 * Read-Only Server Startup Check.
 * Verifies Supabase credentials and ensures target storage buckets exist and are accessible.
 */
export const initializeStorageService = async () => {
  const url = config.supabaseUrl;
  const key = config.supabaseSecretKey;

  if (!url || typeof url !== 'string' || !url.trim() || !key || typeof key !== 'string' || !key.trim()) {
    const errorMsg = '[StorageService] Supabase configuration missing (SUPABASE_URL or SUPABASE_SECRET_KEY).';
    logger.error(errorMsg);
    throw new ApiError(500, errorMsg);
  }

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      const errorMsg = `[StorageService] Failed to list Supabase buckets: ${error.message}`;
      logger.error(errorMsg);
      throw new ApiError(500, errorMsg);
    }

    const bucketNames = Array.isArray(buckets) ? buckets.map((b) => b.name || b.id) : [];
    const requiredBuckets = ['book-covers', 'book-pdfs'];
    const missingBuckets = requiredBuckets.filter((b) => !bucketNames.includes(b));

    if (missingBuckets.length > 0) {
      const errorMsg = `[StorageService] Missing required storage bucket(s): ${missingBuckets.join(', ')}. Create them in Supabase Storage.`;
      logger.error(errorMsg);
      throw new ApiError(500, errorMsg);
    }

    isInitialized = true;
    logger.info('[StorageService] Supabase Storage initialization & read-only bucket verification succeeded.', {
      buckets: requiredBuckets,
    });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const errorMsg = `[StorageService] Initialization exception: ${err.message}`;
    logger.error(errorMsg);
    throw new ApiError(500, errorMsg);
  }
};

/**
 * Storage Service — Pure Supabase Storage Management (No Local Disk Fallback)
 */
class StorageService {
  /**
   * Helper to build date-organized path: `<bucket>/YYYY/MM/<uuid>.<ext>`
   */
  generateDateOrganizedPath(bucket, extension) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const uuid = crypto.randomUUID();
    const ext = extension ? extension.toLowerCase().replace(/^\./, '') : 'bin';

    return `${bucket}/${year}/${month}/${uuid}.${ext}`;
  }

  /**
   * Validate file MIME type, extension, and file size server-side.
   */
  validateFile(bucket, mimeType, extension, fileSizeInBytes) {
    const allowedMimes = ALLOWED_MIME_TYPES[bucket] || ALLOWED_MIME_TYPES['book-covers'];
    const allowedExts = ALLOWED_EXTENSIONS[bucket] || ALLOWED_EXTENSIONS['book-covers'];
    const maxSize = MAX_FILE_SIZES[bucket] || MAX_FILE_SIZES['book-covers'];

    const normalizedExt = extension ? (extension.startsWith('.') ? extension.toLowerCase() : `.${extension.toLowerCase()}`) : '';

    if (mimeType && !allowedMimes.includes(mimeType.toLowerCase())) {
      throw new ApiError(
        400,
        `Invalid file type (${mimeType}) for ${bucket}. Allowed types: ${allowedMimes.join(', ')}`
      );
    }

    if (normalizedExt && !allowedExts.includes(normalizedExt)) {
      throw new ApiError(
        400,
        `Invalid file extension (${normalizedExt}) for ${bucket}. Allowed extensions: ${allowedExts.join(', ')}`
      );
    }

    if (fileSizeInBytes && fileSizeInBytes > maxSize) {
      const maxMb = (maxSize / (1024 * 1024)).toFixed(0);
      throw new ApiError(400, `File size exceeds the limit of ${maxMb} MB for ${bucket}.`);
    }
  }

  /**
   * Safely extract relative storage path from a full CDN URL or path string.
   */
  extractPathFromUrl(fileUrl, bucket) {
    if (!fileUrl || typeof fileUrl !== 'string') return null;

    try {
      const url = new URL(fileUrl);
      const marker = `/${bucket}/`;
      const index = url.pathname.indexOf(marker);

      if (index === -1) return null;

      const extracted = url.pathname
        .substring(index + marker.length)
        .replace(/^\/+/, '')
        .replace(/\\/g, '/');

      return extracted.length > 0 ? extracted : null;
    } catch (_) {
      // If it's already a relative path string
      const marker = `${bucket}/`;
      if (fileUrl.includes(marker)) {
        const index = fileUrl.indexOf(marker);
        return fileUrl.substring(index + marker.length).replace(/^\/+/, '');
      }
      return fileUrl.replace(/^\/+/, '');
    }
  }

  /**
   * Upload a file buffer directly to Supabase Storage.
   *
   * @param {string} bucket - Target bucket name ('book-covers' or 'book-pdfs')
   * @param {Buffer} fileBuffer - In-memory file buffer
   * @param {string} mimeType - File MIME type
   * @param {string} originalName - Original filename or extension
   * @returns {Promise<{ bucket: string, path: string, fileUrl: string, coverImage?: string, coverImagePath?: string, pdfUrl?: string, pdfPath?: string }>}
   */
  async upload(bucket, fileBuffer, mimeType, originalName) {
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
      throw new ApiError(400, 'Invalid file content provided for upload.');
    }

    const extension = path.extname(originalName || '') || '.bin';
    this.validateFile(bucket, mimeType, extension, fileBuffer.length);

    const relPath = this.generateDateOrganizedPath(bucket, extension);
    const cacheControl = process.env.SUPABASE_STORAGE_CACHE_CONTROL || '3600';

    try {
      const { data, error } = await supabase.storage.from(bucket).upload(relPath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
        cacheControl,
      });

      if (error) {
        logger.error(`[UPLOAD_FAILED] Supabase storage upload error in bucket "${bucket}":`, {
          error: error.message,
          bucket,
          path: relPath,
        });
        throw new ApiError(500, `File upload to storage failed: ${error.message}`);
      }

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path || relPath);
      const publicUrl = urlData?.publicUrl;

      if (!publicUrl) {
        throw new ApiError(500, 'Failed to generate public URL for uploaded file.');
      }

      logger.info(`[UPLOAD_SUCCESS] Uploaded object to ${bucket}`, {
        bucket,
        path: relPath,
        publicUrl,
      });

      const isCover = bucket === 'book-covers';
      return {
        bucket,
        path: relPath,
        fileUrl: publicUrl,
        ...(isCover
          ? { coverImage: publicUrl, coverImagePath: relPath }
          : { pdfUrl: publicUrl, pdfPath: relPath }),
      };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      logger.error(`[UPLOAD_FAILED] Storage upload exception in bucket "${bucket}":`, {
        error: err.message,
        bucket,
      });
      throw new ApiError(500, `Storage upload error: ${err.message}`);
    }
  }

  /**
   * Delete an object from Supabase Storage by path or URL.
   *
   * @param {string} bucket - Target bucket name ('book-covers' or 'book-pdfs')
   * @param {string} urlOrPath - Storage path or full public URL
   * @returns {Promise<{ success: boolean, reason?: string }>} Status object
   */
  async delete(bucket, urlOrPath) {
    if (!urlOrPath || typeof urlOrPath !== 'string') {
      return { success: true };
    }

    const relPath = urlOrPath.includes('/') ? this.extractPathFromUrl(urlOrPath, bucket) || urlOrPath : urlOrPath;
    const normalizedPath = relPath.replace(/\\/g, '/').replace(/^\/+/, '');

    try {
      const { error } = await supabase.storage.from(bucket).remove([normalizedPath]);

      if (!error || error?.status === 404 || error?.code === 'NotFound' || error?.message?.toLowerCase().includes('not found')) {
        logger.info(`[DELETE_SUCCESS] Removed object from ${bucket}`, {
          bucket,
          path: normalizedPath,
        });
        return { success: true };
      }

      logger.warn(`[DELETE_FAILED] Could not delete object from ${bucket}`, {
        bucket,
        path: normalizedPath,
        reason: error?.message,
      });
      return { success: false, reason: error?.message || 'Supabase deletion failed' };
    } catch (err) {
      logger.warn(`[DELETE_FAILED] Exception deleting object from ${bucket}`, {
        bucket,
        path: normalizedPath,
        reason: err.message,
      });
      return { success: false, reason: err.message };
    }
  }
}

export const storageService = new StorageService();
