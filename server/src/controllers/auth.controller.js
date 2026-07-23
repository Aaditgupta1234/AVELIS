/**
 * @fileoverview Authentication controller.
 *
 * Scaffolds controller methods for register, login, me, and logout,
 * returning standardized placeholder responses.
 *
 * @module controllers/auth.controller
 */

import { sendSuccess } from '../utils/response.js';
import { registerUser, loginUser, getCurrentUser, oauthAuthService } from '../services/auth.service.js';
import { logger } from '../config/logger.js';

/**
 * Handle user registration request.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const user = await registerUser({ name, email, password });

    logger.info(`[AUTH] User registered: userId=${user.id}`);

    return sendSuccess(
      res,
      201,
      user,
      'User registered successfully.'
    );
  } catch (error) {
    logger.warn(`[AUTH] Registration failed: ${error.message}`);
    next(error);
  }
};

/**
 * Handle user login request.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const authData = await loginUser({ email, password });

    logger.info(`[AUTH] User logged in: userId=${authData.user?.id}`);

    return sendSuccess(
      res,
      200,
      authData,
      'Login successful.'
    );
  } catch (error) {
    logger.warn(`[AUTH] Login failed: ${error.message}`);
    next(error);
  }
};

/**
 * Handle OAuth login request.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const oauthLogin = async (req, res, next) => {
  try {
    const { token } = req.body;
    const authData = await oauthAuthService({ supabaseToken: token });

    logger.info(`[AUTH] OAuth login successful: userId=${authData.user?.id}`);

    return sendSuccess(
      res,
      200,
      authData,
      'OAuth authentication successful.'
    );
  } catch (error) {
    logger.warn(`[AUTH] OAuth authentication failed: ${error.message}`);
    next(error);
  }
};

/**
 * Handle get current user request.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const me = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userProfile = await getCurrentUser(userId);

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
 * Handle user logout request placeholder.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const logout = async (req, res, next) => {
  try {
    return sendSuccess(
      res,
      200,
      null,
      'Logout successful.'
    );
  } catch (error) {
    next(error);
  }
};
