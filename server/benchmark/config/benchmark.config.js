/**
 * @fileoverview Centralized benchmark configuration.
 *
 * Every tunable knob is overridable via environment variables.
 * No hardcoded values exist anywhere else in the benchmark system.
 *
 * All settings can be overridden via environment variables:
 *
 * @env {string}  BENCHMARK_BASE_URL            Base API URL
 *                                               (default: http://localhost:5000/api/v1)
 * @env {number}  BENCHMARK_ITERATIONS          Benchmark iterations per scenario
 *                                               (default: 50)
 * @env {number}  BENCHMARK_WARMUP_ITERATIONS   Warm-up iterations before measurement
 *                                               (default: 5)
 * @env {string}  BENCHMARK_CONCURRENCY_LEVELS  Comma-separated concurrency tiers
 *                                               (default: 1,5,10,25,50)
 * @env {number}  BENCHMARK_TIMEOUT_MS          Per-request timeout in milliseconds
 *                                               (default: 5000)
 * @env {string}  BENCHMARK_REPORT_DIR          Report output directory
 *                                               (default: benchmark/reports)
 * @env {boolean} BENCHMARK_COLLECT_MEMORY      Capture memory samples
 *                                               (default: true)
 * @env {boolean} BENCHMARK_COLLECT_CPU         Capture CPU usage samples
 *                                               (default: true)
 * @env {number}  BENCHMARK_READ_ITERATIONS     Iterations for read-only endpoint benchmarks
 *                                               (default: 50)
 * @env {number}  BENCHMARK_WRITE_ITERATIONS    Iterations for write endpoint benchmarks
 *                                               (default: 10)
 *
 * @module benchmark/config/benchmark.config
 */

/**
 * Parse BENCHMARK_CONCURRENCY_LEVELS env var.
 * Accepts a comma-separated list of integers: "1,5,10,25,50"
 *
 * @returns {number[]} Parsed concurrency levels, falling back to defaults.
 */
const parseConcurrencyLevels = () => {
  const raw = process.env.BENCHMARK_CONCURRENCY_LEVELS;
  if (!raw) return [1, 5, 10, 25, 50];
  const parsed = raw
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  return parsed.length > 0 ? parsed : [1, 5, 10, 25, 50];
};

/**
 * @typedef {Object} BenchmarkConfig
 * @property {string}   version             - Benchmark algorithm version (bump on algorithm changes)
 * @property {string}   baseUrl             - Base API URL for HTTP requests
 * @property {number}   warmupIterations    - Warm-up iterations (excluded from metrics)
 * @property {number}   iterations          - Measurement iterations per scenario
 * @property {number[]} concurrencyLevels   - Concurrency tiers to test
 * @property {number}   timeoutMs           - Per-request timeout in milliseconds
 * @property {string}   reportDir           - Directory where reports are written
 * @property {boolean}  collectMemory       - Whether to capture memory snapshots
 * @property {boolean}  collectCpu          - Whether to capture CPU usage snapshots
 */

/**
 * Frozen benchmark configuration derived from environment variables.
 * Mirrors the pattern used in src/config/env.js.
 *
 * @type {BenchmarkConfig}
 */
export const benchmarkConfig = Object.freeze({
  /**
   * Tracks changes to the benchmarking algorithm (percentile math, sampling strategy,
   * report format). Bump manually — never driven by env var, because this reflects
   * a code-review decision, not an environment difference.
   */
  version: '1.0.0',

  baseUrl:
    process.env.BENCHMARK_BASE_URL || 'http://localhost:5000/api/v1',

  warmupIterations:
    Number(process.env.BENCHMARK_WARMUP_ITERATIONS) || 5,

  iterations:
    Number(process.env.BENCHMARK_ITERATIONS) || 50,

  /**
   * Array of concurrency tiers to iterate over.
   * Phase 13.5.6.1 smoke test uses only the first level.
   * Phase 13.5.6.4 load tests iterate all levels.
   */
  concurrencyLevels: parseConcurrencyLevels(),

  timeoutMs:
    Number(process.env.BENCHMARK_TIMEOUT_MS) || 5000,

  reportDir:
    process.env.BENCHMARK_REPORT_DIR || 'benchmark/reports',

  collectMemory:
    process.env.BENCHMARK_COLLECT_MEMORY !== 'false',

  collectCpu:
    process.env.BENCHMARK_COLLECT_CPU !== 'false',

  /**
   * Endpoint-specific iteration counts for Phase 13.5.6.2+.
   * Kept as a sub-object to distinguish from the generic `iterations` field
   * and to signal these values are specific to API endpoint benchmarking.
   *
   * The runner selects `endpointIterations.read` or `endpointIterations.write`
   * based on `endpoint.readOnly`. The outer `iterations` field remains intact
   * for backward compatibility with the Phase 13.5.6.1 smoke scenario.
   */
  endpointIterations: Object.freeze({
    read:  Number(process.env.BENCHMARK_READ_ITERATIONS)  || 50,
    write: Number(process.env.BENCHMARK_WRITE_ITERATIONS) || 10,
  }),
});
