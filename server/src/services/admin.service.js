import { prisma } from '../lib/prisma.js';
import { CopyStatus, LoanStatus, PaymentStatus } from '@prisma/client';
import { ApiError } from '../utils/index.js';

/**
 * Fetch aggregated statistics for the administrator dashboard.
 *
 * @returns {Promise<Object>} Aggregated counts
 */
export const getDashboardStats = async () => {
  const [
    totalUsers,
    totalBooks,
    totalBookCopies,
    availableCopies,
    borrowedCopies,
    activeLoans,
    pendingOrders,
    totalReviews,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.book.count(),
    prisma.bookCopy.count(),
    prisma.bookCopy.count({ where: { status: CopyStatus.AVAILABLE } }),
    prisma.bookCopy.count({ where: { status: CopyStatus.BORROWED } }),
    prisma.loan.count({ where: { status: { in: [LoanStatus.BORROWED, LoanStatus.OVERDUE] } } }),
    prisma.order.count({ where: { paymentStatus: PaymentStatus.PENDING } }),
    prisma.review.count(),
  ]);

  return {
    totalUsers,
    totalBooks,
    totalBookCopies,
    availableCopies,
    borrowedCopies,
    activeLoans,
    pendingOrders,
    totalReviews,
  };
};

/**
 * Fetch paginated, filtered list of users.
 *
 * @param {Object} params - Query parameters
 * @param {number} params.page - Current page
 * @param {number} params.limit - Max items per page
 * @param {string} [params.search] - Case-insensitive search on username or email
 * @param {string} [params.role] - Filter by role
 * @returns {Promise<Object>} Paginated users payload
 */
export const getUsers = async ({ page, limit, search, role }) => {
  const where = {};

  if (search) {
    where.OR = [
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) {
    where.role = role;
  }

  const skip = (page - 1) * limit;

  const [users, totalUsers] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      totalItems: totalUsers,
      totalPages: Math.ceil(totalUsers / limit) || 0,
    },
  };
};

/**
 * Fetch a single user by ID.
 *
 * @param {string} id - User ID
 * @returns {Promise<Object>} Public user details
 * @throws {ApiError} If user not found (404)
 */
export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  return user;
};
