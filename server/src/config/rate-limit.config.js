/**
 * @fileoverview Centralized rate limiting configuration.
 *
 * Configures default and maximum rate-limiting parameters, parses environment variables
 * with secure fallback defaults, and exports recursively deep-frozen objects.
 *
 * @module config/rate-limit.config
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
 * Helper to parse a positive integer for rate limiting parameters.
 * Falls back to secure defaults if missing, malformed, non-integer, <= 0, NaN, or Infinity.
 *
 * @param {string|undefined} envVal - Raw environment variable value
 * @param {number} defaultVal - Default value fallback
 * @param {string} name - Variable name for warnings
 * @returns {number} Validated positive integer
 */
function parseRateLimitInteger(envVal, defaultVal, name) {
  if (envVal === undefined || envVal === null || envVal.trim() === '') {
    return defaultVal;
  }
  const trimmed = envVal.trim();
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 1 || !Number.isFinite(parsed)) {
    console.warn(`[RATE LIMIT CONFIG WARNING] Invalid value for ${name}: "${envVal}". Applying fallback default value: ${defaultVal}.`);
    return defaultVal;
  }
  return parsed;
}

/**
 * Helper to parse a boolean configuration parameter.
 *
 * @param {string|undefined} envVal - Raw environment variable value
 * @param {boolean} defaultVal - Default value fallback
 * @param {string} name - Variable name for warnings
 * @returns {boolean} Parsed boolean value
 */
function parseBoolean(envVal, defaultVal, name) {
  if (envVal === undefined || envVal === null || envVal.trim() === '') {
    return defaultVal;
  }
  const normalized = envVal.trim().toLowerCase();
  if (normalized === 'true') {
    return true;
  }
  if (normalized === 'false') {
    return false;
  }
  console.warn(`[RATE LIMIT CONFIG WARNING] Invalid boolean value for ${name}: "${envVal}". Applying fallback default value: ${defaultVal}.`);
  return defaultVal;
}

/**
 * Helper to parse Express trust proxy configuration parameter.
 * Supports:
 * - case-insensitive 'true' / 'false' => boolean
 * - positive integer string => number (hop count)
 * - Express reserved keywords: 'loopback', 'linklocal', 'uniquelocal' => string
 * - comma-separated list of IP addresses/subnets => string
 *
 * @param {string|undefined} envVal - Raw environment variable value
 * @param {*} defaultVal - Default value fallback
 * @returns {*} Validated trust proxy configuration
 */
function parseTrustProxy(envVal, defaultVal) {
  if (envVal === undefined || envVal === null || envVal.trim() === '') {
    return defaultVal;
  }
  const trimmed = envVal.trim();
  const lower = trimmed.toLowerCase();

  // Boolean match
  if (lower === 'true') return true;
  if (lower === 'false') return false;

  // Hop count check (integer >= 1)
  const parsedInt = Number(trimmed);
  if (Number.isInteger(parsedInt) && parsedInt >= 1 && Number.isFinite(parsedInt)) {
    return parsedInt;
  }

  // Express reserved string keywords
  if (['loopback', 'linklocal', 'uniquelocal'].includes(lower)) {
    return lower;
  }

  // Comma-separated list of IP addresses / subnets (basic pattern check)
  const ipListPattern = /^[a-fA-F0-9.:/,\s-]+$/;
  if (ipListPattern.test(trimmed)) {
    return trimmed;
  }

  console.warn(`[RATE LIMIT CONFIG WARNING] Invalid value for TRUST_PROXY: "${envVal}". Applying fallback: false.`);
  return false;
}

// 15 minutes in ms
const FIFTEEN_MINS_MS = 15 * 60 * 1000;
// 1 minute in ms
const ONE_MIN_MS = 60 * 1000;
// 1 hour in ms
const ONE_HOUR_MS = 60 * 60 * 1000;

const defaultMessage = 'Too many requests from this IP, please try again later.';

