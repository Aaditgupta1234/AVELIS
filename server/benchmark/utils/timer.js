/**
 * @fileoverview High-resolution timer utilities.
 *
 * Uses process.hrtime.bigint() for nanosecond-precision timing,
 * returning elapsed durations as fractional milliseconds.
 *
 * @module benchmark/utils/timer
 */

/**
 * Start a high-resolution timer.
 *
 * @returns {bigint} A BigInt timestamp in nanoseconds representing the start time.
 *
 * @example
 * const token = startTimer();
 * // ... do work ...
 * const elapsed = endTimer(token); // e.g. 12.345 ms
 */
export const startTimer = () => process.hrtime.bigint();

/**
 * End a high-resolution timer and return the elapsed time in milliseconds.
 *
 * @param {bigint} token - The BigInt timestamp returned by startTimer().
 * @returns {number} Elapsed time in milliseconds (fractional, e.g. 12.345).
 *
 * @example
 * const token = startTimer();
 * await doSomething();
 * const ms = endTimer(token); // fractional ms
 */
export const endTimer = (token) => {
  const nanos = process.hrtime.bigint() - token;
  // Convert nanoseconds → milliseconds with fractional precision
  return Number(nanos) / 1_000_000;
};
