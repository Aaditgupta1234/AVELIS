/**
 * @fileoverview Centralized authorization configuration.
 *
 * Defines default roles, hierarchical permissions levels, and exports
 * recursively deep-frozen objects to guarantee runtime immutability.
 *
 * @module config/authorization.config
 */

/**
 * Recursively deep-freezes an object.
 *
 * @param {Object} object - The object to deep freeze
 * @returns {Object} The frozen object
 */
function deepFreeze(object) {
  const propNames = Reflect.ownKeys(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && (typeof value === 'object' || typeof value === 'function')) {
      deepFreeze(value);
    }
  }
  return Object.freeze(object);
}

/** Supported application roles */
export const ROLES = Object.freeze({
  MEMBER: 'MEMBER',
  STAFF: 'STAFF',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
});

/** Numeric hierarchy rankings (higher represents greater authority) */
const ROLE_HIERARCHY = Object.freeze({
  [ROLES.MEMBER]: 1,
  [ROLES.STAFF]: 2,
  [ROLES.ADMIN]: 3,
  [ROLES.SUPER_ADMIN]: 4,
});

const rawConfig = {
  roles: ROLES,
  roleHierarchy: ROLE_HIERARCHY,
  defaultRole: ROLES.MEMBER,
};

export const authorizationConfig = deepFreeze(rawConfig);
export default authorizationConfig;
