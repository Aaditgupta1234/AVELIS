import { prisma } from '../lib/prisma.js';
import { ApiError, hashPassword, comparePassword, generateToken } from '../utils/index.js';
import { UserRole, AuthProvider } from '@prisma/client';
import { supabaseAdmin } from '../lib/supabase.js';
import { generateFormattedUsername, syncOAuthProfile } from './identity.service.js';

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
 * Retrieve user profile and verify account activity status.
 *
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Sanitized user profile data
 * @throws {ApiError} If user not found (404) or is inactive (403)
 */
export const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  if (!user.isActive) {
    throw new ApiError(
      403,
      'Your account is inactive. Please contact an administrator.'
    );
  }

  return {
    id: user.id,
    name: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified,
  };
};

/**
 * Provider-agnostic OAuth authentication service.
 * Verifies Supabase OAuth token, resolves user via providerId/email,
 * syncs profile & audit fields, and returns native JWT.
 *
 * @param {Object} params - Input parameters
 * @param {string} params.supabaseToken - Access token issued by Supabase Auth
 * @returns {Promise<Object>} Object containing native JWT token and sanitized user
 * @throws {ApiError} If verification fails or user account is inactive
 */
export const oauthAuthService = async ({ supabaseToken }) => {
  if (!supabaseToken) {
    throw new ApiError(400, 'OAuth access token is required.');
  }

  // 1. Strictly verify Supabase token with Supabase Admin API
  const { data, error } = await supabaseAdmin.auth.getUser(supabaseToken);
  if (error || !data?.user) {
    throw new ApiError(401, 'Invalid or expired OAuth token.');
  }

  const supabaseUser = data.user;
  const providerId = supabaseUser.id;
  const email = (supabaseUser.email || '').trim().toLowerCase();
  
  if (!email) {
    throw new ApiError(400, 'OAuth token does not contain a valid email address.');
  }

  const metadata = supabaseUser.user_metadata || {};
  const rawName = metadata.full_name || metadata.name || email.split('@')[0];
  const picture = metadata.avatar_url || metadata.picture || null;
  const rawProvider = (supabaseUser.app_metadata?.provider || 'GOOGLE').toUpperCase();
  const provider = ['GOOGLE', 'GITHUB', 'APPLE', 'MICROSOFT'].includes(rawProvider)
    ? rawProvider
    : 'GOOGLE';

  // 2. Look up account: priority 1 by providerId, priority 2 by email
  let user = await prisma.user.findUnique({
    where: { providerId },
  });

  if (!user) {
    user = await prisma.user.findUnique({
      where: { email },
    });
  }

  // 3. Account resolution & sync
  if (user) {
    if (!user.isActive) {
      throw new ApiError(403, 'Your account is inactive. Please contact an administrator.');
    }
    user = await syncOAuthProfile(user, { providerId, picture, provider });
  } else {
    // 4. Create new user for first-time OAuth sign in
    const username = await generateFormattedUsername(rawName);
    const randomPassword = `OAuth_${Math.random().toString(36).substring(2)}_${Date.now()}`;
    const passwordHash = await hashPassword(randomPassword);

    user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        avatarUrl: picture,
        isCustomAvatar: false,
        signupProvider: AuthProvider[provider] ? provider : AuthProvider.GOOGLE,
        providerId,
        emailVerified: true,
        lastLoginAt: new Date(),
        lastLoginProvider: provider,
        role: UserRole.MEMBER,
      },
    });
  }

  // 5. Issue application native JWT token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.username,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
    },
  };
};
