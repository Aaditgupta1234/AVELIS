/**
 * @fileoverview Book module constants.
 *
 * Reusable constants for page limits, sorting parameters, and searchable keys.
 *
 * @module constants/book
 */

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_SORT_FIELD = 'createdAt';
export const DEFAULT_SORT_ORDER = 'desc';

/**
 * Fields belonging directly to the Book database model that support search filtering.
 * Relational searching (e.g. by author/category names) will be handled via
 * explicit Prisma relation joins in later development phases.
 */
export const BOOK_SEARCHABLE_FIELDS = ['title', 'isbn', 'publisher', 'language'];
