/**
 * @fileoverview Warm-up runner.
 *
 * Executes a configurable number of warm-up iterations before
 * benchmark measurements begin. All results are discarded — warm-up
 * metrics are never included in benchmark statistics.
 *
 * Purpose of warm-up:
 * - Initialize Node.js V8 JIT compiler
 * - Establish database / Prisma connections
 * - Populate caches where applicable
 * - Stabilize performance before measurement
 *
 * @module benchmark/core/warmupRunner
 */

import { startTimer, endTimer } from '../utils/timer.js';

/**
 * @typedef {Object} WarmupResult
 * @property {number} iterationsRun - Number of warm-up iterations executed
 * @property {number} elapsedMs     - Total warm-up wall-clock time in milliseconds
 */

/**
 * @typedef {Object} Scenario
 * @property {string}            name    - Human-readable scenario identifier
 * @property {function(): Promise<any>} request - Async function that performs one request
 */

/**
 * Execute warm-up iterations for a scenario.
 *
 * Warm-up requests are executed sequentially (not concurrently) to avoid
 * overwhelming the server during JIT initialization. Results are discarded.
 *
 * @param {Scenario} scenario - The benchmark scenario to warm up
 * @param {Object}   config   - Benchmark configuration (uses config.warmupIterations)
 * @returns {Promise<WarmupResult>}
 *
 * @example
 * const result = await runWarmup(scenario, benchmarkConfig);
 * console.log(`Warm-up: ${result.iterationsRun} iterations in ${result.elapsedMs.toFixed(1)}ms`);
 */
export const runWarmup = async (scenario, config) => {
  const iterations = config.warmupIterations ?? 5;
  const token = startTimer();

  for (let i = 0; i < iterations; i++) {
    try {
      // Execute and discard — warm-up results are never recorded
      await scenario.request();
    } catch {
      // Swallow warm-up errors silently — the goal is JIT initialization,
      // not correctness. Errors here should not abort the benchmark.
    }
  }

  return {
    iterationsRun: iterations,
    elapsedMs: endTimer(token),
  };
};
