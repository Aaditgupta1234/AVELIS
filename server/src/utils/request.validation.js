/**
 * @fileoverview Shared request validation utilities.
 *
 * Provides schema-less helper functions to assert structural validation constraints
 * (pagination, UUID formats, sort mappings, search constraints, arrays)
 * returning standardized validation error objects.
 *
 * @module utils/request.validation
 */

import { validationSecurityConfig } from '../config/index.js';

/**
 * Validate RFC4122-compliant UUID.
 *
 * @param {string} uuid - Target UUID string
 * @returns {boolean} True if matching valid UUID structure
 */
export function validateUUID(uuid) {
  if (typeof uuid !== 'string') {
    return false;
  }
  return validationSecurityConfig.UUID_REGEX.test(uuid.trim());
}

/**
 * Validate positive integer values.
 * Strictly rejects floats, booleans, objects, arrays, NaN, and Infinity.
 *
 * @param {*} val - Input value
 * @returns {boolean} True if strictly a positive integer
 */
export function validatePositiveInteger(val) {
  if (val === undefined || val === null || typeof val === 'boolean' || Array.isArray(val)) {
    return false;
  }
  const num = Number(val);
  return Number.isInteger(num) && num > 0 && String(val).trim() !== '';
}

/**
 * Validate pagination values.
 * Returns errors array with field/message attributes if invalid.
 *
 * @param {*} page - Input page offset
 * @param {*} limit - Input limit size
 * @returns {{ errors: Array<{field: string, message: string}>, pageVal: number, limitVal: number }} Validation outcome
 */
export function validatePagination(page, limit) {
  const errors = [];
  let pageVal = validationSecurityConfig.DEFAULT_PAGE;
  let limitVal = validationSecurityConfig.DEFAULT_LIMIT;

  if (page !== undefined && page !== null) {
    if (!validatePositiveInteger(page)) {
      errors.push({ field: 'page', message: 'Page must be a positive integer.' });
    } else {
      pageVal = Number(page);
    }
  }

  if (limit !== undefined && limit !== null) {
    if (!validatePositiveInteger(limit)) {
      errors.push({ field: 'limit', message: 'Limit must be a positive integer.' });
    } else {
      const parsedLimit = Number(limit);
      if (parsedLimit > validationSecurityConfig.MAX_LIMIT) {
        errors.push({
          field: 'limit',
          message: `Limit exceeds maximum allowed size of ${validationSecurityConfig.MAX_LIMIT}.`
        });
      } else {
        limitVal = parsedLimit;
      }
    }
  }

  return { errors, pageVal, limitVal };
}

/**
 * Validate sorting inputs.
 * Rejects unknown sort fields immediately to prevent SQL injection.
 *
 * @param {string} sortBy - Target field
 * @param {string} sortOrder - Sort direction
 * @param {Array<string>} allowedFields - Allowed sort fields allow-list
 * @returns {{ errors: Array<{field: string, message: string}>, sortOrderNormalized: string }} Validation outcome
 */
export function validateSort(sortBy, sortOrder, allowedFields) {
  const errors = [];
  let sortOrderNormalized = validationSecurityConfig.DEFAULT_DIRECTION;

  if (sortBy !== undefined && sortBy !== null) {
    if (typeof sortBy !== 'string' || !allowedFields.includes(sortBy.trim())) {
      errors.push({ field: 'sortBy', message: `Unknown or disallowed sort field: "${sortBy}".` });
    }
  }

  if (sortOrder !== undefined && sortOrder !== null) {
    if (typeof sortOrder !== 'string') {
      errors.push({ field: 'sortOrder', message: 'Sort order must be a string.' });
    } else {
      const normalized = sortOrder.trim().toLowerCase();
      if (!validationSecurityConfig.ALLOWED_DIRECTIONS.includes(normalized)) {
        errors.push({
          field: 'sortOrder',
          message: `Sort order direction must be one of: ${validationSecurityConfig.ALLOWED_DIRECTIONS.join(', ')}.`
        });
      } else {
        sortOrderNormalized = normalized;
      }
    }
  }

  return { errors, sortOrderNormalized };
}

/**
 * Validate search text inputs.
 *
 * @param {string} query - Target search text
 * @returns {{ errors: Array<{field: string, message: string}> }} Validation outcome
 */
export function validateSearch(query) {
  const errors = [];

  if (query !== undefined && query !== null) {
    if (typeof query !== 'string') {
      errors.push({ field: 'search', message: 'Search query must be a string.' });
    } else if (query.length > validationSecurityConfig.MAX_SEARCH_LENGTH) {
      errors.push({
        field: 'search',
        message: `Search query exceeds maximum length of ${validationSecurityConfig.MAX_SEARCH_LENGTH} characters.`
      });
    }
  }

  return { errors };
}

/**
 * Validate array inputs.
 *
 * Supports options:
 * - maxArrayLength: override config limit
 * - allowDuplicates: policy ('allow', 'reject', or 'deduplicate')
 * - rejectEmpty: boolean
 *
 * @param {Array} arr - Target array
 * @param {Object} [options={}] - Options config
 * @returns {{ errors: Array<{field: string, message: string}>, sanitizedArray: Array }} Validation outcome
 */
export function validateArray(arr, options = {}) {
  const errors = [];
  const maxLimit = options.maxArrayLength || validationSecurityConfig.MAX_ARRAY_LENGTH;
  const duplicatePolicy = options.duplicatePolicy || 'allow'; // allow | reject | deduplicate
  const rejectEmpty = options.rejectEmpty !== false;

  let sanitizedArray = Array.isArray(arr) ? [...arr] : [];

  if (!Array.isArray(arr)) {
    errors.push({ field: 'array', message: 'Input must be an array.' });
    return { errors, sanitizedArray };
  }

  if (rejectEmpty && arr.length === 0) {
    errors.push({ field: 'array', message: 'Array must not be empty.' });
  }

  if (arr.length > maxLimit) {
    errors.push({ field: 'array', message: `Array exceeds maximum allowed size of ${maxLimit} elements.` });
  }

  // Check duplicates
  const hasDuplicates = new Set(arr).size !== arr.length;
  if (hasDuplicates) {
    if (duplicatePolicy === 'reject') {
      errors.push({ field: 'array', message: 'Array must not contain duplicate elements.' });
    } else if (duplicatePolicy === 'deduplicate') {
      sanitizedArray = [...new Set(arr)];
    }
  }

  return { errors, sanitizedArray };
}

/**
 * Validate value belongs to defined enum list.
 *
 * @param {*} val - Target value
 * @param {Array} allowedValues - Allowed members
 * @returns {boolean} True if member matches
 */
export function validateEnum(val, allowedValues) {
  return allowedValues.includes(val);
}

/**
 * Validate chronological date range.
 *
 * @param {string|Date} startDate - Start boundary date
 * @param {string|Date} endDate - End boundary date
 * @returns {{ errors: Array<{field: string, message: string}> }} Validation outcome
 */
export function validateDateRange(startDate, endDate) {
  const errors = [];

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (startDate && isNaN(start.getTime())) {
    errors.push({ field: 'startDate', message: 'Invalid start date format.' });
  }
  if (endDate && isNaN(end.getTime())) {
    errors.push({ field: 'endDate', message: 'Invalid end date format.' });
  }

  if (errors.length === 0 && startDate && endDate && start > end) {
    errors.push({ field: 'dateRange', message: 'Start date cannot be after end date.' });
  }

  return { errors };
}
