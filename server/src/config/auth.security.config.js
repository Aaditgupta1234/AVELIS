/**
 * @fileoverview Centralized authentication security configuration.
 *
 * Configures JWT verification options, algorithm allow-lists, clock skew tolerance,
 * and handles environment-variable overrides with deep-freeze immutability.
 *
 * @module config/auth.security.config
 */

import { config } from './env.js';

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
 * Parses comma-separated values from environment variables into arrays.
 *
 * @param {string|undefined} envVar - Environment variable value
 * @param {Array<string>} defaultValue - Default value
 * @returns {Array<string>} Parsed array
 */
function parseOverride(envVar, defaultValue) {
  if (!envVar || typeof envVar !== 'string') {
    return defaultValue;
  }
  const tokens = envVar
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  return tokens.length > 0 ? tokens : defaultValue;
}

// Baseline defaults
const DEFAULT_AUTH = Object.freeze({
  jwtAlgorithms: Object.freeze(['HS256']),
  jwtClockTolerance: 0,
  jwtMaxAge: null,
});

let jwtAlgorithms = DEFAULT_AUTH.jwtAlgorithms;
if (process.env.JWT_ALGORITHMS !== undefined) {
  const parsed = process.env.JWT_ALGORITHMS
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  if (parsed.length === 0) {
    throw new Error('JWT_ALGORITHMS configuration cannot be empty.');
  }
  jwtAlgorithms = parsed;
}

// Asserts all configured algorithms belong to the supported allow-list
const SUPPORTED_ALGORITHMS = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512'];

for (const algo of jwtAlgorithms) {
  if (!SUPPORTED_ALGORITHMS.includes(algo)) {
    throw new Error(`Unsupported JWT algorithm configured: "${algo}". Supported allow-list: ${SUPPORTED_ALGORITHMS.join(', ')}`);
  }
}

// Clock skew tolerance parsing and validation
let clockTolerance = DEFAULT_AUTH.jwtClockTolerance;
if (process.env.JWT_CLOCK_TOLERANCE) {
  const parsed = Number(process.env.JWT_CLOCK_TOLERANCE);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error('JWT_CLOCK_TOLERANCE must be a non-negative integer.');
  }
  clockTolerance = parsed;
  if (clockTolerance > 300) {
    console.warn(`[SECURITY WARNING] JWT_CLOCK_TOLERANCE is set to ${clockTolerance} seconds. A value under 300 seconds (5 minutes) is highly recommended for production security.`);
  }
}

const rawConfig = {
  /** JWT secret key used for signing and verification */
  jwtSecret: config.jwtSecret,

  /** Access token expiration duration string */
  jwtExpiresIn: config.jwtExpiresIn,

  /** Allow-listed signature verification algorithms */
  jwtAlgorithms,

  /** Clock tolerance in seconds to allow for network time differences */
  jwtClockTolerance: clockTolerance,

  /** Optional token max age limit (in seconds or ms string) */
  jwtMaxAge: process.env.JWT_MAX_AGE || null,

  /** Expected token issuer (optional, validated only when configured) */
  jwtIssuer: process.env.JWT_ISSUER || null,

  /** Expected token audience (optional, validated only when configured) */
  jwtAudience: process.env.JWT_AUDIENCE || null,
};

export const authSecurityConfig = deepFreeze(rawConfig);
export default authSecurityConfig;
