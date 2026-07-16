/**
 * @fileoverview Centralized database benchmarking configuration.
 *
 * All parameters support overrides via environment variables.
 *
 * @module benchmark/config
 */

import path from 'path';

export const config = Object.freeze({
  /** Number of warm-up iterations executed before measurements begin */
  WARMUP_ITERATIONS: Number(process.env.DB_BENCHMARK_WARMUP) || 5,

  /** Number of measurement iterations per query/transaction */
  MEASURE_ITERATIONS: Number(process.env.DB_BENCHMARK_ITERATIONS) || 100,

  /** Latency threshold in milliseconds to classify a query as slow */
  SLOW_QUERY_THRESHOLD: Number(process.env.DB_SLOW_QUERY_THRESHOLD_MS) || 100,

  /** Result row count limit to classify a query as fetching a large result set */
  LARGE_RESULT_THRESHOLD: Number(process.env.DB_LARGE_RESULT_THRESHOLD_ROWS) || 100,

  /** Base output directory for reports and results */
  OUTPUT_DIRECTORY: process.env.DB_BENCHMARK_OUTPUT_DIR || 'benchmark/database',

  /** Output directory for timestamped history runs */
  HISTORY_DIRECTORY: process.env.DB_BENCHMARK_HISTORY_DIR || 'benchmark/database/history',

  /** Save timestamped run copies */
  SAVE_HISTORY: process.env.DB_BENCHMARK_SAVE_HISTORY !== 'false',

  /** Maximum number of historical runs to retain */
  MAX_HISTORY_RUNS: Number(process.env.DB_BENCHMARK_MAX_HISTORY_RUNS) || 20,

  /** Performance thresholds (in milliseconds) for read operations (informational only) */
  READ_AVG_LIMIT: Number(process.env.DB_BENCHMARK_READ_AVG_LIMIT) || 20,
  READ_P95_LIMIT: Number(process.env.DB_BENCHMARK_READ_P95_LIMIT) || 50,

  /** Performance thresholds (in milliseconds) for write/transaction operations (informational only) */
  WRITE_AVG_LIMIT: Number(process.env.DB_BENCHMARK_WRITE_AVG_LIMIT) || 50,
  WRITE_P95_LIMIT: Number(process.env.DB_BENCHMARK_WRITE_P95_LIMIT) || 100,
});
