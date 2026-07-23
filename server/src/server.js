/**
 * @fileoverview Server entry point.
 *
 * Responsibilities:
 * 1. Load environment configuration
 * 2. Start the Express HTTP server
 * 3. Log startup information
 * 4. Handle graceful shutdown (SIGINT, SIGTERM)
 *
 * No database connection. No business logic.
 *
 * @module server
 */

import { config, logger } from './config/index.js';
import app from './app.js';
import { prisma } from './lib/prisma.js';
import { initializeStorageService } from './services/storage.service.js';

/**
 * Start the application server.
 *
 * Verifies database connectivity, verifies storage initialization,
 * starts listening for HTTP requests, and registers graceful shutdown handlers.
 */
const startServer = async () => {
  // 1. Verify Prisma connection cleanly on startup
  try {
    await prisma.$connect();
    logger.info('Database connection established successfully');
  } catch (err) {
    logger.error('Failed to establish database connection on startup:', err);
    process.exit(1);
  }

  // 2. Verify Supabase Storage buckets (read-only verification)
  try {
    await initializeStorageService();
  } catch (err) {
    logger.error('Failed to initialize storage service on startup:', err.message);
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    logger.info('================================================');
    logger.info('  AVELIS Server');
    logger.info(`  Environment : ${config.nodeEnv}`);
    logger.info(`  Port        : ${config.port}`);
    logger.info('================================================');
  });

  // -------------------------------------------------------------------------
  // Graceful Shutdown & Exception Handling
  // -------------------------------------------------------------------------

  let shuttingDown = false;

  /**
   * Handle shutdown signals gracefully.
   * Closes the HTTP server and Prisma client before exiting.
   *
   * @param {string} signal - The signal or event that triggered shutdown
   */
  const gracefulShutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`\n${signal} received. Starting graceful shutdown...`);

    // Force shutdown after 10 seconds if graceful shutdown hangs
    const forceShutdownTimer = setTimeout(() => {
      logger.error('Forced shutdown — graceful shutdown timed out');
      process.exit(1);
    }, 10000);

    server.close(async () => {
      logger.info('HTTP server closed');
      try {
        await prisma.$disconnect();
        logger.info('Database connection gracefully closed');
      } catch (e) {
        logger.error('Error during database disconnect:', e);
      }
      clearTimeout(forceShutdownTimer);
      logger.info('Graceful shutdown complete');
      process.exit(0);
    });
  };

  // Listen for termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Listen for uncaught exceptions/rejections
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
  });
};

// Start the server
startServer();
