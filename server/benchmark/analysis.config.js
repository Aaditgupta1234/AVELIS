/**
 * @fileoverview Centralized performance bottleneck analysis configuration.
 *
 * All parameters support overrides via environment variables.
 *
 * @module benchmark/analysis.config
 */

import path from 'path';

export const analysisConfig = Object.freeze({
  /** Input directories for benchmark artifacts */
  INPUT_DIRECTORIES: {
    api: process.env.API_BENCHMARK_DIR || 'benchmark/reports',
    database: process.env.DB_BENCHMARK_DIR || 'benchmark/database',
    load: process.env.LOAD_BENCHMARK_DIR || 'benchmark/load',
  },

  /** Base output directory for analysis reports and results */
  OUTPUT_DIRECTORY: process.env.ANALYSIS_OUTPUT_DIR || 'benchmark/analysis',

  /** Output directory for timestamped history runs */
  HISTORY_DIRECTORY: process.env.ANALYSIS_HISTORY_DIR || 'benchmark/analysis/history',

  /** Save timestamped run copies */
  SAVE_HISTORY: process.env.ANALYSIS_SAVE_HISTORY !== 'false',

  /** Maximum number of historical runs to retain */
  MAX_HISTORY_RUNS: Number(process.env.ANALYSIS_MAX_HISTORY_RUNS) || 20,

  /** Supported schema version for generated JSON files */
  SCHEMA_VERSION: '1.0',

  /** Current analysis phase label */
  ANALYSIS_PHASE: '13.5.6.5',

  /** Target performance thresholds for bottleneck flagging (informational only) */
  BOTTLENECK_THRESHOLDS: {
    API_LATENCY_LIMIT: Number(process.env.API_LATENCY_LIMIT_MS) || 200,
    DB_LATENCY_LIMIT: Number(process.env.DB_LATENCY_LIMIT_MS) || 20,
    DB_TX_LIMIT: Number(process.env.DB_TX_LIMIT_MS) || 50,
    LOAD_ERROR_LIMIT: Number(process.env.LOAD_ERROR_LIMIT_PCT) || 0.02,
    LOAD_TIMEOUT_LIMIT: Number(process.env.LOAD_TIMEOUT_LIMIT_PCT) || 0.01,
    CPU_LIMIT: Number(process.env.LOAD_CPU_LIMIT_PCT) || 0.80,
    MEM_LIMIT: Number(process.env.LOAD_MEM_LIMIT_PCT) || 0.80,
    EVENT_LOOP_LIMIT: Number(process.env.LOAD_EVENT_LOOP_LIMIT_MS) || 10,
  },

  /** Severity categorization thresholds */
  SEVERITY_THRESHOLDS: {
    CRITICAL: {
      API_LATENCY: 500,        // > 500ms
      DB_LATENCY: 100,         // > 100ms
      DB_TX: 150,              // > 150ms
      ERROR_RATE: 0.10,        // > 10% errors
      TIMEOUT_RATE: 0.05,      // > 5% timeouts
      CPU_FRACTION: 0.95,      // > 95% CPU
    },
    HIGH: {
      API_LATENCY: 200,        // > 200ms
      DB_LATENCY: 20,          // > 20ms
      DB_TX: 50,               // > 50ms
      ERROR_RATE: 0.02,        // > 2% errors
      TIMEOUT_RATE: 0.01,      // > 1% timeouts
      CPU_FRACTION: 0.80,      // > 80% CPU
    },
    MEDIUM: {
      API_LATENCY: 50,         // > 50ms
      DB_LATENCY: 10,          // > 10ms
      DB_TX: 20,               // > 20ms
      ERROR_RATE: 0.005,       // > 0.5% errors
      TIMEOUT_RATE: 0.001,     // > 0.1% timeouts
      CPU_FRACTION: 0.50,      // > 50% CPU
    },
  },

  /** Priority scoring weights for the Priority Engine */
  PRIORITY_WEIGHTS: {
    IMPACT_WEIGHT: Number(process.env.PRIORITY_IMPACT_WEIGHT) || 0.4,
    EFFORT_WEIGHT: Number(process.env.PRIORITY_EFFORT_WEIGHT) || 0.3,
    RISK_WEIGHT: Number(process.env.PRIORITY_RISK_WEIGHT) || 0.3,
  },
});
