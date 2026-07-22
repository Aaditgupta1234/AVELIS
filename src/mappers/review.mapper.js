/**
 * Mapper utility to translate raw backend Review DTOs into the canonical UI Review model.
 */

/**
 * Maps a single backend Review DTO to the canonical UI model.
 *
 * @param {Object} review - Raw review data from the API
 * @returns {Object|null} Normalized UI review object
 */
export const mapReviewToUI = (review) => {
  if (!review) return null;

  return {
    id: review.id,
    bookId: review.book?.id || review.bookId || "",
    bookTitle: review.book?.title || "",
    rating: Number(review.rating || 0),
    comment: review.comment || "",
    createdAt: review.createdAt || new Date().toISOString(),
    updatedAt: review.updatedAt || new Date().toISOString(),
    userId: review.user?.id || review.userId || "",
    username: review.user?.username || "Anonymous",
    email: review.user?.email || "",
  };
};

/**
 * Maps an array of backend Review DTOs to UI models.
 *
 * @param {Array} reviews - Array of raw reviews from the API
 * @returns {Array} Array of normalized UI review objects
 */
export const mapReviewsToUI = (reviews) => {
  if (!Array.isArray(reviews)) return [];
  return reviews.map(mapReviewToUI).filter(Boolean);
};
