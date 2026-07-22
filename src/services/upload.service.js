import { STORAGE_KEYS } from '../constants/storage.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

/**
 * Upload helper with real-time upload progress tracking.
 *
 * @param {string} path - Relative API endpoint path ('/uploads/book-cover' or '/uploads/book-pdf')
 * @param {File} file - File object from file input
 * @param {function(number): void} onProgress - Progress callback receiving percentage (0..100)
 * @returns {Promise<{ bucket: string, path: string, fileUrl: string }>}
 */
const uploadFileWithProgress = (path, file, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const fullUrl = path.startsWith('http') ? path : `${API_BASE.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;

    xhr.open('POST', fullUrl, true);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    // Upload progress tracking
    if (xhr.upload && typeof onProgress === 'function') {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };
    }

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.message || `Upload failed with status ${xhr.status}`));
        }
      } catch (e) {
        reject(new Error(`Failed to parse response: ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error occurred during file upload.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('File upload connection timed out.'));
    };

    xhr.send(formData);
  });
};

/**
 * Upload Book Cover Image file with progress listener.
 */
export const uploadBookCover = (file, onProgress) => {
  return uploadFileWithProgress('/uploads/book-cover', file, onProgress);
};

/**
 * Upload Book PDF Document file with progress listener.
 */
export const uploadBookPdf = (file, onProgress) => {
  return uploadFileWithProgress('/uploads/book-pdf', file, onProgress);
};
