import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/index.js';
import { BOOK_SELECT, BOOK_PUBLIC_INCLUDE } from '../shared/selects/book.select.js';

/**
 * Helper to retrieve a book and verify its existence.
 *
 * @param {Object} tx - Prisma transaction context
 * @param {string} id - Book ID
 * @returns {Promise<Object>} The book record
 * @throws {ApiError} 404 if book not found
 */
const getBookOrThrow = async (tx, id, select = null) => {
  const book = await tx.book.findUnique({
    where: { id },
    ...(select && { select })
  });
  if (!book) {
    throw new ApiError(404, 'Book not found.');
  }
  return book;
};

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
  const { publicationYear, description, coverImage, pdfUrl, sellingPrice, stockQuantity, isBorrowable, isForSale, authorIds, categoryIds } = bookData;

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
        pdfUrl: pdfUrl ?? null,
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
      include: BOOK_PUBLIC_INCLUDE
    });

    return book;
  }, { maxWait: 5000, timeout: 10000 });
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
  const where = {
    isDeleted: false
  };

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
 * @param {string} id - Book ID
 * @returns {Promise<Object>} The book record
 * @throws {ApiError} 404 if book not found or soft-deleted
 */
export const getBookById = async (id) => {
  const book = await prisma.book.findUnique({
    where: { id },
    include: BOOK_PUBLIC_INCLUDE
  });

  if (!book || book.isDeleted) {
    throw new ApiError(404, 'Book not found.');
  }

  return book;
};

/**
 * Service to update properties of a book entry.
 *
 * @param {string} id - Book ID
 * @param {Object} bookData - Modified properties
 * @returns {Promise<Object>} The updated book record
 * @throws {ApiError} 404 if book not found, 409 if ISBN exists, 400 if invalid author/category IDs
 */
export const updateBook = async (id, bookData) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Find Existing Book
    const existingBook = await getBookOrThrow(tx, id);

    // 2. ISBN Conflict Check
    const isbn = typeof bookData.isbn === 'string' ? bookData.isbn.trim() : bookData.isbn;
    if (isbn !== undefined && isbn !== null) {
      // Compare with the existing book's ISBN.
      // If changed, search for another book using that ISBN.
      if (isbn !== existingBook.isbn) {
        const duplicateBook = await tx.book.findUnique({
          where: { isbn }
        });
        if (duplicateBook) {
          throw new ApiError(409, 'ISBN already exists.');
        }
      }
    }

    // 3. Verify Author IDs if provided
    if (bookData.authorIds !== undefined && bookData.authorIds !== null) {
      const authors = await tx.author.findMany({
        where: { id: { in: bookData.authorIds } },
        select: { id: true }
      });
      if (authors.length !== bookData.authorIds.length) {
        throw new ApiError(400, 'One or more author IDs are invalid.');
      }
    }

    // 4. Verify Category IDs if provided
    if (bookData.categoryIds !== undefined && bookData.categoryIds !== null) {
      const categories = await tx.category.findMany({
        where: { id: { in: bookData.categoryIds } },
        select: { id: true }
      });
      if (categories.length !== bookData.categoryIds.length) {
        throw new ApiError(400, 'One or more category IDs are invalid.');
      }
    }

    // 5. Build Partial Update Object
    const updateData = {};
    if (bookData.title !== undefined) updateData.title = typeof bookData.title === 'string' ? bookData.title.trim() : bookData.title;
    if (bookData.isbn !== undefined) updateData.isbn = isbn;
    if (bookData.publisher !== undefined) updateData.publisher = typeof bookData.publisher === 'string' ? bookData.publisher.trim() : bookData.publisher;
    if (bookData.publicationYear !== undefined) updateData.publicationYear = bookData.publicationYear;
    if (bookData.language !== undefined) updateData.language = typeof bookData.language === 'string' ? bookData.language.trim() : bookData.language;
    if (bookData.description !== undefined) updateData.description = typeof bookData.description === 'string' ? bookData.description.trim() : bookData.description;
    if (bookData.coverImage !== undefined) updateData.coverImage = typeof bookData.coverImage === 'string' ? bookData.coverImage.trim() : bookData.coverImage;
    if (bookData.pdfUrl !== undefined) updateData.pdfUrl = typeof bookData.pdfUrl === 'string' ? bookData.pdfUrl.trim() : bookData.pdfUrl;
    if (bookData.sellingPrice !== undefined) updateData.sellingPrice = bookData.sellingPrice;
    if (bookData.stockQuantity !== undefined) updateData.stockQuantity = bookData.stockQuantity;
    if (bookData.isBorrowable !== undefined) updateData.isBorrowable = bookData.isBorrowable;
    if (bookData.isForSale !== undefined) updateData.isForSale = bookData.isForSale;

    if (bookData.authorIds !== undefined && bookData.authorIds !== null) {
      updateData.authors = {
        deleteMany: {},
        create: bookData.authorIds.map(authorId => ({ authorId }))
      };
    }

    if (bookData.categoryIds !== undefined && bookData.categoryIds !== null) {
      updateData.categories = {
        deleteMany: {},
        create: bookData.categoryIds.map(categoryId => ({ categoryId }))
      };
    }

    // 6. Update Database and return consistent response
    const updatedBook = await tx.book.update({
      where: { id },
      data: updateData,
      include: BOOK_PUBLIC_INCLUDE
    });

    return updatedBook;
  }, { maxWait: 5000, timeout: 10000 });
};

