import { getUserProfile } from '../../services/users/user.service.js';
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
