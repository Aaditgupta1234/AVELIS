/**
 * @fileoverview User role constants.
 *
 * Defines all available user roles in the AVELIS system.
 * Used for role-based access control throughout the application.
 *
 * @module constants/roles
 */

/**
 * Available user roles.
 *
 * @readonly
 * @enum {string}
 */
export const ROLES = Object.freeze({
  ADMIN: 'admin',
  LIBRARIAN: 'librarian',
  MEMBER: 'member',
});

/**
 * Array of all valid role values.
 * Useful for validation and Mongoose enum definitions.
 *
 * @type {string[]}
 */
export const ROLE_VALUES = Object.freeze(Object.values(ROLES));
