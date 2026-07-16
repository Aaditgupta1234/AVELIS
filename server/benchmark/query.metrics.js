/**
 * @fileoverview Database query benchmark runner.
 *
 * Runs Direct Prisma queries isolated from service logic. Calculates statistical
 * latency distribution, standard deviation, and database time metrics.
 *
 * @module benchmark/query.metrics
 */

import { config } from './config.js';
import { getFingerprint } from './slow-query.detector.js';

/**
 * Calculate statistics for a collection of durations.
 *
 * @param {number[]} durations - Execution times in ms
 * @returns {Object} Calculated metrics
 */
export function computeStats(durations) {
  const n = durations.length;
  if (n === 0) {
    return { avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0, stddev: 0 };
  }

  const sorted = [...durations].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const total = durations.reduce((acc, d) => acc + d, 0);
  const avg = total / n;

  const percentile = (p) => {
    const idx = Math.ceil((p / 100) * n) - 1;
    return sorted[Math.max(0, Math.min(idx, n - 1))];
  };

  const variance = durations.reduce((acc, d) => acc + Math.pow(d - avg, 2), 0) / n;
  const stddev = Math.sqrt(variance);

  return {
    avg,
    min,
    max,
    p50: percentile(50),
    p95: percentile(95),
    p99: percentile(99),
    stddev,
  };
}

/**
 * Run direct database query benchmarks.
 *
 * @param {import('@prisma/client').PrismaClient} db - Extended query-tracking Prisma Client
 * @param {Object} data - Seeded database IDs/fixtures
 * @param {Object} queryCollector - Query-logging helper
 * @returns {Promise<Array>} Results of each query benchmark
 */
export async function runQueryBenchmarks(db, data, queryCollector) {
  const benchmarks = [
    // ── 1. User Lookup ───────────────────────────────────────────────────────
    {
      name: 'User Lookup',
      run: async () => {
        await db.user.findUnique({
          where: { id: data.memberUserId },
          select: { id: true, email: true, username: true, role: true, isActive: true },
        });
      },
    },

    // ── 2. Book Listing ──────────────────────────────────────────────────────
    {
      name: 'Book Listing',
      run: async () => {
        await db.book.findMany({
          skip: 0,
          take: 10,
          where: { isDeleted: false },
          include: { copies: true },
        });
      },
    },

    // ── 3. Book Search ───────────────────────────────────────────────────────
    {
      name: 'Book Search',
      run: async () => {
        await db.book.findMany({
          where: {
            OR: [
              { title: { contains: 'bench' } },
              { isbn: { contains: 'bench' } },
            ],
            isDeleted: false,
          },
        });
      },
    },

    // ── 4. Loan Queries ──────────────────────────────────────────────────────
    {
      name: 'Loan Queries',
      run: async () => {
        await db.loan.findMany({
          where: { userId: data.memberUserId },
          include: {
            bookCopy: {
              include: { book: true },
            },
          },
        });
      },
    },

    // ── 5. Reservation Queries ───────────────────────────────────────────────
    {
      name: 'Reservation Queries',
      run: async () => {
        await db.reservation.findMany({
          where: { userId: data.memberUserId },
          include: { book: true },
        });
      },
    },

    // ── 6. Dashboard Aggregations ────────────────────────────────────────────
    {
      name: 'Dashboard Aggregation',
      run: async () => {
        await Promise.all([
          db.user.groupBy({
            by: ['isActive'],
            _count: { id: true },
          }),
          db.book.count({ where: { isDeleted: false } }),
          db.bookCopy.groupBy({
            by: ['status'],
            where: { book: { isDeleted: false } },
            _count: { id: true },
          }),
          db.loan.groupBy({
            by: ['status'],
            _count: { id: true },
          }),
          db.reservation.groupBy({
            by: ['status'],
            _count: { id: true },
          }),
          db.order.groupBy({
            by: ['orderStatus'],
            _count: { id: true },
          }),
        ]);
      },
    },

    // ── 7. Analytics Aggregations ────────────────────────────────────────────
    {
      name: 'Analytics Aggregation',
      run: async () => {
        await Promise.all([
          db.loan.groupBy({
            by: ['status'],
            _count: { id: true },
          }),
          db.user.groupBy({
            by: ['role'],
            _count: { id: true },
          }),
          db.review.aggregate({
            _avg: { rating: true },
            _count: { id: true },
          }),
          db.loan.findMany({
            select: { createdAt: true, status: true },
          }),
        ]);
      },
    },

    // ── 8. Reporting Queries ─────────────────────────────────────────────────
    {
      name: 'Reporting Queries',
      run: async () => {
        await Promise.all([
          db.loan.findMany({
            where: { status: 'OVERDUE' },
            include: {
              user: true,
              bookCopy: { include: { book: true } },
            },
          }),
          db.bookCopy.findMany({
            include: {
              book: true,
              loans: { where: { status: 'BORROWED' } },
            },
          }),
          db.user.findUnique({
            where: { id: data.memberUserId },
            include: {
              loans: {
                include: {
                  bookCopy: { include: { book: true } },
                },
              },
              reservations: {
                include: { book: true },
              },
            },
          }),
          db.book.findMany({
            where: {
              title: { contains: 'bench' },
              isDeleted: false,
            },
          }),
        ]);
      },
    },
  ];

  const results = [];

  for (const bench of benchmarks) {
    console.log(`  Benchmarking Query: ${bench.name}...`);

    // Warm-up
    for (let i = 0; i < config.WARMUP_ITERATIONS; i++) {
      await bench.run();
    }

    const durations = [];
    let recordedQueries = [];

    // Capture queries only during a single measurement run to analyze duplicate query count
    queryCollector.start();
    await bench.run();
    recordedQueries = queryCollector.stop();

    // Measurement
    for (let i = 0; i < config.MEASURE_ITERATIONS; i++) {
      const start = performance.now();
      await bench.run();
      const duration = performance.now() - start;
      durations.push(duration);
    }

    const stats = computeStats(durations);
    const totalTimeMs = durations.reduce((sum, d) => sum + d, 0);

    // Query analysis
    const uniqueFingerprints = new Set();
    const duplicateQueries = [];
    const redundantLookups = [];
    const readCounts = {};

    for (const q of recordedQueries) {
      const fp = getFingerprint(q.model, q.operation, q.args);
      if (uniqueFingerprints.has(fp)) {
        duplicateQueries.push(fp);
        if (['findUnique', 'findFirst'].includes(q.operation)) {
          redundantLookups.push(fp);
        }
      } else {
        uniqueFingerprints.add(fp);
      }

      if (['findUnique', 'findFirst', 'findMany'].includes(q.operation) && q.model) {
        const key = `${q.model}.${q.operation}`;
        readCounts[key] = (readCounts[key] || 0) + 1;
      }
    }

    const potentialNPlusOne = Object.values(readCounts).some((count) => count > 3);
    const excessiveRoundTrips = recordedQueries.length > 5;

    results.push({
      name: bench.name,
      status: 'PASS',
      metrics: {
        totalRequests: config.MEASURE_ITERATIONS,
        durationMs: stats,
        totalTimeMs,
      },
      queryAnalysis: {
        totalQueries: recordedQueries.length,
        duplicateQueries,
        redundantLookups,
        potentialNPlusOne,
        excessiveRoundTrips,
      },
      // Store raw queries metadata for further analysis
      rawQueries: recordedQueries.map(q => ({
        model: q.model || 'raw',
        operation: q.operation,
        fingerprint: getFingerprint(q.model, q.operation, q.args),
      })),
    });
  }

  return results;
}
