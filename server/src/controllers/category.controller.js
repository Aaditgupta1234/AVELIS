import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/index.js';

/**
 * Get all categories for dropdowns and catalog management.
 */
export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    return sendSuccess(res, 200, categories, 'Categories retrieved successfully.');
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to retrieve categories.');
  }
};
