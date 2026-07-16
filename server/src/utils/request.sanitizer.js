/**
 * @fileoverview Request input sanitization utilities.
 *
 * Provides pure non-mutating helpers to trim strings, normalize Unicode formats,
 * strip control characters, and prevent prototype pollution recursively.
 *
 * @module utils/request.sanitizer
 */

/**
 * Strips non-printable ASCII control characters while preserving standard whitespace
 * characters such as newline, carriage return, and tab.
 *
 * @param {string} str - Input string
 * @returns {string} Sanitized string
 */
function removeControlCharacters(str) {
  // Preserve \n (10), \r (13), \t (9). Remove other control characters in range 0-31 and 127.
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Sanitizes a string using String.prototype.normalize('NFC'), trimming leading/trailing spaces,
 * and filtering non-printable control characters.
 *
 * @param {*} val - Target input value
 * @returns {*} Sanitized string or original input if not string
 */
export function sanitizeString(val) {
  if (typeof val !== 'string') {
    return val;
  }
  const cleanStr = removeControlCharacters(val);
  return cleanStr.normalize('NFC').trim();
}

/**
 * Sanitizes a search string in a deterministic sequence:
 * 1. Remove invalid control characters.
 * 2. Trim leading/trailing whitespace.
 * 3. Collapse consecutive whitespace into a single space.
 * 4. Apply Unicode NFC normalization.
 *
 * @param {*} val - Target query input
 * @returns {*} Sanitized search query
 */
export function sanitizeSearchString(val) {
  if (typeof val !== 'string') {
    return val;
  }
  let str = removeControlCharacters(val);
  str = str.trim();
  str = str.replace(/\s+/g, ' ');
  return str.normalize('NFC');
}

/**
 * Normalizes email format case-insensitively and trims spaces.
 *
 * @param {*} email - Input email
 * @returns {*} Normalized email or input if not string
 */
export function normalizeEmail(email) {
  if (typeof email !== 'string') {
    return email;
  }
  const trimmed = email.trim();
  const parts = trimmed.split('@');
  if (parts.length === 2) {
    // Lowercase domain part and local part case-insensitively for security compatibility
    return `${parts[0].toLowerCase()}@${parts[1].toLowerCase()}`;
  }
  return trimmed.toLowerCase();
}

/**
 * Normalizes username format case-insensitively and trims spaces.
 *
 * @param {*} username - Input username
 * @returns {*} Normalized username
 */
export function normalizeUsername(username) {
  if (typeof username !== 'string') {
    return username;
  }
  return username.trim().toLowerCase();
}

/**
 * Recursively deep clones and sanitizes object attributes, ignoring prototype pollution keys,
 * and protecting against circular references.
 *
 * Applies to plain objects, nested objects, and arrays.
 *
 * @param {*} obj - Target input object
 * @param {WeakSet} [seen=new WeakSet()] - Set tracker for circular reference detection
 * @returns {*} Cloned and sanitized output
 */
export function sanitizeObject(obj, seen = new WeakSet()) {
  if (obj === null || typeof obj !== 'object') {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    return obj;
  }

  // Handle Buffer, Date, Regexp to preserve original data types without stringifying/cloning them
  if (Buffer.isBuffer(obj) || obj instanceof Date || obj instanceof RegExp) {
    return obj;
  }

  if (seen.has(obj)) {
    return obj; // Circular reference detected: return the reference to prevent crash
  }
  seen.add(obj);

  if (Array.isArray(obj)) {
    const clone = [];
    seen.add(clone);
    for (let i = 0; i < obj.length; i++) {
      clone.push(sanitizeObject(obj[i], seen));
    }
    return clone;
  }

  const clone = {};
  seen.add(clone);

  const keys = Reflect.ownKeys(obj);
  for (const key of keys) {
    // Strip keys that could cause prototype pollution recursively
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }

    const val = obj[key];
    clone[key] = sanitizeObject(val, seen);
  }

  return clone;
}

/**
 * Recursively trims whitespace from object attributes without modifying other characters.
 *
 * @param {*} obj - Input object
 * @param {WeakSet} [seen=new WeakSet()] - Circular reference tracking set
 * @returns {*} Trimmed clone
 */
export function trimObject(obj, seen = new WeakSet()) {
  if (obj === null || typeof obj !== 'object') {
    if (typeof obj === 'string') {
      return obj.trim();
    }
    return obj;
  }

  if (Buffer.isBuffer(obj) || obj instanceof Date || obj instanceof RegExp) {
    return obj;
  }

  if (seen.has(obj)) {
    return obj;
  }
  seen.add(obj);

  if (Array.isArray(obj)) {
    const clone = [];
    seen.add(clone);
    for (let i = 0; i < obj.length; i++) {
      clone.push(trimObject(obj[i], seen));
    }
    return clone;
  }

  const clone = {};
  seen.add(clone);

  const keys = Reflect.ownKeys(obj);
  for (const key of keys) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    clone[key] = trimObject(obj[key], seen);
  }

  return clone;
}
