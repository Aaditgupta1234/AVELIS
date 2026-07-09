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
 * Sequentially coordinates request validation, member eligibility checks, book copy availability
 * checks, and transaction-wrapped loan creation.
 *
 * @param {Object} borrowData - Object containing userId and bookCopyId
 * @param {string} borrowData.userId - The UUID of the member
 * @param {string} borrowData.bookCopyId - The UUID of the physical book copy
 * @returns {Promise<Object>} The created loan record with selected fields
 * @throws {ApiError} Thrown if request parameters are missing (Bad Request), user/copy/book is not found (Not Found), privileges are missing or limit is reached (Forbidden), or copy is already borrowed (Conflict).
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
 * NOTE: Private helper function.
 *
 * @param {Object} eligibilityData - Object containing userId
 * @param {string} eligibilityData.userId - The UUID of the member
 * @returns {Promise<void>} Resolves if eligible, otherwise throws ApiError
 * @throws {ApiError} Thrown if user is not found, user is not a member, user account is inactive, or borrowing limit is reached.
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
 * NOTE: Private helper function.
 *
 * @param {Object} availabilityData - Object containing bookCopyId
 * @param {string} availabilityData.bookCopyId - The UUID of the requested book copy
 * @returns {Promise<Object>} Object containing the validated bookCopyId
 * @throws {ApiError} Thrown if book copy or book is not found/soft-deleted, book is not borrowable, or copy is not available.
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
 * NOTE: Private helper function.
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

/**
 * Service placeholder to return a borrowed book copy for a member.
 *
 * Note: Placeholder for Phase 12.3.3 controller wiring. The implementation
 * will be completed during Phase 12.3.4.
 *
 * @param {Object} returnData - Object containing userId and loanId
 * @param {string} returnData.userId - The UUID of the member
 * @param {string} returnData.loanId - The UUID of the loan
 * @returns {Promise<Object>} The updated loan record
 * @throws {ApiError} 501 Not implemented
 */
/**
 * Validate if a member is eligible to return a specific loan.
 *
 * NOTE: Private helper function.
 *
 * @param {Object} eligibilityData - Object containing userId and loanId
 * @param {string} eligibilityData.userId - The UUID of the member
 * @param {string} eligibilityData.loanId - The UUID of the loan
 * @returns {Promise<Object>} Object containing the validated loan
 * @throws {ApiError} 501 Not implemented
 */
const validateReturnEligibility = async ({ userId, loanId }) => {
  // 1. Retrieve the Loan using established query shape
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    select: LOAN_SELECT
  });

  // 2. Validate Loan Exists
  if (!loan) {
    throw new ApiError(404, 'Loan not found.');
  }

  // 3. Validate Ownership
  if (loan.userId !== userId) {
    throw new ApiError(403, 'Access denied. You can only return your own loans.');
  }

  // 4. Positive Loan Status Validation
  if (loan.status !== LoanStatus.BORROWED && loan.status !== LoanStatus.OVERDUE) {
    if (loan.status === LoanStatus.RETURNED) {
      throw new ApiError(400, 'Loan already returned.');
    }
    throw new ApiError(400, 'Loan is not in a returnable state.');
  }

  // 5. Return the Validated Loan
  return { loan };
};

/**
 * Perform database updates to complete a loan return inside a transaction.
 *
 * NOTE: Private helper function. Assumes authorization, ownership, and return
 * eligibility validation have already completed.
 * Updates the Loan status to RETURNED, sets the returnDate timestamp,
 * marks the associated BookCopy as AVAILABLE, and commits both
 * changes atomically within a Prisma transaction.
 *
 * @param {Object} returnData - Object containing the validated loan
 * @param {Object} returnData.loan - The validated loan record
 * @returns {Promise<Object>} The updated loan record
 */
const completeLoanReturn = async ({ loan }) => {
  return prisma.$transaction(async (tx) => {
    // 1. Update the Loan record to RETURNED and set returnDate
    const updatedLoan = await tx.loan.update({
      where: { id: loan.id },
      data: {
        status: LoanStatus.RETURNED,
        returnDate: new Date()
      },
      select: LOAN_SELECT
    });

    // 2. Update the associated BookCopy to AVAILABLE
    await tx.bookCopy.update({
      where: { id: loan.copyId },
      data: {
        status: CopyStatus.AVAILABLE
      }
    });

    return updatedLoan;
  });
};

/**
 * Service orchestrator to return a borrowed book copy for a member.
 *
 * Sequentially coordinates member return eligibility validation and loan return completion.
 *
 * @param {Object} returnData - Object containing userId and loanId
 * @param {string} returnData.userId - The UUID of the member
 * @param {string} returnData.loanId - The UUID of the loan
 * @returns {Promise<Object>} The updated loan record
 */
export const memberReturnBook = async ({ userId, loanId }) => {
  // 1. Validate return eligibility (Phase 12.3.5)
  const { loan: validatedLoan } = await validateReturnEligibility({ userId, loanId });

  // 2. Perform the database update transaction (Phase 12.3.6)
  const updatedLoan = await completeLoanReturn({ loan: validatedLoan });

  return updatedLoan;
};






