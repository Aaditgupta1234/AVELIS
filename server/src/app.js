/**
 * @fileoverview Express application configuration.
 *
 * Creates and configures the Express application with all
 * required middleware, routes, and error handlers.
 *
 * This module does NOT start the server — that is handled
 * by server.js.
 *
 * @module app
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import { config } from './config/index.js';
import apiRoutes from './routes/index.js';
import { notFound } from './middleware/error/notFound.js';
import { errorHandler } from './middleware/error/errorHandler.js';

/**
 * Create and configure the Express application.
 */
const app = express();

// ---------------------------------------------------------------------------
// Security Middleware
// ---------------------------------------------------------------------------

/** Set security-related HTTP headers */
app.use(helmet());

/** Compress response bodies */
app.use(compression());

/** Enable Cross-Origin Resource Sharing */
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

// ---------------------------------------------------------------------------
// Body Parsing
// ---------------------------------------------------------------------------

/** Parse JSON request bodies */
app.use(express.json({ limit: '10mb' }));

/** Parse URL-encoded request bodies */
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---------------------------------------------------------------------------
// Request Logging
// ---------------------------------------------------------------------------

/** HTTP request logger — use 'dev' format in development */
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------

/** Mount all API routes under /api/v1 */
app.use('/api/v1', apiRoutes);

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------

/** Catch-all for unmatched routes */
app.use(notFound);

/** Global error handler — must be last */
app.use(errorHandler);

export default app;
