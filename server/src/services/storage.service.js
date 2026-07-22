import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { supabase } from '../lib/supabase.js';
import { config } from '../config/index.js';
import { ApiError } from '../utils/index.js';

/**
 * Storage Service — Hybrid Supabase Storage with Local Dev Fallback.
 */
class StorageService {
  /**
   * Helper to build date-organized path: `folder/YYYY/MM/prefix-uuid.ext`
   */
  generateDateOrganizedPath(folderPrefix, extension) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const uuid = crypto.randomUUID();
    const ext = extension ? extension.replace(/^\./, '') : 'bin';

    return `${folderPrefix}/${year}/${month}/${folderPrefix}-${uuid}.${ext}`;
  }

  /**
   * Check if Supabase key is configured with a valid JWT string structure.
   */
  isSupabaseJwtValid() {
    const key = config.supabaseSecretKey;
    return typeof key === 'string' && key.startsWith('eyJ');
  }

  /**
   * Upload a file buffer. Uses Supabase Storage if valid JWT key, else saves to local uploads directory as dev fallback.
   *
   * @param {string} bucket - Target bucket name ('book-covers' or 'book-pdfs')
   * @param {Buffer} fileBuffer - In-memory file buffer
   * @param {string} mimeType - File MIME type
   * @param {string} extension - Extension without dot
   * @param {string} folderPrefix - Folder prefix ('cover' or 'pdf')
   * @returns {Promise<{ bucket: string, path: string, fileUrl: string }>}
   */
  async upload(bucket, fileBuffer, mimeType, extension, folderPrefix = 'file') {
    const relPath = this.generateDateOrganizedPath(folderPrefix, extension);

    // Try Supabase Storage upload if JWT key is present
    if (this.isSupabaseJwtValid()) {
      try {
        const { data, error } = await supabase.storage.from(bucket).upload(relPath, fileBuffer, {
          contentType: mimeType,
          upsert: true,
        });

        if (!error && data) {
          const fileUrl = this.getPublicUrl(bucket, data.path || relPath);
          return {
            bucket,
            path: data.path || relPath,
            fileUrl,
          };
        }
        console.warn(`[StorageService] Supabase storage upload notice (${error?.message}). Falling back to local storage.`);
      } catch (err) {
        console.warn(`[StorageService] Supabase upload failed (${err.message}). Falling back to local storage.`);
      }
    }

    // Local Storage Fallback (for development / unconfigured Supabase keys)
    const localDir = path.join(process.cwd(), 'uploads', bucket, path.dirname(relPath));
    fs.mkdirSync(localDir, { recursive: true });

    const fullLocalPath = path.join(process.cwd(), 'uploads', bucket, relPath);
    fs.writeFileSync(fullLocalPath, fileBuffer);

    const hostUrl = config.clientUrl ? config.clientUrl.replace(/:[0-9]+$/, `:${config.port}`) : `http://localhost:${config.port}`;
    const fileUrl = `${hostUrl}/uploads/${bucket}/${relPath.replace(/\\/g, '/')}`;

    return {
      bucket,
      path: relPath,
      fileUrl,
    };
  }

  /**
   * Delete an object from storage.
   */
  async delete(bucket, relPath) {
    if (!relPath) return false;

    if (this.isSupabaseJwtValid()) {
      const { error } = await supabase.storage.from(bucket).remove([relPath]);
      if (!error) return true;
    }

    // Local deletion fallback
    const fullLocalPath = path.join(process.cwd(), 'uploads', bucket, relPath);
    if (fs.existsSync(fullLocalPath)) {
      try {
        fs.unlinkSync(fullLocalPath);
        return true;
      } catch (_) {}
    }
    return false;
  }

  /**
   * Check if object exists.
   */
  async exists(bucket, relPath) {
    if (!relPath) return false;

    if (this.isSupabaseJwtValid()) {
      const { data, error } = await supabase.storage.from(bucket).list(relPath.substring(0, relPath.lastIndexOf('/')), {
        search: relPath.substring(relPath.lastIndexOf('/') + 1),
      });
      if (!error && data && data.length > 0) return true;
    }

    const fullLocalPath = path.join(process.cwd(), 'uploads', bucket, relPath);
    return fs.existsSync(fullLocalPath);
  }

  /**
   * Retrieve public URL.
   */
  getPublicUrl(bucket, relPath) {
    if (this.isSupabaseJwtValid()) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(relPath);
      if (data?.publicUrl) return data.publicUrl;
    }

    const hostUrl = config.clientUrl ? config.clientUrl.replace(/:[0-9]+$/, `:${config.port}`) : `http://localhost:${config.port}`;
    return `${hostUrl}/uploads/${bucket}/${relPath.replace(/\\/g, '/')}`;
  }

  /**
   * Retrieve signed URL.
   */
  async getSignedUrl(bucket, relPath, expiresInSeconds = 3600) {
    if (this.isSupabaseJwtValid()) {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(relPath, expiresInSeconds);
      if (!error && data?.signedUrl) return data.signedUrl;
    }

    return this.getPublicUrl(bucket, relPath);
  }
}

export const storageService = new StorageService();
