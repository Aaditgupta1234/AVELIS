/**
 * @fileoverview Reporting module service.
 *
 * Implements business logic for administrative reports search.
 * Provides helper functions for pagination, sorting allow-lists, and date filters.
 *
 * @module modules/reporting/service
 */

import { ApiError } from '../../utils/index.js';
import { prisma } from '../../lib/prisma.js';
import { LoanStatus, CopyStatus, CopyCondition, UserRole } from '@prisma/client';
import { USER_SELECT } from '../../shared/selects/user.select.js';
import { LOAN_SELECT } from '../../shared/selects/loan.select.js';
import { RESERVATION_SELECT } from '../../shared/selects/reservation.select.js';
import { REVIEW_SELECT } from '../../shared/selects/review.select.js';

const MEMBER_REPORT_ORDER_SELECT = {
  id: true,
  orderNumber: true,
  totalAmount: true,
  paymentStatus: true,
  orderStatus: true,
  shippingAddress: true,
  orderedAt: true,
  createdAt: true
};

const OVERDUE_SEVERITY = {
  LOW_MAX_DAYS: 7,
  MEDIUM_MAX_DAYS: 30,
};

// ==========================================
// PRIVATE SERVICE HELPERS (Not Exported)
// ==========================================

/**
 * Build pagination offset boundaries (skip and take).
 * Defaults to page 1 and limit 10 if missing.
 *
 * @param {Object} filters - Input filters query object
 * @param {number} [filters.page] - Page index
 * @param {number} [filters.limit] - Page size limit
 * @returns {Object} Pagination parameters (skip, take, page, limit)
 */
const buildPagination = ({ page, limit }) => {
  const resolvedPage = page !== undefined ? page : 1;
  const resolvedLimit = limit !== undefined ? limit : 10;
  return {
    skip: (resolvedPage - 1) * resolvedLimit,
    take: resolvedLimit,
    page: resolvedPage,
    limit: resolvedLimit
  };
};

/**
 * Construct standard pagination metadata output object.
 *
 * @param {number} totalItems - Total matching records count
 * @param {number} page - Current page index
 * @param {number} limit - Current limit size
 * @returns {Object} Standard AVELIS pagination metadata
 */
const buildPaginationMetadata = (totalItems, page, limit) => {
  const totalPages = Math.ceil(totalItems / limit) || 0;
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1 && totalItems > 0;
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage,
    hasPreviousPage
  };
};

/**
 * Construct Prisma sorting criteria safety-checked against an allow-list.
 *
 * @param {Object} filters - Input filters query object
 * @param {string} [filters.sortBy] - Sort field parameter
 * @param {string} [filters.sortOrder] - Sort order ('asc' | 'desc')
 * @param {string[]} allowedFields - Valid sorting field names for the entity
 * @param {string} defaultSortBy - Default sort field fallback
 * @param {string} [defaultSortOrder='desc'] - Default sort order fallback
 * @returns {Object} Prisma orderBy sorting clause
 */
const buildSorting = ({ sortBy, sortOrder }, allowedFields, defaultSortBy, defaultSortOrder = 'desc') => {
  const field = sortBy && allowedFields.includes(sortBy) ? sortBy : defaultSortBy;
  const order = sortOrder ? sortOrder : defaultSortOrder;
  return { [field]: order };
};

/**
 * Construct Prisma query criteria for date ranges.
 *
 * @param {Object} filters - Input filters query object
 * @param {string} [filters.fromDate] - Start date parameter
 * @param {string} [filters.toDate] - End date parameter
 * @param {string} fieldName - DB model timestamp field to filter against
 * @returns {Object} Prisma date range filter object
 */
const buildDateRangeFilter = ({ fromDate, toDate }, fieldName) => {
  if (!fromDate && !toDate) return {};

  const range = {};
  if (fromDate) range.gte = new Date(fromDate);
  if (toDate) range.lte = new Date(toDate);

  return { [fieldName]: range };
};

/**
 * Centralized private helper to aggregate copy counts for a single book.
 * Computes availability percentage rounded to 2 decimal places.
 *
 * @param {Array} copies - Array of BookCopy objects containing { status, condition }
 * @returns {Object} Aggregated inventory metrics
 */
const aggregateBookInventory = (copies) => {
  const totalCopies = copies.length;
  const availableCopies = copies.filter(c => c.status === CopyStatus.AVAILABLE).length;
  const borrowedCopies = copies.filter(c => c.status === CopyStatus.BORROWED).length;
  const reservedCopies = copies.filter(c => c.status === CopyStatus.RESERVED).length;
  const lostCopies = copies.filter(c => c.status === CopyStatus.LOST).length;
  const damagedCopies = copies.filter(c => c.condition === CopyCondition.DAMAGED).length;
  const maintenanceCopies = copies.filter(c => c.status === CopyStatus.MAINTENANCE).length;

  const availabilityPercentage = totalCopies > 0
    ? Math.round((availableCopies / totalCopies) * 100 * 100) / 100
    : 0;

  return {
    totalCopies,
    availableCopies,
    borrowedCopies,
    reservedCopies,
    lostCopies,
    damagedCopies,
    maintenanceCopies,
    availabilityPercentage
  };
};

// ==========================================
// EXPORTED SERVICE METHODS
// ==========================================

