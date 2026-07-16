/**
 * @fileoverview Authorization security decision helpers.
 *
 * Provides reusable functions to evaluate user role hierarchy and resource ownership constraints.
 * Does not mutate any request or input context.
 *
 * @module utils/authorization
 */

import { authorizationConfig } from '../config/index.js';

/**
 * Resolve the numerical hierarchy level for a given role.
 *
 * @param {string} role - Role name
 * @returns {number} Role hierarchy level (0 if role unknown)
 */
export function resolveRoleLevel(role) {
  return authorizationConfig.roleHierarchy[role] || 0;
}

/**
 * Check if the user has the specified exact role.
 *
 * @param {Object} user - Authenticated user details
 * @param {string} role - Target role
 * @returns {boolean} True if matches exactly
 */
export function hasRole(user, role) {
  return !!(user && user.role === role);
}

/**
 * Check if the user's role is in the allowed roles list.
 *
 * @param {Object} user - Authenticated user details
 * @param {Array<string>} roles - Allowed roles list
 * @returns {boolean} True if user role is in the list
 */
export function hasAnyRole(user, roles) {
  return !!(user && roles.includes(user.role));
}

/**
 * Check if the user has the minimum required role based on hierarchy.
 *
 * @param {Object} user - Authenticated user details
 * @param {string} minRole - Minimum required role
 * @returns {boolean} True if user's role level >= minRole level
 */
export function hasMinimumRole(user, minRole) {
  if (!user || !user.role) return false;
  return resolveRoleLevel(user.role) >= resolveRoleLevel(minRole);
}

/**
 * Check if the user is an Administrator (or higher).
 *
 * @param {Object} user - Authenticated user details
 * @returns {boolean} True if user has Admin (or higher) level
 */
export function isAdmin(user) {
  return hasMinimumRole(user, authorizationConfig.roles.ADMIN);
}

/**
 * Check if the authenticated user is the owner of the resource.
 *
 * @param {Object} user - Authenticated user details
 * @param {string} resourceOwnerId - Resource owner user ID
 * @returns {boolean} True if user ID matches resource owner ID
 */
export function isOwner(user, resourceOwnerId) {
  return !!(user && user.id === resourceOwnerId);
}

/**
 * Determine if the user is authorized to access a specific member-owned resource.
 *
 * Semantics:
 * - Admin (or higher) → Always allowed
 * - Owner (user ID matches resource owner ID) → Allowed
 * - Everyone else → Denied
 *
 * @param {Object} user - Authenticated user details
 * @param {string} resourceOwnerId - Resource owner user ID
 * @returns {boolean} True if authorized
 */
export function canAccessResource(user, resourceOwnerId) {
  return isAdmin(user) || isOwner(user, resourceOwnerId);
}
