/**
 * @fileoverview Centralized validation helpers and regex constants.
 *
 * Provides shared regular expression constants and pure validation utilities
 * used across all request validators and validation middleware.
 *
 * Helpers are intentionally pure — they do not trim or normalize input.
 * Each validator is responsible for its own normalization steps to preserve
 * existing validation behavior exactly.
 *
 * @module helpers/validation.helper
 */

/**
 * UUID v4 regular expression.
 * Matches the standard 8-4-4-4-12 hexadecimal format.
 *
 * @type {RegExp}
 */
export const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Email address regular expression.
 * Validates basic email format: local-part@domain.tld
 *
 * @type {RegExp}
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate if a value is a valid UUID string (pure — does not trim).
 *
 * @param {*} val - Value to check
 * @returns {boolean} True if the value is a string matching UUID format
 */
export const isValidUuid = (val) => {
  return typeof val === 'string' && UUID_REGEX.test(val);
};

/**
 * Validate if a value is a valid email string (pure — does not trim).
 *
 * @param {*} val - Value to check
 * @returns {boolean} True if the value is a string matching email format
 */
export const isValidEmail = (val) => {
  return typeof val === 'string' && EMAIL_REGEX.test(val);
};
