/**
 * @fileoverview Analytics module service.
 *
 * Scaffolds the business logic interface for administrative analytics.
 *
 * @module services/analytics
 */

import { ApiError } from '../utils/index.js';

import { prisma } from '../lib/prisma.js';
import { LoanStatus, UserRole } from '@prisma/client';

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
 * Build the query filter object for member analytics cohorts based on registration date.
 *
 * @param {Object} params - Date params
 * @param {string} [params.startDate] - ISO-8601 start date
 * @param {string} [params.endDate] - ISO-8601 end date
 * @returns {Object} Prisma filter object
 */
const buildMemberFilter = ({ startDate, endDate }) => {
  const filter = {
    role: UserRole.MEMBER
  };
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
 * Retrieve overview statistics for the filtered member cohort.
 *
 * @param {Object} filter - Prisma user cohort filter
 * @returns {Promise<Object>} Member overview counts
 */
const getMemberOverview = async (filter) => {
  const [totalMembers, activeMembers, inactiveMembers, membersWithActiveLoans] = await Promise.all([
    prisma.user.count({ where: filter }),
    prisma.user.count({ where: { ...filter, isActive: true } }),
    prisma.user.count({ where: { ...filter, isActive: false } }),
    prisma.user.count({
      where: {
        ...filter,
        loans: {
          some: {
            status: { in: [LoanStatus.BORROWED, LoanStatus.OVERDUE] }
          }
        }
      }
    })
  ]);

  return {
    totalMembers,
    activeMembers,
    inactiveMembers,
    membersWithActiveLoans
  };
};

/**
 * Retrieve the most active members.
 *
 * fullName is reserved for future schema support and is currently returned as null.
 * Deactivated users are included in the cohort to preserve historical analytics integrity.
 *
 * @param {Object} filter - Prisma user cohort filter
 * @param {number} limit - Maximum number of members to return
 * @returns {Promise<Array<Object>>} List of active members
 */
const getMostActiveMembers = async (filter, limit) => {
  const members = await prisma.user.findMany({
    where: filter,
    select: {
      id: true,
      username: true,
      loans: {
        select: {
          status: true
        }
      }
    }
  });

  const memberData = members.map(m => {
    const borrowCount = m.loans.length;
    const activeLoans = m.loans.filter(l => l.status === LoanStatus.BORROWED || l.status === LoanStatus.OVERDUE).length;
    return {
      memberId: m.id,
      username: m.username,
      fullName: null,
      borrowCount,
      activeLoans
    };
  });

  return memberData
    .sort((a, b) => {
      if (b.borrowCount !== a.borrowCount) {
        return b.borrowCount - a.borrowCount;
      }
      return a.username.localeCompare(b.username);
    })
    .slice(0, limit);
};

/**
 * Retrieve daily member registrations chronological trend.
 *
 * @param {Object} filter - Prisma user cohort filter
 * @returns {Promise<Array<Object>>} Daily registration counts
 */
const getRegistrationTrend = async (filter) => {
  const members = await prisma.user.findMany({
    where: filter,
    select: {
      createdAt: true
    }
  });

  const trendMap = {};
  for (const m of members) {
    const dateStr = m.createdAt.toISOString().split('T')[0];
    trendMap[dateStr] = (trendMap[dateStr] || 0) + 1;
  }

  return Object.entries(trendMap)
    .map(([date, registrations]) => ({
      date,
      registrations
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Categorize cohort members based on their total historical borrowing counts.
 *
 * @param {Object} filter - Prisma user cohort filter
 * @returns {Promise<Object>} Distribution counts
 */
const getBorrowActivityDistribution = async (filter) => {
  const members = await prisma.user.findMany({
    where: filter,
    select: {
      loans: {
        select: {
          id: true
        }
      }
    }
  });

  let zeroLoans = 0;
  let oneToFiveLoans = 0;
  let sixToTenLoans = 0;
  let moreThanTenLoans = 0;

  for (const m of members) {
    const count = m.loans.length;
    if (count === 0) {
      zeroLoans++;
    } else if (count >= 1 && count <= 5) {
      oneToFiveLoans++;
    } else if (count >= 6 && count <= 10) {
      sixToTenLoans++;
    } else if (count > 10) {
      moreThanTenLoans++;
    }
  }

  return {
    zeroLoans,
    oneToFiveLoans,
    sixToTenLoans,
    moreThanTenLoans
  };
};

/**
 * Retrieve member analytics.
 *
 * @param {Object} params - Query filters and limit
 * @returns {Promise<Object>} Member analytics data structure
 */
export const getMemberAnalytics = async ({ startDate, endDate, limit = 10 } = {}) => {
  const filter = buildMemberFilter({ startDate, endDate });

  const [overview, mostActiveMembers, registrationTrend, borrowActivityDistribution] = await Promise.all([
    getMemberOverview(filter),
    getMostActiveMembers(filter, limit),
    getRegistrationTrend(filter),
    getBorrowActivityDistribution(filter)
  ]);

  return {
    filter: {
      startDate: startDate || null,
      endDate: endDate || null,
      limit
    },
    overview,
    mostActiveMembers,
    registrationTrend,
    borrowActivityDistribution
  };
};

/**
 * Build the query filter object for rating analytics based on review creation date.
 * Enforces the policy that reviews belonging to soft-deleted books are fully excluded.
 *
 * @param {Object} params - Date params
 * @param {string} [params.startDate] - ISO-8601 start date
 * @param {string} [params.endDate] - ISO-8601 end date
 * @returns {Object} Prisma filter object
 */
const buildRatingFilter = ({ startDate, endDate }) => {
  const filter = {
    book: {
      isDeleted: false
    }
  };
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
 * Retrieve overview statistics for the filtered ratings.
 *
 * @param {Object} filter - Prisma review filter
 * @returns {Promise<Object>} Rating overview counts
 */
const getRatingOverview = async (filter) => {
  const aggregate = await prisma.review.aggregate({
    where: filter,
    _count: {
      id: true
    },
    _avg: {
      rating: true
    }
  });

  const [fiveStarReviews, oneStarReviews] = await Promise.all([
    prisma.review.count({ where: { ...filter, rating: 5 } }),
    prisma.review.count({ where: { ...filter, rating: 1 } })
  ]);

  const totalReviews = aggregate._count.id || 0;
  const averageRating = totalReviews > 0 ? Number((aggregate._avg.rating || 0).toFixed(2)) : 0;

  return {
    totalReviews,
    averageRating,
    fiveStarReviews,
    oneStarReviews
  };
};

/**
 * Retrieve the highest rated books based on filtered reviews.
 * The system enforces a unique constraint @@unique([userId, bookId]),
 * meaning each user can post at most one review per book.
 *
 * @param {Object} filter - Prisma review filter
 * @param {number} limit - Maximum number of books to return
 * @returns {Promise<Array<Object>>} Highest rated books
 */
const getHighestRatedBooks = async (filter, limit) => {
  const reviewGroups = await prisma.review.groupBy({
    by: ['bookId'],
    where: filter,
    _avg: {
      rating: true
    },
    _count: {
      id: true
    }
  });

  if (reviewGroups.length === 0) return [];

  const books = await prisma.book.findMany({
    where: {
      id: { in: reviewGroups.map(g => g.bookId) },
      isDeleted: false
    },
    select: {
      id: true,
      title: true
    }
  });

  const bookRatings = reviewGroups
    .map(g => {
      const book = books.find(b => b.id === g.bookId);
      if (!book) return null;
      const averageRating = Number((g._avg.rating || 0).toFixed(2));
      return {
        bookId: g.bookId,
        title: book.title,
        averageRating,
        reviewCount: g._count.id || 0
      };
    })
    .filter(Boolean);

  return bookRatings
    .sort((a, b) => {
      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating;
      }
      if (b.reviewCount !== a.reviewCount) {
        return b.reviewCount - a.reviewCount;
      }
      return a.title.localeCompare(b.title);
    })
    .slice(0, limit);
};

/**
 * Retrieve the lowest rated books based on filtered reviews.
 *
 * @param {Object} filter - Prisma review filter
 * @param {number} limit - Maximum number of books to return
 * @returns {Promise<Array<Object>>} Lowest rated books
 */
const getLowestRatedBooks = async (filter, limit) => {
  const reviewGroups = await prisma.review.groupBy({
    by: ['bookId'],
    where: filter,
    _avg: {
      rating: true
    },
    _count: {
      id: true
    }
  });

  if (reviewGroups.length === 0) return [];

  const books = await prisma.book.findMany({
    where: {
      id: { in: reviewGroups.map(g => g.bookId) },
      isDeleted: false
    },
    select: {
      id: true,
      title: true
    }
  });

  const bookRatings = reviewGroups
    .map(g => {
      const book = books.find(b => b.id === g.bookId);
      if (!book) return null;
      const averageRating = Number((g._avg.rating || 0).toFixed(2));
      return {
        bookId: g.bookId,
        title: book.title,
        averageRating,
        reviewCount: g._count.id || 0
      };
    })
    .filter(Boolean);

  return bookRatings
    .sort((a, b) => {
      if (a.averageRating !== b.averageRating) {
        return a.averageRating - b.averageRating;
      }
      if (b.reviewCount !== a.reviewCount) {
        return b.reviewCount - a.reviewCount;
      }
      return a.title.localeCompare(b.title);
    })
    .slice(0, limit);
};

/**
 * Retrieve count distribution of rating scores.
 *
 * @param {Object} filter - Prisma review filter
 * @returns {Promise<Object>} Score distribution counts
 */
const getRatingDistribution = async (filter) => {
  const groups = await prisma.review.groupBy({
    by: ['rating'],
    where: filter,
    _count: {
      id: true
    }
  });

  let oneStar = 0;
  let twoStar = 0;
  let threeStar = 0;
  let fourStar = 0;
  let fiveStar = 0;

  for (const g of groups) {
    const count = g._count.id || 0;
    if (g.rating === 1) oneStar = count;
    else if (g.rating === 2) twoStar = count;
    else if (g.rating === 3) threeStar = count;
    else if (g.rating === 4) fourStar = count;
    else if (g.rating === 5) fiveStar = count;
  }

  return {
    oneStar,
    twoStar,
    threeStar,
    fourStar,
    fiveStar
  };
};

/**
 * Retrieve daily review creations chronological trend.
 *
 * @param {Object} filter - Prisma review filter
 * @returns {Promise<Array<Object>>} Daily review counts
 */
const getReviewTrend = async (filter) => {
  const reviews = await prisma.review.findMany({
    where: filter,
    select: {
      createdAt: true
    }
  });

  const trendMap = {};
  for (const r of reviews) {
    const dateStr = r.createdAt.toISOString().split('T')[0];
    trendMap[dateStr] = (trendMap[dateStr] || 0) + 1;
  }

  return Object.entries(trendMap)
    .map(([date, reviews]) => ({
      date,
      reviews
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Retrieve rating analytics.
 *
 * @param {Object} params - Query filters and limit
 * @returns {Promise<Object>} Rating analytics data structure
 */
export const getRatingAnalytics = async ({ startDate, endDate, limit = 10 } = {}) => {
  const filter = buildRatingFilter({ startDate, endDate });

  const [overview, highestRatedBooks, lowestRatedBooks, ratingDistribution, reviewTrend] = await Promise.all([
    getRatingOverview(filter),
    getHighestRatedBooks(filter, limit),
    getLowestRatedBooks(filter, limit),
    getRatingDistribution(filter),
    getReviewTrend(filter)
  ]);

  return {
    filter: {
      startDate: startDate || null,
      endDate: endDate || null,
      limit
    },
    overview,
    highestRatedBooks,
    lowestRatedBooks,
    ratingDistribution,
    reviewTrend
  };
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
