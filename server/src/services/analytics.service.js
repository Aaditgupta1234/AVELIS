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
 * Enforces the soft-deletion policy by excluding reviews/loans belonging to soft-deleted books.
 * Dates are parsed and grouped using UTC daily periods.
 * Resulting lists sort books with alphabetical and ID secondary/tertiary fallbacks to ensure determinism.
 *
 * @param {Object} params - Query filters and limit
 * @param {string} [params.startDate] - ISO-8601 start date
 * @param {string} [params.endDate] - ISO-8601 end date
 * @param {number} [params.limit=10] - Maximum records for list arrays
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
 * Filters cohort based on registration date (`createdAt` of `MEMBER` users).
 * Deactivated users are included in the cohort to maintain historical integrity.
 * Note: fullName is reserved for future schema support and is currently returned as null.
 * Dates are grouped daily under UTC.
 *
 * @param {Object} params - Query filters and limit
 * @param {string} [params.startDate] - ISO-8601 start date
 * @param {string} [params.endDate] - ISO-8601 end date
 * @param {number} [params.limit=10] - Maximum records for list arrays
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
 * Enforces the soft-deletion policy by completely excluding reviews of soft-deleted books.
 * Enforces the user-to-book review uniqueness constraint (`@@unique([userId, bookId])`).
 * Dates are parsed and daily trend reviews are grouped in UTC.
 *
 * @param {Object} params - Query filters and limit
 * @param {string} [params.startDate] - ISO-8601 start date
 * @param {string} [params.endDate] - ISO-8601 end date
 * @param {number} [params.limit=10] - Maximum records for list arrays
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
 * Helper to retrieve the ISO-8601 Monday-Sunday week format string (YYYY-Www) in UTC.
 *
 * @param {Date} date - Date object
 * @returns {string} ISO week string
 */
const getIsoWeekString = (date) => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // Set to nearest Thursday: current date + 4 - current day number
  // Sunday is treated as day number 7
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  const formattedWeek = String(weekNo).padStart(2, '0');
  return `${d.getUTCFullYear()}-W${formattedWeek}`;
};

/**
 * Helper to retrieve the UTC monthly date string (YYYY-MM).
 *
 * @param {Date} date - Date object
 * @returns {string} Year-month string
 */
const getMonthString = (date) => {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
};

/**
 * Helper to retrieve the UTC daily date string (YYYY-MM-DD).
 *
 * @param {Date} date - Date object
 * @returns {string} Year-month-date string
 */
const getDayString = (date) => {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Helper to retrieve the UTC Monday of the week containing the given date.
 *
 * @param {Date} date - Date object
 * @returns {Date} Monday Date object in UTC
 */
const getMonday = (date) => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  return d;
};

/**
 * Build the query filters across multiple models for time-series date ranges.
 * Excludes soft-deleted book reviews and limits registrations to MEMBERs.
 *
 * @param {Object} params - Date params
 * @param {string} [params.startDate] - ISO-8601 start date
 * @param {string} [params.endDate] - ISO-8601 end date
 * @returns {Object} Prisma filters for each model
 */
const buildTimeSeriesFilter = ({ startDate, endDate }) => {
  const dateRange = {};
  if (startDate) {
    dateRange.gte = new Date(startDate);
  }
  if (endDate) {
    const normalizedEndDate = endDate.length === 10 ? `${endDate}T23:59:59.999Z` : endDate;
    dateRange.lte = new Date(normalizedEndDate);
  }

  const baseFilter = Object.keys(dateRange).length > 0 ? { createdAt: dateRange } : {};

  return {
    loans: baseFilter,
    reservations: baseFilter,
    orders: baseFilter,
    reviews: {
      ...baseFilter,
      book: {
        isDeleted: false
      }
    },
    registrations: {
      ...baseFilter,
      role: UserRole.MEMBER
    }
  };
};

/**
 * Core helper to group database records by period and count creations.
 *
 * @param {Array<Object>} records - Database records
 * @param {string} interval - Grouping interval (day, week, month)
 * @returns {Object} Key-value map of period to count
 */
