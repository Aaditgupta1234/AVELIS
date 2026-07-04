/**
 * @fileoverview Password hashing and comparison utilities.
 *
 * Provides functions to hash passwords securely and compare plain text
 * passwords with hashed values using bcrypt.
 *
 * @module utils/hash
 */

import bcrypt from 'bcrypt';

/**
 * Hash a plain text password.
 *
 * @param {string} password - The plain text password to hash
 * @returns {Promise<string>} The hashed password
 */
export const hashPassword = async (password) => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Compare a plain text password with a hashed password.
 *
 * @param {string} password - The plain text password
 * @param {string} hashedPassword - The stored hashed password
 * @returns {Promise<boolean>} True if the password matches, false otherwise
 */
export const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};
