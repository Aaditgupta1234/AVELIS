/**
 * @fileoverview Lightweight application logger.
 *
 * Provides a simple, structured logging interface with timestamped
 * output. Designed as a drop-in placeholder that can be replaced
 * by Winston, Pino, or any other logging library later.
 *
 * @module config/logger
 */

/**
 * Log level definitions with numeric priority and console method mapping.
 */
const LOG_LEVELS = {
  error: { priority: 0, method: 'error', label: 'ERROR' },
  warn:  { priority: 1, method: 'warn',  label: 'WARN ' },
  info:  { priority: 2, method: 'info',  label: 'INFO ' },
  debug: { priority: 3, method: 'log',   label: 'DEBUG' },
};

/**
 * Format a log message with an ISO timestamp and level label.
 *
 * @param {string} level - The log level label
 * @param {string} message - The log message
 * @returns {string} Formatted log string
 */
const formatMessage = (level, message) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}`;
};

/**
 * Logger instance exposing info, warn, error, and debug methods.
 *
 * @example
 * import { logger } from './config/logger.js';
 * logger.info('Server started on port 5000');
 * logger.error('Database connection failed', error);
 */
export const logger = {
  /**
   * Log an informational message.
   * @param {string} message
   * @param  {...any} args - Additional arguments passed to console
   */
  info(message, ...args) {
    console.info(formatMessage(LOG_LEVELS.info.label, message), ...args);
  },

  /**
   * Log a warning message.
   * @param {string} message
   * @param  {...any} args
   */
  warn(message, ...args) {
    console.warn(formatMessage(LOG_LEVELS.warn.label, message), ...args);
  },

  /**
   * Log an error message.
   * @param {string} message
   * @param  {...any} args
   */
  error(message, ...args) {
    console.error(formatMessage(LOG_LEVELS.error.label, message), ...args);
  },

  /**
   * Log a debug message. Only useful during development.
   * @param {string} message
   * @param  {...any} args
   */
  debug(message, ...args) {
    console.log(formatMessage(LOG_LEVELS.debug.label, message), ...args);
  },
};
