/**
 * @fileoverview Configuration barrel file.
 *
 * Re-exports all configuration modules for clean, centralized imports.
 *
 * @module config
 *
 * @example
 * import { config, logger } from './config/index.js';
 */

export { config } from './env.js';
export { logger } from './logger.js';
export { securityConfig, permissionsPolicyMiddleware } from './security.config.js';
