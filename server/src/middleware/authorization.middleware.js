/**
 * @fileoverview Centralized HTTP authorization middleware.
 *
 * Provides Express request handlers to enforce hierarchical role levels
 * and exact role matching with standardized client-facing error responses.
 *
 * @module middleware/authorization.middleware
 */

import { ApiError } from '../utils/index.js';
import { hasRole, hasAnyRole, hasMinimumRole } from '../utils/index.js';

/**
 * Restrict request access to users matching the minimum required role (hierarchical check).
 *
 * @param {string} minRole - Minimum required role
 * @returns {import('express').RequestHandler} Express request handler
 */
export function requireRole(minRole) {
  return (req, res, next) => {
    if (!req.user || !hasMinimumRole(req.user, minRole)) {
      return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }
    next();
  };
}

/**
 * Restrict request access to users matching the exact role.
 *
 * @param {string} role - Exact target role
 * @returns {import('express').RequestHandler} Express request handler
 */
export function requireExactRole(role) {
  return (req, res, next) => {
    if (!req.user || !hasRole(req.user, role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }
    next();
  };
}

/**
 * Restrict request access to users matching any of the specified roles.
 *
 * @param {...string} roles - List of allowed roles
 * @returns {import('express').RequestHandler} Express request handler
 */
export function requireAnyRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !hasAnyRole(req.user, roles)) {
      return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }
    next();
  };
}
