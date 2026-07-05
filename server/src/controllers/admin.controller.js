import * as adminService from '../services/admin.service.js';
import { sendSuccess } from '../utils/response.js';
import { sendError } from '../utils/index.js';
import { UserRole } from '@prisma/client';

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

/**
 * Get paginated list of users.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getUsers = async (req, res, next) => {
  try {
    const { page, limit, search, role } = req.query;
    const errors = [];

    let parsedPage = 1;
    if (page !== undefined) {
      const p = Number(page);
      if (!Number.isInteger(p) || p < 1) {
        errors.push({ field: 'page', message: 'Page must be an integer greater than or equal to 1.' });
      } else {
        parsedPage = p;
      }
    }

    let parsedLimit = 10;
    if (limit !== undefined) {
      const l = Number(limit);
      if (!Number.isInteger(l) || l < 1) {
        errors.push({ field: 'limit', message: 'Limit must be an integer greater than or equal to 1.' });
      } else if (l > 100) {
        errors.push({ field: 'limit', message: 'Limit cannot exceed 100.' });
      } else {
        parsedLimit = l;
      }
    }

    if (role !== undefined) {
      const rolesList = Object.values(UserRole);
      if (!rolesList.includes(role)) {
        errors.push({
          field: 'role',
          message: `Role must be one of: ${rolesList.join(', ')}.`,
        });
      }
    }

    if (errors.length > 0) {
      return sendError(res, 400, 'Validation failed.', errors);
    }

    const cleanSearch = search ? String(search).trim() : undefined;
    const result = await adminService.getUsers({
      page: parsedPage,
      limit: parsedLimit,
      search: cleanSearch,
      role,
    });

    return sendSuccess(res, 200, result, 'Users fetched successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by id.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await adminService.getUserById(id);

    return sendSuccess(res, 200, user, 'User fetched successfully.');
  } catch (error) {
    next(error);
  }
};