const rateLimitRaw = {
  /** Global API Limiter Configuration */
  globalLimiterConfig: {
    windowMs: parseRateLimitInteger(process.env.GLOBAL_WINDOW_MS, FIFTEEN_MINS_MS, 'GLOBAL_WINDOW_MS'),
    max: parseRateLimitInteger(process.env.GLOBAL_RATE_LIMIT, 100, 'GLOBAL_RATE_LIMIT'),
    standardHeaders: true,
    legacyHeaders: false,
    message: defaultMessage,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  /** Global API Slowdown Configuration */
  globalSlowdownConfig: {
    windowMs: parseRateLimitInteger(process.env.GLOBAL_WINDOW_MS, FIFTEEN_MINS_MS, 'GLOBAL_WINDOW_MS'),
    delayAfter: parseRateLimitInteger(process.env.GLOBAL_DELAY_AFTER, 50, 'GLOBAL_DELAY_AFTER'),
    delayMs: parseRateLimitInteger(process.env.GLOBAL_DELAY_MS, 500, 'GLOBAL_DELAY_MS'),
    maxDelayMs: parseRateLimitInteger(process.env.GLOBAL_MAX_DELAY_MS, 2000, 'GLOBAL_MAX_DELAY_MS'),
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  /** Authentication Endpoint Limiter Configuration */
  authLimiterConfig: {
    windowMs: parseRateLimitInteger(process.env.AUTH_WINDOW_MS, FIFTEEN_MINS_MS, 'AUTH_WINDOW_MS'),
    max: parseRateLimitInteger(process.env.AUTH_RATE_LIMIT, 10, 'AUTH_RATE_LIMIT'),
    standardHeaders: true,
    legacyHeaders: false,
    message: defaultMessage,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  /** Authentication Endpoint Slowdown Configuration */
  authSlowdownConfig: {
    windowMs: parseRateLimitInteger(process.env.AUTH_WINDOW_MS, FIFTEEN_MINS_MS, 'AUTH_WINDOW_MS'),
    delayAfter: parseRateLimitInteger(process.env.AUTH_DELAY_AFTER, 5, 'AUTH_DELAY_AFTER'),
    delayMs: parseRateLimitInteger(process.env.AUTH_DELAY_MS, 1000, 'AUTH_DELAY_MS'),
    maxDelayMs: parseRateLimitInteger(process.env.AUTH_MAX_DELAY_MS, 5000, 'AUTH_MAX_DELAY_MS'),
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  /** Search Endpoint Limiter Configuration */
  searchLimiterConfig: {
    windowMs: parseRateLimitInteger(process.env.SEARCH_WINDOW_MS, ONE_MIN_MS, 'SEARCH_WINDOW_MS'),
    max: parseRateLimitInteger(process.env.SEARCH_RATE_LIMIT, 30, 'SEARCH_RATE_LIMIT'),
    standardHeaders: true,
    legacyHeaders: false,
    message: defaultMessage,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  /** Search Endpoint Slowdown Configuration */
  searchSlowdownConfig: {
    windowMs: parseRateLimitInteger(process.env.SEARCH_WINDOW_MS, ONE_MIN_MS, 'SEARCH_WINDOW_MS'),
    delayAfter: parseRateLimitInteger(process.env.SEARCH_DELAY_AFTER, 15, 'SEARCH_DELAY_AFTER'),
    delayMs: parseRateLimitInteger(process.env.SEARCH_DELAY_MS, 200, 'SEARCH_DELAY_MS'),
    maxDelayMs: parseRateLimitInteger(process.env.SEARCH_MAX_DELAY_MS, 2000, 'SEARCH_MAX_DELAY_MS'),
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  /** Report Endpoint Limiter Configuration */
  reportLimiterConfig: {
    windowMs: parseRateLimitInteger(process.env.REPORT_WINDOW_MS, FIFTEEN_MINS_MS, 'REPORT_WINDOW_MS'),
    max: parseRateLimitInteger(process.env.REPORT_RATE_LIMIT, 20, 'REPORT_RATE_LIMIT'),
    standardHeaders: true,
    legacyHeaders: false,
    message: defaultMessage,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  /** Report Endpoint Slowdown Configuration */
  reportSlowdownConfig: {
    windowMs: parseRateLimitInteger(process.env.REPORT_WINDOW_MS, FIFTEEN_MINS_MS, 'REPORT_WINDOW_MS'),
    delayAfter: parseRateLimitInteger(process.env.REPORT_DELAY_AFTER, 10, 'REPORT_DELAY_AFTER'),
    delayMs: parseRateLimitInteger(process.env.REPORT_DELAY_MS, 500, 'REPORT_DELAY_MS'),
    maxDelayMs: parseRateLimitInteger(process.env.REPORT_MAX_DELAY_MS, 3000, 'REPORT_MAX_DELAY_MS'),
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  /** Export Endpoint Limiter Configuration */
  exportLimiterConfig: {
    windowMs: parseRateLimitInteger(process.env.EXPORT_WINDOW_MS, ONE_HOUR_MS, 'EXPORT_WINDOW_MS'),
    max: parseRateLimitInteger(process.env.EXPORT_RATE_LIMIT, 5, 'EXPORT_RATE_LIMIT'),
    standardHeaders: true,
    legacyHeaders: false,
    message: defaultMessage,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  /** Export Endpoint Slowdown Configuration */
  exportSlowdownConfig: {
    windowMs: parseRateLimitInteger(process.env.EXPORT_WINDOW_MS, ONE_HOUR_MS, 'EXPORT_WINDOW_MS'),
    delayAfter: parseRateLimitInteger(process.env.EXPORT_DELAY_AFTER, 2, 'EXPORT_DELAY_AFTER'),
    delayMs: parseRateLimitInteger(process.env.EXPORT_DELAY_MS, 2000, 'EXPORT_DELAY_MS'),
    maxDelayMs: parseRateLimitInteger(process.env.EXPORT_MAX_DELAY_MS, 10000, 'EXPORT_MAX_DELAY_MS'),
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  /** Enable request slowdown for protection */
  ENABLE_SLOWDOWN: parseBoolean(process.env.ENABLE_SLOWDOWN, true, 'ENABLE_SLOWDOWN'),

  /** Express Trust Proxy configuration */
  TRUST_PROXY: parseTrustProxy(process.env.TRUST_PROXY, false),
};

export const rateLimitConfig = deepFreeze(rateLimitRaw);
export default rateLimitConfig;
