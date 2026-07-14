/**
 * @fileoverview Reusable HTTP client for benchmark requests.
 *
 * Wraps Node.js built-in http/https modules. Returns a standardized
 * result object containing status, body, timing, and error fields.
 * Never throws — all errors are captured and returned as { status: 0, error }.
 *
 * This utility is reusable by every benchmark scenario.
 *
 * @module benchmark/utils/httpClient
 */

import http from 'http';
import https from 'https';
import { startTimer, endTimer } from './timer.js';

/**
 * @typedef {Object} HttpResult
 * @property {number}      status     - HTTP status code (0 on network error)
 * @property {any}         body       - Parsed JSON body, or raw string if not JSON
 * @property {number}      durationMs - Request duration in milliseconds (fractional)
 * @property {string|null} error      - Error message, or null on success
 */

/**
 * @typedef {Object} HttpRequestOptions
 * @property {Object}  [body]      - Request body (will be JSON-serialized)
 * @property {Object}  [headers]   - Additional request headers
 * @property {number}  [timeoutMs] - Request timeout in milliseconds (default: 5000)
 */

/**
 * Make an HTTP/HTTPS request and return a standardized result.
 *
 * @param {string}             method  - HTTP method (GET, POST, etc.)
 * @param {string}             url     - Full URL including protocol, host, and path
 * @param {HttpRequestOptions} [opts]  - Optional request configuration
 * @returns {Promise<HttpResult>}
 *
 * @example
 * const result = await request('GET', 'http://localhost:5000/api/v1/books');
 * console.log(result.status, result.durationMs);
 *
 * @example
 * const result = await request('POST', 'http://localhost:5000/api/v1/auth/login', {
 *   body: { email: 'admin@example.com', password: 'secret' },
 *   headers: { Authorization: 'Bearer ...' },
 *   timeoutMs: 3000,
 * });
 */
export const request = (method, url, opts = {}) =>
  new Promise((resolve) => {
    const { body, headers = {}, timeoutMs = 5000 } = opts;

    const bodyStr = body ? JSON.stringify(body) : undefined;
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const transport = isHttps ? https : http;

    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers,
        ...(bodyStr
          ? { 'Content-Length': Buffer.byteLength(bodyStr) }
          : {}),
      },
    };

    const token = startTimer();

    const req = transport.request(reqOptions, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        const durationMs = endTimer(token);
        let parsedBody;
        try {
          parsedBody = JSON.parse(raw);
        } catch {
          parsedBody = raw;
        }
        resolve({
          status: res.statusCode,
          body: parsedBody,
          durationMs,
          error: null,
        });
      });
    });

    // Timeout handling
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      const durationMs = endTimer(token);
      resolve({
        status: 0,
        body: null,
        durationMs,
        error: `Request timed out after ${timeoutMs}ms`,
      });
    });

    // Network error handling
    req.on('error', (err) => {
      const durationMs = endTimer(token);
      resolve({
        status: 0,
        body: null,
        durationMs,
        error: err.message,
      });
    });

    if (bodyStr) req.write(bodyStr);
    req.end();
  });
