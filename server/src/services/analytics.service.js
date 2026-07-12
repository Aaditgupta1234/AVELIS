/**
 * @fileoverview Analytics module service.
 *
 * Scaffolds the business logic interface for administrative analytics.
 *
 * @module services/analytics
 */

import { ApiError } from '../utils/index.js';

import { prisma } from '../lib/prisma.js';
import { LoanStatus } from '@prisma/client';

/**
 * Build the query filter object for borrowing analytics date ranges.
 *
 * @param {Object} params - Date params
 * @param {string} [params.startDate] - ISO-8601 start date
 * @param {string} [params.endDate] - ISO-8601 end date
 * @returns {Object} Prisma filter object
 */
const buildAnalyticsFilter = ({ startDate, endDate }) => {
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
 * Retrieve borrowing overview metrics.
 *
 * @param {Object} filter - Prisma date range criteria
 * @returns {Promise<Object>} Overview statistics
 */
const getBorrowOverview = async (filter) => {
  const groups = await prisma.loan.groupBy({
    by: ['status'],
    where: filter,
    _count: {
      id: true
    }
  });

  let totalLoans = 0;
  let activeLoans = 0;
  let returnedLoans = 0;
  let overdueLoans = 0;

  for (const group of groups) {
    const count = group._count.id || 0;
    totalLoans += count;
    if (group.status === LoanStatus.RETURNED) {
      returnedLoans = count;
    } else if (group.status === LoanStatus.BORROWED) {
      activeLoans += count;
    } else if (group.status === LoanStatus.OVERDUE) {
      overdueLoans = count;
      activeLoans += count;
    }
  }

  return {
    totalLoans,
    activeLoans,
    returnedLoans,
    overdueLoans
  };
};

/**
 * Retrieve the most borrowed books.
 *
 * @param {Object} filter - Prisma date range criteria
 * @param {number} limit - Maximum number of books to return
 * @returns {Promise<Array<Object>>} Most borrowed books
 */
const getMostBorrowedBooks = async (filter, limit) => {
  const loans = await prisma.loan.findMany({
    where: {
      status: LoanStatus.RETURNED,
      ...filter,
      bookCopy: {
        book: {
          isDeleted: false
        }
      }
    },
    select: {
      bookCopy: {
        select: {
          book: {
            select: {
              id: true,
              title: true,
              authors: {
                select: {
                  author: {
                    select: {
                      fullName: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  const bookMap = {};
  for (const loan of loans) {
    const book = loan.bookCopy?.book;
    if (!book) continue;

    const authorName = book.authors
      .map(a => a.author?.fullName)
      .filter(Boolean)
      .join(', ') || 'Unknown';

    if (!bookMap[book.id]) {
      bookMap[book.id] = {
        bookId: book.id,
        title: book.title,
        author: authorName,
        borrowCount: 0
      };
    }
    bookMap[book.id].borrowCount++;
  }

  return Object.values(bookMap)
    .sort((a, b) => {
      if (b.borrowCount !== a.borrowCount) {
        return b.borrowCount - a.borrowCount;
      }
      const titleCompare = a.title.localeCompare(b.title);
      if (titleCompare !== 0) {
        return titleCompare;
      }
      return a.bookId.localeCompare(b.bookId);
    })
    .slice(0, limit);
};

/**
 * Retrieve borrowing frequency grouped daily.
 *
 * @param {Object} filter - Prisma date range criteria
 * @returns {Promise<Array<Object>>} Daily borrowing counts
 */
const getBorrowFrequency = async (filter) => {
  const loans = await prisma.loan.findMany({
    where: filter,
    select: {
      createdAt: true
    }
  });

  const frequencyMap = {};
  for (const loan of loans) {
    const dateStr = loan.createdAt.toISOString().split('T')[0];
    frequencyMap[dateStr] = (frequencyMap[dateStr] || 0) + 1;
  }

  return Object.entries(frequencyMap)
    .map(([date, borrowCount]) => ({
      date,
      borrowCount
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Retrieve top borrowed book categories.
 *
 * @param {Object} filter - Prisma date range criteria
 * @returns {Promise<Array<Object>>} Top borrowed categories
 */
const getTopBorrowedCategories = async (filter) => {
  const loans = await prisma.loan.findMany({
    where: {
      ...filter,
      bookCopy: {
        book: {
          isDeleted: false
        }
      }
    },
    select: {
      bookCopy: {
        select: {
          book: {
            select: {
              categories: {
                select: {
                  category: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  const categoryMap = {};
  for (const loan of loans) {
    const categories = loan.bookCopy?.book?.categories || [];
    for (const bc of categories) {
      const cat = bc.category;
      if (!cat) continue;
      if (!categoryMap[cat.id]) {
        categoryMap[cat.id] = {
          categoryId: cat.id,
          categoryName: cat.name,
          borrowCount: 0
        };
      }
      categoryMap[cat.id].borrowCount++;
    }
  }

  return Object.values(categoryMap)
    .sort((a, b) => b.borrowCount - a.borrowCount);
};

/**
 * Retrieve count distribution of loan statuses.
 *
 * @param {Object} filter - Prisma date range criteria
 * @returns {Promise<Object>} Status counts
 */
const getLoanStatusDistribution = async (filter) => {
  const groups = await prisma.loan.groupBy({
    by: ['status'],
    where: filter,
    _count: {
      id: true
    }
  });

  let active = 0;
  let returned = 0;
  let overdue = 0;

  for (const group of groups) {
    const count = group._count.id || 0;
    if (group.status === LoanStatus.BORROWED) {
      active = count;
    } else if (group.status === LoanStatus.RETURNED) {
      returned = count;
    } else if (group.status === LoanStatus.OVERDUE) {
      overdue = count;
    }
  }

  return {
    active,
    returned,
    overdue
  };
};

/**
 * Retrieve borrowing analytics.
 *
 * @param {Object} params - Query filters and limit
 * @returns {Promise<Object>} Borrowing analytics data structure
 */
export const getBorrowingAnalytics = async ({ startDate, endDate, limit = 10 } = {}) => {
  const filter = buildAnalyticsFilter({ startDate, endDate });

  const [overview, mostBorrowedBooks, borrowFrequency, topCategories, statusDistribution] = await Promise.all([
    getBorrowOverview(filter),
    getMostBorrowedBooks(filter, limit),
    getBorrowFrequency(filter),
    getTopBorrowedCategories(filter),
    getLoanStatusDistribution(filter)
  ]);

  return {
    filter: {
      startDate: startDate || null,
      endDate: endDate || null,
      limit
    },
    overview,
    mostBorrowedBooks,
    borrowFrequency,
    topCategories,
    statusDistribution
  };
};

/**
 * Retrieve member analytics.
 *
 * @returns {Promise<Object>} Placeholder that throws 501 Not Implemented
 * @throws {ApiError} 501 Not implemented
 */
export const getMemberAnalytics = async () => {
  throw new ApiError(501, 'Member Analytics endpoint not implemented yet.');
};

/**
 * Retrieve rating analytics.
 *
 * @returns {Promise<Object>} Placeholder that throws 501 Not Implemented
 * @throws {ApiError} 501 Not implemented
 */
export const getRatingAnalytics = async () => {
  throw new ApiError(501, 'Rating Analytics endpoint not implemented yet.');
};

/**
 * Retrieve time-series analytics.
 *
 * @returns {Promise<Object>} Placeholder that throws 501 Not Implemented
 * @throws {ApiError} 501 Not implemented
 */
export const getTimeSeriesAnalytics = async () => {
  throw new ApiError(501, 'Time-Series Analytics endpoint not implemented yet.');
};
