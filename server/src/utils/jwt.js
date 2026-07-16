/**
 * @fileoverview JWT generation and verification utilities.
 *
 * Provides functions to generate JWT access tokens and verify them using
 * centralized authentication security configuration.
 *
 * @module utils/jwt
 */

import jwt from 'jsonwebtoken';
import { authSecurityConfig } from '../config/index.js';

/**
 * Generate a JWT token for a given payload.
 *
 * @param {Object} payload - The payload to sign (e.g. { id, email, role })
 * @param {Object} [options={}] - Additional signing options
 * @returns {string} The signed JWT access token
 */
export const generateToken = (payload, options = {}) => {
  const algorithm = authSecurityConfig.jwtAlgorithms[0];
  return jwt.sign(payload, authSecurityConfig.jwtSecret, {
    expiresIn: authSecurityConfig.jwtExpiresIn,
    algorithm,
    ...options,
  });
};

/**
 * Verify a JWT token.
 *
 * @param {string} token - The token to verify
 * @returns {Object} The decoded token payload
 * @throws {Error} If verification fails, signature is invalid, or token is expired
 */
export const verifyToken = (token) => {
  const options = {
    algorithms: authSecurityConfig.jwtAlgorithms,
    clockTolerance: authSecurityConfig.jwtClockTolerance,
  };

  // Only pass issuer and audience if explicitly configured
  if (authSecurityConfig.jwtIssuer) {
    options.issuer = authSecurityConfig.jwtIssuer;
  }
  if (authSecurityConfig.jwtAudience) {
    options.audience = authSecurityConfig.jwtAudience;
  }
  if (authSecurityConfig.jwtMaxAge) {
    options.maxAge = authSecurityConfig.jwtMaxAge;
  }

  return jwt.verify(token, authSecurityConfig.jwtSecret, options);
};
