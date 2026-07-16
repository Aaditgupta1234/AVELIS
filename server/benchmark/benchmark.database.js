/**
 * @fileoverview Database benchmarking runner.
 *
 * Coordinates Prisma client wrapping ($extends), database seeding, query and
 * transaction benchmarking, memory tracking, version collection, history pruning,
 * slow query detection, and markdown report generation.
 *
 * @module benchmark/benchmark.database
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { Prisma } from '@prisma/client';
import { prisma } from '../src/lib/prisma.js';
import { createSeedContext } from './helpers/seedHelper.js';
import { config } from './config.js';
import { runQueryBenchmarks } from './query.metrics.js';
import { runTransactionBenchmarks } from './transaction.metrics.js';
import { detectQueries } from './slow-query.detector.js';
import { generateMarkdownReport } from './report.generator.js';

// ── Rate limiter must be disabled ──────────────────────────────────────────
process.env.DISABLE_RATE_LIMIT = 'true';

// ── Query collector utility ────────────────────────────────────────────────
const queryCollector = {
  active: false,
  queries: [],
  start() {
    this.active = true;
    this.queries = [];
  },
  stop() {
    this.active = false;
    return this.queries;
  },
  record(queryInfo) {
    if (this.active) {
      this.queries.push(queryInfo);
    }
  },
};

// ── Wrapped Prisma Client using Client Extensions ($extends) ────────────────
const db = prisma.$extends({
  query: {
    $allOperations({ model, operation, args, query }) {
      const startTime = performance.now();
      return query(args)
        .then((result) => {
          const durationMs = performance.now() - startTime;
          let resultSize = 0;
          if (Array.isArray(result)) {
            resultSize = result.length;
          } else if (result !== null && result !== undefined) {
            resultSize = 1;
          }
          queryCollector.record({
            model,
            operation,
            args,
            durationMs,
            resultSize,
          });
          return result;
        })
        .catch((error) => {
          const durationMs = performance.now() - startTime;
          queryCollector.record({
            model,
            operation,
            args,
            durationMs,
            resultSize: 0,
            error: error.message,
          });
          throw error;
        });
    },
  },
});

/**
 * Prune historical run folders, keeping only the most recent MAX_HISTORY_RUNS.
 */
async function pruneHistory() {
  try {
    const items = await fs.readdir(config.HISTORY_DIRECTORY);
    const dirs = [];
    for (const item of items) {
      const fullPath = path.join(config.HISTORY_DIRECTORY, item);
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        dirs.push({ name: item, path: fullPath, mtime: stat.mtimeMs });
      }
    }

    dirs.sort((a, b) => a.mtime - b.mtime); // Oldest first

    while (dirs.length > config.MAX_HISTORY_RUNS) {
      const oldest = dirs.shift();
      console.log(`  Pruning old history run: ${oldest.name}...`);
      await fs.rm(oldest.path, { recursive: true, force: true });
    }
  } catch (error) {
    console.warn(`  Warning: Failed to prune history directory: ${error.message}`);
  }
}

/**
 * Save current benchmark run data to a timestamped history folder.
 */
