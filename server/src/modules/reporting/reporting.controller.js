/**
 * @fileoverview Reporting module controller.
 *
 * Handles administrative requests for report search and generation.
 * Delegates execution directly to the reporting service layer.
 *
 * @module modules/reporting/controller
 */

import * as reportingService from './reporting.service.js';
import { sendSuccess } from '../../utils/index.js';

/**
 * Handle searching books for reports.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const searchBooks = async (req, res, next) => {
  try {
    const data = await reportingService.searchBooks();
    return sendSuccess(res, 200, data, 'Books search report retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle searching members for reports.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const searchMembers = async (req, res, next) => {
  try {
    const data = await reportingService.searchMembers();
    return sendSuccess(res, 200, data, 'Members search report retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle searching loans for reports.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const searchLoans = async (req, res, next) => {
  try {
    const data = await reportingService.searchLoans();
    return sendSuccess(res, 200, data, 'Loans search report retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle searching reservations for reports.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const searchReservations = async (req, res, next) => {
  try {
    const data = await reportingService.searchReservations();
    return sendSuccess(res, 200, data, 'Reservations search report retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle searching orders for reports.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const searchOrders = async (req, res, next) => {
  try {
    const data = await reportingService.searchOrders();
    return sendSuccess(res, 200, data, 'Orders search report retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle retrieving overdue report.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getOverdueReport = async (req, res, next) => {
  try {
    const data = await reportingService.getOverdueReport();
    return sendSuccess(res, 200, data, 'Overdue report retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle retrieving inventory report.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getInventoryReport = async (req, res, next) => {
  try {
    const data = await reportingService.getInventoryReport();
    return sendSuccess(res, 200, data, 'Inventory report retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle retrieving member report.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getMemberReport = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const data = await reportingService.getMemberReport({ memberId });
    return sendSuccess(res, 200, data, 'Member report retrieved successfully.');
  } catch (error) {
    next(error);
  }
};
