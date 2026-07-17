/**
 * @fileoverview Centralized HTTP security configuration.
 *
 * Configures Helmet headers, CSP directives, HSTS, and custom Permissions-Policy.
 * All properties are environment-aware and support secure defaults with overrides.
 *
 * @module config/security.config
 */

import { config } from './env.js';

/**
 * Parses comma-separated values from environment variables into arrays.
 * Implements strict type checks and falls back to default values if input is invalid or empty.
 *
 * @param {string|undefined} envVar - Environment variable value
 * @param {Array<string>} defaultValue - Immutable default array
 * @returns {Array<string>} Validated array of directives
 */
function parseOverride(envVar, defaultValue) {
  if (!envVar || typeof envVar !== 'string') {
    return defaultValue;
  }

  const tokens = envVar
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  // Validate that the result is a non-empty array of strings
  const isValid =
    Array.isArray(tokens) &&
    tokens.length > 0 &&
    tokens.every((t) => typeof t === 'string' && t.length > 0);

  return isValid ? tokens : defaultValue;
}

// Immutable baseline defaults
const DEFAULT_CSP = Object.freeze({
  defaultSrc: Object.freeze(["'self'"]),
  scriptSrc: Object.freeze(["'self'"]),
  styleSrc: Object.freeze(["'self'", "'unsafe-inline'"]),
  imgSrc: Object.freeze(["'self'", "data:"]),
  connectSrc: Object.freeze(["'self'"]),
  fontSrc: Object.freeze(["'self'"]),
  objectSrc: Object.freeze(["'none'"]),
  frameAncestors: Object.freeze(["'none'"]),
  baseUri: Object.freeze(["'self'"]),
  formAction: Object.freeze(["'self'"]),
});

// Explicit ordered construction of the directives object keys
const directives = {};
directives.defaultSrc = parseOverride(process.env.CSP_DEFAULT_SRC, DEFAULT_CSP.defaultSrc);
directives.scriptSrc = parseOverride(process.env.CSP_SCRIPT_SRC, DEFAULT_CSP.scriptSrc);
directives.styleSrc = parseOverride(process.env.CSP_STYLE_SRC, DEFAULT_CSP.styleSrc);
directives.imgSrc = parseOverride(process.env.CSP_IMG_SRC, DEFAULT_CSP.imgSrc);
directives.connectSrc = parseOverride(process.env.CSP_CONNECT_SRC, DEFAULT_CSP.connectSrc);
directives.fontSrc = parseOverride(process.env.CSP_FONT_SRC, DEFAULT_CSP.fontSrc);
directives.objectSrc = parseOverride(process.env.CSP_OBJECT_SRC, DEFAULT_CSP.objectSrc);
directives.frameAncestors = parseOverride(process.env.CSP_FRAME_ANCESTORS, DEFAULT_CSP.frameAncestors);
directives.baseUri = parseOverride(process.env.CSP_BASE_URI, DEFAULT_CSP.baseUri);
directives.formAction = parseOverride(process.env.CSP_FORM_ACTION, DEFAULT_CSP.formAction);

if (config.nodeEnv === 'production') {
  directives.upgradeInsecureRequests = [];
}

export const securityConfig = Object.freeze({
  /** Helmet middleware configuration properties */
  helmetOptions: Object.freeze({
    contentSecurityPolicy: Object.freeze({
      directives: Object.freeze(directives),
    }),
    crossOriginEmbedderPolicy: config.nodeEnv === 'production',
    crossOriginOpenerPolicy: Object.freeze({ policy: 'same-origin' }),
    crossOriginResourcePolicy: Object.freeze({ policy: 'same-origin' }),
    dnsPrefetchControl: Object.freeze({ allow: false }),
    frameguard: Object.freeze({ action: 'deny' }),
    hidePoweredBy: true,
    hsts: config.nodeEnv === 'production' || process.env.ENABLE_HSTS === 'true'
      ? Object.freeze({ maxAge: 31536000, includeSubDomains: true, preload: true })
      : false,
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    referrerPolicy: Object.freeze({ policy: process.env.REFERRER_POLICY || 'strict-origin-when-cross-origin' }),
    xssFilter: false,
    permittedCrossDomainPolicies: Object.freeze({ policy: 'none' }),
  }),

  /** Custom permissions policy header string */
  permissionsPolicy: process.env.PERMISSIONS_POLICY || 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=()',

  /** Centralized CORS options */
  corsOptions: Object.freeze({
    origin: config.corsOrigin,
    credentials: true,
    maxAge: config.corsMaxAge,
  }),
});

/**
 * Custom Express middleware to set browser permissions policy headers.
 */
export function permissionsPolicyMiddleware(req, res, next) {
  res.setHeader('Permissions-Policy', securityConfig.permissionsPolicy);
  next();
}
