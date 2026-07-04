/**
 * @fileoverview JWT generation and verification utilities.
 *
 * Provides functions to generate JWT access tokens and verify them using
 * jsonwebtoken and environment configuration.
 *
 * @module utils/jwt
 */

import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * Generate a JWT token for a given payload.
 *
 * @param {Object} payload - The payload to sign (e.g. { id, email, role })
 * @returns {string} The signed JWT access token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

/**
 * Verify a JWT token.
 *
 * @param {string} token - The token to verify
 * @returns {Object} The decoded token payload
 * @throws {Error} If verification fails or token is expired
 */
export const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};
