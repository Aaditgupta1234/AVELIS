/**
 * @fileoverview Middleware to prevent browser and proxy caching on sensitive endpoints.
 *
 * Exports a frozen header mapping and an Express middleware function.
 *
 * @module middleware/nocache.middleware
 */

/**
 * Frozen mapping of standard cache prevention HTTP headers.
 *
 * @type {Readonly<{
 *   'Cache-Control': string,
 *   'Pragma': string,
 *   'Expires': string,
 *   'Surrogate-Control': string
 * }>}
 */
export const NO_CACHE_HEADERS = Object.freeze({
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store',
});

/**
 * Express middleware that applies cache prevention headers.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const noCacheMiddleware = (req, res, next) => {
  for (const [key, value] of Object.entries(NO_CACHE_HEADERS)) {
    res.setHeader(key, value);
  }
  next();
};

export default noCacheMiddleware;
