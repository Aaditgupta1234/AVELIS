/**
 * @fileoverview Book module database selection mappings.
 *
 * Configures the fields to extract from the database when querying books
 * to maintain consistent API payload contracts.
 *
 * @module shared/selects/book.select
 */

/**
 * Prisma query select mapping for retrieving Book database entries.
 * @type {Object}
 */
export const BOOK_SELECT = {
  id: true,
  title: true,
  isbn: true,
  publisher: true,
  publicationYear: true,
  language: true,
  description: true,
  coverImage: true,
  coverImagePath: true,
  pdfUrl: true,
  pdfPath: true,
  sellingPrice: true,
  stockQuantity: true,
  isBorrowable: true,
  isForSale: true,
  isDeleted: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true
};

export const BOOK_PUBLIC_INCLUDE = {
  authors: {
    select: {
      author: {
        select: {
          id: true,
          fullName: true
        }
      }
    }
  },
  categories: {
    select: {
      category: {
        select: {
          id: true,
          name: true
        }
      }
    }
  },
  copies: {
    select: {
      id: true,
      status: true,
      condition: true
    }
  }
};
