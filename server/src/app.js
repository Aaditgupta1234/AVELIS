/**
 * @fileoverview Express application configuration.
 *
 * Creates and configures the Express application with
 * production-ready middleware. This module does NOT start
 * the server — that is handled by server.js.
 *
 * No routes, no custom middleware, no business logic.
 * This is the Phase 2 bootstrap only.
 *
 * @module app
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import { config } from './config/index.js';

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

/** HTTP request logger */
app.use(morgan('dev'));

export default app;
