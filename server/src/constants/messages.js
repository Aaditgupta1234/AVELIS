/**
 * @fileoverview Reusable response messages.
 *
 * Centralized message strings used in API responses.
 * Keeps user-facing text consistent and easy to update.
 *
 * @module constants/messages
 */

/**
 * Standard response messages organized by domain.
 *
 * @readonly
 */
export const MESSAGES = Object.freeze({
  // General
  SUCCESS: 'Request successful',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  NOT_FOUND: 'Resource not found',
  INTERNAL_ERROR: 'Internal server error',

  // Authentication
  AUTH: Object.freeze({
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    REGISTER_SUCCESS: 'Registration successful',
    INVALID_CREDENTIALS: 'Invalid email or password',
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'You do not have permission to perform this action',
    TOKEN_EXPIRED: 'Token has expired',
    TOKEN_INVALID: 'Invalid token',
  }),

  // Validation
  VALIDATION: Object.freeze({
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Please provide a valid email',
    INVALID_ID: 'Invalid ID format',
    PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters',
  }),

  // Books
  BOOK: Object.freeze({
    NOT_FOUND: 'Book not found',
    ALREADY_EXISTS: 'A book with this ISBN already exists',
    BORROWED: 'Book is currently borrowed',
    RETURNED: 'Book returned successfully',
  }),

  // Users
  USER: Object.freeze({
    NOT_FOUND: 'User not found',
    ALREADY_EXISTS: 'A user with this email already exists',
  }),
});