/**
 * Service to soft delete a book.
 *
 * @param {string} bookId - Book ID
 * @returns {Promise<Object>} The updated book record
 * @throws {ApiError} 404 if book not found, 400 if already soft deleted
 */
export const softDeleteBook = async (bookId) => {
  try {
    return await prisma.book.update({
      where: { id: bookId, isDeleted: false },
      data: {
        isDeleted: true,
        deletedAt: new Date()
      },
      include: BOOK_PUBLIC_INCLUDE
    });
  } catch (error) {
    if (error.code === 'P2025') {
      const book = await prisma.book.findUnique({
        where: { id: bookId },
        select: { id: true, isDeleted: true }
      });
      if (!book) {
        throw new ApiError(404, 'Book not found.');
      }
      if (book.isDeleted) {
        throw new ApiError(400, 'Book has already been deleted.');
      }
    }
    throw error;
  }
};

/**
 * Service to permanently delete a previously soft-deleted book.
 *
 * @param {string} bookId - Book ID
 * @returns {Promise<Object>} The deleted book record
 * @throws {ApiError} 404 if book not found, 400 if book is not soft-deleted
 */
export const permanentDeleteBook = async (bookId) => {
  try {
    return await prisma.book.delete({
      where: { id: bookId, isDeleted: true },
      include: BOOK_PUBLIC_INCLUDE
    });
  } catch (error) {
    if (error.code === 'P2025') {
      const book = await prisma.book.findUnique({
        where: { id: bookId },
        select: { id: true, isDeleted: true }
      });
      if (!book) {
        throw new ApiError(404, 'Book not found.');
      }
      if (!book.isDeleted) {
        throw new ApiError(400, 'Book must be soft deleted before permanent deletion.');
      }
    }
    throw error;
  }
};

/**
 * Service to restore a previously soft-deleted book.
 *
 * @param {string} bookId - Book ID
 * @returns {Promise<Object>} The restored book record
 * @throws {ApiError} 404 if book not found, 400 if book is not deleted
 */
export const restoreBook = async (bookId) => {
  try {
    return await prisma.book.update({
      where: { id: bookId, isDeleted: true },
      data: {
        isDeleted: false,
        deletedAt: null
      },
      include: BOOK_PUBLIC_INCLUDE
    });
  } catch (error) {
    if (error.code === 'P2025') {
      const book = await prisma.book.findUnique({
        where: { id: bookId },
        select: { id: true, isDeleted: true }
      });
      if (!book) {
        throw new ApiError(404, 'Book not found.');
      }
      if (!book.isDeleted) {
        throw new ApiError(400, 'Book is not deleted.');
      }
    }
    throw error;
  }
};

/**
 * Service to retrieve rating statistics for a specific book.
 * Calculates average rating, total review count, and rating distribution dynamically.
 *
 * @param {string} bookId - The UUID of the book
 * @returns {Promise<Object>} The rating statistics object
 * @throws {ApiError} 404 if the book does not exist or is soft-deleted
 */
export const getBookRating = async (bookId) => {
  // Step 1: Verify the book exists and is not soft-deleted
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { id: true, isDeleted: true }
  });

  if (!book || book.isDeleted) {
    throw new ApiError(404, 'Book not found.');
  }

  // Step 2: Query the rating statistics using Prisma aggregation
  const aggregations = await prisma.review.aggregate({
    where: { bookId },
    _avg: { rating: true },
    _count: { id: true }
  });

  const distributions = await prisma.review.groupBy({
    by: ['rating'],
    where: { bookId },
    _count: { rating: true }
  });

  // Step 3: Construct the return object
  const ratingDistribution = {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0
  };

  for (const group of distributions) {
    const key = String(group.rating);
    if (key in ratingDistribution) {
      ratingDistribution[key] = group._count.rating;
    }
  }

  let averageRating = null;
  if (aggregations._count.id > 0 && aggregations._avg.rating !== null) {
    averageRating = Math.round(aggregations._avg.rating * 10) / 10;
  }

  return {
    averageRating,
    totalReviews: aggregations._count.id,
    ratingDistribution
  };
};

