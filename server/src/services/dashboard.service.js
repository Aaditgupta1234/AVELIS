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
 * @returns {Promise<{total: number, active: number}>} User metrics
 */
const getUserStatistics = async () => {
  const userGroups = await prisma.user.groupBy({
    by: ['isActive'],
    _count: { id: true }
  });

  let total = 0;
  let active = 0;

  for (const group of userGroups) {
    const count = group._count.id;
    total += count;
    if (group.isActive) {
      active = count;
    }
  }

  return { total, active };
};

/**
 * Retrieve book inventory statistics.
 *
 * FILTERING POLICY (Cumulative):
 * Book inventory metrics reflect the physical current state of cataloged books and copies,
 * and are intentionally unfiltered by date range to show current overall available resources.
 *
 * @returns {Promise<{total: number, copies: number, availableCopies: number}>} Book metrics
 */
const getBookStatistics = async () => {
  const [total, copyGroups] = await Promise.all([
    prisma.book.count({ where: { isDeleted: false } }),
    prisma.bookCopy.groupBy({
      by: ['status'],
      where: { book: { isDeleted: false } },
      _count: { id: true }
    })
  ]);

  let copies = 0;
  let availableCopies = 0;

  for (const group of copyGroups) {
    const count = group._count.id;
    copies += count;
    if (group.status === CopyStatus.AVAILABLE) {
      availableCopies = count;
    }
  }

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
  const loanGroups = await prisma.loan.groupBy({
    by: ['status'],
    where: filter,
    _count: { id: true }
  });

  let total = 0;
  let active = 0;
  let overdue = 0;

  for (const group of loanGroups) {
    const count = group._count.id;
    total += count;
    if (group.status === LoanStatus.BORROWED || group.status === LoanStatus.OVERDUE) {
      active += count;
    }
    if (group.status === LoanStatus.OVERDUE) {
      overdue = count;
    }
  }

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
 * @returns {Promise<{total: number, pending: number, fulfilled: number}>} Reservation metrics
 */
const getReservationStatistics = async (filter) => {
  const reservationGroups = await prisma.reservation.groupBy({
    by: ['status'],
    where: filter,
    _count: { id: true }
  });

  let total = 0;
  let pending = 0;
  let fulfilled = 0;

  for (const group of reservationGroups) {
    const count = group._count.id;
    total += count;
    if (group.status === ReservationStatus.PENDING || group.status === ReservationStatus.READY_FOR_PICKUP) {
      pending += count;
    }
    if (group.status === ReservationStatus.COMPLETED) {
      fulfilled = count;
    }
  }

  return { total, pending, fulfilled };
};

/**
 * Retrieve order statistics.
 *
 * FILTERING POLICY (Transactional):
 * Orders represent catalog sales activity, and are filtered by the date range
 * to track volume and pending logistics/deliveries within the period.
 *
 * @param {Object} filter - Prisma date range criteria
 * @returns {Promise<{total: number, pending: number, completed: number}>} Order metrics
 */
const getOrderStatistics = async (filter) => {
  const orderGroups = await prisma.order.groupBy({
    by: ['orderStatus'],
    where: filter,
    _count: { id: true }
    // Ensure we filter out orders of deleted users if soft-deleted users are tracked,
    // but the current database schema does not have soft delete on users.
  });

  let total = 0;
  let pending = 0;
  let completed = 0;

  for (const group of orderGroups) {
    const count = group._count.id;
    total += count;
    if (group.orderStatus === OrderStatus.PLACED || group.orderStatus === OrderStatus.PROCESSING || group.orderStatus === OrderStatus.SHIPPED) {
      pending += count;
    }
    if (group.orderStatus === OrderStatus.DELIVERED) {
      completed = count;
    }
  }

  return { total, pending, completed };
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
    getUserStatistics(),
    getBookStatistics(),
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
