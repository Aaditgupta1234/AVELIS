/**
 * @fileoverview Load testing runner.
 *
 * Spawns the HTTP server, seeds database, runs concurrency simulations,
 * records stability traces, executes soak testing, and outputs reports.
 *
 * @module benchmark/load.runner
 */

// ── Rate limiter must be disabled BEFORE app is imported ──────────────────────
process.env.DISABLE_RATE_LIMIT = 'true';

import http from 'http';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { Prisma } from '@prisma/client';
import { prisma } from '../src/lib/prisma.js';
import app from '../src/app.js';
import { loadConfig } from './load.config.js';
import { createSeedContext } from './helpers/seedHelper.js';
import { getAdminToken, getMemberToken, clearTokenCache } from './helpers/authHelper.js';
import { createWorkloadGenerator } from './workload.generator.js';
import {
  getProcessCpu,
  getMemoryUsage,
  startEventLoopMonitor,
  stopEventLoopMonitor,
  getEventLoopDelay,
} from './stability.metrics.js';
import { runSoakTest } from './soak.runner.js';
import { analyzeConnections } from './connection.analyzer.js';
import { generateMarkdownReport } from './report.generator.js';
import { computeStats } from './query.metrics.js';

/**
 * Execute a concurrency workload test.
 */
async function runConcurrencyScenario(baseUrl, concurrency, durationMs, workloadGen) {
  const startTime = performance.now();
  const latencies = [];
  let successCount = 0;
  let failureCount = 0;
  const errorBreakdown = {
    timeout: 0,
    http_error: {},
    network_error: 0,
    unexpected_exception: 0,
  };

  const startCpu = getProcessCpu();
  const startMem = getMemoryUsage();

  const simulateWorker = async () => {
    while (performance.now() - startTime < durationMs) {
      const operation = workloadGen.selectOperation();
      const reqStart = performance.now();
      try {
        await workloadGen.execute(baseUrl, operation);
        const duration = performance.now() - reqStart;
        latencies.push(duration);
        successCount++;
      } catch (err) {
        failureCount++;
        if (err.message === 'timeout') {
          errorBreakdown.timeout++;
        } else if (err.message === 'http_error') {
          const code = err.statusCode || 500;
          errorBreakdown.http_error[code] = (errorBreakdown.http_error[code] || 0) + 1;
        } else if (err.message === 'network_error') {
          errorBreakdown.network_error++;
        } else {
          errorBreakdown.unexpected_exception++;
        }
      }
    }
  };

  const workers = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(simulateWorker());
  }

  await Promise.all(workers);

  const endCpu = getProcessCpu();
  const endMem = getMemoryUsage();
  const actualDurationMs = performance.now() - startTime;

  const stats = computeStats(latencies);
  const rps = (successCount + failureCount) / (actualDurationMs / 1000);

  return {
    concurrency,
    status: 'PASS',
    metrics: {
      totalRequests: successCount + failureCount,
      success: successCount,
      failures: failureCount,
      successRate: (successCount / (successCount + failureCount || 1)) * 100,
      rps,
      durationMs: stats,
      cpuFraction: endCpu,
      memory: {
        heapUsedStart: startMem.heapUsed,
        heapUsedEnd: endMem.heapUsed,
        heapGrowthBytes: endMem.heapUsed - startMem.heapUsed,
        rssStart: startMem.rss,
        rssEnd: endMem.rss,
        rssGrowthBytes: endMem.rss - startMem.rss,
      },
      errors: errorBreakdown,
    },
  };
}

/**
 * Prune historical run folders.
 */
async function pruneHistory() {
  try {
    const items = await fs.readdir(loadConfig.HISTORY_DIRECTORY);
    const dirs = [];
    for (const item of items) {
      const fullPath = path.join(loadConfig.HISTORY_DIRECTORY, item);
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        dirs.push({ name: item, path: fullPath, mtime: stat.mtimeMs });
      }
    }

    dirs.sort((a, b) => a.mtime - b.mtime); // Oldest first

    while (dirs.length > loadConfig.MAX_HISTORY_RUNS) {
      const oldest = dirs.shift();
      console.log(`  Pruning old history load run: ${oldest.name}...`);
      await fs.rm(oldest.path, { recursive: true, force: true });
    }
  } catch (error) {
    console.warn(`  Warning: Failed to prune history directory: ${error.message}`);
  }
}

