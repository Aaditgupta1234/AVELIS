/**
 * @fileoverview User module database selection mappings.
 *
 * Configures the fields to extract from the database when querying user registry profiles.
 *
 * @module shared/selects/user.select
 */

/**
 * Prisma query select mapping for retrieving User database entries.
 * @type {Object}
 */
export const USER_SELECT = {
  id: true,
  username: true,
  email: true,
  phone: true,
  avatarUrl: true,
  isCustomAvatar: true,
  signupProvider: true,
  providerId: true,
  emailVerified: true,
  lastLoginAt: true,
  lastLoginProvider: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true
};
