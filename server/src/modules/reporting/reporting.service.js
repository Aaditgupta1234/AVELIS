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
import { LoanStatus, CopyStatus, CopyCondition } from '@prisma/client';

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
  return {
    page,
    limit,
    totalItems,
    totalPages
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
 * @returns {Promise<Object>} Paginated search results list and metadata
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
 * @returns {Promise<Object>} Paginated search results list and metadata
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
 * @returns {Promise<Object>} Paginated search results list and metadata
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
 * @returns {Promise<Object>} Paginated search results list and metadata
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
 * @returns {Promise<Object>} Paginated search results list and metadata
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
 * @returns {Promise<Object>} Paginated search results list and metadata
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
 * @returns {Promise<Object>} Paginated inventory report items list: { items }
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

  let items = [];

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

  if (isDerivedSort) {
    // 1. Fetch ALL matching books
    const allBooks = await prisma.book.findMany({
      where,
      select: selectPayload
    });

    // 2. Perform aggregation
    const mapped = allBooks.map(book => {
      const metrics = aggregateBookInventory(book.copies);
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

    // 3. In-memory sorting (with stable deterministic fallback sorting on title/id)
    mapped.sort((a, b) => {
      const valA = a[resolvedSortBy];
      const valB = b[resolvedSortBy];
      if (resolvedSortOrder === 'desc') {
        return valB - valA || a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
      } else {
        return valA - valB || a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
      }
    });

    // 4. Slicing for pagination
    items = mapped.slice(skip, skip + take);

  } else {
    // 1. Direct database-level sorting and pagination
    const dbOrder = [
      { [resolvedSortBy]: resolvedSortOrder },
      { title: 'asc' }
    ];

    const dbBooks = await prisma.book.findMany({
      where,
      skip,
      take,
      orderBy: dbOrder,
      select: selectPayload
    });

    // 2. Run aggregateBookInventory mapping on only the paginated books
    items = dbBooks.map(book => {
      const metrics = aggregateBookInventory(book.copies);
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
  }

  return { items };
};

/**
 * Retrieve specific member activities report.
 *
 * @param {Object} params - Service params
 * @param {string} params.memberId - Member ID
 * @throws {ApiError} 501 Not Implemented
 */
export const getMemberReport = async ({ memberId }) => {
  throw new ApiError(501, `Member Report API for member ${memberId} not implemented yet.`);
};
