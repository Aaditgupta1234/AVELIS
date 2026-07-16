/**
 * @fileoverview Sequential benchmark orchestrator for Phase 13.5.6.2.
 *
 * Runs all (or a filtered subset of) endpoint benchmarks against a live
 * Express server and generates per-endpoint reports plus an overall index.md.
 *
 * Usage:
 *   node benchmark/runAllBenchmarks.js                  # run all 33 endpoints
 *   node benchmark/runAllBenchmarks.js books            # books scenario only
 *   node benchmark/runAllBenchmarks.js auth             # auth scenario only
 *   node benchmark/runAllBenchmarks.js loans-borrow     # exact endpoint match
 *
 * Environment overrides:
 *   BENCHMARK_READ_ITERATIONS=100  node benchmark/runAllBenchmarks.js
 *   BENCHMARK_WRITE_ITERATIONS=5   node benchmark/runAllBenchmarks.js loans
 *
 * @module benchmark/runAllBenchmarks
 */

// ── Rate limiter must be disabled BEFORE app is imported ──────────────────────
process.env.DISABLE_RATE_LIMIT = 'true';

import http from 'http';
import path from 'path';
import fs from 'fs/promises';

import { prisma } from '../src/lib/prisma.js';
import app from '../src/app.js';
import { benchmarkConfig } from './config/benchmark.config.js';
import { runBenchmark } from './core/benchmarkRunner.js';
import { generateReport } from './core/reportGenerator.js';
import { createMetricsCollector } from './core/metricsCollector.js';
import { startTimer, endTimer } from './utils/timer.js';
import { fms, frps, fpct, padEnd } from './utils/formatter.js';
import { request as httpRequest } from './utils/httpClient.js';
import { getAdminToken, getMemberToken, clearTokenCache } from './helpers/authHelper.js';
import { createSeedContext } from './helpers/seedHelper.js';

// ── Scenario imports ──────────────────────────────────────────────────────────
import authScenario         from './scenarios/auth.scenario.js';
import booksScenario        from './scenarios/books.scenario.js';
import loansScenario        from './scenarios/loans.scenario.js';
import reservationsScenario from './scenarios/reservations.scenario.js';
import reviewsScenario      from './scenarios/reviews.scenario.js';
import dashboardScenario    from './scenarios/dashboard.scenario.js';
import analyticsScenario    from './scenarios/analytics.scenario.js';
import reportsScenario      from './scenarios/reports.scenario.js';

/** All scenarios in display order */
const ALL_SCENARIOS = [
  authScenario,
  booksScenario,
  loansScenario,
  reservationsScenario,
  reviewsScenario,
  dashboardScenario,
  analyticsScenario,
  reportsScenario,
];

// ---------------------------------------------------------------------------
// CLI filter
// ---------------------------------------------------------------------------

/**
 * Filter scenarios and endpoints by CLI argument.
 * Matches on scenario name prefix or exact endpoint name.
 *
 * @param {string|undefined} filter
 * @returns {{ scenario: Object, endpoints: Object[] }[]}
 */
const applyFilter = (filter) => {
  if (!filter) {
    return ALL_SCENARIOS.map((s) => ({ scenario: s, endpoints: s.endpoints }));
  }

  const result = [];
  for (const scenario of ALL_SCENARIOS) {
    if (scenario.name === filter || scenario.name.startsWith(filter)) {
      // Scenario-level match: include all endpoints
      result.push({ scenario, endpoints: scenario.endpoints });
    } else {
      // Endpoint-level match: exact name
      const matched = scenario.endpoints.filter((e) => e.name === filter);
      if (matched.length > 0) {
        result.push({ scenario, endpoints: matched });
      }
    }
  }

  if (result.length === 0) {
    console.error(`\n  [ERROR] No scenarios or endpoints matched filter: "${filter}"`);
    console.error('  Available scenario names:', ALL_SCENARIOS.map((s) => s.name).join(', '));
    process.exit(1);
  }

  return result;
};

// ---------------------------------------------------------------------------
// Progress printer
// ---------------------------------------------------------------------------

/**
 * Print a concise per-endpoint summary to stdout.
 *
 * @param {string}                                        scenarioName
 * @param {string}                                        endpointName
 * @param {import('./core/benchmarkRunner.js').BenchmarkResult} result
 * @param {string}                                        reportDir
 * @param {boolean}                                       success
 */
