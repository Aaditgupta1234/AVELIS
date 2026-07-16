/**
 * @fileoverview Reviews benchmark scenarios.
 *
 * Endpoints:
 *   Read  (4): book-reviews, mine, get-by-id, rating
 *   Write (1): create
 *
 * reviews-create rotates through 3 book IDs so the same user can write
 * at most one review per book (enforced by @@unique([userId, bookId])).
 * beforeIteration deletes the prior review so each iteration can create fresh.
 *
 * @module benchmark/scenarios/reviews.scenario
 */

// Per-iteration state
const createState = { bookId: null, reviewId: null, bookIndex: 0 };

export default {
  name: 'reviews',
  description: 'Review management: book reviews, mine, get, create, rating',

  endpoints: [
    // ── reviews-book (member) ────────────────────────────────────────────────
    {
      name: 'reviews-book',
      tags: ['read', 'authenticated', 'member', 'database'],
      method: 'GET',
      readOnly: true,
      expectedStatus: 200,

      buildUrl: (base, data) => `${base}/reviews/book/${data.bookId}`,
      buildHeaders: (tokens) => ({ Authorization: `Bearer ${tokens.member}` }),
      buildBody: () => undefined,
    },

    // ── reviews-mine (member) ────────────────────────────────────────────────
    {
      name: 'reviews-mine',
      tags: ['read', 'authenticated', 'member', 'database'],
      method: 'GET',
      readOnly: true,
      expectedStatus: 200,

      buildUrl: (base) => `${base}/reviews/me`,
      buildHeaders: (tokens) => ({ Authorization: `Bearer ${tokens.member}` }),
      buildBody: () => undefined,
    },

    // ── reviews-get (member) ─────────────────────────────────────────────────
    {
      name: 'reviews-get',
      tags: ['read', 'authenticated', 'member', 'database'],
      method: 'GET',
      readOnly: true,
      expectedStatus: 200,

      buildUrl: (base, data) => `${base}/reviews/${data.reviewId}`,
      buildHeaders: (tokens) => ({ Authorization: `Bearer ${tokens.member}` }),
      buildBody: () => undefined,
    },

    // ── reviews-create (member, write) ───────────────────────────────────────
    {
      name: 'reviews-create',
      tags: ['write', 'authenticated', 'member', 'database'],
      method: 'POST',
      readOnly: false,
      expectedStatus: 201,

      buildUrl: (base) => `${base}/reviews`,
      buildHeaders: (tokens) => ({ Authorization: `Bearer ${tokens.member}` }),
      buildBody: () => ({
        bookId: createState.bookId,
        rating: 4,
        comment: 'bench_review iteration comment',
      }),

      beforeIteration: async (prisma, data) => {
        // Rotate through available books so we don't hit the unique constraint
        const bookPool = [data.bookId, data.bookId2, data.bookId3];
        createState.bookId = bookPool[createState.bookIndex % bookPool.length];
        createState.bookIndex++;

        // Delete any existing review for this user+book to allow fresh creation
        await prisma.review.deleteMany({
          where: {
            userId: data.memberUserId,
            bookId: createState.bookId,
          },
        });
        createState.reviewId = null;
      },

      afterIteration: async (prisma, data) => {
        // Delete the review created this iteration
        await prisma.review.deleteMany({
          where: {
            userId: data.memberUserId,
            bookId: createState.bookId,
            comment: 'bench_review iteration comment',
          },
        });
      },

      cleanup: async (prisma, data) => {
        await prisma.review.deleteMany({
          where: {
            userId: data.memberUserId,
            comment: 'bench_review iteration comment',
          },
        });
        createState.bookIndex = 0;
      },
    },

    // ── reviews-rating (public) ──────────────────────────────────────────────
    {
      name: 'reviews-rating',
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
