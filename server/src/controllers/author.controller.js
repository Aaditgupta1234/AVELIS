import { prisma } from '../lib/prisma.js';
import { sendSuccess, sendError } from '../utils/index.js';

/**
 * Get all authors for dropdowns and catalog management.
 */
export const getAuthors = async (req, res) => {
  try {
    const authors = await prisma.author.findMany({
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        fullName: true,
        biography: true,
        photo: true,
      },
    });

    // Map to normalized { id, name } objects for frontend consumption
    const formatted = authors.map((a) => ({
      id: a.id,
      name: a.fullName,
      fullName: a.fullName,
      biography: a.biography,
      photo: a.photo,
    }));

    return sendSuccess(res, 200, formatted, 'Authors retrieved successfully.');
  } catch (error) {
    return sendError(res, 500, error.message || 'Failed to retrieve authors.');
  }
};
