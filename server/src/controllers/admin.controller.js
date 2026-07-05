import * as adminService from '../services/admin.service.js';
import { sendSuccess } from '../utils/response.js';

/**
 * Get dashboard statistics.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();

    return sendSuccess(
      res,
      200,
      stats,
      'Dashboard statistics fetched successfully.'
    );
  } catch (error) {
    next(error);
  }
};
