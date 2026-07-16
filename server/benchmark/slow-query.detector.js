/**
 * @fileoverview Slow query detector and normalization analyzer.
 *
 * Normalizes query arguments into query fingerprints, identifies slow queries,
 * large result sets, potential full table scans, and expensive joins.
 *
 * @module benchmark/slow-query.detector
 */

/**
 * Generate a normalized fingerprint string from a Prisma query.
 * Replaces actual values/literals in arguments with placeholder '?'.
 *
 * @param {string} model - Prisma model name (e.g. 'book')
 * @param {string} operation - Prisma operation name (e.g. 'findMany')
 * @param {Object} args - Query arguments
 * @returns {string} Normalized fingerprint
 */
export function getFingerprint(model, operation, args) {
  const normalize = (val) => {
    if (val === null || val === undefined) return val;
    if (val instanceof Date) return '?';
    if (typeof val === 'object') {
      if (Array.isArray(val)) {
        return val.map(normalize);
      }
      const res = {};
      for (const [k, v] of Object.entries(val)) {
        res[k] = normalize(v);
      }
      return res;
    }
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      return '?';
    }
    return val;
  };

  const normalizedArgs = args ? normalize(args) : {};
  return `${model || 'raw'}.${operation}(${JSON.stringify(normalizedArgs)})`;
}

/**
 * Check if the arguments specify nested selections/inclusions of depth > 2.
 *
 * @param {Object} obj - args.include or args.select
 * @param {number} depth - current depth
 * @returns {number} max depth found
 */
function getJoinDepth(obj, depth = 0) {
  if (!obj || typeof obj !== 'object') return depth;
  let max = depth;
  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object') {
      const d = getJoinDepth(value.include || value.select || value, depth + 1);
      if (d > max) max = d;
    }
  }
  return max;
}

/**
 * Scan query logs and detect performance anomalies.
 *
 * @param {Array} logs - Raw query logs collected during benchmarks
 * @param {number} slowThreshold - Configured slow query threshold (ms)
 * @param {number} largeThreshold - Configured large result set threshold (rows)
 * @returns {Array} List of flagged queries and recommendations
 */
export function detectQueries(logs, slowThreshold, largeThreshold) {
  const flagged = [];

  for (const log of logs) {
    const { model, operation, args, durationMs, resultSize } = log;
    const queryName = `${model || 'raw'}.${operation}`;

    // ── 1. Slow Query detection ──────────────────────────────────────────────
    if (durationMs > slowThreshold) {
      flagged.push({
        queryName,
        type: 'Slow Query',
        duration: durationMs,
        threshold: slowThreshold,
        severity: durationMs > slowThreshold * 2 ? 'HIGH' : 'MEDIUM',
        recommendation: 'Optimize database indexes, analyze query execution plan, or cache the result.',
        fingerprint: getFingerprint(model, operation, args),
      });
    }

    // ── 2. Large Result Set detection ────────────────────────────────────────
    if (resultSize > largeThreshold) {
      flagged.push({
        queryName,
        type: 'Large Result Set',
        duration: durationMs,
        resultSize,
        threshold: largeThreshold,
        severity: 'MEDIUM',
        recommendation: 'Implement pagination (use skip and take) or select only necessary fields.',
        fingerprint: getFingerprint(model, operation, args),
      });
    }

    // ── 3. Full Table Scan detection ─────────────────────────────────────────
    const isRead = ['findMany', 'count', 'aggregate', 'groupBy'].includes(operation);
    if (isRead && model) {
      const hasWhere = args && args.where && Object.keys(args.where).length > 0;
      if (!hasWhere) {
        flagged.push({
          queryName,
          type: 'Potential Full Table Scan',
          duration: durationMs,
          severity: 'HIGH',
          recommendation: 'Avoid full table scans by adding a WHERE clause filtering on indexed columns.',
          fingerprint: getFingerprint(model, operation, args),
        });
      }
    }

    // ── 4. Expensive Join detection ──────────────────────────────────────────
    if (args && (args.include || args.select)) {
      const depth = getJoinDepth(args.include || args.select);
      if (depth > 2) {
        flagged.push({
          queryName,
          type: 'Expensive Nested Joins',
          duration: durationMs,
          depth,
          severity: 'MEDIUM',
          recommendation: 'Flatten nested inclusions or execute split queries instead of loading multiple deep relations concurrently.',
          fingerprint: getFingerprint(model, operation, args),
        });
      }
    }
  }

  return flagged;
}
