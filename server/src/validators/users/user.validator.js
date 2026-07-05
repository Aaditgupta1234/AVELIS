import { sendError } from '../../utils/index.js';

/**
 * Validator for user profile update requests.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const updateUserValidator = (req, res, next) => {
  const errors = [];
  let { username } = req.body;

  // Validate username
  if (username === undefined || username === null) {
    errors.push({ field: 'username', message: 'Username is required.' });
  } else {
    username = String(username).trim();
    if (username.length < 3) {
      errors.push({
        field: 'username',
        message: 'Username must contain at least 3 characters.',
      });
    }
    if (username.length > 50) {
      errors.push({
        field: 'username',
        message: 'Username cannot exceed 50 characters.',
      });
    }
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  // Update request body with trimmed value
  req.body.username = username;

  next();
};
