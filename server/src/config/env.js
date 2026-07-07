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
const REQUIRED_VARS = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'CLIENT_URL',
];

/**
 * Validate that all required environment variables are set.
 * Throws a descriptive error listing every missing variable.
 *
 * @throws {Error} If any required variables are missing or invalid
 */
const validateEnv = () => {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join('\n')}\n` +
      'Copy .env.example to .env and fill in the values.'
    );
  }

  // Validate JWT_SECRET length (must be at least 32 characters)
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters long for security purposes.'
    );
  }
};

// Run validation immediately on import
validateEnv();

/**
 * Frozen application configuration derived from environment variables.
 *
 * @typedef {Object} Config
 * @property {string} nodeEnv       - Current environment (development | production | test)
 * @property {number} port          - Port the server listens on
 * @property {string} databaseUrl   - Database connection string
 * @property {string} jwtSecret     - Secret key for JWT signing
 * @property {string} jwtExpiresIn  - JWT expiration duration
 * @property {string} clientUrl     - Frontend client URL
 * @property {string} corsOrigin    - Allowed CORS origin (maps to clientUrl)
 */
export const config = Object.freeze({
  nodeEnv: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10) || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL,
  corsOrigin: process.env.CLIENT_URL || process.env.CORS_ORIGIN || '*',
  
  // Logging settings
  loggingLevel: process.env.LOGGING_LEVEL || 'info',

  // Password hashing settings
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,

  // Business logic rules settings
  maxActiveReservations: parseInt(process.env.MAX_ACTIVE_RESERVATIONS, 10) || 3,
  reservationPickupWindowHours: parseInt(process.env.RESERVATION_PICKUP_WINDOW_HOURS, 10) || 48,
  loanDurationDays: parseInt(process.env.LOAN_DURATION_DAYS, 10) || 14,
  renewalLimit: parseInt(process.env.RENEWAL_LIMIT, 10) || 2,

  // Pagination settings
  defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE, 10) || 10,
  maxPageSize: parseInt(process.env.MAX_PAGE_SIZE, 10) || 100,
});
