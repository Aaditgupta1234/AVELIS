import { prisma } from '../../lib/prisma.js';
import { ApiError, hashPassword, comparePassword } from '../../utils/index.js';

/**
 * Retrieve current user profile from database.
 *
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Safe user profile details
 * @throws {ApiError} If user not found (404) or account is inactive (403)
 */
export const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      avatarUrl: true,
      isCustomAvatar: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
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

  console.log('[GET_ME DEBUG] Returned profile for:', user.email, 'avatarUrl:', user.avatarUrl);

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    isCustomAvatar: user.isCustomAvatar,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Update current user profile.
 *
 * @param {string} userId - User UUID
 * @param {Object} updateData - Fields to update
 * @param {string} updateData.username - New username
 * @returns {Promise<Object>} Safe user profile details
 * @throws {ApiError} If user not found (404), account inactive (403), or username taken (409)
 */
export const updateUserProfile = async (userId, updateData) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      isActive: true,
      email: true,
      role: true,
      avatarUrl: true,
      isCustomAvatar: true,
      createdAt: true,
      updatedAt: true,
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

  const newUsername = updateData.username;

  // Compare using the project's existing comparison strategy
  if (newUsername === user.username) {
    // Return immediately to avoid unnecessary database update writes and timestamp changes
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isCustomAvatar: user.isCustomAvatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // Check username uniqueness matching registration flow comparison strategy
  const existingUser = await prisma.user.findUnique({
    where: { username: newUsername },
    select: { id: true },
  });

  if (existingUser) {
    throw new ApiError(409, 'Username is already taken.');
  }

  // Update in database using Prisma select security to fetch only public fields
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { username: newUsername },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      avatarUrl: true,
      isCustomAvatar: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

/**
 * Change current user password.
 *
 * @param {string} userId - User UUID
 * @param {Object} passwordData - Password details
 * @param {string} passwordData.currentPassword - Existing plain password
 * @param {string} passwordData.newPassword - New plain password
 * @returns {Promise<void>}
 * @throws {ApiError} If user not found (404), account inactive (403), current password mismatch (401), or new password matches current (400)
 */
export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      passwordHash: true,
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

  // Verify the current password
  const isCurrentPasswordCorrect = await comparePassword(currentPassword, user.passwordHash);
  if (!isCurrentPasswordCorrect) {
    throw new ApiError(401, 'Incorrect current password.');
  }

  // Reject the request if the new password is identical to the current password
  const isNewPasswordSame = await comparePassword(newPassword, user.passwordHash);
  if (isNewPasswordSame) {
    throw new ApiError(
      400,
      'New password cannot be the same as the current password.'
    );
  }

  // Hash new password using existing bcrypt config
  const passwordHash = await hashPassword(newPassword);

  // Update only the password field
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
};