const printProgress = (scenarioName, endpointName, result, reportDir, success) => {
  const m = result.metrics;
  const W = 22;
  const icon = success ? '✓' : '✗';
  const label = success ? 'PASS' : 'FAIL';

  console.log(`\nRunning: ${scenarioName} — ${endpointName}`);
  console.log(
    `  ${padEnd('Iterations', W)} ${result.config.iterations}` +
    `   ${padEnd('Concurrency', W)} ${result.config.concurrencyLevels[0]}`
  );
  console.log(
    `  ${padEnd('Avg', W)} ${fms(m.durationMs.avg)}` +
    `   ${padEnd('P95', W)} ${fms(m.durationMs.p95)}` +
    `   ${padEnd('P99', W)} ${fms(m.durationMs.p99)}`
  );
  console.log(
    `  ${padEnd('RPS', W)} ${frps(m.rps)}` +
    `   ${padEnd('Success', W)} ${fpct(m.successRate)}`
  );
  console.log(`  ${icon} ${label}  →  ${reportDir}`);
};

// ---------------------------------------------------------------------------
// Index report generator
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} IndexEntry
 * @property {string} group        - Scenario name
 * @property {string} endpointName
 * @property {string[]} tags
 * @property {number} avg
 * @property {number} p95
 * @property {number} p99
 * @property {number} rps
 * @property {number} successRate
 * @property {boolean} pass
 */

/**
 * Write benchmark/reports/index.md summarising all results.
 *
 * @param {IndexEntry[]} entries
 * @param {Object} config
 */
const writeIndexReport = async (entries, config) => {
  const now = new Date().toISOString();
  const lines = [
    '# AVELIS Benchmark Index Report',
    '',
    `> Generated: ${now}`,
    '',
    '## Environment',
    '',
    `| Field | Value |`,
    `| --- | --- |`,
    `| Benchmark Version | ${config.version} |`,
    `| Node.js | ${process.version} |`,
    `| Platform / Arch | ${process.platform} / ${process.arch} |`,
    `| Read Iterations | ${config.endpointIterations.read} |`,
    `| Write Iterations | ${config.endpointIterations.write} |`,
    '',
  ];

  // Group by scenario
  const groups = {};
  for (const entry of entries) {
    if (!groups[entry.group]) groups[entry.group] = [];
    groups[entry.group].push(entry);
  }

  for (const [group, groupEntries] of Object.entries(groups)) {
    lines.push(`## ${group.charAt(0).toUpperCase() + group.slice(1)}`);
    lines.push('');
    lines.push('| Endpoint | Tags | Avg | P95 | P99 | RPS | Success% | Status |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const e of groupEntries) {
      const tags = e.tags.join(', ');
      const status = e.pass ? '✓ PASS' : '✗ FAIL';
      lines.push(
        `| ${e.endpointName} | ${tags} | ${fms(e.avg)} | ${fms(e.p95)} | ${fms(e.p99)} | ${frps(e.rps)} | ${fpct(e.successRate)} | ${status} |`
      );
    }
    lines.push('');
  }

  const totalPass = entries.filter((e) => e.pass).length;
  const totalFail = entries.length - totalPass;
  lines.push('---');
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`| --- | --- |`);
  lines.push(`| Total Endpoints | ${entries.length} |`);
  lines.push(`| Passed | ${totalPass} |`);
  lines.push(`| Failed | ${totalFail} |`);
  lines.push('');

  const indexPath = path.resolve(config.reportDir, 'index.md');
  await fs.mkdir(path.resolve(config.reportDir), { recursive: true });
  await fs.writeFile(indexPath, lines.join('\n'), 'utf8');
  return indexPath;
};

// ---------------------------------------------------------------------------
// Custom benchmark runner that supports per-iteration hooks
// ---------------------------------------------------------------------------

/**
 * Run a single endpoint benchmark with full lifecycle support:
 * setup → warmup → [beforeIteration → request → afterIteration] × N → cleanup
 *
 * This wraps the Phase 13.5.6.1 runBenchmark by building a scenario object
 * that includes beforeIteration/afterIteration calls inline.
 *
 * @param {Object}  endpoint
 * @param {Object}  data      - SeedData
 * @param {Object}  tokens    - { admin, member }
 * @param {string}  baseUrl
 * @param {Object}  config
 * @param {import('@prisma/client').PrismaClient} prisma
 * @returns {Promise<import('./core/benchmarkRunner.js').BenchmarkResult>}
 */
