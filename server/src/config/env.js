/**
 * @fileoverview Centralized environment configuration.
 *
 * Loads environment variables from .env via dotenv and validates
 * that all required variables are present. Exports a frozen
 * configuration object used throughout the application.
 *
 * @module config/env
 */

import 'dotenv/config';

/**
 * List of environment variables that must be defined.
 * The server will refuse to start if any are missing.
 */
const REQUIRED_VARS = ['NODE_ENV', 'PORT'];

/**
 * Validate that all required environment variables are set.
 * Throws a descriptive error listing every missing variable.
 *
 * @throws {Error} If any required variables are missing
 */
const validateEnv = () => {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join('\n')}\n` +
      'Copy .env.example to .env and fill in the values.'
    );
  }
};

// Run validation immediately on import
validateEnv();

/**
 * Frozen application configuration derived from environment variables.
 *
 * @typedef {Object} Config
 * @property {string} nodeEnv    - Current environment (development | production | test)
 * @property {number} port       - Port the server listens on
 * @property {string} corsOrigin - Allowed CORS origin
 */
export const config = Object.freeze({
  nodeEnv: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10) || 5000,
  corsOrigin: process.env.CORS_ORIGIN || '*',
});
