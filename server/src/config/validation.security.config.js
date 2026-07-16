/**
 * @fileoverview Centralized request validation security configuration.
 *
 * Configures default and maximum parameter constraints (e.g. pagination,
 * string lengths, search lengths, array sizes), parses environment variables
 * with secure fallback defaults, and exports recursively deep-frozen objects.
 *
 * @module config/validation.security.config
 */

/**
 * Recursively deep-freezes an object.
 *
 * @param {Object} object - Object to freeze
 * @returns {Object} The frozen object
 */
function deepFreeze(object) {
  const propNames = Reflect.ownKeys(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && (typeof value === 'object' || typeof value === 'function')) {
      deepFreeze(value);
    }
  }
  return Object.freeze(object);
}

/**
 * Helper to parse a positive integer from environment variables.
 * Falls back to secure defaults if missing, malformed, non-integer, or out of bounds.
 *
 * @param {string|undefined} envVal - Raw environment variable value
 * @param {number} defaultVal - Default value fallback
 * @param {number} [min=1] - Minimum boundary constraint
 * @param {number} [max=Infinity] - Maximum boundary constraint
 * @param {string} name - Variable name for logs
 * @returns {number} Validated configuration integer
 */
function parseConfigInteger(envVal, defaultVal, min = 1, max = Infinity, name) {
  if (envVal === undefined || envVal === null || envVal.trim() === '') {
    return defaultVal;
  }
  const parsed = Number(envVal);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    console.warn(`[VALIDATION CONFIG WARNING] Invalid value for ${name}: "${envVal}". Applying fallback default value: ${defaultVal}.`);
    return defaultVal;
  }
  return parsed;
}

// Baseline defaults
const DEFAULTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  MAX_SEARCH_LENGTH: 100,
  MAX_ARRAY_LENGTH: 100,
  MAX_STRING_LENGTH: 1000,
};

const rawConfig = {
  /** Default request page offset */
  DEFAULT_PAGE: parseConfigInteger(
    process.env.DEFAULT_PAGE,
    DEFAULTS.DEFAULT_PAGE,
    1,
    Infinity,
    'DEFAULT_PAGE'
  ),

  /** Default request limit quantity */
  DEFAULT_LIMIT: parseConfigInteger(
    process.env.DEFAULT_LIMIT,
    DEFAULTS.DEFAULT_LIMIT,
    1,
    Infinity,
    'DEFAULT_LIMIT'
  ),

  /** Maximum allowed request page size limit */
  MAX_LIMIT: parseConfigInteger(
    process.env.MAX_LIMIT,
    DEFAULTS.MAX_LIMIT,
    1,
    1000,
    'MAX_LIMIT'
  ),

  /** Maximum permitted search query string length */
  MAX_SEARCH_LENGTH: parseConfigInteger(
    process.env.MAX_SEARCH_LENGTH,
    DEFAULTS.MAX_SEARCH_LENGTH,
    1,
    1000,
    'MAX_SEARCH_LENGTH'
  ),

  /** Maximum permitted request body array size limit */
  MAX_ARRAY_LENGTH: parseConfigInteger(
    process.env.MAX_ARRAY_LENGTH,
    DEFAULTS.MAX_ARRAY_LENGTH,
    1,
    10000,
    'MAX_ARRAY_LENGTH'
  ),

  /** Maximum permitted general string input length */
  MAX_STRING_LENGTH: parseConfigInteger(
    process.env.MAX_STRING_LENGTH,
    DEFAULTS.MAX_STRING_LENGTH,
    1,
    100000,
    'MAX_STRING_LENGTH'
  ),

  /** Centralized RFC4122-compliant UUID validation pattern */
  UUID_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,

  /** Allowed sorting directions */
  ALLOWED_DIRECTIONS: ['asc', 'desc'],

  /** Default sort order direction */
  DEFAULT_DIRECTION: 'desc',
};

export const validationSecurityConfig = deepFreeze(rawConfig);
export default validationSecurityConfig;
