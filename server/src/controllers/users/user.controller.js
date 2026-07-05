import { getUserProfile, updateUserProfile, changePassword as changeUserPassword } from '../../services/users/user.service.js';
import { sendSuccess } from '../../utils/response.js';

/**
 * Handle get current authenticated user profile request.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userProfile = await getUserProfile(userId);

    return sendSuccess(
      res,
      200,
      userProfile,
      'User profile retrieved successfully.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Handle update current user profile request.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const updateMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { username } = req.body;
    const updatedProfile = await updateUserProfile(userId, { username });

    return sendSuccess(
      res,
      200,
      updatedProfile,
      'Profile updated successfully.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Handle change password request.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    await changeUserPassword(userId, { currentPassword, newPassword });

    return sendSuccess(
      res,
      200,
      null,
      'Password updated successfully.'
    );
  } catch (error) {
    next(error);
  }
};
