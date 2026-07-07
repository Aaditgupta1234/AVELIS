import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/index.js';

/**
 * Retrieve a user and verify their existence, or throw a 404 error.
 *
 * @param {string} userId - User ID
 * @param {Object} [tx=prisma] - Prisma transaction client or default prisma
 * @returns {Promise<Object>} The user record
 * @throws {ApiError} 404 if user not found
 */
export const getUserOrThrow = async (userId, tx = prisma) => {
  const user = await tx.user.findUnique({
    where: { id: userId }
  });
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }
  return user;
};

/**
 * Retrieve a book and verify its existence, or throw a 404 error.
 *
 * @param {string} bookId - Book ID
 * @param {Object} [tx=prisma] - Prisma transaction client or default prisma
 * @returns {Promise<Object>} The book record
 * @throws {ApiError} 404 if book not found
 */
export const getBookOrThrow = async (bookId, tx = prisma) => {
  const book = await tx.book.findUnique({
    where: { id: bookId }
  });
  if (!book) {
    throw new ApiError(404, 'Book not found.');
  }
  return book;
};

/**
 * Retrieve a book copy and verify its existence, or throw a 404 error.
 *
 * @param {string} copyId - Book Copy ID
 * @param {Object} [tx=prisma] - Prisma transaction client or default prisma
 * @returns {Promise<Object>} The book copy record
 * @throws {ApiError} 404 if copy not found
 */
export const getCopyOrThrow = async (copyId, tx = prisma) => {
  const copy = await tx.bookCopy.findUnique({
    where: { id: copyId }
  });
  if (!copy) {
    throw new ApiError(404, 'Book copy not found.');
  }
  return copy;
};
