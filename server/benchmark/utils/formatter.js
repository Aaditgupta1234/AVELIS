/**
 * @fileoverview Number and string formatting helpers.
 *
 * Used by the report generator and console summary output.
 * All functions are pure — no side effects.
 *
 * @module benchmark/utils/formatter
 */

/**
 * Format a number as milliseconds with 2 decimal places.
 *
 * @param {number} n
 * @returns {string} e.g. "12.34 ms"
 */
export const fms = (n) => `${Number(n).toFixed(2)} ms`;

/**
 * Format a number as requests per second with 1 decimal place.
 *
 * @param {number} n
 * @returns {string} e.g. "1234.5 req/s"
 */
export const frps = (n) => `${Number(n).toFixed(1)} req/s`;

/**
 * Format a number as megabytes with 2 decimal places.
 *
 * @param {number} n
 * @returns {string} e.g. "45.23 MB"
 */
export const fmb = (n) => `${Number(n).toFixed(2)} MB`;

/**
 * Format a number as a percentage with 2 decimal places.
 *
 * @param {number} n - Value between 0 and 100.
 * @returns {string} e.g. "98.50%"
 */
export const fpct = (n) => `${Number(n).toFixed(2)}%`;

/**
 * Pad a string on the right to a given width (left-align).
 *
 * @param {string|number} s - Value to pad.
 * @param {number}        w - Target width.
 * @returns {string}
 */
export const padEnd = (s, w) => String(s).padEnd(w);

/**
 * Pad a string on the left to a given width (right-align).
 *
 * @param {string|number} s - Value to pad.
 * @param {number}        w - Target width.
 * @returns {string}
 */
export const padStart = (s, w) => String(s).padStart(w);

/**
 * Build a simple Markdown table from headers and rows.
 *
 * @param {string[]}   headers - Column headers.
 * @param {string[][]} rows    - Table rows (each row is an array of cell strings).
 * @returns {string} Markdown table string.
 *
 * @example
 * mdTable(['Metric', 'Value'], [['Avg', '12.34 ms'], ['P99', '45.00 ms']]);
 */
export const mdTable = (headers, rows) => {
  const sep = headers.map(() => '---');
  const lines = [
    `| ${headers.join(' | ')} |`,
    `| ${sep.join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ];
  return lines.join('\n');
};
