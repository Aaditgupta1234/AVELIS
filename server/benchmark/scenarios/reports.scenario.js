/**
 * @fileoverview Reports benchmark scenarios.
 *
 * All endpoints are admin read-only reporting queries.
 *
 * Endpoints:
 * - GET /admin/dashboard/reports/overdue
 * - GET /admin/dashboard/reports/inventory
 * - GET /admin/dashboard/reports/members/:memberId
 * - GET /admin/dashboard/reports/search/books?q=bench
 *
 * @module benchmark/scenarios/reports.scenario
 */

export default {
  name: 'reports',
  description: 'Admin reporting: overdue, inventory, member, search',

  endpoints: [
    // ── reports-overdue ──────────────────────────────────────────────────────
    {
      name: 'reports-overdue',
      tags: ['read', 'authenticated', 'admin', 'database'],
      method: 'GET',
      readOnly: true,
      expectedStatus: 200,

      buildUrl: (base) => `${base}/admin/dashboard/reports/overdue`,
      buildHeaders: (tokens) => ({ Authorization: `Bearer ${tokens.admin}` }),
      buildBody: () => undefined,
    },

    // ── reports-inventory ────────────────────────────────────────────────────
    {
      name: 'reports-inventory',
      tags: ['read', 'authenticated', 'admin', 'database'],
      method: 'GET',
      readOnly: true,
      expectedStatus: 200,

      buildUrl: (base) => `${base}/admin/dashboard/reports/inventory`,
      buildHeaders: (tokens) => ({ Authorization: `Bearer ${tokens.admin}` }),
      buildBody: () => undefined,
    },

    // ── reports-member ───────────────────────────────────────────────────────
    {
      name: 'reports-member',
      tags: ['read', 'authenticated', 'admin', 'database'],
      method: 'GET',
      readOnly: true,
      expectedStatus: 200,

      buildUrl: (base, data) => `${base}/admin/dashboard/reports/members/${data.memberUserId}`,
      buildHeaders: (tokens) => ({ Authorization: `Bearer ${tokens.admin}` }),
      buildBody: () => undefined,
    },

    // ── reports-search-books ─────────────────────────────────────────────────
    {
      name: 'reports-search-books',
      tags: ['read', 'authenticated', 'admin', 'database'],
      method: 'GET',
      readOnly: true,
      expectedStatus: 200,

      buildUrl: (base) => `${base}/admin/dashboard/reports/search/books?q=bench`,
      buildHeaders: (tokens) => ({ Authorization: `Bearer ${tokens.admin}` }),
      buildBody: () => undefined,
    },
  ],
};
