/**
 * @fileoverview Authentication helper for benchmark runs.
 *
 * Generates JWT tokens directly via generateToken() without making HTTP
 * login requests, isolating auth overhead from endpoint latency measurements.
 *
 * Tokens are cached in-module for the lifetime of a benchmark run.
 * Call clearTokenCache() between runs to force re-authentication.
 *
 * @module benchmark/helpers/authHelper
 */

import { generateToken } from '../../src/utils/jwt.js';
import { UserRole } from '@prisma/client';

/**
 * @typedef {Object} TokenCache
 * @property {string|null} admin  - Cached admin JWT
 * @property {string|null} member - Cached member JWT
 */

/** @type {TokenCache} */
const cache = { admin: null, member: null };

/**
 * @typedef {Object} SeededMemberInfo
 * @property {string} userId - The seeded member's user ID
 */

/** @type {SeededMemberInfo|null} Tracks the bench member created by getMemberToken */
let seededMemberInfo = null;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Return a cached JWT for the first ADMIN user found in the database.
 *
 * Never makes an HTTP request — generates the token directly via generateToken().
 * On subsequent calls, returns the cached token without hitting the database.
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @returns {Promise<string>} Valid JWT for the admin user
 * @throws {Error} If no ADMIN user exists in the database
 *
 * @example
 * const token = await getAdminToken(prisma);
 * headers: { Authorization: `Bearer ${token}` }
 */
export const getAdminToken = async (prisma) => {
  if (cache.admin) return cache.admin;

  const admin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN, isActive: true },
    select: { id: true, email: true, role: true },
  });

  if (!admin) {
    throw new Error(
      '[authHelper] No active ADMIN user found in database. ' +
      'Ensure at least one admin user exists before running benchmarks.'
    );
  }

  cache.admin = generateToken({ id: admin.id, email: admin.email, role: admin.role });
  return cache.admin;
};

/**
 * Return a cached JWT for a seeded benchmark MEMBER user.
 *
 * Creates a bench_auth_member_<timestamp>@bench.local user on first call,
 * caches the token, and returns it on subsequent calls.
 * The created user is tracked via getSeededMemberInfo() for cleanup.
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @returns {Promise<string>} Valid JWT for the member user
 *
 * @example
 * const token = await getMemberToken(prisma);
 */
export const getMemberToken = async (prisma) => {
  if (cache.member) return cache.member;

  // Upsert a deterministic bench member — avoids duplicates on repeated runs
  // if a prior cleanup did not complete. ALIGNED WITH SEED HELPER.
  const email = `bench_member@bench.local`;

  const member = await prisma.user.upsert({
    where: { email },
    update: { isActive: true },
    create: {
      email,
      username: 'bench_member',
      passwordHash: '$2b$10$benchhashnotusedforlogin000000000000000000000000000',
      role: UserRole.MEMBER,
      isActive: true,
    },
    select: { id: true, email: true, role: true },
  });

  seededMemberInfo = { userId: member.id };
  cache.member = generateToken({ id: member.id, email: member.email, role: member.role });
  return cache.member;
};

/**
 * Return the seeded member user info (used by seedHelper for cleanup).
 *
 * @returns {SeededMemberInfo|null}
 */
export const getSeededMemberInfo = () => seededMemberInfo;

/**
 * Clear all cached tokens.
 * Call this before each benchmark run to force re-authentication.
 */
export const clearTokenCache = () => {
  cache.admin = null;
  cache.member = null;
  seededMemberInfo = null;
};
