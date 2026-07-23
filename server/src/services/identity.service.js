import { prisma } from '../lib/prisma.js';

/**
 * Generate a formatted, collision-free username.
 * Format: alexandermercer -> alexandermercer_2 -> alexandermercer_3
 *
 * @param {string} baseName - User display name or email prefix
 * @returns {Promise<string>} Unique formatted username
 */
export const generateFormattedUsername = async (baseName) => {
  let candidate = baseName ? baseName.toLowerCase().replace(/[^a-z0-9_]/g, '') : 'bibliophile';
  if (!candidate) candidate = 'bibliophile';
  
  let counter = 2;
  let username = candidate;
  
  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${candidate}_${counter}`;
    counter++;
  }
  
  return username;
};

/**
 * Synchronize OAuth profile details, audit fields, and avatar for an existing user.
 *
 * @param {Object} user - Prisma User object
 * @param {Object} tokenPayload - Extracted token details
 * @param {string} tokenPayload.providerId - Unique provider user ID (sub)
 * @param {string} [tokenPayload.picture] - OAuth profile picture URL
 * @param {string} [tokenPayload.provider] - Provider enum string (GOOGLE, etc.)
 * @returns {Promise<Object>} Updated Prisma user object
 */
export const syncOAuthProfile = async (user, { providerId, picture, provider = 'GOOGLE' }) => {
  const updates = {
    lastLoginAt: new Date(),
    lastLoginProvider: provider,
  };

  // Link providerId if not already populated
  if (!user.providerId && providerId) {
    updates.providerId = providerId;
  }

  // Upgrade email verification status (OAuth providers verify email ownership)
  if (!user.emailVerified) {
    updates.emailVerified = true;
  }

  // Auto-refresh OAuth avatar if user has NOT uploaded a custom avatar or currently has no avatarUrl
  if ((!user.isCustomAvatar || !user.avatarUrl) && picture && user.avatarUrl !== picture) {
    updates.avatarUrl = picture;
  }

  return await prisma.user.update({
    where: { id: user.id },
    data: updates,
  });
};
