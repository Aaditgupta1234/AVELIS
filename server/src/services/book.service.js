import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/index.js';

/**
 * Service to register a new catalog book.
 *
 * @param {Object} bookData - Input book properties
 * @returns {Promise<Object>} The populated book record
 * @throws {ApiError} 409 if ISBN exists, 400 if invalid author/category IDs
 */
export const createBook = async (bookData) => {
  const title = bookData.title?.trim();
  const isbn = bookData.isbn?.trim();
  const publisher = bookData.publisher?.trim();
  const language = bookData.language?.trim();
  const { publicationYear, description, coverImage, sellingPrice, stockQuantity, isBorrowable, isForSale, authorIds, categoryIds } = bookData;

  return await prisma.$transaction(async (tx) => {
    // 1. Verify ISBN does not already exist
    const existingBook = await tx.book.findUnique({
      where: { isbn }
    });
    if (existingBook) {
      throw new ApiError(409, 'Book with this ISBN already exists.');
    }

    // 2. Verify supplied author IDs exist
    const authors = await tx.author.findMany({
      where: { id: { in: authorIds } },
      select: { id: true }
    });
    if (authors.length !== authorIds.length) {
      throw new ApiError(400, 'One or more author IDs are invalid.');
    }

    // 3. Verify supplied category IDs exist
    const categories = await tx.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true }
    });
    if (categories.length !== categoryIds.length) {
      throw new ApiError(400, 'One or more category IDs are invalid.');
    }

    // 4. Create Book along with junction mappings using nullish coalescing defaults
    const book = await tx.book.create({
      data: {
        title,
        isbn,
        publisher,
        publicationYear: publicationYear ?? null,
        language: language ?? 'English',
        description: description ?? null,
        coverImage: coverImage ?? null,
        sellingPrice: sellingPrice ?? 0,
        stockQuantity: stockQuantity ?? 0,
        isBorrowable: isBorrowable ?? true,
        isForSale: isForSale ?? true,
        authors: {
          create: authorIds.map(authorId => ({ authorId }))
        },
        categories: {
          create: categoryIds.map(categoryId => ({ categoryId }))
        }
      },
      include: {
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
        }
      }
    });

    return book;
  });
};

/**
 * Service to retrieve a filtered/paginated book catalog list.
 *
 * @param {Object} _query - Filtering queries
 * @returns {Promise<null>} Intentionally returns null during foundation phase
 */
export const getBooks = async (query) => {
  const { page, limit, search, sortBy, order, language, publicationYear, isBorrowable, isForSale } = query;

  const skip = (page - 1) * limit;
  const take = limit;

  // Build dynamic where conditions
  const where = {};

  // Case-insensitive language filtering
  if (language) {
    where.language = {
      equals: language.trim(),
      mode: 'insensitive'
    };
  }
  if (publicationYear) where.publicationYear = publicationYear;
  if (isBorrowable !== undefined) where.isBorrowable = isBorrowable;
  if (isForSale !== undefined) where.isForSale = isForSale;

  // Normalize search string
  const normalizedSearch = search?.trim();
  if (normalizedSearch) {
    where.OR = [
      { title: { contains: normalizedSearch, mode: 'insensitive' } },
      { isbn: { contains: normalizedSearch, mode: 'insensitive' } },
      { publisher: { contains: normalizedSearch, mode: 'insensitive' } }
    ];
  }

  // Deterministic secondary sorting
  const orderBy = [
    { [sortBy]: order },
    { id: 'asc' }
  ];

  // Execute count and list queries concurrently inside a transaction
  const [books, totalItems] = await prisma.$transaction([
    prisma.book.findMany({
      where,
      skip,
      take,
      orderBy,
      select: {
        id: true,
        title: true,
        isbn: true,
        publisher: true,
        publicationYear: true,
        language: true,
        coverImage: true,
        sellingPrice: true,
        stockQuantity: true,
        isBorrowable: true,
        isForSale: true,
        createdAt: true,
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
        }
      }
    }),
    prisma.book.count({ where })
  ]);

  // Enforce predictable totalPages (minimum 1)
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  return {
    books,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
};

/**
 * Service to retrieve details of a specific book by its ID.
 *
 * @param {string} _id - Book ID
 * @returns {Promise<null>} Intentionally returns null during foundation phase
 */
export const getBookById = async (_id) => {
  return null;
};

/**
 * Service to update properties of a book entry.
 *
 * @param {string} _id - Book ID
 * @param {Object} _bookData - Modified properties
 * @returns {Promise<null>} Intentionally returns null during foundation phase
 */
export const updateBook = async (_id, _bookData) => {
  return null;
};

/**
 * Service to delete a book entry.
 *
 * @param {string} _id - Book ID
 * @returns {Promise<null>} Intentionally returns null during foundation phase
 */
export const deleteBook = async (_id) => {
  return null;
};

/**
 * Service to restore a soft-deleted book entry.
 *
 * @param {string} _id - Book ID
 * @returns {Promise<null>} Intentionally returns null during foundation phase
 */
export const restoreBook = async (_id) => {
  return null;
};
