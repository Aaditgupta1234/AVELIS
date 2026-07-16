/**
 * @fileoverview Auth benchmark scenarios.
 *
 * Benchmarks authentication endpoints:
 * - POST /auth/register (write — unique email per iteration)
 * - POST /auth/login    (read  — uses seeded member credentials)
 *
 * @module benchmark/scenarios/auth.scenario
 */

/**
 * @type {import('../helpers/seedHelper.js').SeedData & {_regCounter: number}}
 */
const iterState = { _regCounter: 0 };

export default {
  name: 'auth',
  description: 'Authentication endpoints: register and login',

  endpoints: [
    // ── auth-register ────────────────────────────────────────────────────────
    {
      name: 'auth-register',
      tags: ['write', 'public', 'database'],
      method: 'POST',
      readOnly: false,
      expectedStatus: 201,

      buildUrl: (base) => `${base}/auth/register`,
      buildHeaders: () => ({ 'Content-Type': 'application/json' }),

      buildBody: () => {
        // Unique email per iteration — counter ensures no duplicates
        iterState._regCounter++;
        return {
          name: `bench_reg_user_${iterState._regCounter}_${Date.now()}`,
          email: `bench_reg_${iterState._regCounter}_${Date.now()}@bench.local`,
          password: 'BenchPass123!',
        };
      },

      // No beforeIteration needed — buildBody generates unique data each call.
      // cleanup removes all bench_reg_* users after the benchmark.
      cleanup: async (prisma) => {
        await prisma.user.deleteMany({
          where: { email: { startsWith: 'bench_reg_' } },
        });
        iterState._regCounter = 0;
      },
    },

    // ── auth-login ───────────────────────────────────────────────────────────
    {
      name: 'auth-login',
      tags: ['read', 'public', 'database'],
      method: 'POST',
      readOnly: true,
      expectedStatus: 200,

      buildUrl: (base) => `${base}/auth/login`,
      buildHeaders: () => ({ 'Content-Type': 'application/json' }),

      buildBody: (_data) => ({
        email: _data.memberEmail,
        password: _data.memberPassword,
      }),
    },
  ],
};
