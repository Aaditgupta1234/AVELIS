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
 * Format category object with booksCount and resolved audit information.
 */
const formatCategoryResponse = (category, userMap = new Map()) => {
  const activeBooksCount = category._count?.books ?? (Array.isArray(category.books) ? category.books.length : 0);
  
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    isSystem: category.isSystem,
    isDeleted: category.isDeleted,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    deletedAt: category.deletedAt,
    restoredAt: category.restoredAt,
    createdBy: category.createdBy ? (userMap.get(category.createdBy) || category.createdBy) : 'System Initialization',
    deletedBy: category.deletedBy ? (userMap.get(category.deletedBy) || category.deletedBy) : null,
    restoredBy: category.restoredBy ? (userMap.get(category.restoredBy) || category.restoredBy) : null,
    booksCount: activeBooksCount,
  };
};

/**
 * Get categories list (active, archived, or all) with active book counts and pagination.
 */
export const getAllCategoriesService = async ({ filter = 'active', page, limit } = {}) => {
  const where = {};
  if (filter === 'active') {
    where.isDeleted = false;
  } else if (filter === 'archived') {
    where.isDeleted = true;
  }

  const queryOptions = {
    where,
    orderBy: { name: 'asc' },
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

  const categories = await prisma.category.findMany(queryOptions);

  // Collect audit user IDs
  const userIds = [];
  categories.forEach((c) => {
    if (c.createdBy) userIds.push(c.createdBy);
    if (c.deletedBy) userIds.push(c.deletedBy);
    if (c.restoredBy) userIds.push(c.restoredBy);
  });

  const userMap = await resolveAuditUsers(userIds);

  return categories.map((c) => formatCategoryResponse(c, userMap));
};

/**
 * Create a new category or restore a soft-deleted category with matching normalized name.
 */
export const createCategoryService = async ({ name, description }, userId) => {
  const cleanName = normalizeString(name);
  const cleanDescription = description ? description.trim() : null;

  if (!cleanName) {
    const err = new Error('Category name is required.');
    err.statusCode = 400;
    throw err;
  }

  // Case-insensitive lookup across ALL rows (including soft-deleted)
  const existing = await prisma.category.findFirst({
    where: {
      name: {
        equals: cleanName,
        mode: 'insensitive',
      },
    },
  });

  if (existing) {
    if (!existing.isDeleted) {
      const err = new Error(`Category "${cleanName}" already exists.`);
      err.statusCode = 409;
      throw err;
    }

    // Atomically restore soft-deleted category and update description if provided
    const restored = await prisma.$transaction(async (tx) => {
      return await tx.category.update({
        where: { id: existing.id },
        data: {
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          restoredAt: new Date(),
          restoredBy: userId || null,
          ...(cleanDescription !== null && { description: cleanDescription }),
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
    return formatCategoryResponse(restored, userMap);
  }

  // Create new category
  const created = await prisma.category.create({
    data: {
      name: cleanName,
      description: cleanDescription,
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
  return formatCategoryResponse(created, userMap);
};

/**
 * Update an existing category with duplicate checks and optimistic concurrency validation.
 */
export const updateCategoryService = async (id, { name, description }, expectedUpdatedAt, userId) => {
  const existing = await prisma.category.findUnique({
    where: { id },
  });

  if (!existing) {
    const err = new Error('Category not found.');
    err.statusCode = 404;
    throw err;
  }

  // Optimistic concurrency check if provided
  if (expectedUpdatedAt && new Date(expectedUpdatedAt).getTime() !== new Date(existing.updatedAt).getTime()) {
    const err = new Error('Category was modified by another administrator. Please refresh and try again.');
    err.statusCode = 409;
    throw err;
  }

  const cleanName = name !== undefined ? normalizeString(name) : existing.name;
  const cleanDescription = description !== undefined ? (description ? description.trim() : null) : existing.description;

  if (!cleanName) {
    const err = new Error('Category name cannot be empty.');
    err.statusCode = 400;
    throw err;
  }

  if (cleanName.toLowerCase() !== existing.name.toLowerCase()) {
    const conflict = await prisma.category.findFirst({
      where: {
        name: { equals: cleanName, mode: 'insensitive' },
        id: { not: id },
        isDeleted: false,
      },
    });

    if (conflict) {
      const err = new Error(`Another category named "${cleanName}" already exists.`);
      err.statusCode = 409;
      throw err;
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    return await tx.category.update({
      where: { id },
      data: {
        name: cleanName,
        description: cleanDescription,
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
  return formatCategoryResponse(updated, userMap);
};

/**
 * Soft delete a category.
 */
export const deleteCategoryService = async (id, userId) => {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    const err = new Error('Category not found.');
    err.statusCode = 404;
    throw err;
  }

  if (category.isSystem) {
    const err = new Error('System core categories cannot be deleted.');
    err.statusCode = 400;
    throw err;
  }

  if (category.isDeleted) {
    const err = new Error('Category is already deleted.');
    err.statusCode = 409;
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    await tx.category.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId || null,
      },
    });
  });

  return { success: true, message: `Category "${category.name}" soft-deleted successfully.` };
};

/**
 * Restore an archived category.
 */
export const restoreCategoryService = async (id, userId) => {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    const err = new Error('Category not found.');
    err.statusCode = 404;
    throw err;
  }

  if (!category.isDeleted) {
    const err = new Error('Category is already active.');
    err.statusCode = 409;
    throw err;
  }

  const restored = await prisma.$transaction(async (tx) => {
    return await tx.category.update({
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
  return formatCategoryResponse(restored, userMap);
};
