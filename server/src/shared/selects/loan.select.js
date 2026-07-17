/**
 * @fileoverview Loan module database selection mappings.
 *
 * Configures the fields to extract from the database when querying loan transactions.
 *
 * @module shared/selects/loan.select
 */

/**
 * Prisma query select mapping for retrieving Loan database entries.
 * @type {Object}
 */
export const LOAN_SELECT = {
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
  updatedAt: true,
  user: {
    select: {
      id: true,
      username: true,
      email: true
    }
  },
  bookCopy: {
    select: {
      id: true,
      bookId: true,
      barcode: true,
      shelfLocation: true,
      condition: true,
      status: true,
      purchaseDate: true,
      createdAt: true,
      updatedAt: true,
      book: {
        select: {
          id: true,
          title: true,
          isbn: true
        }
      }
    }
  }
};