const groupRecords = (records, interval) => {
  const counts = {};
  for (const r of records) {
    let key;
    if (interval === 'month') {
      key = getMonthString(r.createdAt);
    } else if (interval === 'week') {
      key = getIsoWeekString(r.createdAt);
    } else {
      key = getDayString(r.createdAt);
    }
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
};

/**
 * Group loan creations by period.
 *
 * @param {Array<Object>} loans - Loan records
 * @param {string} interval - Grouping interval
 * @returns {Object} Period count map
 */
const groupLoans = (loans, interval) => groupRecords(loans, interval);

/**
 * Group reservation creations by period.
 *
 * @param {Array<Object>} reservations - Reservation records
 * @param {string} interval - Grouping interval
 * @returns {Object} Period count map
 */
const groupReservations = (reservations, interval) => groupRecords(reservations, interval);

/**
 * Group order creations by period.
 *
 * @param {Array<Object>} orders - Order records
 * @param {string} interval - Grouping interval
 * @returns {Object} Period count map
 */
const groupOrders = (orders, interval) => groupRecords(orders, interval);

/**
 * Group review creations by period.
 *
 * @param {Array<Object>} reviews - Review records
 * @param {string} interval - Grouping interval
 * @returns {Object} Period count map
 */
const groupReviews = (reviews, interval) => groupRecords(reviews, interval);

/**
 * Group registration creations by period.
 *
 * @param {Array<Object>} registrations - User records
 * @param {string} interval - Grouping interval
 * @returns {Object} Period count map
 */
const groupRegistrations = (registrations, interval) => groupRecords(registrations, interval);

/**
 * Construct a complete, chronologically sorted, gap-filled timeline of metrics.
 * 
 * Period boundaries are defined as:
 * - Daily: UTC midnight to UTC midnight.
 * - Weekly: ISO-8601 Monday–Sunday weeks.
 * - Monthly: Calendar months in UTC.
 * 
 * Guarantee:
 * - Output is always returned in ascending chronological order.
 * - Missing periods are backfilled with zero values.
 * 
 * Future Scaling Note:
 * - Enforce a maximum date range limit on query validation (e.g. max 1 year for daily timelines)
 *   to avoid generating excessively large arrays in memory during gap filling.
 *
 * @param {Date} start - Timeline start date
 * @param {Date} end - Timeline end date
 * @param {string} interval - Timeline interval (day, week, month)
 * @param {Object} loansMap - Grouped loan counts
 * @param {Object} reservationsMap - Grouped reservation counts
 * @param {Object} ordersMap - Grouped order counts
 * @param {Object} reviewsMap - Grouped review counts
 * @param {Object} registrationsMap - Grouped registration counts
 * @returns {Array<Object>} Complete gap-filled activity timeline
 */
const buildTimeline = (
  start,
  end,
  interval,
  loansMap,
  reservationsMap,
  ordersMap,
  reviewsMap,
  registrationsMap
) => {
  if (!start) return [];

  const periods = [];
  if (interval === 'month') {
    let current = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    const endUTC = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
    while (current <= endUTC) {
      periods.push(getMonthString(current));
      current.setUTCMonth(current.getUTCMonth() + 1);
    }
  } else if (interval === 'week') {
    let current = getMonday(start);
    const endMonday = getMonday(end);
    while (current <= endMonday) {
      periods.push(getIsoWeekString(current));
      current.setUTCDate(current.getUTCDate() + 7);
    }
  } else {
    let current = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
    const endUTC = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
    while (current <= endUTC) {
      periods.push(getDayString(current));
      current.setUTCDate(current.getUTCDate() + 1);
    }
  }

  return periods.map(period => ({
    period,
    loans: loansMap[period] || 0,
    reservations: reservationsMap[period] || 0,
    orders: ordersMap[period] || 0,
    reviews: reviewsMap[period] || 0,
    registrations: registrationsMap[period] || 0
  }));
};

/**
 * Retrieve time-series activity analytics.
 * Concurrently queries loans, reservations, orders, reviews, and user registrations in UTC.
 * Soft-deletion filters apply to reviews. Registration filters count MEMBER users only.
 * Output is guaranteed to be returned in ascending chronological order with gap-filled zero values.
 *
 * @param {Object} params - Query filters and interval
 * @param {string} [params.startDate] - ISO-8601 start date
 * @param {string} [params.endDate] - ISO-8601 end date
 * @param {string} [params.interval='day'] - Grouping interval (day, week, month)
 * @returns {Promise<Object>} Time-series analytics data structure
 */
export const getTimeSeriesAnalytics = async ({ startDate, endDate, interval = 'day' } = {}) => {
  const filters = buildTimeSeriesFilter({ startDate, endDate });

  const [loans, reservations, orders, reviews, registrations] = await Promise.all([
    prisma.loan.findMany({ where: filters.loans, select: { createdAt: true } }),
    prisma.reservation.findMany({ where: filters.reservations, select: { createdAt: true } }),
    prisma.order.findMany({ where: filters.orders, select: { createdAt: true } }),
    prisma.review.findMany({ where: filters.reviews, select: { createdAt: true } }),
    prisma.user.findMany({ where: filters.registrations, select: { createdAt: true } })
  ]);

  let start = null;
  let end = null;

  if (startDate) {
    start = new Date(startDate);
  } else {
    const allDates = [
      ...loans.map(l => l.createdAt),
      ...reservations.map(r => r.createdAt),
      ...orders.map(o => o.createdAt),
      ...reviews.map(r => r.createdAt),
      ...registrations.map(r => r.createdAt)
    ];
    if (allDates.length > 0) {
      start = new Date(Math.min(...allDates.map(d => d.getTime())));
    }
  }

  if (endDate) {
    end = new Date(endDate.length === 10 ? `${endDate}T23:59:59.999Z` : endDate);
  } else {
    const allDates = [
      ...loans.map(l => l.createdAt),
      ...reservations.map(r => r.createdAt),
      ...orders.map(o => o.createdAt),
      ...reviews.map(r => r.createdAt),
      ...registrations.map(r => r.createdAt)
    ];
    if (allDates.length > 0) {
      end = new Date(Math.max(...allDates.map(d => d.getTime()), Date.now()));
    } else {
      end = new Date();
    }
  }

  const loansMap = groupLoans(loans, interval);
  const reservationsMap = groupReservations(reservations, interval);
  const ordersMap = groupOrders(orders, interval);
  const reviewsMap = groupReviews(reviews, interval);
  const registrationsMap = groupRegistrations(registrations, interval);

  const timeline = buildTimeline(
    start,
    end,
    interval,
    loansMap,
    reservationsMap,
    ordersMap,
    reviewsMap,
    registrationsMap
  );

  return {
    filter: {
      startDate: startDate || null,
      endDate: endDate || null,
      interval
    },
    timeline
  };
};
