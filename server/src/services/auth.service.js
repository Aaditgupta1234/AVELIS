import { prisma } from '../lib/prisma.js';
import { ApiError, hashPassword } from '../utils/index.js';

/**
 * Register a new user and persist them in the database.
 *
 * @param {Object} userData - Registration inputs
 * @param {string} userData.name - User's display name
 * @param {string} userData.email - User's email
 * @param {string} userData.password - User's password
 * @returns {Promise<Object>} Persisted and sanitized user record
 * @throws {ApiError} If duplicate email or username is found
 */
export const registerUser = async ({ name, email, password }) => {
  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  // Check duplicate email
  const existingUserByEmail = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUserByEmail) {
    throw new ApiError(409, 'Email is already registered.');
  }

  // Check duplicate username (name) due to unique constraint in the current schema
  const existingUserByUsername = await prisma.user.findUnique({
    where: { username: normalizedName },
  });

  if (existingUserByUsername) {
    throw new ApiError(409, 'Username is already taken.');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      username: normalizedName,
      email: normalizedEmail,
      passwordHash,
      role: 'MEMBER',
    },
  });

  // Return sanitized user object constructed from the database record (source of truth)
  return {
    id: user.id,
    name: user.username,
    email: user.email,
    role: user.role,
  };
};

/**
 * Login user placeholder.
 *
 * @returns {Promise<null>}
 */
export const loginUser = async () => {
  // Placeholder: database operations and verification will be added in Phase 6.2
  return null;
};

/**
 * Get current user placeholder.
 *
 * @returns {Promise<null>}
 */
export const getCurrentUser = async () => {
  // Placeholder: user database fetch will be added in Phase 6.2
  return null;
};
