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

/**
 * Validator for user password change requests.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const changePasswordValidator = (req, res, next) => {
  const errors = [];
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // Validate currentPassword
  if (currentPassword === undefined || currentPassword === null || String(currentPassword) === '') {
    errors.push({ field: 'currentPassword', message: 'Current password is required.' });
  }

  // Validate newPassword
  if (newPassword === undefined || newPassword === null) {
    errors.push({ field: 'newPassword', message: 'New password is required.' });
  } else {
    const newPasswordStr = String(newPassword);
    if (newPasswordStr.length < 8) {
      errors.push({
        field: 'newPassword',
        message: 'New password must contain at least 8 characters.',
      });
    }
    if (newPasswordStr.length > 128) {
      errors.push({
        field: 'newPassword',
        message: 'New password cannot exceed 128 characters.',
      });
    }
  }

  // Validate confirmPassword
  if (confirmPassword === undefined || confirmPassword === null) {
    errors.push({ field: 'confirmPassword', message: 'Confirm password is required.' });
  } else if (String(confirmPassword) !== String(newPassword)) {
    errors.push({
      field: 'confirmPassword',
      message: 'Confirm password must match the new password.',
    });
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed.', errors);
  }

  next();
};
