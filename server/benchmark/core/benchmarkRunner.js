/**
 * @fileoverview Benchmark runner.
 *
 * Orchestrates the full benchmark lifecycle:
 *   1. Load configuration (or use provided config)
 *   2. Execute warm-up phase (results discarded)
 *   3. Execute benchmark iterations at the first concurrency level
 *   4. Collect metrics per request
 *   5. Sample system state (memory + CPU + uptime)
 *   6. Compute statistics via metricsCollector.summarize()
 *   7. Return a structured BenchmarkResult
 *
 * Contains no endpoint-specific logic. All API details live in scenario files.
 *
 * @module benchmark/core/benchmarkRunner
 */

import { benchmarkConfig as defaultConfig } from '../config/benchmark.config.js';
import { runWarmup } from './warmupRunner.js';
import { createMetricsCollector } from './metricsCollector.js';
import { startTimer, endTimer } from '../utils/timer.js';

/**
 * @typedef {Object} Scenario
 * @property {string}            name    - Human-readable scenario identifier (used as report subfolder)
 * @property {function(): Promise<{ status: number, durationMs: number, error: string|null }>} request
 *   Async function that performs one benchmark request and returns an HttpResult.
 */

/**
 * @typedef {Object} BenchmarkResult
 * @property {string}   benchmarkVersion - Algorithm version from config (e.g. '1.0.0')
 * @property {string}   scenario         - Scenario name
 * @property {string}   date             - ISO timestamp of run start
 * @property {{ nodeVersion: string, platform: string, arch: string }} metadata
 * @property {Object}   config           - Snapshot of config used for this run
 * @property {{ iterationsRun: number, elapsedMs: number }} warmup
 * @property {import('./metricsCollector.js').MetricsSummary} metrics
 * @property {Array<{ durationMs: number, status: number, success: boolean, timestamp: number }>} raw
 */

/**
 * Run a complete benchmark for a scenario.
 *
 * @param {Scenario} scenario        - The scenario to benchmark
 * @param {Object}   [config]        - Optional config override (defaults to benchmarkConfig)
 * @returns {Promise<BenchmarkResult>}
 *
 * @example
 * const result = await runBenchmark({
 *   name: 'books-list',
 *   request: () => httpClient.request('GET', `${config.baseUrl}/books`),
 * });
 */
export const runBenchmark = async (scenario, config = defaultConfig) => {
  const date = new Date().toISOString();
  const collector = createMetricsCollector();

  // ── 1. Warm-up phase ───────────────────────────────────────────────────────
  // Results are discarded. Warm-up metrics NEVER enter the collector.
  const warmup = await runWarmup(scenario, config);

  // ── 2. Benchmark iterations ────────────────────────────────────────────────
  // Use the first concurrency level for this phase (smoke / single-scenario).
  // Phase 13.5.6.4 will iterate all concurrencyLevels.
  const concurrency = config.concurrencyLevels[0] ?? 1;
  const iterations = config.iterations ?? 50;

  // Total requests = iterations × concurrency
  // Each "iteration" fires `concurrency` requests concurrently, then waits.
  const benchToken = startTimer();

  for (let i = 0; i < iterations; i++) {
    // Sample system state at the start of each iteration
    if (config.collectMemory || config.collectCpu) {
      collector.sampleSystem();
    }

    // Fire `concurrency` requests concurrently
    const batch = Array.from({ length: concurrency }, () => {
      const timestamp = Date.now();
      return scenario.request().then((result) => {
        collector.record({
          durationMs: result.durationMs,
          status: result.status ?? 0,
          success: result.status >= 200 && result.status < 300,
          timestamp,
        });
      });
    });

    await Promise.all(batch);
  }

  const elapsedMs = endTimer(benchToken);
  collector.setElapsed(elapsedMs);

  // ── 3. Finalize ────────────────────────────────────────────────────────────
  const metrics = collector.summarize();
  const raw = collector.getRaw();

  /** @type {BenchmarkResult} */
  const result = {
    benchmarkVersion: config.version,
    scenario: scenario.name,
    date,
    metadata: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    config: {
      version: config.version,
      baseUrl: config.baseUrl,
      warmupIterations: config.warmupIterations,
      iterations: config.iterations,
      concurrencyLevels: config.concurrencyLevels,
      timeoutMs: config.timeoutMs,
      collectMemory: config.collectMemory,
      collectCpu: config.collectCpu,
    },
    warmup,
    metrics,
    raw,
  };

  return result;
};
