/**
 * @fileoverview Database transaction benchmark runner.
 *
 * Measures commit latency, rollback latency, success rates, and retry counts
 * for raw Prisma transaction blocks, isolated from service-layer logic.
 *
 * @module benchmark/transaction.metrics
 */

import { config } from './config.js';
import { computeStats } from './query.metrics.js';

/**
 * Run database transaction benchmarks.
 *
 * @param {import('@prisma/client').PrismaClient} db - Extended query-tracking Prisma Client
 * @param {Object} data - Seeded database IDs/fixtures
 * @returns {Promise<Array>} Results of each transaction benchmark
 */
export async function runTransactionBenchmarks(db, data) {
  const userId = data.memberUserId;

  const transactionBenches = [
    // ── 1. Borrow Book ───────────────────────────────────────────────────────
    {
      name: 'Borrow Book',
      setupCommit: async () => {
        // Create an AVAILABLE copy
        const copy = await db.bookCopy.create({
          data: {
            bookId: data.bookId,
            barcode: `bench-tx-borrow-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            status: 'AVAILABLE',
            condition: 'GOOD',
          },
          select: { id: true, barcode: true },
        });
        return { copyId: copy.id, barcode: copy.barcode };
      },
      runCommit: async (ctx) => {
        await db.$transaction(async (tx) => {
          const user = await tx.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true },
          });
          if (user.role !== 'MEMBER') throw new Error('Only members can borrow');

          const copy = await tx.bookCopy.findUnique({
            where: { id: ctx.copyId },
          });
          if (copy.status !== 'AVAILABLE') throw new Error('Copy not available');

          await tx.loan.create({
            data: {
              userId,
              copyId: ctx.copyId,
              issueDate: new Date(),
              dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              status: 'BORROWED',
            },
          });

          await tx.bookCopy.update({
            where: { id: ctx.copyId },
            data: { status: 'BORROWED' },
          });
        });
      },
      cleanupCommit: async (ctx) => {
        if (ctx?.copyId) {
          await db.loan.deleteMany({ where: { copyId: ctx.copyId } });
          await db.bookCopy.deleteMany({ where: { id: ctx.copyId } });
        }
      },
      runRollback: async () => {
        // Try to borrow a copy that is already BORROWED (data.copyId2)
        await db.$transaction(async (tx) => {
          const copy = await tx.bookCopy.findUnique({
            where: { id: data.copyId2 },
          });
          if (copy.status !== 'AVAILABLE') throw new Error('Copy not available');
          // should rollback
          await tx.loan.create({
            data: {
              userId,
              copyId: data.copyId2,
              issueDate: new Date(),
              dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              status: 'BORROWED',
            },
          });
        });
      },
    },

    // ── 2. Return Book ───────────────────────────────────────────────────────
    {
      name: 'Return Book',
      setupCommit: async () => {
        // Create BORROWED copy and a loan
        const copy = await db.bookCopy.create({
          data: {
            bookId: data.bookId,
            barcode: `bench-tx-return-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            status: 'BORROWED',
            condition: 'GOOD',
          },
          select: { id: true },
        });
        const loan = await db.loan.create({
          data: {
            userId,
            copyId: copy.id,
            issueDate: new Date(),
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            status: 'BORROWED',
          },
          select: { id: true },
        });
        return { copyId: copy.id, loanId: loan.id };
      },
      runCommit: async (ctx) => {
        await db.$transaction(async (tx) => {
          const loan = await tx.loan.findFirst({
            where: { id: ctx.loanId, status: 'BORROWED' },
          });
          if (!loan) throw new Error('Active loan not found');

          await tx.loan.update({
            where: { id: ctx.loanId },
            data: {
              status: 'RETURNED',
              returnDate: new Date(),
            },
          });

          await tx.bookCopy.update({
            where: { id: loan.copyId },
            data: { status: 'AVAILABLE' },
          });
        });
      },
      cleanupCommit: async (ctx) => {
        if (ctx?.copyId) {
          await db.loan.deleteMany({ where: { copyId: ctx.copyId } });
          await db.bookCopy.deleteMany({ where: { id: ctx.copyId } });
        }
      },
      runRollback: async () => {
        // Try returning a non-existent loan ID
        await db.$transaction(async (tx) => {
          const loan = await tx.loan.findFirst({
            where: { id: '00000000-0000-0000-0000-000000000000', status: 'BORROWED' },
          });
          if (!loan) throw new Error('Active loan not found');
        });
      },
    },

    // ── 3. Renew Loan ────────────────────────────────────────────────────────
    {
      name: 'Renew Loan',
      setupCommit: async () => {
        const copy = await db.bookCopy.create({
          data: {
            bookId: data.bookId,
            barcode: `bench-tx-renew-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            status: 'BORROWED',
            condition: 'GOOD',
          },
          select: { id: true },
        });
        const loan = await db.loan.create({
          data: {
            userId,
            copyId: copy.id,
            issueDate: new Date(),
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            status: 'BORROWED',
          },
          select: { id: true },
        });
        return { copyId: copy.id, loanId: loan.id };
      },
      runCommit: async (ctx) => {
        await db.$transaction(async (tx) => {
          const loan = await tx.loan.findFirst({
            where: { id: ctx.loanId, status: 'BORROWED' },
          });
          if (!loan) throw new Error('Active loan not found');

          await tx.loan.update({
            where: { id: ctx.loanId },
            data: {
              dueDate: new Date(loan.dueDate.getTime() + 14 * 24 * 60 * 60 * 1000),
              renewCount: { increment: 1 },
            },
          });
        });
      },
      cleanupCommit: async (ctx) => {
        if (ctx?.copyId) {
          await db.loan.deleteMany({ where: { copyId: ctx.copyId } });
          await db.bookCopy.deleteMany({ where: { id: ctx.copyId } });
        }
      },
      runRollback: async () => {
        // Try renewing a non-existent loan ID
        await db.$transaction(async (tx) => {
          const loan = await tx.loan.findFirst({
            where: { id: '00000000-0000-0000-0000-000000000000', status: 'BORROWED' },
          });
          if (!loan) throw new Error('Active loan not found');
        });
      },
    },

    // ── 4. Reservation Creation ──────────────────────────────────────────────
    {
      name: 'Reservation Creation',
      setupCommit: async () => {
        // Ensure no active reservation on bookId2
        await db.reservation.deleteMany({
          where: { userId, bookId: data.bookId2, status: 'PENDING' },
        });
        return {};
      },
      runCommit: async () => {
        await db.$transaction(async (tx) => {
          const existing = await tx.reservation.findFirst({
            where: { userId, bookId: data.bookId2, status: 'PENDING' },
          });
          if (existing) throw new Error('Already has active reservation');

          await tx.reservation.create({
            data: {
              userId,
              bookId: data.bookId2,
              status: 'PENDING',
            },
          });
        });
      },
      cleanupCommit: async () => {
        await db.reservation.deleteMany({
          where: { userId, bookId: data.bookId2 },
        });
      },
      runRollback: async () => {
        // Try creating duplicate reservation (on data.bookId3 which has a PENDING reservation seeded)
        await db.$transaction(async (tx) => {
          const existing = await tx.reservation.findFirst({
            where: { userId, bookId: data.bookId3, status: 'PENDING' },
          });
          if (existing) throw new Error('Already has active reservation');
        });
      },
    },

    // ── 5. Reservation Cancellation ──────────────────────────────────────────
    {
      name: 'Reservation Cancellation',
      setupCommit: async () => {
        // Create a pending reservation
        const res = await db.reservation.create({
          data: {
            userId,
            bookId: data.bookId2,
            status: 'PENDING',
          },
          select: { id: true },
        });
        return { reservationId: res.id };
      },
      runCommit: async (ctx) => {
        await db.$transaction(async (tx) => {
          const res = await tx.reservation.findFirst({
            where: { id: ctx.reservationId, status: 'PENDING' },
          });
          if (!res) throw new Error('Pending reservation not found');

          await tx.reservation.update({
            where: { id: ctx.reservationId },
            data: { status: 'CANCELLED' },
          });
        });
      },
      cleanupCommit: async (ctx) => {
        if (ctx?.reservationId) {
          await db.reservation.deleteMany({ where: { id: ctx.reservationId } });
        }
      },
      runRollback: async () => {
        // Try cancelling non-existent reservation
        await db.$transaction(async (tx) => {
          const res = await tx.reservation.findFirst({
            where: { id: '00000000-0000-0000-0000-000000000000', status: 'PENDING' },
          });
          if (!res) throw new Error('Pending reservation not found');
        });
      },
    },

    // ── 6. Review Creation ───────────────────────────────────────────────────
    {
      name: 'Review Creation',
      setupCommit: async () => {
        // Delete review on bookId2 so we can recreate it (has active loan copyId2)
        await db.review.deleteMany({
          where: { userId, bookId: data.bookId2 },
        });
        return {};
      },
      runCommit: async () => {
        await db.$transaction(async (tx) => {
          const existing = await tx.review.findUnique({
            where: { userId_bookId: { userId, bookId: data.bookId2 } },
          });
          if (existing) throw new Error('Already reviewed this book');

          const count = await tx.loan.count({
            where: { userId, bookCopy: { bookId: data.bookId2 } },
          });
          if (count === 0) throw new Error('Must borrow book first');

          await tx.review.create({
            data: {
              userId,
              bookId: data.bookId2,
              rating: 5,
              comment: 'bench_review transaction comment',
            },
          });
        });
      },
      cleanupCommit: async () => {
        await db.review.deleteMany({
          where: { userId, bookId: data.bookId2 },
        });
      },
      runRollback: async () => {
        // Try creating a review on book3 (no loans seeded)
        await db.$transaction(async (tx) => {
          const count = await tx.loan.count({
            where: { userId, bookCopy: { bookId: data.bookId3 } },
          });
          if (count === 0) throw new Error('Must borrow book first');
        });
      },
    },
  ];

  const results = [];

  for (const bench of transactionBenches) {
    console.log(`  Benchmarking Transaction: ${bench.name}...`);

    let successCount = 0;
    let failureCount = 0;
    const commitDurations = [];
    const rollbackDurations = [];

    // Warm-up Commit
    for (let i = 0; i < config.WARMUP_ITERATIONS; i++) {
      const ctx = await bench.setupCommit();
      try {
        await bench.runCommit(ctx);
      } finally {
        await bench.cleanupCommit(ctx);
      }
    }

    // Warm-up Rollback
    for (let i = 0; i < config.WARMUP_ITERATIONS; i++) {
      try {
        await bench.runRollback();
      } catch {
        // expected rollback
      }
    }

    // Commit Measurement Run
    for (let i = 0; i < config.MEASURE_ITERATIONS; i++) {
      const ctx = await bench.setupCommit();
      const start = performance.now();
      try {
        await bench.runCommit(ctx);
        const duration = performance.now() - start;
        commitDurations.push(duration);
        successCount++;
      } catch (err) {
        failureCount++;
      } finally {
        await bench.cleanupCommit(ctx);
      }
    }

    // Rollback Measurement Run
    for (let i = 0; i < config.MEASURE_ITERATIONS; i++) {
      const start = performance.now();
      try {
        await bench.runRollback();
        // If it somehow doesn't throw, it's a failure (since it's supposed to fail/rollback)
        failureCount++;
      } catch (err) {
        const duration = performance.now() - start;
        rollbackDurations.push(duration);
        successCount++; // rollback succeeded (meaning it threw and aborted as expected)
      }
    }

    const commitStats = computeStats(commitDurations);
    const rollbackStats = computeStats(rollbackDurations);
    const totalRuns = successCount + failureCount;
    const successRate = totalRuns > 0 ? (successCount / totalRuns) * 100 : 100;

    results.push({
      name: bench.name,
      status: 'PASS',
      metrics: {
        success: successCount,
        failures: failureCount,
        retries: 0, // Placeholder schema for future retries logic
        successRate,
        commitDurationMs: commitStats,
        rollbackDurationMs: rollbackStats,
      },
    });
  }

  return results;
}
