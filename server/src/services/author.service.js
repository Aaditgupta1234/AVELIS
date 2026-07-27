import { prisma } from '../lib/prisma.js';

/**
 * Helper to normalize whitespace in strings.
 */
const normalizeString = (str) => (str ? str.trim().replace(/\s+/g, ' ') : '');

/**
 * Helper to resolve user UUIDs to readable emails/usernames gracefully.
 */
const resolveAuditUsers = async (userIds) => {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  try {
    const users = await prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, username: true, email: true },
    });
    const userMap = new Map();
    users.forEach((u) => {
      userMap.set(u.id, u.email || u.username);
    });
    return userMap;
  } catch (_) {
    return new Map();
  }
};

/**
 * Format author object with booksCount and resolved audit information.
 */
const formatAuthorResponse = (author, userMap = new Map()) => {
  const activeBooksCount = author._count?.books ?? (Array.isArray(author.books) ? author.books.length : 0);

  return {
    id: author.id,
    name: author.fullName,
    fullName: author.fullName,
    biography: author.biography,
    photo: author.photo,
    isSystem: author.isSystem,
    isDeleted: author.isDeleted,
    createdAt: author.createdAt,
    updatedAt: author.updatedAt,
    deletedAt: author.deletedAt,
    restoredAt: author.restoredAt,
    createdBy: author.createdBy ? (userMap.get(author.createdBy) || author.createdBy) : 'System Initialization',
    deletedBy: author.deletedBy ? (userMap.get(author.deletedBy) || author.deletedBy) : null,
    restoredBy: author.restoredBy ? (userMap.get(author.restoredBy) || author.restoredBy) : null,
    booksCount: activeBooksCount,
  };
};

/**
 * Get authors list (active, archived, or all) with active book counts and pagination.
 */
export const getAllAuthorsService = async ({ filter = 'active', page, limit } = {}) => {
  const where = {};
  if (filter === 'active') {
    where.isDeleted = false;
  } else if (filter === 'archived') {
    where.isDeleted = true;
  }

  const queryOptions = {
    where,
    orderBy: { fullName: 'asc' },
    include: {
      _count: {
        select: {
          books: {
            where: {
              book: {
                isDeleted: false,
              },
            },
          },
        },
      },
    },
  };

  if (page && limit) {
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    queryOptions.skip = (pageNum - 1) * limitNum;
    queryOptions.take = limitNum;
  }

  const authors = await prisma.author.findMany(queryOptions);

  // Collect audit user IDs
  const userIds = [];
  authors.forEach((a) => {
    if (a.createdBy) userIds.push(a.createdBy);
    if (a.deletedBy) userIds.push(a.deletedBy);
    if (a.restoredBy) userIds.push(a.restoredBy);
  });

  const userMap = await resolveAuditUsers(userIds);

  return authors.map((a) => formatAuthorResponse(a, userMap));
};

/**
 * Create a new author or restore a soft-deleted author with matching normalized name.
 */
export const createAuthorService = async ({ fullName, biography, photo }, userId) => {
  const cleanName = normalizeString(fullName);
  const cleanBio = biography ? biography.trim() : null;
  const cleanPhoto = photo ? photo.trim() : null;

  if (!cleanName) {
    const err = new Error('Author full name is required.');
    err.statusCode = 400;
    throw err;
  }

  // Case-insensitive lookup across ALL rows (including soft-deleted)
  const existing = await prisma.author.findFirst({
    where: {
      fullName: {
        equals: cleanName,
        mode: 'insensitive',
      },
    },
  });

  if (existing) {
    if (!existing.isDeleted) {
      const err = new Error(`Author "${cleanName}" already exists.`);
      err.statusCode = 409;
      throw err;
    }

    // Atomically restore soft-deleted author and update details if provided
    const restored = await prisma.$transaction(async (tx) => {
      return await tx.author.update({
        where: { id: existing.id },
        data: {
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          restoredAt: new Date(),
          restoredBy: userId || null,
          ...(cleanBio !== null && { biography: cleanBio }),
          ...(cleanPhoto !== null && { photo: cleanPhoto }),
        },
        include: {
          _count: {
            select: {
              books: {
                where: { book: { isDeleted: false } },
              },
            },
          },
        },
      });
    });

    const userMap = await resolveAuditUsers([restored.createdBy, restored.restoredBy].filter(Boolean));
    return formatAuthorResponse(restored, userMap);
  }

  // Create new author
  const created = await prisma.author.create({
    data: {
      fullName: cleanName,
      biography: cleanBio,
      photo: cleanPhoto,
      createdBy: userId || null,
      isSystem: false,
    },
    include: {
      _count: {
        select: {
          books: {
            where: { book: { isDeleted: false } },
          },
        },
      },
    },
  });

  const userMap = await resolveAuditUsers([created.createdBy].filter(Boolean));
  return formatAuthorResponse(created, userMap);
};

