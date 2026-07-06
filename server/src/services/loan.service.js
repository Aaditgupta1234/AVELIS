import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/index.js';
import { UserRole, CopyStatus, LoanStatus } from '@prisma/client';

const DEFAULT_BORROW_DAYS = 14;

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
    const user = await tx.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      throw new ApiError(404, 'User not found.');
    }
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

    // 5. Create Loan
    const loan = await tx.loan.create({
      data: {
        userId,
        copyId,
        issueDate,
        dueDate,
        status: LoanStatus.BORROWED
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        bookCopy: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                isbn: true
              }
            }
          }
        }
      }
    });

    // 6. Update BookCopy status to BORROWED
    await tx.bookCopy.update({
      where: { id: copyId },
      data: {
        status: CopyStatus.BORROWED
      }
    });

    return loan;
  });
};
