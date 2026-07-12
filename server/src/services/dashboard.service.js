/**
 * @fileoverview Dashboard module service.
 *
 * Scaffolds the business logic interface for admin dashboard stats, analytics, and reports.
 *
 * @module services/dashboard
 */

import { ApiError } from '../utils/index.js';

import { prisma } from '../lib/prisma.js';
import { CopyStatus, LoanStatus, ReservationStatus, OrderStatus } from '@prisma/client';

/**
 * Build the reusable query filter object for transactional date ranges.
 * If endDate is date-only (length 10), it is normalized to the end of that day (23:59:59.999Z).
 *
 * @param {Object} params - Date params
 * @param {string} [params.startDate] - ISO-8601 start date
 * @param {string} [params.endDate] - ISO-8601 end date
 * @returns {Object} Prisma filter object
 */
const buildDashboardFilter = ({ startDate, endDate }) => {
  const filter = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      const normalizedEndDate = endDate.length === 10 ? `${endDate}T23:59:59.999Z` : endDate;
      filter.createdAt.lte = new Date(normalizedEndDate);
    }
  }
  return filter;
};

/**
 * Retrieve user statistics.
 *
 * FILTERING POLICY (Cumulative):
 * Both total and active user counts represent current inventory state,
 * and are intentionally unfiltered by date range to reflect the current library enrollment.
 *
 * @param {Object} filter - Prisma date range criteria (unused here)
 * @returns {Promise<{total: number, active: number}>} User metrics
 */
const getUserStatistics = async (filter) => {
  const [total, active] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } })
  ]);
  return { total, active };
};

/**
 * Retrieve book inventory statistics.
 *
 * FILTERING POLICY (Cumulative):
 * Book inventory metrics reflect the physical current state of cataloged books and copies,
 * and are intentionally unfiltered by date range to show current overall available resources.
 *
 * @param {Object} filter - Prisma date range criteria (unused here)
 * @returns {Promise<{total: number, copies: number, availableCopies: number}>} Book metrics
 */
const getBookStatistics = async (filter) => {
  const [total, copies, availableCopies] = await Promise.all([
    prisma.book.count(),
    prisma.bookCopy.count(),
    prisma.bookCopy.count({ where: { status: CopyStatus.AVAILABLE } })
  ]);
  return { total, copies, availableCopies };
};

/**
 * Retrieve loan activity statistics.
 *
 * FILTERING POLICY (Transactional):
 * Loans represent transactions/activity, and all metrics are filtered by the selected date range
 * to measure borrow activity and overdue occurrences within the requested period.
 *
 * @param {Object} filter - Prisma date range criteria
 * @returns {Promise<{total: number, active: number, overdue: number}>} Loan metrics
 */
const getLoanStatistics = async (filter) => {
  const [total, active, overdue] = await Promise.all([
    prisma.loan.count({ where: filter }),
    prisma.loan.count({
      where: {
        ...filter,
        status: { in: [LoanStatus.BORROWED, LoanStatus.OVERDUE] }
      }
    }),
    prisma.loan.count({
      where: {
        ...filter,
        status: LoanStatus.OVERDUE
      }
    })
  ]);
  return { total, active, overdue };
};

/**
 * Retrieve reservation activity statistics.
 *
 * FILTERING POLICY (Transactional):
 * Reservations represent user activity, and are filtered by the date range
 * to measure reservation demand and active waitlists within the period.
 *
 * @param {Object} filter - Prisma date range criteria
 * @returns {Promise<{total: number, active: number}>} Reservation metrics
 */
const getReservationStatistics = async (filter) => {
  const [total, active] = await Promise.all([
    prisma.reservation.count({ where: filter }),
    prisma.reservation.count({
      where: {
        ...filter,
        status: { in: [ReservationStatus.PENDING, ReservationStatus.READY_FOR_PICKUP] }
      }
    })
  ]);
  return { total, active };
};

/**
 * Retrieve order statistics.
 *
 * FILTERING POLICY (Transactional):
 * Orders represent catalog sales activity, and are filtered by the date range
 * to track volume and pending logistics/deliveries within the period.
 *
 * @param {Object} filter - Prisma date range criteria
 * @returns {Promise<{total: number, pending: number}>} Order metrics
 */
const getOrderStatistics = async (filter) => {
  const [total, pending] = await Promise.all([
    prisma.order.count({ where: filter }),
    prisma.order.count({
      where: {
        ...filter,
        orderStatus: { in: [OrderStatus.PLACED, OrderStatus.PROCESSING, OrderStatus.SHIPPED] }
      }
    })
  ]);
  return { total, pending };
};

/**
 * Retrieve administrative dashboard summary stats.
 *
 * Coordinates concurrent calls to statistical helper methods and formats the response.
 *
 * @param {Object} params - Query filters
 * @param {string} [params.startDate] - ISO-8601 start date
 * @param {string} [params.endDate] - ISO-8601 end date
 * @returns {Promise<Object>} Formatted dashboard summary statistics
 */
export const getDashboardSummary = async ({ startDate, endDate } = {}) => {
  const filter = buildDashboardFilter({ startDate, endDate });

  const [users, books, loans, reservations, orders] = await Promise.all([
    getUserStatistics(filter),
    getBookStatistics(filter),
    getLoanStatistics(filter),
    getReservationStatistics(filter),
    getOrderStatistics(filter)
  ]);

  return {
    filter: {
      startDate: startDate || null,
      endDate: endDate || null
    },
    users,
    books,
    loans,
    reservations,
    orders
  };
};

/**
 * Retrieve administrative analytics.
 *
 * @returns {Promise<Object>} Placeholder that throws 501 Not Implemented
 * @throws {ApiError} 501 Not implemented
 */
export const getAnalytics = async () => {
  throw new ApiError(501, 'Analytics endpoint not implemented yet.');
};

/**
 * Retrieve administrative reports.
 *
 * @returns {Promise<Object>} Placeholder that throws 501 Not Implemented
 * @throws {ApiError} 501 Not implemented
 */
export const getReports = async () => {
  throw new ApiError(501, 'Reports endpoint not implemented yet.');
};
