/**
 * @fileoverview Express application configuration.
 *
 * Creates and configures the Express application with
 * production-ready middleware. This module does NOT start
 * the server — that is handled by server.js.
 *
 * No routes, no custom middleware, no business logic.
 *
 * @module app
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import { config, securityConfig, permissionsPolicyMiddleware, rateLimitConfig } from './config/index.js';
import { logger } from './config/logger.js';

/**
 * Create and configure the Express application.
 */
const app = express();

/** Configure Express trust proxy settings */
app.set('trust proxy', rateLimitConfig.TRUST_PROXY);

// ---------------------------------------------------------------------------
// Security Middleware
// ---------------------------------------------------------------------------

/** Apply Helmet security headers with explicit production-safe configuration */
app.use(helmet(securityConfig.helmetOptions));

/** Apply custom Permissions Policy headers */
app.use(permissionsPolicyMiddleware);

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
// Request Normalization Middleware
// ---------------------------------------------------------------------------
import { requestNormalizationMiddleware } from './middleware/request.normalization.middleware.js';
app.use(requestNormalizationMiddleware);

// ---------------------------------------------------------------------------
// Global Rate Limiting Middleware
// ---------------------------------------------------------------------------
import { globalRateLimiter } from './middleware/rate-limit.middleware.js';
app.use(globalRateLimiter);

// ---------------------------------------------------------------------------
// Request Logging
// ---------------------------------------------------------------------------

/** HTTP request logger — use 'combined' format in production for structured output */
const morganFormat = config.nodeEnv === 'production' ? 'combined' : 'dev';

/**
 * Custom morgan token to omit the Authorization header from logs.
 * Prevents JWT tokens or credentials from appearing in log output.
 */
morgan.token('safe-headers', (req) => {
  const headers = { ...req.headers };
  delete headers.authorization;
  delete headers.cookie;
  return JSON.stringify(headers);
});

app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        // Strip trailing newline before passing to logger
        logger.info(message.trimEnd());
      },
    },
  })
);

// ---------------------------------------------------------------------------
// API Routing
// ---------------------------------------------------------------------------

import apiRoutes from './routes/index.js';
app.use('/api/v1', apiRoutes);

// ---------------------------------------------------------------------------
// Fallback & Error Handling Middleware
// ---------------------------------------------------------------------------

import { notFound } from './middleware/error/notFound.js';
import { errorHandler } from './middleware/error/errorHandler.js';

/** Handle 404 - Route not found */
app.use(notFound);

/** Global error handler (must be registered last) */
app.use(errorHandler);

export default app;
