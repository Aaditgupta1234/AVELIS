import { apiClient } from '../api/client.js';

/**
 * Service to execute user login.
 *
 * @param {Object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @param {Object} [options] - Additional request options (e.g. signal)
 * @returns {Promise<{ token: string, user: Object }>}
 */
export const loginUser = async ({ email, password }, options = {}) => {
  const response = await apiClient.post('/auth/login', { email, password }, options);
  return response.data.data; // Extracts { token, user }
};

/**
 * Service to register a new user.
 *
 * @param {Object} userData
 * @param {string} userData.name
 * @param {string} userData.email
 * @param {string} userData.password
 * @param {Object} [options] - Additional request options (e.g. signal)
 * @returns {Promise<Object>} Sanitized user record
 */
export const registerUser = async ({ name, email, password }, options = {}) => {
  const response = await apiClient.post('/auth/register', { name, email, password }, options);
  return response.data.data; // Extracts user object
};

/**
 * Service to retrieve the current user's profile details.
 *
 * @param {Object} [options] - Additional request options (e.g. signal)
 * @returns {Promise<Object>} Authorized user profile details
 */
export const getMe = async (options = {}) => {
  const response = await apiClient.get('/auth/me', options);
  return response.data.data; // Extracts user object { id, name, email, role, isActive }
};

/**
 * Service to execute OAuth authentication via backend bridge.
 *
 * @param {Object} payload
 * @param {string} payload.token - Supabase access token
 * @param {Object} [options] - Additional request options
 * @returns {Promise<{ token: string, user: Object }>}
 */
export const oauthUser = async ({ token }, options = {}) => {
  const response = await apiClient.post('/auth/oauth', { token }, options);
  return response.data.data; // Extracts { token, user }
};
