import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/index.js';

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

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