const runEndpointBenchmark = async (endpoint, data, tokens, baseUrl, config, prisma) => {
  const iterations = endpoint.readOnly
    ? config.endpointIterations.read
    : config.endpointIterations.write;

  // ── setup ────────────────────────────────────────────────────────────────
  if (endpoint.setup) await endpoint.setup(prisma, data);

  // Build the wrapped scenario for the Phase 13.5.6.1 runner
  const wrappedScenario = {
    name: endpoint.name,

    request: async () => {
      // beforeIteration
      if (endpoint.beforeIteration) await endpoint.beforeIteration(prisma, data);

      // Build live request parameters
      const url = endpoint.buildUrl(baseUrl, data);
      const headers = endpoint.buildHeaders(tokens);
      const body = endpoint.buildBody ? endpoint.buildBody(data) : undefined;

      // Execute the HTTP request
      const result = await httpRequest(endpoint.method, url, {
        body,
        headers,
        timeoutMs: config.timeoutMs,
      });

      // afterIteration
      if (endpoint.afterIteration) await endpoint.afterIteration(prisma, data);

      return result;
    },
  };

  // Override iteration count per-endpoint
  const endpointConfig = {
    ...config,
    iterations,
  };

  const result = await runBenchmark(wrappedScenario, endpointConfig);

  // ── cleanup ──────────────────────────────────────────────────────────────
  if (endpoint.cleanup) await endpoint.cleanup(prisma, data);

  return result;
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = async () => {
  const filter = process.argv[2];

  console.log('\n================================================================');
  console.log('  AVELIS Benchmark — Phase 13.5.6.2 — API Benchmarking');
  console.log('================================================================');
  if (filter) console.log(`  Filter: "${filter}"`);
  console.log(`  Read Iterations  : ${benchmarkConfig.endpointIterations.read}`);
  console.log(`  Write Iterations : ${benchmarkConfig.endpointIterations.write}`);
  console.log(`  Warmup           : ${benchmarkConfig.warmupIterations}`);
  console.log(`  Rate Limiter     : DISABLED`);
  console.log('================================================================\n');

  // ── 1. Start live server ─────────────────────────────────────────────────
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;
  console.log(`  Server listening on port ${port}`);

  // ── 2. Seed database ──────────────────────────────────────────────────────
  const seedCtx = createSeedContext(prisma);
  let data;

  /** @type {IndexEntry[]} */
  const indexEntries = [];
  let totalPass = 0;
  let totalFail = 0;

  try {
    console.log('  Seeding benchmark data...');
    data = await seedCtx.seed();
    console.log('  Seed complete.\n');

    // ── 3. Authenticate ──────────────────────────────────────────────────────
    clearTokenCache();
    const adminToken  = await getAdminToken(prisma);
    const memberToken = await getMemberToken(prisma);
    const tokens = { admin: adminToken, member: memberToken };
    console.log('  Tokens acquired (admin + member).\n');

    // ── 4. Build filtered scenario/endpoint list ──────────────────────────────
    const toRun = applyFilter(filter);
    const totalEndpoints = toRun.reduce((n, { endpoints }) => n + endpoints.length, 0);
    console.log(`  Endpoints to run: ${totalEndpoints}\n`);

    // ── 5. Run benchmarks ────────────────────────────────────────────────────
    for (const { scenario, endpoints } of toRun) {
      for (const endpoint of endpoints) {
        let result;
        let pass = false;

        try {
          result = await runEndpointBenchmark(
            endpoint, data, tokens, baseUrl, benchmarkConfig, prisma
          );

          const { summaryPath } = await generateReport(result, benchmarkConfig);
          const reportDir = path.dirname(summaryPath);

          pass = result.metrics.successRate >= 95;
          if (pass) totalPass++; else totalFail++;

          printProgress(scenario.name, endpoint.name, result, reportDir, pass);

          indexEntries.push({
            group: scenario.name,
            endpointName: endpoint.name,
            tags: endpoint.tags,
            avg: result.metrics.durationMs.avg,
            p95: result.metrics.durationMs.p95,
            p99: result.metrics.durationMs.p99,
            rps: result.metrics.rps,
            successRate: result.metrics.successRate,
            pass,
          });
        } catch (err) {
          console.error(`\n  [ERROR] ${endpoint.name}: ${err.message}`);
          totalFail++;
          indexEntries.push({
            group: scenario.name,
            endpointName: endpoint.name,
            tags: endpoint.tags ?? [],
            avg: 0, p95: 0, p99: 0, rps: 0, successRate: 0,
            pass: false,
          });
        }
      }
    }

    // ── 6. Write index ────────────────────────────────────────────────────────
    const indexPath = await writeIndexReport(indexEntries, benchmarkConfig);
    console.log(`\n  Index report → ${indexPath}`);

  } finally {
    // ── 7. Cleanup ────────────────────────────────────────────────────────────
    console.log('\n  Cleaning up benchmark data...');
    try {
      await seedCtx.cleanup();
      console.log('  Cleanup complete.');
    } catch (cleanupErr) {
      console.error('  [WARN] Cleanup error:', cleanupErr.message);
    }

    clearTokenCache();
    await prisma.$disconnect();
    await new Promise((resolve) => server.close(resolve));
  }

  // ── 8. Final summary ──────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log(`  Phase 13.5.6.2 Complete`);
  console.log(`  Endpoints Run    : ${indexEntries.length}`);
  console.log(`  Passed           : ${totalPass}`);
  console.log(`  Failed           : ${totalFail}`);
  console.log('================================================================\n');

  if (totalFail > 0) process.exit(1);
};

main().catch((err) => {
  console.error('\n[FATAL] Orchestrator crashed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