/**
 * Save current benchmark run data to a timestamped history folder.
 */
async function saveHistory(runId, summary, stability, soakTest) {
  if (!loadConfig.SAVE_HISTORY) return;

  try {
    await fs.mkdir(loadConfig.HISTORY_DIRECTORY, { recursive: true });
    const runDir = path.join(loadConfig.HISTORY_DIRECTORY, runId);
    await fs.mkdir(runDir, { recursive: true });

    await fs.writeFile(path.join(runDir, 'summary.json'), JSON.stringify(summary, null, 2));
    await fs.writeFile(path.join(runDir, 'stability.json'), JSON.stringify(stability, null, 2));
    await fs.writeFile(path.join(runDir, 'soak-test.json'), JSON.stringify(soakTest, null, 2));

    console.log(`  Saved benchmark history load run to: ${runDir}`);
    await pruneHistory();
  } catch (error) {
    console.error(`  Error saving load history: ${error.message}`);
  }
}

async function run() {
  console.log('============================================================');
  console.log('  AVELIS Load Testing Suite (Phase 13.5.6.4)');
  console.log('============================================================');

  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const startedAt = new Date().toISOString();
  const suiteStart = performance.now();

  const seedCtx = createSeedContext(prisma);
  let seededData = null;
  let server = null;

  try {
    // ── 1. Start live Express server ──────────────────────────────────────────
    console.log('Starting HTTP server...');
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}/api/v1`;
    console.log(`HTTP server listening on: ${baseUrl}`);

    // ── 2. Seeding fixtures ───────────────────────────────────────────────────
    console.log('Seeding database load fixtures...');
    seededData = await seedCtx.seed();
    console.log('Database seeded.');

    // ── 3. Authenticate and retrieve tokens ───────────────────────────────────
    console.log('Retrieving tokens...');
    clearTokenCache();
    const adminToken = await getAdminToken(prisma);
    const memberToken = await getMemberToken(prisma);
    const tokens = { admin: adminToken, member: memberToken };
    console.log('Authentication tokens retrieved.');

    // ── 4. Initialize generators & monitors ──────────────────────────────────
    const seedVal = loadConfig.LOAD_RANDOM_SEED;
    const workloadGen = createWorkloadGenerator(seededData, tokens, seedVal);
    startEventLoopMonitor(100);

    // Collect environment info
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

    // ── 5. Run Concurrency Scenarios ─────────────────────────────────────────
    const scenariosResults = [];
    const stabilityTrace = [];

    // Warm-up scenario (10 users, 2 seconds)
    console.log(`\nExecuting warmup run (${loadConfig.WARMUP_DURATION} ms)...`);
    await runConcurrencyScenario(baseUrl, 10, loadConfig.WARMUP_DURATION, workloadGen);
    console.log('Warmup complete.');

    for (const concurrency of loadConfig.CONCURRENCY_SCENARIOS) {
      console.log(`\nExecuting Scenario: ${concurrency} Concurrent Users...`);
      
      const scenarioRes = await runConcurrencyScenario(
        baseUrl,
        concurrency,
        loadConfig.TEST_DURATION,
        workloadGen
      );
      
      scenariosResults.push(scenarioRes);

      // Record stability trace entry
      stabilityTrace.push({
        concurrency,
        cpuFraction: scenarioRes.metrics.cpuFraction,
        memory: {
          heapUsed: scenarioRes.metrics.memory.heapUsedEnd,
          rss: scenarioRes.metrics.memory.rssEnd,
        },
        eventLoopDelayMs: getEventLoopDelay(),
      });
    }

    // ── 6. Run Soak Test ─────────────────────────────────────────────────────
    console.log('\nExecuting Soak Test...');
    const soakTestResult = await runSoakTest(baseUrl, workloadGen, loadConfig.SOAK_DURATION);

    // ── 7. Run Connection Pool Analysis ──────────────────────────────────────
    console.log('\nAnalyzing database connection pool...');
    const connectionAnalysis = await analyzeConnections(prisma);

    // ── 8. Formulate final results ───────────────────────────────────────────
    const suiteEnd = performance.now();
    const finishedAt = new Date().toISOString();
    const durationMs = suiteEnd - suiteStart;

    // Check if performance warning is needed
    let hasPerformanceWarning = false;
    for (const s of scenariosResults) {
      const m = s.metrics;
      const errorRate = m.failures / (m.totalRequests || 1);
      const timeoutRate = (m.errors?.timeout || 0) / (m.totalRequests || 1);
      if (
        m.durationMs.avg > loadConfig.LATENCY_AVG_LIMIT ||
        m.durationMs.p95 > loadConfig.LATENCY_P95_LIMIT ||
        errorRate > loadConfig.ERROR_RATE_LIMIT ||
        timeoutRate > loadConfig.TIMEOUT_RATE_LIMIT
      ) {
        hasPerformanceWarning = true;
      }
    }

    const summaryJson = {
      schemaVersion: '1.0',
      phase: '13.5.6.4',
      runId,
      benchmarkStatus: 'PASS',
      performanceStatus: hasPerformanceWarning ? 'WARNING' : 'PASS',
      generatedAt: finishedAt,
      startedAt,
      finishedAt,
      durationMs,
      config: {
        warmupDurationMs: loadConfig.WARMUP_DURATION,
        testDurationMs: loadConfig.TEST_DURATION,
        soakDurationMs: loadConfig.SOAK_DURATION,
        randomSeed: seedVal,
      },
      environment,
      metadata,
      scenarios: scenariosResults,
    };

    const stabilityJson = {
      schemaVersion: '1.0',
      phase: '13.5.6.4',
      runId,
      generatedAt: finishedAt,
      trace: stabilityTrace,
      connectionAnalysis,
    };

    const soakTestOutput = {
      schemaVersion: '1.0',
      phase: '13.5.6.4',
      runId,
      generatedAt: finishedAt,
      startedAt,
      finishedAt,
      durationMs: loadConfig.SOAK_DURATION,
      ...soakTestResult,
    };

    // Write outputs to load/ output directory
    console.log(`\nWriting load testing results to directory: ${loadConfig.OUTPUT_DIRECTORY}`);
    await fs.mkdir(loadConfig.OUTPUT_DIRECTORY, { recursive: true });

    await fs.writeFile(
      path.join(loadConfig.OUTPUT_DIRECTORY, 'summary.json'),
      JSON.stringify(summaryJson, null, 2)
    );
    await fs.writeFile(
      path.join(loadConfig.OUTPUT_DIRECTORY, 'stability.json'),
      JSON.stringify(stabilityJson, null, 2)
    );
    await fs.writeFile(
      path.join(loadConfig.OUTPUT_DIRECTORY, 'soak-test.json'),
      JSON.stringify(soakTestOutput, null, 2)
    );

    // Save timestamped history run copies
    await saveHistory(runId, summaryJson, stabilityJson, soakTestOutput);

    // Compile report.md
    console.log('Compiling markdown report.md...');
    const reportMd = generateMarkdownReport(summaryJson, stabilityJson, soakTestOutput);
    await fs.writeFile(path.join(loadConfig.OUTPUT_DIRECTORY, 'report.md'), reportMd);
    console.log(`Markdown report saved to: ${path.join(loadConfig.OUTPUT_DIRECTORY, 'report.md')}`);

    console.log('\n============================================================');
    console.log('  Load Testing Suite COMPLETE');
    console.log('============================================================\n');

  } catch (error) {
    console.error('\nLoad testing failed:', error);
    process.exitCode = 1;
  } finally {
    // ── 9. Teardown ──────────────────────────────────────────────────────────
    console.log('Shutting down event loop monitor...');
    stopEventLoopMonitor();

    console.log('Cleaning up database load fixtures...');
    try {
      await seedCtx.cleanup();
      console.log('Cleanup completed successfully.');
    } catch (cleanupError) {
      console.error('Cleanup failed:', cleanupError);
    }

    console.log('Disconnecting database client...');
    await prisma.$disconnect();

    if (server) {
      console.log('Stopping HTTP server...');
      await new Promise((resolve) => server.close(resolve));
      console.log('HTTP server stopped.');
    }
  }
}

run();