/**
 * Update an existing author with duplicate checks and optimistic concurrency validation.
 */
export const updateAuthorService = async (id, { fullName, biography, photo }, expectedUpdatedAt, userId) => {
  const existing = await prisma.author.findUnique({
    where: { id },
  });

  if (!existing) {
    const err = new Error('Author not found.');
    err.statusCode = 404;
    throw err;
  }

  // Optimistic concurrency check if provided
  if (expectedUpdatedAt && new Date(expectedUpdatedAt).getTime() !== new Date(existing.updatedAt).getTime()) {
    const err = new Error('Author details were modified by another administrator. Please refresh and try again.');
    err.statusCode = 409;
    throw err;
  }

  const cleanName = fullName !== undefined ? normalizeString(fullName) : existing.fullName;
  const cleanBio = biography !== undefined ? (biography ? biography.trim() : null) : existing.biography;
  const cleanPhoto = photo !== undefined ? (photo ? photo.trim() : null) : existing.photo;

  if (!cleanName) {
    const err = new Error('Author full name cannot be empty.');
    err.statusCode = 400;
    throw err;
  }

  if (cleanName.toLowerCase() !== existing.fullName.toLowerCase()) {
    const conflict = await prisma.author.findFirst({
      where: {
        fullName: { equals: cleanName, mode: 'insensitive' },
        id: { not: id },
        isDeleted: false,
      },
    });

    if (conflict) {
      const err = new Error(`Another author named "${cleanName}" already exists.`);
      err.statusCode = 409;
      throw err;
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    return await tx.author.update({
      where: { id },
      data: {
        fullName: cleanName,
        biography: cleanBio,
        photo: cleanPhoto,
      },
      include: {
        _count: {
          select: {
            books: { where: { book: { isDeleted: false } } },
          },
        },
      },
    });
  });

  const userMap = await resolveAuditUsers([updated.createdBy, updated.deletedBy, updated.restoredBy].filter(Boolean));
  return formatAuthorResponse(updated, userMap);
};

/**
 * Soft delete an author.
 */
export const deleteAuthorService = async (id, userId) => {
  const author = await prisma.author.findUnique({
    where: { id },
  });

  if (!author) {
    const err = new Error('Author not found.');
    err.statusCode = 404;
    throw err;
  }

  if (author.isSystem) {
    const err = new Error('System core authors cannot be deleted.');
    err.statusCode = 400;
    throw err;
  }

  if (author.isDeleted) {
    const err = new Error('Author is already deleted.');
    err.statusCode = 409;
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    await tx.author.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId || null,
      },
    });
  });

  return { success: true, message: `Author "${author.fullName}" soft-deleted successfully.` };
};

/**
 * Restore an archived author.
 */
export const restoreAuthorService = async (id, userId) => {
  const author = await prisma.author.findUnique({
    where: { id },
  });

  if (!author) {
    const err = new Error('Author not found.');
    err.statusCode = 404;
    throw err;
  }

  if (!author.isDeleted) {
    const err = new Error('Author is already active.');
    err.statusCode = 409;
    throw err;
  }

  const restored = await prisma.$transaction(async (tx) => {
    return await tx.author.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        restoredAt: new Date(),
        restoredBy: userId || null,
      },
      include: {
        _count: {
          select: {
            books: { where: { book: { isDeleted: false } } },
          },
        },
      },
    });
  });

  const userMap = await resolveAuditUsers([restored.createdBy, restored.restoredBy].filter(Boolean));
  return formatAuthorResponse(restored, userMap);
};
