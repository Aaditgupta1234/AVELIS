/**
 * @fileoverview Centralized security logging utility.
 *
 * Provides a structured JSON logging format for security-critical events,
 * integrates with the standard logger, and enforces automatic recursive redaction.
 *
 * @module utils/securityLogger
 */

import { logger } from '../config/logger.js';

/**
 * Standard security event types.
 * @type {Readonly<Object>}
 */
export const EVENT_TYPES = Object.freeze({
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILURE: 'AUTH_FAILURE',
  AUTHZ_FAILURE: 'AUTHZ_FAILURE',
  JWT_FAILURE: 'JWT_FAILURE',
  VALIDATION_FAILURE: 'VALIDATION_FAILURE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SLOWDOWN_THROTTLED: 'SLOWDOWN_THROTTLED',
  SUSPICIOUS_REQUEST: 'SUSPICIOUS_REQUEST',
  SECURITY_EXCEPTION: 'SECURITY_EXCEPTION',
});

/**
 * Severity levels.
 * @type {Readonly<Object>}
 */
export const SEVERITIES = Object.freeze({
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL',
});

/**
 * Configurable list of sensitive keys to redact from logs.
 * @type {ReadonlySet<string>}
 */
export const SENSITIVE_KEYS = new Set([
  'password', 'passwordconfirm', 'password_confirm', 'confirmpassword',
  'token', 'refreshtoken', 'refresh_token', 'jwt',
  'authorization', 'cookie', 'apikey', 'api_key', 'secret',
  'database_url', 'jwt_secret', 'otp'
]);

/**
 * Recursively redacts sensitive fields in any object or array.
 *
 * @param {*} data - Raw data to sanitize
 * @returns {*} Sanitized data
 */
export function redactSensitiveData(data) {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item));
  }

  const redacted = {};
  for (const [key, value] of Object.entries(data)) {
    const keyLower = key.toLowerCase();
    if (SENSITIVE_KEYS.has(keyLower)) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      redacted[key] = redactSensitiveData(value);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

/**
 * Core logging function that formats and writes the structured JSON string.
 *
 * @param {string} eventType - The security event type
 * @param {string} severity - Severity level (INFO, WARN, ERROR, CRITICAL)
 * @param {import('express').Request} req - Express request
 * @param {string} message - Descriptive message
 * @param {Object} [metadata={}] - Additional metadata fields
 */
function logEvent(eventType, severity, req, message, metadata = {}) {
  const logObj = {
    timestamp: new Date().toISOString(),
    eventType,
    severity,
    route: req?.originalUrl || req?.url || 'N/A',
    method: req?.method || 'N/A',
    clientIp: req?.ip || req?.socket?.remoteAddress || 'N/A',
    userId: req?.user?.id || metadata?.userId || null,
    requestId: req?.requestId || req?.correlationId || null,
    message,
    metadata: redactSensitiveData(metadata)
  };

  const logStr = JSON.stringify(logObj);

  switch (severity) {
    case SEVERITIES.CRITICAL:
    case SEVERITIES.ERROR:
      logger.error(logStr);
      break;
    case SEVERITIES.WARN:
      logger.warn(logStr);
      break;
    case SEVERITIES.INFO:
    default:
      logger.info(logStr);
      break;
  }
}

/**
 * Centralized methods for logging specific security events.
 */
export const securityLogger = {
  logAuthenticationSuccess(req, metadata = {}) {
    logEvent(EVENT_TYPES.AUTH_SUCCESS, SEVERITIES.INFO, req, 'Authentication successful', metadata);
  },

  logAuthenticationFailure(req, reason, metadata = {}) {
    logEvent(EVENT_TYPES.AUTH_FAILURE, SEVERITIES.WARN, req, `Authentication failed: ${reason}`, metadata);
  },

  logAuthorizationFailure(req, reason, metadata = {}) {
    logEvent(EVENT_TYPES.AUTHZ_FAILURE, SEVERITIES.ERROR, req, `Authorization failed: ${reason}`, metadata);
  },

  logJwtFailure(req, reason, metadata = {}) {
    logEvent(EVENT_TYPES.JWT_FAILURE, SEVERITIES.WARN, req, `JWT verification failed: ${reason}`, metadata);
  },

  logValidationFailure(req, errors = [], metadata = {}) {
    logEvent(EVENT_TYPES.VALIDATION_FAILURE, SEVERITIES.WARN, req, 'Request payload validation failed', { ...metadata, errors });
  },

  logRateLimitExceeded(req, metadata = {}) {
    logEvent(EVENT_TYPES.RATE_LIMIT_EXCEEDED, SEVERITIES.WARN, req, 'IP rate limit exceeded', metadata);
  },

  logSlowdownThrottling(req, delayInfo = {}, metadata = {}) {
    logEvent(EVENT_TYPES.SLOWDOWN_THROTTLED, SEVERITIES.WARN, req, `Request slowed down by ${delayInfo.delay}ms`, { ...metadata, ...delayInfo });
  },

  logSuspiciousRequest(req, reason, metadata = {}) {
    logEvent(EVENT_TYPES.SUSPICIOUS_REQUEST, SEVERITIES.ERROR, req, `Suspicious request detected: ${reason}`, metadata);
  },

  logSecurityException(req, error, metadata = {}) {
    const errMessage = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : undefined;
    logEvent(EVENT_TYPES.SECURITY_EXCEPTION, SEVERITIES.CRITICAL, req, `Security exception: ${errMessage}`, { ...metadata, stack: errStack });
  }
};

export default securityLogger;
