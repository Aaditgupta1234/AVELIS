/**
 * @fileoverview Analytics benchmark scenarios.
 *
 * All endpoints are admin read-only aggregation queries.
 *
 * Endpoints:
 * - GET /admin/dashboard/analytics/borrowing
 * - GET /admin/dashboard/analytics/members
 * - GET /admin/dashboard/analytics/ratings
 * - GET /admin/dashboard/analytics/timeseries
 *
 * @module benchmark/scenarios/analytics.scenario
 */

export default {
  name: 'analytics',
  description: 'Admin analytics: borrowing, members, ratings, time-series',

  endpoints: [
    // ── analytics-borrowing ──────────────────────────────────────────────────
    {
      name: 'analytics-borrowing',
      tags: ['read', 'authenticated', 'admin', 'analytics', 'database'],
      method: 'GET',
      readOnly: true,
      expectedStatus: 200,

      buildUrl: (base) => `${base}/admin/dashboard/analytics/borrowing`,
      buildHeaders: (tokens) => ({ Authorization: `Bearer ${tokens.admin}` }),
      buildBody: () => undefined,
    },

    // ── analytics-members ────────────────────────────────────────────────────
    {
      name: 'analytics-members',
      tags: ['read', 'authenticated', 'admin', 'analytics', 'database'],
      method: 'GET',
      readOnly: true,
      expectedStatus: 200,

      buildUrl: (base) => `${base}/admin/dashboard/analytics/members`,
      buildHeaders: (tokens) => ({ Authorization: `Bearer ${tokens.admin}` }),
      buildBody: () => undefined,
    },

    // ── analytics-ratings ────────────────────────────────────────────────────
    {
      name: 'analytics-ratings',
      tags: ['read', 'authenticated', 'admin', 'analytics', 'database'],
      method: 'GET',
      readOnly: true,
      expectedStatus: 200,

      buildUrl: (base) => `${base}/admin/dashboard/analytics/ratings`,
      buildHeaders: (tokens) => ({ Authorization: `Bearer ${tokens.admin}` }),
      buildBody: () => undefined,
    },

    // ── analytics-timeseries ─────────────────────────────────────────────────
    {
      name: 'analytics-timeseries',
      tags: ['read', 'authenticated', 'admin', 'analytics', 'database'],
      method: 'GET',
      readOnly: true,
      expectedStatus: 200,

      buildUrl: (base) => `${base}/admin/dashboard/analytics/timeseries`,
      buildHeaders: (tokens) => ({ Authorization: `Bearer ${tokens.admin}` }),
      buildBody: () => undefined,
    },
  ],
};
