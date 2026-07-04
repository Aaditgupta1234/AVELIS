import { prisma } from '../lib/prisma.js';
import { ApiError, hashPassword, comparePassword, generateToken } from '../utils/index.js';
import { UserRole } from '@prisma/client';

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
      role: UserRole.MEMBER,
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
 * Authenticate a user and generate a JWT access token.
 *
 * @param {Object} credentials - User credentials
 * @param {string} credentials.email - User's email
 * @param {string} credentials.password - User's password
 * @returns {Promise<Object>} Object containing token and sanitized user details
 * @throws {ApiError} If lookup, password check, or account status validation fails
 */
export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Look up user by email
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new ApiError(401, 'Invalid credentials.');
  }

  // 2. Verify password
  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials.');
  }

  // 3. Verify account status
  if (!user.isActive) {
    throw new ApiError(
      403,
      'Your account is inactive. Please contact an administrator.'
    );
  }

  // 4. Generate JWT with minimal payload
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  // 5. Return token and sanitized user object
  return {
    token,
    user: {
      id: user.id,
      name: user.username,
      email: user.email,
      role: user.role,
    },
  };
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
