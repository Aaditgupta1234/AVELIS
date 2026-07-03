/**
 * @fileoverview MongoDB connection module.
 *
 * Provides a reusable function to establish and manage the
 * MongoDB connection via Mongoose. Logs connection status
 * using the application logger.
 *
 * @module config/database
 */

import mongoose from 'mongoose';
import { config } from './env.js';
import { logger } from './logger.js';

/**
 * Connect to MongoDB using the URI from environment configuration.
 *
 * Registers event listeners for connection lifecycle events
 * (connected, error, disconnected) and logs each transition.
 *
 * @async
 * @returns {Promise<void>}
 * @throws {Error} If the initial connection attempt fails
 */
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri);

    logger.info(`MongoDB connected: ${conn.connection.host}`);

    // Log subsequent connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};
