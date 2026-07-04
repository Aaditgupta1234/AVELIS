/**
 * @fileoverview Authentication request validators.
 *
 * Scaffolds validator middleware functions to validate incoming payloads
 * for registration and login.
 *
 * @module validators/auth.validator
 */

import { sendError } from '../utils/index.js';

/**
 * Validator placeholder for user registration requests.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const registerValidator = (req, res, next) => {
  const errors = [];
  let { name, email, password } = req.body;

  // Validate Name
  if (name === undefined || name === null) {
    errors.push({ field: 'name', message: 'Name is required.' });
  } else {
    name = String(name).trim();
    if (name === '') {
      errors.push({ field: 'name', message: 'Name cannot be empty.' });
    }
  }

  // Validate Email
  if (email === undefined || email === null) {
    errors.push({ field: 'email', message: 'Email is required.' });
  } else {
    email = String(email).trim();
    if (email === '') {
      errors.push({ field: 'email', message: 'Email cannot be empty.' });
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push({ field: 'email', message: 'Email is invalid.' });
      }
    }
  }

  // Validate Password
  if (password === undefined || password === null) {
    errors.push({ field: 'password', message: 'Password is required.' });
  } else {
    const passwordStr = String(password);
    if (passwordStr.length < 8) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least 8 characters.',
      });
    }
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  // Update request body with trimmed/normalized values
  req.body.name = name;
  req.body.email = email.toLowerCase();

  next();
};

/**
 * Validator placeholder for user login requests.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const loginValidator = (req, res, next) => {
  const errors = [];
  let { email, password } = req.body;

  // Validate Email
  if (email === undefined || email === null) {
    errors.push({ field: 'email', message: 'Email is required.' });
  } else {
    email = String(email).trim();
    if (email === '') {
      errors.push({ field: 'email', message: 'Email cannot be empty.' });
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push({ field: 'email', message: 'Email is invalid.' });
      }
    }
  }

  // Validate Password
  if (password === undefined || password === null || String(password) === '') {
    errors.push({ field: 'password', message: 'Password is required.' });
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  // Update request body with trimmed/normalized email
  req.body.email = email.toLowerCase();

  next();
};
