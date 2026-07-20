/**
 * Mapper utility to translate raw backend Book DTOs into the canonical UI Book model.
 */

/**
 * Maps a single backend Loan DTO to the canonical UI model.
 *
 * @param {Object} loan - Raw loan data from the API
 * @returns {Object|null} Normalized UI loan object
 */
export const mapLoanToUI = (loan) => {
  if (!loan) return null;

  const bookData = loan.bookCopy?.book || {};
  const authorNames = bookData.authors && bookData.authors.length > 0
    ? bookData.authors.map((a) => a.author?.fullName).filter(Boolean).join(", ")
    : "Unknown Author";

  return {
    id: loan.id,
    bookId: loan.bookCopy?.bookId || "",
    title: bookData.title || "Unknown Title",
    author: authorNames,
    coverImage: bookData.coverImage || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80",
    borrowedAt: loan.issueDate || new Date().toISOString(),
    dueDate: loan.dueDate || new Date().toISOString(),
    returnedAt: loan.returnDate || null,
    status: loan.status || "BORROWED",
    renewCount: Number(loan.renewCount || 0),
    fineAmount: Number(loan.fineAmount || 0),
  };
};

/**
 * Maps an array of backend Loan DTOs to UI models.
 *
 * @param {Array} loans - Array of raw loans from the API
 * @returns {Array} Array of normalized UI loan objects
 */
export const mapLoansToUI = (loans) => {
  if (!Array.isArray(loans)) return [];
  return loans.map(mapLoanToUI).filter(Boolean);
};
