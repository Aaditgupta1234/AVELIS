/**
 * @fileoverview Loan module service.
 *
 * Implements business logic for book loans, including borrowing, returning, renewing,
 * and checking active or past loans.
 *
 * @module services/loan
 */

import { prisma } from '../lib/prisma.js';

import { ApiError } from '../utils/index.js';
import { UserRole, CopyStatus, LoanStatus } from '@prisma/client';
import { LOAN_SELECT } from '../shared/selects/loan.select.js';
import { getUserOrThrow } from '../helpers/resource.helper.js';

import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

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

/**
 * Service placeholder to retrieve active loans for a specific user.
 *
 * @param {string} userId - The UUID of the authenticated user
 * @returns {Promise<Array>} List of active loans
 * @throws {ApiError} 501 Not implemented
 */
export const getMyActiveLoans = async (userId) => {
  throw new ApiError(501, 'Not implemented.');
};

/**
 * Service placeholder to retrieve loan history for a specific user.
 *
 * @param {string} userId - The UUID of the authenticated user
 * @returns {Promise<Array>} List of past loans
 * @throws {ApiError} 501 Not implemented
 */
export const getLoanHistory = async (userId) => {
  throw new ApiError(501, 'Not implemented.');
};

/**
 * Service placeholder to renew a borrowed book copy.
 *
 * @param {Object} renewData - Object containing loanId and userId
 * @returns {Promise<Object>} The renewed loan record
 * @throws {ApiError} 501 Not implemented
 */
export const renewLoan = async ({ loanId, userId }) => {
  throw new ApiError(501, 'Not implemented.');
};

/**
 * Service orchestrator to borrow a book copy for a member.
 *
 * ARCHITECTURAL CONTEXT:
 * This method acts as the service-level orchestrator, sequencing the validation,
 * eligibility check, availability check, and database transaction steps.
 *
 * @param {Object} borrowData - Object containing userId and bookCopyId
 * @returns {Promise<Object>} The created loan record
 */
export const memberBorrowBook = async ({ userId, bookCopyId }) => {
  try {
    // 1. Basic defensive parameter validation
    await validateBorrowRequest({ userId, bookCopyId });

    // 2. Check user eligibility for borrowing (Phase 12.2.5)
    await checkBorrowEligibility({ userId });

    // 3. Check copy availability (Phase 12.2.6)
    const { bookCopyId: validatedCopyId } = await checkBookCopyAvailability({ bookCopyId });

    // 4. Create the loan transaction (Phase 12.2.7)
    const loan = await createLoan({ userId, bookCopyId: validatedCopyId });

    // Structured success logging (passing metadata as an object)
    const borrowedAt = loan.issueDate instanceof Date ? loan.issueDate.toISOString() : new Date(loan.issueDate).toISOString();
    const dueDate = loan.dueDate instanceof Date ? loan.dueDate.toISOString() : new Date(loan.dueDate).toISOString();
    logger.info('[LOAN] Member borrow successful', {
      action: 'borrow_book',
      memberId: userId,
      bookCopyId: validatedCopyId,
      loanId: loan.id,
      borrowedAt,
      dueDate
    });

    return loan;
  } catch (error) {
    // Structured failure logging
    const reason = error.message || 'Unknown error';
    const metadata = {
      action: 'borrow_book',
      memberId: userId,
      bookCopyId,
      reason
    };
    
    if (error.statusCode && error.statusCode < 500) {
      logger.warn(`[LOAN] Member borrow failed: ${reason}`, metadata);
    } else {
      logger.error(
        `[LOAN] Member borrow failed: ${reason}`,
        metadata,
        error.stack
      );
    }

    throw error;
  }
};

/**
 * Basic defensive parameter validation helper.
 *
 * NOTE: Private/encapsulated helper function.
 *
 * @param {Object} data - Object containing userId and bookCopyId
 * @throws {ApiError} 400 If required parameters are missing
 */
const validateBorrowRequest = async ({ userId, bookCopyId }) => {
  if (!userId) {
    throw new ApiError(400, 'userId is required.');
  }
  if (!bookCopyId) {
    throw new ApiError(400, 'bookCopyId is required.');
  }
};

/**
 * Check if the member is eligible to borrow books.
 *
 * ARCHITECTURAL CONTEXT:
 * This helper implements the member eligibility checks introduced in Phase 12.2.5 of the AVELIS roadmap.
 * Book copy availability, loan creation, and transaction management are intentionally implemented 
 * in their dedicated roadmap phases.
 *
 * NOTE: Private/encapsulated helper function.
 *
 * @param {Object} eligibilityData - Object containing userId
 * @param {string} eligibilityData.userId - The UUID of the member
 * @returns {Promise<void>} Resolves successfully if the member is eligible
 * @throws {ApiError} 404 If user does not exist ("User not found.")
 * @throws {ApiError} 403 If user is not a MEMBER ("Access denied. Member privileges required.")
 * @throws {ApiError} 403 If member account is inactive ("Member account is inactive.")
 * @throws {ApiError} 403 If borrowing limit is reached ("Borrowing limit reached. Maximum allowed active loans is 5.")
 */