/**
 * Search books for report generation.
 * Filters date ranges against the book's `createdAt` timestamp.
 * Supported Sorting Fields: 'title', 'isbn', 'sellingPrice', 'stockQuantity', 'createdAt'.
 *
 * @param {Object} filters - Validated query filters
 * @param {number} [filters.page] - Page number
 * @param {number} [filters.limit] - Page limit
 * @param {string} [filters.sortBy] - Sorting field
 * @param {string} [filters.sortOrder] - Sorting order
 * @param {string} [filters.search] - Case-insensitive search keyword (title, isbn, author, category)
 * @param {string} [filters.categoryId] - Category ID UUID
 * @param {string} [filters.status] - CopyStatus enum value
 * @param {string} [filters.fromDate] - ISO-8601 start date limit
 * @param {string} [filters.toDate] - ISO-8601 end date limit
 * @returns {Promise<{items: Array, pagination: Object}>} Paginated search results list and metadata
 */
export const searchBooks = async (filters) => {
  const { skip, take, page, limit } = buildPagination(filters);
  const orderBy = buildSorting(filters, ['title', 'isbn', 'sellingPrice', 'stockQuantity', 'createdAt'], 'createdAt');
  
  // Build incremental where clause
  const where = { isDeleted: false };

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { isbn: { contains: filters.search, mode: 'insensitive' } },
      {
        authors: {
          some: {
            author: {
              fullName: { contains: filters.search, mode: 'insensitive' }
            }
          }
        }
      },
      {
        categories: {
          some: {
            category: {
              name: { contains: filters.search, mode: 'insensitive' }
            }
          }
        }
      }
    ];
  }

  if (filters.categoryId) {
    where.categories = {
      some: {
        categoryId: filters.categoryId
      }
    };
  }

  if (filters.status) {
    where.copies = {
      some: {
        status: filters.status
      }
    };
  }

  const dateFilter = buildDateRangeFilter(filters, 'createdAt');
  Object.assign(where, dateFilter);

  // Execute concurrently
  const [items, totalItems] = await Promise.all([
    prisma.book.findMany({
      where,
      skip,
      take,
      orderBy,
      select: {
        id: true,
        title: true,
        isbn: true,
        sellingPrice: true,
        stockQuantity: true,
        isBorrowable: true,
        isForSale: true,
        createdAt: true,
        authors: {
          select: {
            author: {
              select: {
                fullName: true
              }
            }
          }
        },
        categories: {
          select: {
            category: {
              select: {
                name: true
              }
            }
          }
        }
      }
    }),
    prisma.book.count({ where })
  ]);

  return {
    items,
    pagination: buildPaginationMetadata(totalItems, page, limit)
  };
};

/**
 * Search members for report generation.
 * Filters date ranges against the user's `createdAt` registration timestamp.
 * Supported Sorting Fields: 'username', 'email', 'createdAt'.
 *
 * @param {Object} filters - Validated query filters
 * @param {number} [filters.page] - Page number
 * @param {number} [filters.limit] - Page limit
 * @param {string} [filters.sortBy] - Sorting field
 * @param {string} [filters.sortOrder] - Sorting order
 * @param {string} [filters.search] - Case-insensitive search keyword (username, email)
 * @param {string} [filters.role] - UserRole enum value
 * @param {boolean} [filters.isActive] - Member active flag
 * @param {string} [filters.fromDate] - ISO-8601 start date limit
 * @param {string} [filters.toDate] - ISO-8601 end date limit
 * @returns {Promise<{items: Array, pagination: Object}>} Paginated search results list and metadata
 */
export const searchMembers = async (filters) => {
  const { skip, take, page, limit } = buildPagination(filters);
  const orderBy = buildSorting(filters, ['username', 'email', 'createdAt'], 'createdAt');

  const where = {};

  if (filters.search) {
    where.OR = [
      { username: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  if (filters.role) {
    where.role = filters.role;
  }

  if (filters.isActive !== undefined && filters.isActive !== null) {
    where.isActive = filters.isActive;
  }

  const dateFilter = buildDateRangeFilter(filters, 'createdAt');
  Object.assign(where, dateFilter);

  const [items, totalItems] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy,
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    }),
    prisma.user.count({ where })
  ]);

  return {
    items,
    pagination: buildPaginationMetadata(totalItems, page, limit)
  };
};

/**
 * Search loans for report generation.
 * Filters date ranges against the loan's `issueDate` timestamp.
 * Supported Sorting Fields: 'issueDate', 'dueDate', 'returnDate', 'fineAmount', 'createdAt'.
 *
 * @param {Object} filters - Validated query filters
 * @param {number} [filters.page] - Page number
 * @param {number} [filters.limit] - Page limit
 * @param {string} [filters.sortBy] - Sorting field
 * @param {string} [filters.sortOrder] - Sorting order
 * @param {string} [filters.search] - Case-insensitive search keyword (username, email, book title)
 * @param {string} [filters.memberId] - User ID UUID
 * @param {string} [filters.bookId] - Book ID UUID
 * @param {string} [filters.copyId] - BookCopy ID UUID
 * @param {string} [filters.status] - LoanStatus enum value
 * @param {string} [filters.fromDate] - ISO-8601 start date limit
 * @param {string} [filters.toDate] - ISO-8601 end date limit
 * @returns {Promise<{items: Array, pagination: Object}>} Paginated search results list and metadata
 */
