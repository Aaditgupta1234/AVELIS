/**
 * Mapper utility to translate raw backend Book DTOs into the canonical UI Book model.
 */

/**
 * Maps a single backend Book DTO to the canonical UI model.
 *
 * @param {Object} book - Raw book data from the API
 * @returns {Object|null} Normalized UI book object
 */
export const mapBookToUI = (book) => {
  if (!book) return null;

  // Flatten nested author relationship array
  const authorNames = book.authors && book.authors.length > 0
    ? book.authors.map((a) => a.author?.fullName).filter(Boolean).join(", ")
    : "Unknown Author";

  // Flatten nested category relationship array
  const categoryNames = book.categories && book.categories.length > 0
    ? book.categories.map((c) => c.category?.name).filter(Boolean).join(", ")
    : "General";

  // Retain nested lists of id/name mapping for forms and relations editing
  const authorsList = book.authors
    ? book.authors.map((a) => ({ id: a.author?.id, name: a.author?.fullName })).filter(a => a.id)
    : [];

  const categoriesList = book.categories
    ? book.categories.map((c) => ({ id: c.category?.id, name: c.category?.name })).filter(c => c.id)
    : [];

  return {
    id: book.id,
    title: book.title,
    author: authorNames,
    category: categoryNames,
    authorsList,
    categoriesList,
    coverImage: book.coverImage || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80",
    publicationYear: book.publicationYear || null,
    year: book.publicationYear || null, // Mock UI compatibility key
    publisher: book.publisher || "Archival Press",
    language: book.language || "English",
    description: book.description || "",
    sellingPrice: Number(book.sellingPrice || 0),
    stockQuantity: Number(book.stockQuantity || 0),
    isBorrowable: !!book.isBorrowable,
    isForSale: !!book.isForSale,
    rating: book.rating || 5.0, // Default fallback rating
    createdAt: book.createdAt || new Date().toISOString(),
  };
};

/**
 * Maps an array of backend Book DTOs to UI models.
 *
 * @param {Array} books - Array of raw books from the API
 * @returns {Array} Array of normalized UI book objects
 */
export const mapBooksToUI = (books) => {
  if (!Array.isArray(books)) return [];
  return books.map(mapBookToUI);
};