const checkBorrowEligibility = async ({ userId }) => {
  const MAX_ACTIVE_LOANS = 5;

  // 1. Fetch user status and role with a minimal select query
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isActive: true
    }
  });

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  // 2. Verify user has the MEMBER role
  if (user.role !== UserRole.MEMBER) {
    throw new ApiError(403, 'Access denied. Member privileges required.');
  }

  // 3. Verify user account is active
  if (!user.isActive) {
    throw new ApiError(403, 'Member account is inactive.');
  }

  // 4. Enforce active loans limit (max 5 active loans)
  const activeLoansCount = await prisma.loan.count({
    where: {
      userId,
      status: {
        in: [LoanStatus.BORROWED, LoanStatus.OVERDUE]
      }
    }
  });

  if (activeLoansCount >= MAX_ACTIVE_LOANS) {
    throw new ApiError(403, `Borrowing limit reached. Maximum allowed active loans is ${MAX_ACTIVE_LOANS}.`);
  }
};


/**
 * Check if the target book copy is currently borrowable and available.
 *
 * ARCHITECTURAL CONTEXT:
 * This helper implements the book copy availability checks introduced in Phase 12.2.6 of the AVELIS roadmap.
 * Reservation handling, loan creation, and transaction management are intentionally deferred 
 * to later roadmap phases.
 *
 * NOTE: Private/encapsulated helper function.
 *
 * @param {Object} availabilityData - Object containing bookCopyId
 * @param {string} availabilityData.bookCopyId - The UUID of the requested book copy
 * @returns {Promise<Object>} Object containing the validated bookCopyId
 * @throws {ApiError} 404 If book copy or book does not exist, or is soft deleted
 * @throws {ApiError} 400 If book is not borrowable
 * @throws {ApiError} 409 If requested copy is not available
 */
const checkBookCopyAvailability = async ({ bookCopyId }) => {
  // 1. Fetch copy status and parent bookId
  const copy = await prisma.bookCopy.findUnique({
    where: { id: bookCopyId },
    select: {
      id: true,
      bookId: true,
      status: true
    }
  });

  if (!copy) {
    throw new ApiError(404, 'Book copy not found.');
  }

  // 2. Fetch parent book details
  const book = await prisma.book.findUnique({
    where: { id: copy.bookId },
    select: {
      id: true,
      isDeleted: true,
      isBorrowable: true
    }
  });

  if (!book || book.isDeleted) {
    throw new ApiError(404, 'Book not found.');
  }

  // 3. Verify book is borrowable
  if (!book.isBorrowable) {
    throw new ApiError(400, 'Book is not borrowable.');
  }

  // 4. Verify specific copy is AVAILABLE
  if (copy.status !== CopyStatus.AVAILABLE) {
    throw new ApiError(409, 'Requested book copy is not available.');
  }

  return {
    bookCopyId: copy.id
  };
};


/**
 * Create the loan record and update the copy status within a database transaction.
 *
 * ARCHITECTURAL CONTEXT:
 * This helper implements the atomic loan creation transaction introduced in Phase 12.2.7 of the AVELIS roadmap.
 * Logging, response formatting, reservation workflows, and multi-instance concurrency refinements 
 * are intentionally deferred to their dedicated roadmap phases.
 *
 * NOTE: Private/encapsulated helper function.
 *
 * @param {Object} loanData - Object containing userId and bookCopyId
 * @param {string} loanData.userId - The UUID of the member
 * @param {string} loanData.bookCopyId - The UUID of the book copy
 * @returns {Promise<Object>} The created loan record with selected fields
 * @throws {Error} If database write fails, triggering automatic rollback
 */
const createLoan = async ({ userId, bookCopyId }) => {
  return await prisma.$transaction(async (tx) => {
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(issueDate.getDate() + DEFAULT_BORROW_DAYS);

    // 1. Create the Loan record (maps parameter bookCopyId to copyId in schema)
    const loan = await tx.loan.create({
      data: {
        userId,
        copyId: bookCopyId,
        issueDate,
        dueDate,
        status: LoanStatus.BORROWED
      },
      select: LOAN_SELECT
    });

    // 2. Update the BookCopy status to BORROWED
    await tx.bookCopy.update({
      where: { id: bookCopyId },
      data: {
        status: CopyStatus.BORROWED
      }
    });

    return loan;
  });
};