export const searchLoans = async (filters) => {
  const { skip, take, page, limit } = buildPagination(filters);
  const orderBy = buildSorting(filters, ['issueDate', 'dueDate', 'returnDate', 'fineAmount', 'createdAt'], 'issueDate');

  const where = {};

  if (filters.search) {
    where.OR = [
      { user: { username: { contains: filters.search, mode: 'insensitive' } } },
      { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      { bookCopy: { book: { title: { contains: filters.search, mode: 'insensitive' } } } }
    ];
  }

  if (filters.memberId) {
    where.userId = filters.memberId;
  }

  if (filters.bookId) {
    where.bookCopy = { bookId: filters.bookId };
  }

  if (filters.copyId) {
    where.copyId = filters.copyId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  const dateFilter = buildDateRangeFilter(filters, 'issueDate');
  Object.assign(where, dateFilter);

  const [items, totalItems] = await Promise.all([
    prisma.loan.findMany({
      where,
      skip,
      take,
      orderBy,
      select: {
        id: true,
        userId: true,
        copyId: true,
        issueDate: true,
        dueDate: true,
        returnDate: true,
        fineAmount: true,
        status: true,
        renewCount: true,
        createdAt: true,
        user: {
          select: {
            username: true,
            email: true
          }
        },
        bookCopy: {
          select: {
            barcode: true,
            book: {
              select: {
                title: true
              }
            }
          }
        }
      }
    }),
    prisma.loan.count({ where })
  ]);

  return {
    items,
    pagination: buildPaginationMetadata(totalItems, page, limit)
  };
};

/**
 * Search reservations for report generation.
 * Filters date ranges against the reservation's `createdAt` timestamp.
 * Supported Sorting Fields: 'createdAt', 'expiresAt', 'fulfilledAt'.
 *
 * @param {Object} filters - Validated query filters
 * @param {number} [filters.page] - Page number
 * @param {number} [filters.limit] - Page limit
 * @param {string} [filters.sortBy] - Sorting field
 * @param {string} [filters.sortOrder] - Sorting order
 * @param {string} [filters.search] - Case-insensitive search keyword (username, email, book title)
 * @param {string} [filters.memberId] - User ID UUID
 * @param {string} [filters.bookId] - Book ID UUID
 * @param {string} [filters.status] - ReservationStatus enum value
 * @param {string} [filters.fromDate] - ISO-8601 start date limit
 * @param {string} [filters.toDate] - ISO-8601 end date limit
 * @returns {Promise<{items: Array, pagination: Object}>} Paginated search results list and metadata
 */
export const searchReservations = async (filters) => {
  const { skip, take, page, limit } = buildPagination(filters);
  const orderBy = buildSorting(filters, ['createdAt', 'expiresAt', 'fulfilledAt'], 'createdAt');

  const where = {};

  if (filters.search) {
    where.OR = [
      { user: { username: { contains: filters.search, mode: 'insensitive' } } },
      { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      { book: { title: { contains: filters.search, mode: 'insensitive' } } }
    ];
  }

  if (filters.memberId) {
    where.userId = filters.memberId;
  }

  if (filters.bookId) {
    where.bookId = filters.bookId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  const dateFilter = buildDateRangeFilter(filters, 'createdAt');
  Object.assign(where, dateFilter);

  const [items, totalItems] = await Promise.all([
    prisma.reservation.findMany({
      where,
      skip,
      take,
      orderBy,
      select: {
        id: true,
        userId: true,
        bookId: true,
        copyId: true,
        status: true,
        createdAt: true,
        fulfilledAt: true,
        cancelledAt: true,
        expiresAt: true,
        user: {
          select: {
            username: true,
            email: true
          }
        },
        book: {
          select: {
            title: true
          }
        }
      }
    }),
    prisma.reservation.count({ where })
  ]);

  return {
    items,
    pagination: buildPaginationMetadata(totalItems, page, limit)
  };
};

/**
 * Search orders for report generation.
 * Filters date ranges against the order's `orderedAt` timestamp.
 * Supported Sorting Fields: 'orderNumber', 'totalAmount', 'orderedAt', 'createdAt'.
 *
 * @param {Object} filters - Validated query filters
 * @param {number} [filters.page] - Page number
 * @param {number} [filters.limit] - Page limit
 * @param {string} [filters.sortBy] - Sorting field
 * @param {string} [filters.sortOrder] - Sorting order
 * @param {string} [filters.search] - Case-insensitive search keyword (username, email)
 * @param {string} [filters.memberId] - User ID UUID
 * @param {string} [filters.status] - OrderStatus enum value
 * @param {string} [filters.paymentStatus] - PaymentStatus enum value
 * @param {string} [filters.fromDate] - ISO-8601 start date limit
 * @param {string} [filters.toDate] - ISO-8601 end date limit
 * @returns {Promise<{items: Array, pagination: Object}>} Paginated search results list and metadata
 */
export const searchOrders = async (filters) => {
  const { skip, take, page, limit } = buildPagination(filters);
  const orderBy = buildSorting(filters, ['orderNumber', 'totalAmount', 'orderedAt', 'createdAt'], 'orderedAt');

  const where = {};

  if (filters.search) {
    where.OR = [
      { user: { username: { contains: filters.search, mode: 'insensitive' } } },
      { user: { email: { contains: filters.search, mode: 'insensitive' } } }
    ];
  }

  if (filters.memberId) {
    where.userId = filters.memberId;
  }

  if (filters.status) {
    where.orderStatus = filters.status;
  }

  if (filters.paymentStatus) {
    where.paymentStatus = filters.paymentStatus;
  }

  const dateFilter = buildDateRangeFilter(filters, 'orderedAt');
  Object.assign(where, dateFilter);

  const [items, totalItems] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take,
      orderBy,
      select: {
        id: true,
        userId: true,
        orderNumber: true,
        totalAmount: true,
        paymentStatus: true,
        orderStatus: true,
        shippingAddress: true,
        orderedAt: true,
        createdAt: true,
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    }),
    prisma.order.count({ where })
  ]);

  return {
    items,
    pagination: buildPaginationMetadata(totalItems, page, limit)
  };
};

/**
 * Retrieve overdue loans report.
 * Filters date ranges against the loan's `dueDate` timestamp.
 * Supported Sorting Fields: 'dueDate', 'username', 'daysOverdue'.
 *
 * @param {Object} filters - Validated query filters
 * @param {number} [filters.page] - Page number
 * @param {number} [filters.limit] - Page limit
 * @param {string} [filters.sortBy] - Sorting field
 * @param {string} [filters.sortOrder] - Sorting order
 * @param {string} [filters.memberId] - User ID UUID
 * @param {string} [filters.bookId] - Book ID UUID
 * @param {string} [filters.severity] - Severity filter ('LOW' | 'MEDIUM' | 'HIGH')
 * @param {string} [filters.fromDate] - ISO-8601 start date limit
 * @param {string} [filters.toDate] - ISO-8601 end date limit
 * @returns {Promise<{items: Array, pagination: Object}>} Paginated search results list and metadata
 */
export const getOverdueReport = async (filters = {}) => {
  const { memberId, bookId, severity, fromDate, toDate } = filters;
  const { page, limit } = buildPagination(filters);
  const skip = (page - 1) * limit;
  const take = limit;

  const sortBy = filters.sortBy || 'dueDate';
  const sortOrder = filters.sortOrder || 'asc';

  const now = new Date();
  const msInDay = 24 * 60 * 60 * 1000;

  // Build incremental where clause
  const where = {
    returnDate: null,
    status: {
      in: [LoanStatus.BORROWED, LoanStatus.OVERDUE]
    },
    dueDate: {
      lt: now
    }
  };

  if (memberId) {
    where.userId = memberId;
  }

  if (bookId) {
    where.bookCopy = {
      bookId
    };
  }

  // Intersect date range and severity filters
  if (fromDate) {
    where.dueDate.gte = new Date(fromDate);
  }
  if (toDate) {
    where.dueDate.lte = new Date(toDate);
  }

  if (severity) {
    if (severity === 'LOW') {
      const lowGt = new Date(now.getTime() - (OVERDUE_SEVERITY.LOW_MAX_DAYS + 1) * msInDay);
      const lowLte = new Date(now.getTime() - 1 * msInDay);
      
      where.dueDate.gt = where.dueDate.gt && where.dueDate.gt > lowGt ? where.dueDate.gt : lowGt;
      where.dueDate.lte = where.dueDate.lte && where.dueDate.lte < lowLte ? where.dueDate.lte : lowLte;
    } else if (severity === 'MEDIUM') {
      const medGt = new Date(now.getTime() - (OVERDUE_SEVERITY.MEDIUM_MAX_DAYS + 1) * msInDay);
      const medLte = new Date(now.getTime() - (OVERDUE_SEVERITY.LOW_MAX_DAYS + 1) * msInDay);

      where.dueDate.gt = where.dueDate.gt && where.dueDate.gt > medGt ? where.dueDate.gt : medGt;
      where.dueDate.lte = where.dueDate.lte && where.dueDate.lte < medLte ? where.dueDate.lte : medLte;
    } else if (severity === 'HIGH') {
      const highLte = new Date(now.getTime() - (OVERDUE_SEVERITY.MEDIUM_MAX_DAYS + 1) * msInDay);
      
      where.dueDate.lte = where.dueDate.lte && where.dueDate.lte < highLte ? where.dueDate.lte : highLte;
    }
  }

  let items = [];
  let totalItems = 0;

  if (sortBy === 'daysOverdue') {
    // stable in-memory sort is required for computed fields
    const allItems = await prisma.loan.findMany({
      where,
      select: {
        id: true,
        issueDate: true,
        dueDate: true,
        user: {
          select: {
            username: true,
            email: true
          }
        },
        bookCopy: {
          select: {
            barcode: true,
            book: {
              select: {
                title: true,
                isbn: true
              }
            }
          }
        }
      }
    });

    totalItems = allItems.length;

    // Map computed fields
    const mappedItems = allItems.map(loan => {
      const diffMs = now.getTime() - new Date(loan.dueDate).getTime();
      const daysOverdue = Math.floor(diffMs / msInDay);
      
      let computedSeverity = 'LOW';
      if (daysOverdue > OVERDUE_SEVERITY.MEDIUM_MAX_DAYS) {
        computedSeverity = 'HIGH';
      } else if (daysOverdue > OVERDUE_SEVERITY.LOW_MAX_DAYS) {
        computedSeverity = 'MEDIUM';
      }

      return {
        loanId: loan.id,
        issueDate: loan.issueDate,
        dueDate: loan.dueDate,
        daysOverdue,
        severity: computedSeverity,
        member: {
          username: loan.user.username,
          email: loan.user.email
        },
        book: {
          title: loan.bookCopy.book.title,
          isbn: loan.bookCopy.book.isbn
        },
        copy: {
          barcode: loan.bookCopy.barcode
        }
      };
    });

    // In-memory sort
    mappedItems.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.daysOverdue - b.daysOverdue || a.loanId.localeCompare(b.loanId);
      } else {
        return b.daysOverdue - a.daysOverdue || a.loanId.localeCompare(b.loanId);
      }
    });

    // Slice for pagination
    items = mappedItems.slice(skip, skip + take);

  } else {
    // Database-level sorting and pagination
    let orderBy = {};
    if (sortBy === 'username') {
      orderBy = { user: { username: sortOrder } };
    } else {
      orderBy = { dueDate: sortOrder }; // fallback/default
    }

    const [dbItems, count] = await Promise.all([
      prisma.loan.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          issueDate: true,
          dueDate: true,
          user: {
            select: {
              username: true,
              email: true
            }
          },
          bookCopy: {
            select: {
              barcode: true,
              book: {
                select: {
                  title: true,
                  isbn: true
                }
              }
            }
          }
        }
      }),
      prisma.loan.count({ where })
    ]);

    totalItems = count;

    items = dbItems.map(loan => {
      const diffMs = now.getTime() - new Date(loan.dueDate).getTime();
      const daysOverdue = Math.floor(diffMs / msInDay);
      
      let computedSeverity = 'LOW';
      if (daysOverdue > OVERDUE_SEVERITY.MEDIUM_MAX_DAYS) {
        computedSeverity = 'HIGH';
      } else if (daysOverdue > OVERDUE_SEVERITY.LOW_MAX_DAYS) {
        computedSeverity = 'MEDIUM';
      }

      return {
        loanId: loan.id,
        issueDate: loan.issueDate,
        dueDate: loan.dueDate,
        daysOverdue,
        severity: computedSeverity,
        member: {
          username: loan.user.username,
          email: loan.user.email
        },
        book: {
          title: loan.bookCopy.book.title,
          isbn: loan.bookCopy.book.isbn
        },
        copy: {
          barcode: loan.bookCopy.barcode
        }
      };
    });
  }

  return {
    items,
    pagination: buildPaginationMetadata(totalItems, page, limit)
  };
};

