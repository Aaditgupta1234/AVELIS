/**
 * @fileoverview Centralized request body size limit configuration.
 *
 * Configures payload limits for incoming requests (JSON, URL Encoded, Text, Raw),
 * validates format size strings against standard body-parser specifications,
 * and exports recursively deep-frozen objects.
 *
 * @module config/request-limit.config
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
 * Validates request size limit format strings (e.g. '1mb', '100kb', '1024').
 * Matches standard bytes library and Express body-parser format rules:
 * - Must be a positive value (starts with integer > 0).
 * - Optionally followed by standard byte units (b, kb, mb, gb, tb).
 * - Rejects malformed values (e.g. 'abc', '-1mb', '0mb', empty strings).
 *
 * @param {string|undefined} envVal - Raw environment variable value
 * @param {string} defaultVal - Default fallback value
 * @param {string} name - Variable name for logs
 * @returns {string} Validated size limit string
 */
function parseRequestLimit(envVal, defaultVal, name) {
  if (envVal === undefined || envVal === null || envVal.trim() === '') {
    return defaultVal;
  }
  const trimmed = envVal.trim();
  const formatPattern = /^[1-9]\d*(?:\s*(?:b|kb|mb|gb|tb))?$/i;
  
  if (!formatPattern.test(trimmed)) {
    console.warn(`[REQUEST LIMIT CONFIG WARNING] Invalid size limit format for ${name}: "${envVal}". Applying fallback default value: ${defaultVal}.`);
    return defaultVal;
  }
  return trimmed;
}

const requestLimitRaw = {
  /** Maximum permitted JSON request body size */
  jsonLimit: parseRequestLimit(process.env.MAX_JSON_SIZE, '1mb', 'MAX_JSON_SIZE'),

  /** Maximum permitted URL encoded request body size */
  urlEncodedLimit: parseRequestLimit(process.env.MAX_URLENCODED_SIZE, '1mb', 'MAX_URLENCODED_SIZE'),

  /** Maximum permitted raw/binary request body size */
  rawLimit: parseRequestLimit(process.env.MAX_RAW_SIZE, '100kb', 'MAX_RAW_SIZE'),

  /** Maximum permitted text request body size */
  textLimit: parseRequestLimit(process.env.MAX_TEXT_SIZE, '100kb', 'MAX_TEXT_SIZE'),
};

export const requestLimitConfig = deepFreeze(requestLimitRaw);
export default requestLimitConfig;