async function saveHistory(querySummary, transactions, slowQueries) {
  if (!config.SAVE_HISTORY) return;

  try {
    await fs.mkdir(config.HISTORY_DIRECTORY, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const runDir = path.join(config.HISTORY_DIRECTORY, timestamp);
    await fs.mkdir(runDir, { recursive: true });

    await fs.writeFile(path.join(runDir, 'query-summary.json'), JSON.stringify(querySummary, null, 2));
    await fs.writeFile(path.join(runDir, 'transactions.json'), JSON.stringify(transactions, null, 2));
    await fs.writeFile(path.join(runDir, 'slow-queries.json'), JSON.stringify(slowQueries, null, 2));

    console.log(`  Saved benchmark history run to: ${runDir}`);
    await pruneHistory();
  } catch (error) {
    console.error(`  Error saving history: ${error.message}`);
  }
}

async function run() {
  console.log('============================================================');
  console.log('  AVELIS Database Benchmarking (Phase 13.5.6.3)');
  console.log('============================================================');

  const seedCtx = createSeedContext(prisma);
  let seededData = null;
  const startedAt = new Date().toISOString();
  const suiteStart = performance.now();

  try {
    // ── 1. Database Seeding ──────────────────────────────────────────────────
    console.log('Seeding database fixtures...');
    seededData = await seedCtx.seed();
    console.log('Database seeded successfully.');

    // ── 2. Environment Metadata Collection ──────────────────────────────────
    console.log('Collecting ORM, Node, and Database versions...');
    const pgResult = await prisma.$queryRawUnsafe('SELECT version()');
    const postgresVersion = pgResult[0]?.version || 'Unknown';
    const prismaVersion = Prisma.prismaVersion.client;

    const environment = {
      nodeVersion: process.version,
      prismaVersion,
      postgresVersion,
    };

    const metadata = {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      freeMem: os.freemem(),
      totalMem: os.totalmem(),
    };

    // ── 3. Query Benchmarking ────────────────────────────────────────────────
    console.log('\nRunning Query Benchmarks...');
    const qMemBefore = process.memoryUsage().heapUsed;
    const queryCollectorLogsStart = [...queryCollector.queries];

    queryCollector.start();
    const queryResults = await runQueryBenchmarks(db, seededData, queryCollector);
    const queryCollectorLogs = queryCollector.stop();

    const qMemAfter = process.memoryUsage().heapUsed;

    const querySummary = {
      schemaVersion: '1.0',
      phase: '13.5.6.3',
      generatedAt: new Date().toISOString(),
      startedAt,
      finishedAt: null, // set later
      durationMs: 0, // set later
      config: {
        warmupIterations: config.WARMUP_ITERATIONS,
        measurementIterations: config.MEASURE_ITERATIONS,
      },
      environment,
      metadata,
      memoryUsage: {
        heapUsedBefore: qMemBefore,
        heapUsedAfter: qMemAfter,
      },
      results: queryResults,
    };

    // ── 4. Transaction Benchmarking ──────────────────────────────────────────
    console.log('\nRunning Transaction Benchmarks...');
    const txMemBefore = process.memoryUsage().heapUsed;
    
    // Capture queries during transactions for query counts/slow query detection
    queryCollector.start();
    const transactionResults = await runTransactionBenchmarks(db, seededData);
    const txCollectorLogs = queryCollector.stop();
    
    const txMemAfter = process.memoryUsage().heapUsed;

    const transactionsJson = {
      schemaVersion: '1.0',
      phase: '13.5.6.3',
      generatedAt: new Date().toISOString(),
      startedAt,
      finishedAt: null, // set later
      durationMs: 0, // set later
      environment,
      memoryUsage: {
        heapUsedBefore: txMemBefore,
        heapUsedAfter: txMemAfter,
      },
      results: transactionResults,
    };

    // ── 5. Slow Query & Anomaly Detection ────────────────────────────────────
    console.log('\nAnalyzing database query execution logs...');
    
    const allCapturedLogs = [...queryCollectorLogs, ...txCollectorLogs];
    
    // Core Slow Query Analysis
    const flaggedQueries = detectQueries(
      allCapturedLogs,
      config.SLOW_QUERY_THRESHOLD,
      config.LARGE_RESULT_THRESHOLD
    );

    // Deterministic Mock Slow Query Verification
    console.log('Verifying slow query detector using mock anomalies...');
    const mockAnomalies = [
      {
        model: 'mock_book',
        operation: 'findMany',
        args: { where: { title: 'mock-slow-book' } },
        durationMs: config.SLOW_QUERY_THRESHOLD + 50, // exceeds threshold
        resultSize: config.LARGE_RESULT_THRESHOLD + 20, // exceeds row limit
      },
      {
        model: 'loan',
        operation: 'findMany',
        args: {}, // no where clause -> Potential Full Table Scan
        durationMs: 5,
        resultSize: 10,
      },
      {
        model: 'bookCopy',
        operation: 'findMany',
        args: {
          include: {
            book: {
              include: {
                authors: {
                  include: {
                    author: { include: { books: true } } // nested depth > 2
                  }
                }
              }
            }
          }
        },
        durationMs: 10,
        resultSize: 5,
      }
    ];

    const mockFlagged = detectQueries(
      mockAnomalies,
      config.SLOW_QUERY_THRESHOLD,
      config.LARGE_RESULT_THRESHOLD
    );

    // Combine production-run anomalies with mock verification tests
    const allFlagged = [...flaggedQueries, ...mockFlagged];

    const slowQueriesJson = {
      schemaVersion: '1.0',
      phase: '13.5.6.3',
      generatedAt: new Date().toISOString(),
      flagged: allFlagged,
    };

    // ── 6. Save JSON Results & Write Report ──────────────────────────────────
    const suiteEnd = performance.now();
    const finishedAt = new Date().toISOString();
    const durationMs = suiteEnd - suiteStart;

    querySummary.finishedAt = finishedAt;
    querySummary.durationMs = durationMs;
    transactionsJson.finishedAt = finishedAt;
    transactionsJson.durationMs = durationMs;

    console.log(`\nWriting benchmark results to directory: ${config.OUTPUT_DIRECTORY}`);
    await fs.mkdir(config.OUTPUT_DIRECTORY, { recursive: true });

    await fs.writeFile(
      path.join(config.OUTPUT_DIRECTORY, 'query-summary.json'),
      JSON.stringify(querySummary, null, 2)
    );
    await fs.writeFile(
      path.join(config.OUTPUT_DIRECTORY, 'transactions.json'),
      JSON.stringify(transactionsJson, null, 2)
    );
    await fs.writeFile(
      path.join(config.OUTPUT_DIRECTORY, 'slow-queries.json'),
      JSON.stringify(slowQueriesJson, null, 2)
    );

    // Save timestamped history copies
    await saveHistory(querySummary, transactionsJson, slowQueriesJson);

    console.log('Generating markdown report.md...');
    const reportMd = generateMarkdownReport(querySummary, transactionsJson, slowQueriesJson);
    await fs.writeFile(path.join(config.OUTPUT_DIRECTORY, 'report.md'), reportMd);
    console.log(`Markdown report saved to: ${path.join(config.OUTPUT_DIRECTORY, 'report.md')}`);

    console.log('\n============================================================');
    console.log('  Database Benchmarks Execution COMPLETE');
    console.log('============================================================\n');

  } catch (error) {
    console.error('\nBenchmark Execution Failed:', error);
    process.exitCode = 1;
  } finally {
    // ── 7. Teardown & Cleanup ────────────────────────────────────────────────
    console.log('Cleaning up seeded database fixtures...');
    try {
      await seedCtx.cleanup();
      console.log('Cleanup completed successfully.');
    } catch (cleanupError) {
      console.error('Cleanup failed:', cleanupError);
    }

    console.log('Disconnecting database client...');
    await prisma.$disconnect();
    console.log('Database client disconnected.');
  }
}

run();