/**
 * Retrieve library inventory report.
 * Filters date ranges against the book's `createdAt` timestamp.
 * Supported Sorting Fields: 'title', 'totalCopies', 'availableCopies', 'borrowedCopies',
 * 'reservedCopies', 'lostCopies', 'damagedCopies', 'maintenanceCopies', 'availabilityPercentage', 'createdAt'.
 *
 * @param {Object} filters - Validated query filters
 * @returns {Promise<{summary: Object, items: Array, pagination: Object}>} Object containing summary stats, paginated items list, and pagination metadata
 */
export const getInventoryReport = async (filters = {}) => {
  const { categoryId, authorId, publisher, availability, includeZeroAvailable, page, limit, sortBy, sortOrder, search } = filters;
  const resolvedPage = page || 1;
  const resolvedLimit = limit || 20;
  const skip = (resolvedPage - 1) * resolvedLimit;
  const take = resolvedLimit;

  const resolvedSortBy = sortBy || 'title';
  const resolvedSortOrder = sortOrder || 'asc';

  // Build incremental where clause
  const where = { isDeleted: false };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { isbn: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (categoryId) {
    where.categories = {
      some: {
        categoryId
      }
    };
  }

  if (authorId) {
    where.authors = {
      some: {
        authorId
      }
    };
  }

  if (publisher) {
    where.publisher = { contains: publisher, mode: 'insensitive' };
  }

  // Intersect availability and includeZeroAvailable filters
  const andConditions = [];
  
  if (availability && availability !== 'all') {
    if (availability === 'damaged') {
      andConditions.push({
        copies: {
          some: {
            condition: CopyCondition.DAMAGED
          }
        }
      });
    } else {
      const targetStatus = availability.toUpperCase();
      andConditions.push({
        copies: {
          some: {
            status: CopyStatus[targetStatus] || targetStatus
          }
        }
      });
    }
  }

  if (includeZeroAvailable === false) {
    andConditions.push({
      copies: {
        some: {
          status: CopyStatus.AVAILABLE
        }
      }
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  const derivedSortFields = [
    'totalCopies',
    'availableCopies',
    'borrowedCopies',
    'reservedCopies',
    'lostCopies',
    'damagedCopies',
    'maintenanceCopies',
    'availabilityPercentage'
  ];

  const isDerivedSort = derivedSortFields.includes(resolvedSortBy);

  // Prisma select payload options
  const selectPayload = {
    id: true,
    title: true,
    isbn: true,
    publisher: true,
    createdAt: true,
    authors: {
      select: {
        author: {
          select: {
            fullName: true
          }
        }
      }
    },
    categories: {
      select: {
        category: {
          select: {
            name: true
          }
        }
      }
    },
    copies: {
      select: {
        status: true,
        condition: true
      }
    }
  };

  // 1. Fetch matching books based on sorting path
  let allBooks = [];
  if (isDerivedSort) {
    allBooks = await prisma.book.findMany({
      where,
      select: selectPayload
    });
  } else {
    const dbOrder = [{ [resolvedSortBy]: resolvedSortOrder }];
    if (resolvedSortBy !== 'title') {
      dbOrder.push({ title: 'asc' });
    }
    dbOrder.push({ id: 'asc' });

    allBooks = await prisma.book.findMany({
      where,
      orderBy: dbOrder,
      select: selectPayload
    });
  }

  // 2. Initialize explicit summary accumulator
  const summary = {
    totalBooks: 0,
    totalCopies: 0,
    availableCopies: 0,
    borrowedCopies: 0,
    reservedCopies: 0,
    lostCopies: 0,
    damagedCopies: 0,
    maintenanceCopies: 0,
    zeroAvailabilityBooks: 0,
    totalAvailabilityPercentage: 0
  };

  // 3. Map and accumulate stats in a single pass
  const mapped = allBooks.map(book => {
    const metrics = aggregateBookInventory(book.copies);

    summary.totalBooks++;
    summary.totalCopies += metrics.totalCopies;
    summary.availableCopies += metrics.availableCopies;
    summary.borrowedCopies += metrics.borrowedCopies;
    summary.reservedCopies += metrics.reservedCopies;
    summary.lostCopies += metrics.lostCopies;
    summary.damagedCopies += metrics.damagedCopies;
    summary.maintenanceCopies += metrics.maintenanceCopies;
    if (metrics.availableCopies === 0) {
      summary.zeroAvailabilityBooks++;
    }
    summary.totalAvailabilityPercentage += metrics.availabilityPercentage;

    return {
      id: book.id,
      title: book.title,
      isbn: book.isbn,
      publisher: book.publisher,
      createdAt: book.createdAt,
      category: book.categories.length > 0 ? book.categories[0].category.name : null,
      authors: book.authors.map(a => a.author.fullName).join(', '),
      ...metrics
    };
  });

  // 4. Clean destructuring of reportSummary to avoid mutating the accumulator
  const { totalAvailabilityPercentage, ...reportSummary } = summary;
  reportSummary.averageAvailabilityPercentage = summary.totalBooks > 0
    ? Math.round((totalAvailabilityPercentage / summary.totalBooks) * 100) / 100
    : 0;

  // 5. Perform sorting for derived fields if necessary
  if (isDerivedSort) {
    mapped.sort((a, b) => {
      const valA = a[resolvedSortBy];
      const valB = b[resolvedSortBy];
      if (resolvedSortOrder === 'desc') {
        return valB - valA || a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
      } else {
        return valA - valB || a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
      }
    });
  }

  // 6. Slice page items
  const items = mapped.slice(skip, skip + take);

  const totalItems = summary.totalBooks;

  return {
    summary: reportSummary,
    items,
    pagination: buildPaginationMetadata(totalItems, resolvedPage, resolvedLimit)
  };
};

/**
 * Compute overall lifetime summary statistics for a member.
 * Reuses active in-memory collections when available, otherwise executes optimized database aggregate counts.
 * Note: The summary object represents the member's complete lifetime statistics, independent of the activityType filter.
 *
 * @param {string} memberId - Member ID
 * @param {Object} loaded - Active collections loaded in memory (if any)
 * @param {Object} targets - Boolean flags indicating which collections were fetched
 * @param {boolean} isPaginatedDbQuery - True if database-level pagination was applied (so memory collections are incomplete)
 * @returns {Promise<Object>} Member summary metrics
 */
const buildMemberStatistics = async (memberId, loaded, targets, isPaginatedDbQuery) => {
  const { loans, loanHistory, reservations, orders, reviews } = loaded;
  const { fetchLoans, fetchReservations, fetchOrders, fetchReviews } = targets;

  let totalLoans = 0;
  let activeLoans = 0;
  let returnedLoans = 0;
  let overdueLoans = 0;
  let totalFines = 0;
  let outstandingFines = 0;
  let averageLoanDurationDays = 0;
  let totalReservations = 0;
  let totalOrders = 0;
  let totalReviews = 0;
  let averageReviewRating = 0;

  // Build concurrent fallback queries array
  const fallbackPromises = [];
  const fallbackKeys = [];

  if (!fetchLoans || isPaginatedDbQuery) {
    fallbackPromises.push(
      prisma.loan.groupBy({
        by: ['status'],
        where: { userId: memberId, bookCopy: { book: { isDeleted: false } } },
        _count: { id: true },
        _sum: { fineAmount: true }
      })
    );
    fallbackKeys.push('loansGroupBy');

    fallbackPromises.push(prisma.loan.findMany({
      where: { userId: memberId, status: LoanStatus.RETURNED, bookCopy: { book: { isDeleted: false } } },
      select: { issueDate: true, returnDate: true }
    }));
    fallbackKeys.push('loanHistoryData');
  }

  if (!fetchReservations || isPaginatedDbQuery) {
    fallbackPromises.push(prisma.reservation.count({ where: { userId: memberId, book: { isDeleted: false } } }));
    fallbackKeys.push('reservationsCount');
  }

  if (!fetchOrders || isPaginatedDbQuery) {
    fallbackPromises.push(prisma.order.count({ where: { userId: memberId } }));
    fallbackKeys.push('ordersCount');
  }

  if (!fetchReviews || isPaginatedDbQuery) {
    fallbackPromises.push(
      prisma.review.aggregate({
        where: { userId: memberId, book: { isDeleted: false } },
        _count: { id: true },
        _avg: { rating: true }
      })
    );
    fallbackKeys.push('reviewsAggregated');
  }

  // Resolve all fallback DB operations concurrently
  const fallbackResults = await Promise.all(fallbackPromises);
  const dbData = {};
  fallbackKeys.forEach((key, index) => {
    dbData[key] = fallbackResults[index];
  });

  // 1. Process Loan Statistics
  if (fetchLoans && !isPaginatedDbQuery) {
    activeLoans = loans.length;
    returnedLoans = loanHistory.length;
    totalLoans = activeLoans + returnedLoans;
    overdueLoans = loans.filter(l => l.status === LoanStatus.OVERDUE).length;
    totalFines = [...loans, ...loanHistory].reduce((sum, l) => sum + Number(l.fineAmount || 0), 0);
    outstandingFines = loans.reduce((sum, l) => sum + Number(l.fineAmount || 0), 0);

    const returnedWithDuration = loanHistory.filter(l => l.returnDate && l.issueDate);
    if (returnedWithDuration.length > 0) {
      const totalDurationDays = returnedWithDuration.reduce((sum, l) => {
        const diffMs = new Date(l.returnDate) - new Date(l.issueDate);
        return sum + Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }, 0);
      averageLoanDurationDays = Number((totalDurationDays / returnedWithDuration.length).toFixed(2));
    }
  } else {
    const loanGroups = dbData.loansGroupBy || [];
    totalLoans = 0;
    activeLoans = 0;
    returnedLoans = 0;
    overdueLoans = 0;
    totalFines = 0;
    outstandingFines = 0;

    for (const group of loanGroups) {
      const count = group._count.id;
      const fines = Number(group._sum.fineAmount || 0);
      totalLoans += count;
      totalFines += fines;
      if (group.status === LoanStatus.BORROWED || group.status === LoanStatus.OVERDUE) {
        activeLoans += count;
        outstandingFines += fines;
      }
      if (group.status === LoanStatus.RETURNED) {
        returnedLoans = count;
      }
      if (group.status === LoanStatus.OVERDUE) {
        overdueLoans = count;
      }
    }

    const hist = dbData.loanHistoryData || [];
    if (hist.length > 0) {
      const totalDurationDays = hist.reduce((sum, l) => {
        const diffMs = new Date(l.returnDate) - new Date(l.issueDate);
        return sum + Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }, 0);
      averageLoanDurationDays = Number((totalDurationDays / hist.length).toFixed(2));
    }
  }

  // 2. Process Reservation Statistics
  if (fetchReservations && !isPaginatedDbQuery) {
    totalReservations = reservations.length;
  } else {
    totalReservations = dbData.reservationsCount;
  }

  // 3. Process Order Statistics
  if (fetchOrders && !isPaginatedDbQuery) {
    totalOrders = orders.length;
  } else {
    totalOrders = dbData.ordersCount;
  }

  // 4. Process Review Statistics
  if (fetchReviews && !isPaginatedDbQuery) {
    totalReviews = reviews.length;
    if (totalReviews > 0) {
      const sumRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      averageReviewRating = Number((sumRating / totalReviews).toFixed(2));
    }
  } else {
    const aggregated = dbData.reviewsAggregated || { _count: { id: 0 }, _avg: { rating: 0 } };
    totalReviews = aggregated._count.id || 0;
    averageReviewRating = Number((aggregated._avg.rating || 0).toFixed(2));
  }

  return {
    totalLoans,
    activeLoans,
    returnedLoans,
    overdueLoans,
    totalReservations,
    totalOrders,
    totalReviews,
    currentlyBorrowedBooks: activeLoans,
    totalBooksBorrowed: totalLoans,
    averageLoanDurationDays,
    averageReviewRating,
    totalFines,
    outstandingFines
  };
};

/**
 * Retrieve specific member activity report.
 * Retrieves member profile, activity summary statistics, filtered activity collections, and pagination.
 * Note: The summary object represents the member's complete lifetime statistics, independent of the activityType filter.
 *
 * @param {Object} params - Service parameters
 * @param {string} params.memberId - Member ID UUID
 * @param {string} [params.activityType='all'] - Activity type filter
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=20] - Page size limit
 * @param {string} [params.fromDate] - Filter from date
 * @param {string} [params.toDate] - Filter to date
 * @returns {Promise<{
 *   member: Object,
 *   summary: Object,
 *   activity: {
 *     loans: Array,
 *     loanHistory: Array,
 *     reservations: Array,
 *     orders: Array,
 *     reviews: Array
 *   },
 *   pagination: Object
 * }>} Consolidated member activity report
 */
export const getMemberReport = async (params = {}) => {
  const { memberId, activityType, page, limit, fromDate, toDate } = params;
  const fetchAll = !activityType || activityType === 'all';
  const isPaginatedDbQuery = !fetchAll; // true when filtering to a single activity collection

  const resolvedPage = Number(page) || 1;
  const resolvedLimit = Number(limit) || 20;
  const skip = (resolvedPage - 1) * resolvedLimit;
  const take = resolvedLimit;

  const memberPromise = prisma.user.findUnique({
    where: { id: memberId },
    select: USER_SELECT
  });

  const fetchLoans = fetchAll || activityType === 'loans';
  const fetchReservations = fetchAll || activityType === 'reservations';
  const fetchOrders = fetchAll || activityType === 'orders';
  const fetchReviews = fetchAll || activityType === 'reviews';

  // 1. Build database filters
  const loanWhere = {
    userId: memberId,
    status: { in: [LoanStatus.BORROWED, LoanStatus.OVERDUE] },
    bookCopy: { book: { isDeleted: false } }
  };
  if (fromDate) loanWhere.issueDate = { ...loanWhere.issueDate, gte: new Date(fromDate) };
  if (toDate) loanWhere.issueDate = { ...loanWhere.issueDate, lte: new Date(toDate) };

  const loanHistWhere = {
    userId: memberId,
    status: LoanStatus.RETURNED,
    bookCopy: { book: { isDeleted: false } }
  };
  if (fromDate) loanHistWhere.returnDate = { ...loanHistWhere.returnDate, gte: new Date(fromDate) };
  if (toDate) loanHistWhere.returnDate = { ...loanHistWhere.returnDate, lte: new Date(toDate) };

  const resWhere = {
    userId: memberId,
    book: { isDeleted: false }
  };
  if (fromDate) resWhere.createdAt = { ...resWhere.createdAt, gte: new Date(fromDate) };
  if (toDate) resWhere.createdAt = { ...resWhere.createdAt, lte: new Date(toDate) };

  const orderWhere = { userId: memberId };
  if (fromDate) orderWhere.orderedAt = { ...orderWhere.orderedAt, gte: new Date(fromDate) };
  if (toDate) orderWhere.orderedAt = { ...orderWhere.orderedAt, lte: new Date(toDate) };

  const revWhere = {
    userId: memberId,
    book: { isDeleted: false }
  };
  if (fromDate) revWhere.createdAt = { ...revWhere.createdAt, gte: new Date(fromDate) };
  if (toDate) revWhere.createdAt = { ...revWhere.createdAt, lte: new Date(toDate) };

  let loansPromise = null;
  let loanHistoryPromise = null;
  let reservationsPromise = null;
  let ordersPromise = null;
  let reviewsPromise = null;

  // 2. Build Prisma queries with optional database pagination
  if (fetchLoans) {
    loansPromise = prisma.loan.findMany({
      where: loanWhere,
      orderBy: [{ issueDate: 'desc' }, { id: 'desc' }],
      select: LOAN_SELECT,
      ...(isPaginatedDbQuery ? { skip, take } : {})
    });

    loanHistoryPromise = prisma.loan.findMany({
      where: loanHistWhere,
      orderBy: [{ returnDate: 'desc' }, { id: 'desc' }],
      select: LOAN_SELECT,
      ...(isPaginatedDbQuery ? { skip, take } : {})
    });
  }

  if (fetchReservations) {
    reservationsPromise = prisma.reservation.findMany({
      where: resWhere,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: RESERVATION_SELECT,
      ...(isPaginatedDbQuery ? { skip, take } : {})
    });
  }

  if (fetchOrders) {
    ordersPromise = prisma.order.findMany({
      where: orderWhere,
      orderBy: [{ orderedAt: 'desc' }, { id: 'desc' }],
      select: MEMBER_REPORT_ORDER_SELECT,
      ...(isPaginatedDbQuery ? { skip, take } : {})
    });
  }

  if (fetchReviews) {
    reviewsPromise = prisma.review.findMany({
      where: revWhere,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: REVIEW_SELECT,
      ...(isPaginatedDbQuery ? { skip, take } : {})
    });
  }

  const [
    member,
    loans,
    loanHistory,
    reservations,
    orders,
    reviews
  ] = await Promise.all([
    memberPromise,
    loansPromise,
    loanHistoryPromise,
    reservationsPromise,
    ordersPromise,
    reviewsPromise
  ]);

  if (!member) {
    throw new ApiError(404, 'Member not found.');
  }

  if (member.role !== UserRole.MEMBER) {
    throw new ApiError(400, 'User is not a member.');
  }

  // 3. Compute overall lifetime statistics
  const summary = await buildMemberStatistics(
    memberId,
    {
      loans: loans || [],
      loanHistory: loanHistory || [],
      reservations: reservations || [],
      orders: orders || [],
      reviews: reviews || []
    },
    { fetchLoans, fetchReservations, fetchOrders, fetchReviews },
    isPaginatedDbQuery
  );

  // 4. In-Memory slicing if not paginated in database
  let paginatedLoans = loans || [];
  let paginatedLoanHistory = loanHistory || [];
  let paginatedReservations = reservations || [];
  let paginatedOrders = orders || [];
  let paginatedReviews = reviews || [];

  if (!isPaginatedDbQuery) {
    paginatedLoans = paginatedLoans.slice(skip, skip + take);
    paginatedLoanHistory = paginatedLoanHistory.slice(skip, skip + take);
    paginatedReservations = paginatedReservations.slice(skip, skip + take);
    paginatedOrders = paginatedOrders.slice(skip, skip + take);
    paginatedReviews = paginatedReviews.slice(skip, skip + take);
  }

  // 5. Calculate totalItems and build pagination block
  let totalItems = 0;
  if (activityType === 'loans') {
    totalItems = summary.totalLoans;
  } else if (activityType === 'reservations') {
    totalItems = summary.totalReservations;
  } else if (activityType === 'orders') {
    totalItems = summary.totalOrders;
  } else if (activityType === 'reviews') {
    totalItems = summary.totalReviews;
  } else {
    // 'all'
    totalItems = summary.totalLoans + summary.totalReservations + summary.totalOrders + summary.totalReviews;
  }

  const pagination = buildPaginationMetadata(totalItems, resolvedPage, resolvedLimit);

  return {
    member,
    summary,
    activity: {
      loans: paginatedLoans,
      loanHistory: paginatedLoanHistory,
      reservations: paginatedReservations,
      orders: paginatedOrders,
      reviews: paginatedReviews
    },
    pagination
  };
};
