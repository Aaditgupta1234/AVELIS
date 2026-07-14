/**
 * @fileoverview Reusable metrics accumulator.
 *
 * Collects per-request results and system snapshots during a benchmark run,
 * then computes derived statistics on demand via summarize().
 *
 * Sort-once pattern:
 * summarize() calls sortedCopy() exactly once for the full duration array,
 * then passes the pre-sorted result to all percentile calculations via the
 * base percentile() primitive — avoiding O(n log n) redundant sorts.
 *
 * @module benchmark/core/metricsCollector
 */

import {
  mean,
  stddev,
  min,
  max,
  percentile,
  sortedCopy,
} from './statistics.js';

/**
 * @typedef {Object} RequestRecord
 * @property {number}      durationMs - Request duration in milliseconds
 * @property {number}      status     - HTTP status code (0 = network error)
 * @property {boolean}     success    - True if status is 2xx
 * @property {number}      timestamp  - Date.now() at request start
 */

/**
 * @typedef {Object} SystemSample
 * @property {number} heapUsedMb  - Heap used in MB at sample time
 * @property {number} rssMb       - RSS in MB at sample time
 * @property {number} [userMs]    - CPU user time in ms (if collectCpu)
 * @property {number} [systemMs]  - CPU system time in ms (if collectCpu)
 * @property {number} uptimeSec   - Process uptime in seconds at sample time
 */

/**
 * @typedef {Object} MetricsSummary
 * @property {number} totalRequests
 * @property {number} successCount
 * @property {number} failureCount
 * @property {number} successRate      - 0–100
 * @property {number} failureRate      - 0–100
 * @property {{ avg, median, min, max, p50, p90, p95, p99, stddev }} durationMs
 * @property {number} rps              - Requests per second
 * @property {{ memory: { heapUsedMb, rssMb }, cpu?: { userMs, systemMs }, uptime: number }} system
 * @property {number} elapsedMs        - Total benchmark wall-clock time
 */

/**
 * @typedef {Object} MetricsCollector
 * @property {function(RequestRecord): void}  record       - Record one request result
 * @property {function(): void}               sampleSystem - Snapshot memory + CPU + uptime
 * @property {function(number): void}         setElapsed   - Store total elapsed wall-clock ms
 * @property {function(): MetricsSummary}     summarize    - Compute and return full summary
 * @property {function(): void}               reset        - Clear all accumulated data
 * @property {function(): RequestRecord[]}    getRaw       - Return raw request records
 */

/**
 * Create a new metrics collector instance.
 *
 * @returns {MetricsCollector}
 *
 * @example
 * const collector = createMetricsCollector();
 * collector.record({ durationMs: 12.5, status: 200, success: true, timestamp: Date.now() });
 * collector.sampleSystem();
 * collector.setElapsed(1500);
 * const summary = collector.summarize();
 */
export const createMetricsCollector = () => {
  /** @type {RequestRecord[]} */
  let records = [];

  /** @type {SystemSample[]} */
  let systemSamples = [];

  let elapsedMs = 0;

  // ---------------------------------------------------------------------------
  // record
  // ---------------------------------------------------------------------------

  /**
   * Add one request result. Silently discards invalid entries.
   *
   * @param {RequestRecord} result
   */
  const record = (result) => {
    if (!result || typeof result.durationMs !== 'number') return;
    records.push({
      durationMs: result.durationMs,
      status: result.status ?? 0,
      success: result.success ?? (result.status >= 200 && result.status < 300),
      timestamp: result.timestamp ?? Date.now(),
    });
  };

  // ---------------------------------------------------------------------------
  // sampleSystem
  // ---------------------------------------------------------------------------

  /**
   * Snapshot memory, CPU usage, and process uptime in one atomic call.
   * Consistent with config.collectMemory / config.collectCpu — callers
   * control whether to invoke this, but the API is always available.
   */
  const sampleSystem = () => {
    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();
    systemSamples.push({
      heapUsedMb: mem.heapUsed / 1024 / 1024,
      rssMb: mem.rss / 1024 / 1024,
      userMs: cpu.user / 1000,
      systemMs: cpu.system / 1000,
      uptimeSec: process.uptime(),
    });
  };

  // ---------------------------------------------------------------------------
  // setElapsed
  // ---------------------------------------------------------------------------

  /**
   * Store the total benchmark wall-clock duration.
   *
   * @param {number} ms
   */
  const setElapsed = (ms) => {
    elapsedMs = ms;
  };

  // ---------------------------------------------------------------------------
  // summarize
  // ---------------------------------------------------------------------------

  /**
   * Compute and return a full MetricsSummary.
   * Sorts the duration array exactly once (sort-once pattern).
   *
   * @returns {MetricsSummary}
   */
  const summarize = () => {
    const totalRequests = records.length;
    const successCount = records.filter((r) => r.success).length;
    const failureCount = totalRequests - successCount;

    const durations = records.map((r) => r.durationMs);

    // ── Sort once, reuse for all percentile calculations ──────────────────────
    const sorted = sortedCopy(durations);

    const durationStats = {
      avg: mean(durations),
      median: durations.length > 0 ? percentile(sorted, 50) : 0,
      min: min(durations),
      max: max(durations),
      p50: percentile(sorted, 50),
      p90: percentile(sorted, 90),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
      stddev: stddev(durations),
    };

    const rps = elapsedMs > 0 ? (totalRequests / elapsedMs) * 1000 : 0;

    // ── System: use last sample, or live snapshot if none taken ───────────────
    const lastSample =
      systemSamples.length > 0
        ? systemSamples[systemSamples.length - 1]
        : (() => {
            const mem = process.memoryUsage();
            const cpu = process.cpuUsage();
            return {
              heapUsedMb: mem.heapUsed / 1024 / 1024,
              rssMb: mem.rss / 1024 / 1024,
              userMs: cpu.user / 1000,
              systemMs: cpu.system / 1000,
              uptimeSec: process.uptime(),
            };
          })();

    return {
      totalRequests,
      successCount,
      failureCount,
      successRate: totalRequests > 0 ? (successCount / totalRequests) * 100 : 0,
      failureRate: totalRequests > 0 ? (failureCount / totalRequests) * 100 : 0,
      durationMs: durationStats,
      rps,
      system: {
        memory: {
          heapUsedMb: lastSample.heapUsedMb,
          rssMb: lastSample.rssMb,
        },
        cpu: {
          userMs: lastSample.userMs,
          systemMs: lastSample.systemMs,
        },
        uptime: lastSample.uptimeSec,
      },
      elapsedMs,
    };
  };

  // ---------------------------------------------------------------------------
  // reset
  // ---------------------------------------------------------------------------

  /**
   * Clear all accumulated data. Useful when re-using a collector across runs.
   */
  const reset = () => {
    records = [];
    systemSamples = [];
    elapsedMs = 0;
  };

  // ---------------------------------------------------------------------------
  // getRaw
  // ---------------------------------------------------------------------------

  /**
   * Return the raw request records array.
   * Used by benchmarkRunner to embed in BenchmarkResult.
   *
   * @returns {RequestRecord[]}
   */
  const getRaw = () => [...records];

  return { record, sampleSystem, setElapsed, summarize, reset, getRaw };
};
