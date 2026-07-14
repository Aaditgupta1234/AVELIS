/**
 * @fileoverview Benchmark entry point.
 *
 * Infrastructure smoke test for Phase 13.5.6.1.
 * No endpoint-specific benchmarking occurs in this phase.
 *
 * Runs a no-op scenario that exercises the full benchmark pipeline:
 *   config → warmup → iterations → metrics → report
 *
 * Usage:
 *   node benchmark/runBenchmark.js
 *
 * Environment overrides (examples):
 *   BENCHMARK_ITERATIONS=100 node benchmark/runBenchmark.js
 *   BENCHMARK_CONCURRENCY_LEVELS=1,5,10 node benchmark/runBenchmark.js
 *
 * @module benchmark/runBenchmark
 */

import { benchmarkConfig } from './config/benchmark.config.js';
import { runBenchmark } from './core/benchmarkRunner.js';
import { generateReport } from './core/reportGenerator.js';
import { fms, frps, fpct, padEnd } from './utils/formatter.js';

// ---------------------------------------------------------------------------
// Smoke scenario (Phase 13.5.6.1 — infrastructure only)
// ---------------------------------------------------------------------------

/**
 * A minimal no-op scenario used to verify the full benchmark pipeline
 * without making real HTTP calls. Each "request" resolves immediately
 * with a synthetic 200 response.
 *
 * Phase 13.5.6.2 will replace this with per-endpoint scenarios in
 * benchmark/scenarios/.
 */
const smokeScenario = {
  name: 'smoke',

  /**
   * @returns {Promise<{ status: number, durationMs: number, error: null }>}
   */
  request: async () => {
    const start = Date.now();
    // Simulate a minimal async workload (one event-loop tick)
    await new Promise((resolve) => setImmediate(resolve));
    return {
      status: 200,
      durationMs: Date.now() - start,
      error: null,
    };
  },
};

// ---------------------------------------------------------------------------
// Console summary
// ---------------------------------------------------------------------------

/**
 * Print a concise summary table to stdout.
 *
 * @param {import('./core/benchmarkRunner.js').BenchmarkResult} result
 * @param {import('./core/reportGenerator.js').ReportPaths}     paths
 */
const printSummary = (result, paths) => {
  const m = result.metrics;
  const W = 28;

  console.log('\n' + '='.repeat(60));
  console.log('  Benchmark Summary — ' + result.scenario);
  console.log('='.repeat(60));
  console.log(`  ${padEnd('Benchmark Version', W)} ${result.benchmarkVersion}`);
  console.log(`  ${padEnd('Node.js', W)} ${result.metadata.nodeVersion}`);
  console.log(`  ${padEnd('Platform / Arch', W)} ${result.metadata.platform} / ${result.metadata.arch}`);
  console.log(`  ${padEnd('Date', W)} ${result.date}`);
  console.log('-'.repeat(60));
  console.log(`  ${padEnd('Iterations', W)} ${result.config.iterations}`);
  console.log(`  ${padEnd('Concurrency (this run)', W)} ${result.config.concurrencyLevels[0]}`);
  console.log(`  ${padEnd('Total Requests', W)} ${m.totalRequests}`);
  console.log(`  ${padEnd('Elapsed', W)} ${fms(m.elapsedMs)}`);
  console.log('-'.repeat(60));
  console.log(`  ${padEnd('Avg Latency', W)} ${fms(m.durationMs.avg)}`);
  console.log(`  ${padEnd('Median Latency', W)} ${fms(m.durationMs.median)}`);
  console.log(`  ${padEnd('P95 Latency', W)} ${fms(m.durationMs.p95)}`);
  console.log(`  ${padEnd('P99 Latency', W)} ${fms(m.durationMs.p99)}`);
  console.log(`  ${padEnd('RPS', W)} ${frps(m.rps)}`);
  console.log(`  ${padEnd('Success Rate', W)} ${fpct(m.successRate)}`);
  console.log('-'.repeat(60));
  console.log(`  ${padEnd('Heap Used', W)} ${m.system.memory.heapUsedMb.toFixed(2)} MB`);
  console.log(`  ${padEnd('RSS', W)} ${m.system.memory.rssMb.toFixed(2)} MB`);
  console.log('='.repeat(60));
  console.log('  Reports written:');
  console.log(`    summary.json  → ${paths.summaryPath}`);
  console.log(`    raw-results   → ${paths.rawPath}`);
  console.log(`    report.md     → ${paths.mdPath}`);
  console.log('='.repeat(60) + '\n');
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = async () => {
  console.log('\n  AVELIS Benchmark Infrastructure — Phase 13.5.6.1');
  console.log(`  Scenario  : ${smokeScenario.name}`);
  console.log(`  Warmup    : ${benchmarkConfig.warmupIterations} iterations`);
  console.log(`  Benchmark : ${benchmarkConfig.iterations} iterations`);
  console.log(`  Concurrency levels: [${benchmarkConfig.concurrencyLevels.join(', ')}]`);
  console.log('  Running...\n');

  try {
    const result = await runBenchmark(smokeScenario, benchmarkConfig);
    const paths = await generateReport(result, benchmarkConfig);
    printSummary(result, paths);
  } catch (err) {
    console.error('  [ERROR] Benchmark failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
};

main();
