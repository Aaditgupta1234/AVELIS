/**
 * @fileoverview Prisma Client singleton.
 *
 * Creates and exports a single PrismaClient instance for use
 * throughout the application. Uses the singleton pattern to
 * prevent multiple client instances during development, where
 * nodemon restarts would otherwise create a new connection
 * on every reload.
 *
 * This file is the ONLY entry point for Prisma in the application.
 *
 * @module lib/prisma
 *
 * @example
 * import { prisma } from '../lib/prisma.js';
 *
 * const users = await prisma.user.findMany();
 */

import { PrismaClient } from '@prisma/client';

/**
 * Create or retrieve the Prisma Client singleton.
 *
 * In development, the client is stored on `globalThis` so it
 * survives nodemon restarts without creating additional connections.
 *
 * In production, a fresh instance is created per process.
 *
 * @returns {PrismaClient} The shared Prisma Client instance
 */
const createPrismaClient = () => {
  if (process.env.NODE_ENV === 'production') {
    return new PrismaClient();
  }

  // In development, reuse the existing client across hot reloads
  if (!globalThis.__prisma) {
    globalThis.__prisma = new PrismaClient();
  }

  return globalThis.__prisma;
};

/** @type {PrismaClient} Shared Prisma Client instance */
const prisma = createPrismaClient();

export { prisma };
