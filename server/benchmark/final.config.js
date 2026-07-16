/**
 * @fileoverview Centralized final performance report configuration.
 *
 * Configures directories, versions, and readiness scoring weights.
 * Supports environment overrides.
 *
 * @module benchmark/final.config
 */

export const finalConfig = Object.freeze({
  /** Input directories containing artifacts from previous phases */
  INPUT_DIRECTORIES: {
    api: process.env.API_BENCHMARK_DIR || 'benchmark/reports',
    database: process.env.DB_BENCHMARK_DIR || 'benchmark/database',
    load: process.env.LOAD_BENCHMARK_DIR || 'benchmark/load',
    analysis: process.env.ANALYSIS_BENCHMARK_DIR || 'benchmark/analysis',
  },

  /** Base output directory for the final performance assessment reports */
  OUTPUT_DIRECTORY: process.env.FINAL_REPORT_OUTPUT_DIR || 'benchmark/final',

  /** Output directory for timestamped history report copies */
  HISTORY_DIRECTORY: process.env.FINAL_REPORT_HISTORY_DIR || 'benchmark/final/history',

  /** Enable historical archiving */
  SAVE_HISTORY: process.env.FINAL_REPORT_SAVE_HISTORY !== 'false',

  /** Maximum historical reports to retain */
  MAX_HISTORY_RUNS: Number(process.env.FINAL_REPORT_MAX_HISTORY_RUNS) || 20,

  /** Structural schema version */
  SCHEMA_VERSION: '1.0',

  /** Report formatting/content version */
  REPORT_VERSION: '1.0.0',

  /** Current phase ID */
  REPORT_PHASE: '13.5.6.6',

  /** Enable delta comparisons against the prior historical run */
  COMPARISON_ENABLED: process.env.FINAL_REPORT_COMPARISON_ENABLED !== 'false',

  /** Production readiness score calculation weights */
  EXECUTIVE_SCORE_WEIGHTS: {
    HEALTH_WEIGHT: Number(process.env.READY_HEALTH_WEIGHT) || 0.5,       // Weight for bottleneck health score
    STABILITY_WEIGHT: Number(process.env.READY_STABILITY_WEIGHT) || 0.3, // Weight for load test stability
    COMPLETION_WEIGHT: Number(process.env.READY_COMPLETION_WEIGHT) || 0.2, // Weight for endpoint benchmark coverage
  },
});
