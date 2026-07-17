/**
 * Normalize backend API and network errors into a consistent structure for UI components.
 *
 * @param {any} error - The caught error (typically an AxiosError)
 * @returns {{ message: string, status: number | null, fieldErrors: Record<string, string> }}
 */
export const normalizeError = (error) => {
  const normalized = {
    message: 'An unexpected error occurred. Please try again.',
    status: null,
    fieldErrors: {},
  };

  if (!error) return normalized;

  if (error.response) {
    // Server responded with an error status (4xx, 5xx)
    const { status, data } = error.response;
    normalized.status = status;

    if (data && typeof data === 'object') {
      normalized.message = data.message || normalized.message;

      // Map structured backend validation fields (e.g. [{ field: 'email', message: '...' }])
      if (Array.isArray(data.errors)) {
        data.errors.forEach((err) => {
          if (err && err.field) {
            normalized.fieldErrors[err.field] = err.message;
          }
        });
      }
    }
  } else if (error.request) {
    // Request was made but no response received (network offline or server down)
    normalized.message = 'The server is currently unreachable. Please check your connection and try again.';
  } else {
    // Configuration or setup error
    normalized.message = error.message || normalized.message;
  }

  return normalized;
};
