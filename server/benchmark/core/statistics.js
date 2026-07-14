/**
 * @fileoverview Pure statistics functions.
 *
 * Zero dependency on benchmark execution — all functions are pure and
 * accept plain number arrays. Suitable for use in tests and one-off calculations.
 *
 * Sort-once pattern
 * -----------------
 * Public helpers (p50, p90, p95, p99) each sort internally for ergonomic
 * one-off usage. When computing the full percentile suite inside summarize(),
 * callers should use sortedCopy() once and pass the result directly to the
 * base percentile() primitive to avoid O(n log n) redundant sorts:
 *
 *   const sorted = sortedCopy(durations);
 *   const p50val = percentile(sorted, 50);
 *   const p90val = percentile(sorted, 90);
 *   const p95val = percentile(sorted, 95);
 *   const p99val = percentile(sorted, 99);
 *
 * @module benchmark/core/statistics
 */

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Return a sorted (ascending) copy of an array without mutating the original.
 * Callers in the hot path (summarize) use this once and reuse the result.
 *
 * @param {number[]} arr
 * @returns {number[]}
 */
export const sortedCopy = (arr) => [...arr].sort((a, b) => a - b);

// ---------------------------------------------------------------------------
// Core statistics
// ---------------------------------------------------------------------------

/**
 * Compute the arithmetic mean of an array.
 *
 * @param {number[]} arr - Input values (unsorted, non-empty).
 * @returns {number}
 */
export const mean = (arr) => {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, v) => sum + v, 0) / arr.length;
};

/**
 * Compute the median of an array.
 *
 * @param {number[]} arr - Input values (unsorted, non-empty).
 * @returns {number}
 */
export const median = (arr) => {
  if (arr.length === 0) return 0;
  const sorted = sortedCopy(arr);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

/**
 * Compute the population variance of an array.
 *
 * @param {number[]} arr - Input values (unsorted, non-empty).
 * @returns {number}
 */
export const variance = (arr) => {
  if (arr.length === 0) return 0;
  const m = mean(arr);
  return arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length;
};

/**
 * Compute the population standard deviation of an array.
 *
 * @param {number[]} arr - Input values (unsorted, non-empty).
 * @returns {number}
 */
export const stddev = (arr) => Math.sqrt(variance(arr));

/**
 * Return the minimum value of an array.
 *
 * @param {number[]} arr - Input values (non-empty).
 * @returns {number}
 */
export const min = (arr) => {
  if (arr.length === 0) return 0;
  return Math.min(...arr);
};

/**
 * Return the maximum value of an array.
 *
 * @param {number[]} arr - Input values (non-empty).
 * @returns {number}
 */
export const max = (arr) => {
  if (arr.length === 0) return 0;
  return Math.max(...arr);
};

// ---------------------------------------------------------------------------
// Percentile (base primitive — works on pre-sorted arrays)
// ---------------------------------------------------------------------------

/**
 * Compute an arbitrary percentile from a pre-sorted array.
 *
 * This is the base primitive used by the hot path in summarize().
 * The caller is responsible for sorting — this function trusts its input.
 *
 * Uses the "nearest rank" method:
 *   index = ceil((p / 100) * length) - 1
 *
 * @param {number[]} sorted - A sorted (ascending) array of values.
 * @param {number}   p      - Percentile to compute (0–100).
 * @returns {number}
 *
 * @example
 * const sorted = sortedCopy(durations);
 * const p99 = percentile(sorted, 99);
 */
export const percentile = (sorted, p) => {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
};

// ---------------------------------------------------------------------------
// Convenience wrappers (sort internally — for one-off / test use)
// ---------------------------------------------------------------------------

/**
 * Compute the 50th percentile (median) of an unsorted array.
 * For hot-path usage, prefer: percentile(sortedCopy(arr), 50)
 *
 * @param {number[]} arr
 * @returns {number}
 */
export const p50 = (arr) => percentile(sortedCopy(arr), 50);

/**
 * Compute the 90th percentile of an unsorted array.
 * For hot-path usage, prefer: percentile(sortedCopy(arr), 90)
 *
 * @param {number[]} arr
 * @returns {number}
 */
export const p90 = (arr) => percentile(sortedCopy(arr), 90);

/**
 * Compute the 95th percentile of an unsorted array.
 * For hot-path usage, prefer: percentile(sortedCopy(arr), 95)
 *
 * @param {number[]} arr
 * @returns {number}
 */
export const p95 = (arr) => percentile(sortedCopy(arr), 95);

/**
 * Compute the 99th percentile of an unsorted array.
 * For hot-path usage, prefer: percentile(sortedCopy(arr), 99)
 *
 * @param {number[]} arr
 * @returns {number}
 */
export const p99 = (arr) => percentile(sortedCopy(arr), 99);
