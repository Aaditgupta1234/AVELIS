/**
 * Mapper utility to translate raw backend Reservation DTOs into canonical UI Reservation models.
 */

/**
 * Maps a single backend Reservation DTO to the canonical UI model.
 *
 * @param {Object} reservation - Raw reservation data from the API
 * @returns {Object|null} Normalized UI reservation object
 */
export const mapReservationToUI = (reservation) => {
  if (!reservation) return null;

  const bookData = reservation.book || {};
  const authorNames =
    bookData.authors && bookData.authors.length > 0
      ? bookData.authors.map((a) => a.author?.fullName).filter(Boolean).join(", ")
      : "Unknown Author";

  return {
    id: reservation.id,
    bookId: reservation.bookId || bookData.id || "",
    bookTitle: bookData.title || "Unknown Title",
    bookIsbn: bookData.isbn || "",
    author: authorNames,
    coverImage:
      bookData.coverImage ||
      "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80",
    status: reservation.status || "PENDING",
    createdAt: reservation.createdAt || new Date().toISOString(),
    expiresAt: reservation.expiresAt || null,
    cancelledAt: reservation.cancelledAt || null,
    fulfilledAt: reservation.fulfilledAt || null,
    copyId: reservation.bookCopy?.id || null,
    copyStatus: reservation.bookCopy?.status || null,
    shelfLocation: reservation.bookCopy?.shelfLocation || null,
  };
};

/**
 * Maps an array of backend Reservation DTOs to UI models.
 *
 * @param {Array} reservations - Array of raw reservations from the API
 * @returns {Array} Array of normalized UI reservation objects
 */
export const mapReservationsToUI = (reservations) => {
  if (!Array.isArray(reservations)) return [];
  return reservations.map(mapReservationToUI).filter(Boolean);
};
