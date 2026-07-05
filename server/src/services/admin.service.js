import { prisma } from '../lib/prisma.js';
import { CopyStatus, LoanStatus, PaymentStatus } from '@prisma/client';

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
