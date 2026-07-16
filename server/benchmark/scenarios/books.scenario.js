/**
 * @fileoverview Books benchmark scenarios.
 *
 * All endpoints are read-only — no state mutations, no per-iteration hooks.
 *
 * Endpoints:
 * - GET /books?page=1&limit=10   (list)
 * - GET /books/:bookId            (get by ID)
 * - GET /books?search=bench       (search)
 * - GET /books/:bookId/rating     (rating stats)
 *
 * @module benchmark/scenarios/books.scenario
 */

export default {
  name: 'books',
  description: 'Book catalog endpoints: list, get, search, rating',

  endpoints: [
    // ── books-list ───────────────────────────────────────────────────────────
    {
      name: 'books-list',
      tags: ['read', 'public', 'database'],
      method: 'GET',
      readOnly: true,
      expectedStatus: 200,

      buildUrl: (base) => `${base}/books?page=1&limit=10`,
      buildHeaders: () => ({}),
      buildBody: () => undefined,
    },

    // ── books-get ────────────────────────────────────────────────────────────
    {
      name: 'books-get',
      tags: ['read', 'public', 'database'],
      method: 'GET',
      readOnly: true,
      expectedStatus: 200,

      buildUrl: (base, data) => `${base}/books/${data.bookId}`,
      buildHeaders: () => ({}),
      buildBody: () => undefined,
    },

    // ── books-search ─────────────────────────────────────────────────────────
    {
      name: 'books-search',
      tags: ['read', 'public', 'database'],
      method: 'GET',
      readOnly: true,
      expectedStatus: 200,

      buildUrl: (base) => `${base}/books?search=bench`,
      buildHeaders: () => ({}),
      buildBody: () => undefined,
    },

    // ── books-rating ─────────────────────────────────────────────────────────
    {
      name: 'books-rating',
      tags: ['read', 'public', 'database'],
      method: 'GET',
      readOnly: true,
      expectedStatus: 200,

      buildUrl: (base, data) => `${base}/books/${data.bookId}/rating`,
      buildHeaders: () => ({}),
      buildBody: () => undefined,
    },
  ],
};
