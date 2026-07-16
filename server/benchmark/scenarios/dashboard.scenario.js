/**
 * @fileoverview Dashboard benchmark scenarios.
 *
 * All endpoints are admin read-only.
 *
 * Endpoints:
 * - GET /admin/dashboard/summary   (summary stats)
 * - GET /admin/dashboard/analytics (root analytics)
 *
 * @module benchmark/scenarios/dashboard.scenario
 */

export default {
  name: 'dashboard',
  description: 'Admin dashboard: summary and root analytics',

  endpoints: [
    // ── dashboard-summary ────────────────────────────────────────────────────
    {
      name: 'dashboard-summary',
      tags: ['read', 'authenticated', 'admin', 'analytics', 'database'],
      method: 'GET',
      readOnly: true,
      expectedStatus: 200,

      buildUrl: (base) => `${base}/admin/dashboard/summary`,
      buildHeaders: (tokens) => ({ Authorization: `Bearer ${tokens.admin}` }),
      buildBody: () => undefined,
    },

    // ── dashboard-analytics ──────────────────────────────────────────────────
    {
      name: 'dashboard-analytics',
      tags: ['read', 'authenticated', 'admin', 'analytics', 'database'],
      method: 'GET',
      readOnly: true,
      expectedStatus: 200,

      buildUrl: (base) => `${base}/admin/dashboard/analytics`,
      buildHeaders: (tokens) => ({ Authorization: `Bearer ${tokens.admin}` }),
      buildBody: () => undefined,
    },
  ],
};
