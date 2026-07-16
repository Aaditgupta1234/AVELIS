/**
 * @fileoverview Load testing configuration.
 *
 * Centralizes warm-up, test duration, soak test parameters, concurrency limits,
 * seed targets, and informational performance baselines.
 *
 * @module benchmark/load.config
 */

export const loadConfig = Object.freeze({
  /** Duration in milliseconds of the initial warmup period (before metrics collection starts) */
  WARMUP_DURATION: Number(process.env.LOAD_BENCHMARK_WARMUP_MS) || 2000,

  /** Duration in milliseconds of each concurrent scenario load test */
  TEST_DURATION: Number(process.env.LOAD_BENCHMARK_TEST_MS) || 5000,

  /** Duration in milliseconds of the long running soak test */
  SOAK_DURATION: Number(process.env.LOAD_BENCHMARK_SOAK_MS) || 10000,

  /** Concurrency scenarios (number of concurrent simulated users) */
  CONCURRENCY_SCENARIOS: [50, 100, 250, 500],

  /** Save timestamped run copies */
  SAVE_HISTORY: process.env.LOAD_BENCHMARK_SAVE_HISTORY !== 'false',

  /** Maximum number of historical runs to retain */
  MAX_HISTORY_RUNS: Number(process.env.LOAD_BENCHMARK_MAX_HISTORY_RUNS) || 20,

  /** Base output directory for reports and results */
  OUTPUT_DIRECTORY: process.env.LOAD_BENCHMARK_OUTPUT_DIR || 'benchmark/load',

  /** Output directory for timestamped history runs */
  HISTORY_DIRECTORY: process.env.LOAD_BENCHMARK_HISTORY_DIR || 'benchmark/load/history',

  /** Deterministic seed for PRNG workload generation. When null/undefined, uses timestamp-based seeds. */
  LOAD_RANDOM_SEED: process.env.LOAD_RANDOM_SEED ? Number(process.env.LOAD_RANDOM_SEED) : null,

  // ── Recommended Informational Thresholds ──────────────────────────────────
  /** Recommended average response latency in milliseconds */
  LATENCY_AVG_LIMIT: Number(process.env.LOAD_BENCHMARK_LATENCY_AVG_LIMIT) || 200,

  /** Recommended P95 response latency in milliseconds */
  LATENCY_P95_LIMIT: Number(process.env.LOAD_BENCHMARK_LATENCY_P95_LIMIT) || 500,

  /** Recommended maximum allowed error rate (fraction: e.g. 0.02 = 2%) */
  ERROR_RATE_LIMIT: Number(process.env.LOAD_BENCHMARK_ERROR_RATE_LIMIT) || 0.02,

  /** Recommended maximum allowed timeout rate (fraction: e.g. 0.01 = 1%) */
  TIMEOUT_RATE_LIMIT: Number(process.env.LOAD_BENCHMARK_TIMEOUT_RATE_LIMIT) || 0.01,

  /** Recommended maximum Node Process CPU utilization (fraction: 0.80 = 80%) */
  CPU_LIMIT: Number(process.env.LOAD_BENCHMARK_CPU_LIMIT) || 0.80,

  /** Recommended maximum system memory usage fraction (0.80 = 80%) */
  MEM_LIMIT: Number(process.env.LOAD_BENCHMARK_MEM_LIMIT) || 0.80,
});
