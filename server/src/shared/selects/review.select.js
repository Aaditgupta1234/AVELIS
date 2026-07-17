/**
 * @fileoverview Review module database selection mappings.
 *
 * Configures the fields to extract from the database when querying book reviews.
 *
 * @module shared/selects/review.select
 */

/**
 * Prisma query select mapping for retrieving Review database entries.
 * @type {Object}
 */
export const REVIEW_SELECT = {
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      username: true,
      email: true
    }
  },
  book: {
    select: {
      id: true,
      title: true,
      isbn: true
    }
  }
};
