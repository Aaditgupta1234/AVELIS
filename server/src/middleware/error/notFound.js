/**
 * @fileoverview 404 Not Found middleware.
 *
 * Catches all requests that don't match any defined route
 * and returns a structured JSON 404 response.
 *
 * @module middleware/error/notFound
 */

/**
 * Not Found middleware.
 *
 * Responds with a 404 JSON error for any unmatched route.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} _next - Express next (unused)
 */
const notFound = (req, res, _next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

export { notFound };
