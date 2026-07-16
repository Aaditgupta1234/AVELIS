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
export { authSecurityConfig } from './auth.security.config.js';
export { authorizationConfig, ROLES } from './authorization.config.js';
export { validationSecurityConfig } from './validation.security.config.js';
export { rateLimitConfig } from './rate-limit.config.js';
export { requestLimitConfig } from './request-limit.config.js';
