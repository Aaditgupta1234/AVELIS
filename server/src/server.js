/**
 * @fileoverview Server entry point.
 *
 * Responsibilities:
 * 1. Load environment configuration
 * 2. Connect to MongoDB
 * 3. Start the Express server
 * 4. Handle graceful shutdown
 * 5. Log startup status
 *
 * @module server
 */

import { config, logger, connectDB } from './config/index.js';
import app from './app.js';

/**
 * Start the application server.
 *
 * Connects to MongoDB first, then starts listening for
 * HTTP requests on the configured port.
 */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info('================================================');
      logger.info(`  AVELIS Server`);
      logger.info(`  Environment : ${config.nodeEnv}`);
      logger.info(`  Port        : ${config.port}`);
      logger.info(`  API Base    : http://localhost:${config.port}/api/v1`);
      logger.info('================================================');
    });

    // -----------------------------------------------------------------------
    // Graceful Shutdown
    // -----------------------------------------------------------------------

    /**
     * Handle shutdown signals gracefully.
     * Closes the HTTP server and MongoDB connection before exiting.
     *
     * @param {string} signal - The signal that triggered shutdown
     */
    const gracefulShutdown = (signal) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          const { default: mongoose } = await import('mongoose');
          await mongoose.connection.close();
          logger.info('MongoDB connection closed');
        } catch (err) {
          logger.error('Error closing MongoDB connection:', err.message);
        }

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

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection:', reason);
      gracefulShutdown('unhandledRejection');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();
