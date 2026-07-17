/**
 * @fileoverview Health, Readiness, and Liveness check routes.
 *
 * Exposes lightweight endpoints for container orchestrators and health checks.
 *
 * @module routes/health
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { noCacheMiddleware } from '../middleware/nocache.middleware.js';

const router = Router();

/**
 * GET /api/v1/health
 * High-level system status and database connectivity.
 */
router.get('/health', noCacheMiddleware, async (req, res, next) => {
  try {
    // Verify database connectivity
    await prisma.$queryRaw`SELECT 1`;

    return sendSuccess(
      res,
      200,
      {
        status: 'healthy',
        database: 'connected',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
      'Application health status retrieved successfully.'
    );
  } catch (error) {
    // Return 503 Service Unavailable if database is unreachable
    res.status(503).json({
      success: false,
      message: 'Application health check failed.',
      errors: [{ message: error.message || 'Database connection error' }]
    });
  }
});

/**
 * GET /api/v1/ready
 * Minimal readiness probe answering if the instance can receive traffic.
 */
router.get('/ready', noCacheMiddleware, async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).send('OK');
  } catch (error) {
    res.status(503).send('Service Unavailable');
  }
});

/**
 * GET /api/v1/live
 * Extremely lightweight liveness probe (Express responsive, event loop active).
 */
router.get('/live', noCacheMiddleware, (req, res) => {
  res.status(200).send('OK');
});

export default router;
