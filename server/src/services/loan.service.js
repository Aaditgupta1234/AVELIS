import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/index.js';
import { UserRole, CopyStatus, LoanStatus } from '@prisma/client';
import { LOAN_SELECT } from '../shared/selects/loan.select.js';
import { getUserOrThrow } from '../helpers/resource.helper.js';

import { config } from '../config/env.js';

const DEFAULT_BORROW_DAYS = config.loanDurationDays;

/**
 * Service to borrow a book copy.
 *
 * @param {Object} borrowData - Input data containing userId and copyId
 * @returns {Promise<Object>} The created loan record
 * @throws {ApiError} 404 if user or copy not found
 * @throws {ApiError} 400 if user role not MEMBER or book soft deleted
 * @throws {ApiError} 409 if book copy is not AVAILABLE
 */
export const borrowBook = async ({ userId, copyId }) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Verify user exists and role is MEMBER
    const user = await getUserOrThrow(userId, tx);
    if (user.role !== UserRole.MEMBER) {
      throw new ApiError(400, 'Only members can borrow books.');
    }

    // 2. Verify copy exists, and retrieve parent book
    const copy = await tx.bookCopy.findUnique({
      where: { id: copyId },
      include: { book: true }
    });
    if (!copy) {
      throw new ApiError(404, 'Book copy not found.');
    }

    // 3. Verify parent book exists and is not soft deleted
    const book = copy.book;
    if (!book || book.isDeleted) {
      throw new ApiError(400, 'Book is soft deleted and cannot be borrowed.');
    }

    // 4. Verify copy is AVAILABLE
    if (copy.status !== CopyStatus.AVAILABLE) {
      throw new ApiError(409, 'Book copy is unavailable.');
    }

    // Calculate dates using the project's configured default loan period
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(issueDate.getDate() + DEFAULT_BORROW_DAYS);

    // 5. Update BookCopy status to BORROWED only if it is AVAILABLE (OCC check)
    const updateResult = await tx.bookCopy.updateMany({
      where: { id: copyId, status: CopyStatus.AVAILABLE },
      data: {
        status: CopyStatus.BORROWED
      }
    });

    if (updateResult.count === 0) {
      throw new ApiError(409, 'Book copy is unavailable.');
    }

    // 6. Create Loan
    const loan = await tx.loan.create({
      data: {
        userId,
        copyId,
        issueDate,
        dueDate,
        status: LoanStatus.BORROWED
      },
      select: LOAN_SELECT
    });

    return loan;
  });
};

/**
 * Service to return a borrowed book copy.
 *
 * @param {Object} returnData - Input data containing loanId
 * @returns {Promise<Object>} The updated loan record
 * @throws {ApiError} 404 if loan or associated copy not found
 * @throws {ApiError} 400 if loan is already returned
 */
export const returnBook = async ({ loanId }) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Verify loan exists
    const loan = await tx.loan.findUnique({
      where: { id: loanId }
    });
    if (!loan) {
      throw new ApiError(404, 'Loan not found.');
    }

    // 2. Verify loan is not already returned
    if (loan.status === LoanStatus.RETURNED) {
      throw new ApiError(400, 'Loan already returned.');
    }

    // 3. Verify associated BookCopy exists
    const copy = await tx.bookCopy.findUnique({
      where: { id: loan.copyId }
    });
    if (!copy) {
      throw new ApiError(404, 'Copy not found.');
    }

    const returnDate = new Date();

    // 4. Update Loan status to RETURNED only if it is not already RETURNED (OCC check)
    const updateResult = await tx.loan.updateMany({
      where: {
        id: loanId,
        status: { not: LoanStatus.RETURNED }
      },
      data: {
        status: LoanStatus.RETURNED,
        returnDate
      }
    });

    if (updateResult.count === 0) {
      throw new ApiError(400, 'Loan already returned.');
    }

    // 5. Update BookCopy status back to AVAILABLE
    await tx.bookCopy.update({
      where: { id: loan.copyId },
      data: {
        status: CopyStatus.AVAILABLE
      }
    });

    // 6. Fetch the updated loan using LOAN_SELECT
    const updatedLoan = await tx.loan.findUnique({
      where: { id: loanId },
      select: LOAN_SELECT
    });

    return updatedLoan;
  });
};

/**
 * Service to retrieve a single loan by its ID.
 *
 * @param {Object} queryData - Input data containing loanId and currentUser
 * @returns {Promise<Object>} The loan record
 * @throws {ApiError} 404 if loan not found
 * @throws {ApiError} 403 if member attempts to retrieve another user's loan
 */
export const getLoanById = async ({ loanId, currentUser }) => {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    select: LOAN_SELECT
  });

  if (!loan) {
    throw new ApiError(404, 'Loan not found.');
  }

  // Enforce access control: Admin can retrieve any loan, Member only their own.
  if (currentUser.role !== UserRole.ADMIN && loan.userId !== currentUser.id) {
    throw new ApiError(403, 'Access denied. You can only retrieve your own loans.');
  }

  return loan;
};

/**
 * Service to retrieve a paginated collection of loans.
 *
 * @param {Object} query - Validated query parameters
 * @returns {Promise<Object>} Object containing the list of loans and pagination metadata
 */
export const getLoans = async ({ page, limit, sortBy, sortOrder, status, userId, copyId }) => {
  const where = {};

  if (status) {
    where.status = status;
  }
  if (userId) {
    where.userId = userId;
  }
  if (copyId) {
    where.copyId = copyId;
  }

  const skip = (page - 1) * limit;

  const [loans, total] = await Promise.all([
    prisma.loan.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
      select: LOAN_SELECT
    }),
    prisma.loan.count({ where })
  ]);

  const totalPages = Math.ceil(total / limit) || 0;

  return {
    loans,
    pagination: {
      page,
      limit,
      totalResults: total,
      totalPages
    }
  };
};

/**
 * Service to return a borrowed book copy (delegate of returnBook for Phase 9.7).
 *
 * @param {Object} data - Input data containing loanId
 * @returns {Promise<Object>} The updated loan record
 */
export const returnLoan = returnBook;

/**
 * Service to synchronize overdue loan statuses for Phase 9.8.
 * Detects active loans whose due date has passed and transitions them to OVERDUE.
 *
 * @returns {Promise<{updatedCount: number, checkedAt: Date}>} Summary of updates
 */
export const syncOverdueLoans = async () => {
  const now = new Date();

  const result = await prisma.loan.updateMany({
    where: {
      status: LoanStatus.BORROWED,
      dueDate: {
        lt: now
      }
    },
    data: {
      status: LoanStatus.OVERDUE
    }
  });

  return {
    updatedCount: result.count,
    checkedAt: now
  };
};


