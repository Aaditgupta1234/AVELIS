/**
 * @fileoverview Reporting module controller.
 *
 * Handles administrative requests for report search and generation.
 * Extracts validated parameters and query filters, delegating execution
 * directly to the reporting service layer.
 *
 * @module modules/reporting/controller
 */

import * as reportingService from './reporting.service.js';
import { sendSuccess } from '../../utils/index.js';

/**
 * Handle searching books for reports.
 * Passes validated query parameters down to the service layer.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const searchBooks = async (req, res, next) => {
  try {
    const data = await reportingService.searchBooks(req.query);
    return sendSuccess(res, 200, data, 'Books search report retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle searching members for reports.
 * Passes validated query parameters down to the service layer.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const searchMembers = async (req, res, next) => {
  try {
    const data = await reportingService.searchMembers(req.query);
    return sendSuccess(res, 200, data, 'Members search report retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle searching loans for reports.
 * Passes validated query parameters down to the service layer.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const searchLoans = async (req, res, next) => {
  try {
    const data = await reportingService.searchLoans(req.query);
    return sendSuccess(res, 200, data, 'Loans search report retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle searching reservations for reports.
 * Passes validated query parameters down to the service layer.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const searchReservations = async (req, res, next) => {
  try {
    const data = await reportingService.searchReservations(req.query);
    return sendSuccess(res, 200, data, 'Reservations search report retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle searching orders for reports.
 * Passes validated query parameters down to the service layer.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const searchOrders = async (req, res, next) => {
  try {
    const data = await reportingService.searchOrders(req.query);
    return sendSuccess(res, 200, data, 'Orders search report retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle retrieving overdue report.
 * Passes validated query parameters down to the service layer.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getOverdueReport = async (req, res, next) => {
  try {
    const data = await reportingService.getOverdueReport(req.query);
    return sendSuccess(res, 200, data, 'Overdue report retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle retrieving inventory report.
 * Passes validated query parameters down to the service layer.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getInventoryReport = async (req, res, next) => {
  try {
    const data = await reportingService.getInventoryReport(req.query);
    return sendSuccess(res, 200, data, 'Inventory report retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Handle retrieving specific member activities report.
 * Passes validated route parameters and query filters combined down as a flat options object.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
export const getMemberReport = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const data = await reportingService.getMemberReport({ memberId, ...req.query });
    return sendSuccess(res, 200, data, 'Member report retrieved successfully.');
  } catch (error) {
    next(error);
  }
};
