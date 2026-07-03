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

/**
 * Start the application server.
 *
 * Starts listening for HTTP requests on the configured port
 * and registers graceful shutdown handlers.
 */
const startServer = () => {
  const server = app.listen(config.port, () => {
    logger.info('================================================');
    logger.info('  AVELIS Server');
    logger.info(`  Environment : ${config.nodeEnv}`);
    logger.info(`  Port        : ${config.port}`);
    logger.info('================================================');
  });

  // -------------------------------------------------------------------------
  // Graceful Shutdown
  // -------------------------------------------------------------------------

  /**
   * Handle shutdown signals gracefully.
   * Closes the HTTP server before exiting the process.
   *
   * @param {string} signal - The signal that triggered shutdown
   */
  const gracefulShutdown = (signal) => {
    logger.info(`\n${signal} received. Starting graceful shutdown...`);

    server.close(() => {
      logger.info('HTTP server closed');
      logger.info('Graceful shutdown complete');
      process.exit(0);
    });

    // Force shutdown after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      logger.error('Forced shutdown — graceful shutdown timed out');
      process.exit(1);
    }, 10000);
  };

  // Listen for termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

// Start the server
startServer();
