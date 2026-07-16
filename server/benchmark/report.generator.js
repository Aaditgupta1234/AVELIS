/**
 * @fileoverview Markdown report compiler for Phase 13.5.6.3.
 *
 * Compiles database query and transaction metrics, environment information,
 * slow queries, and query count analysis into a comprehensive report.md.
 *
 * @module benchmark/report.generator
 */

import { config } from './config.js';

const fms = (ms) => (typeof ms === 'number' ? `${ms.toFixed(3)} ms` : 'N/A');
const fpct = (pct) => (typeof pct === 'number' ? `${pct.toFixed(2)}%` : 'N/A');

/**
 * Generate a Markdown report string from database benchmarking metrics.
 *
 * @param {Object} querySummary - Contents of query-summary.json
 * @param {Object} transactions - Contents of transactions.json
 * @param {Object} slowQueries - Contents of slow-queries.json
 * @returns {string} Compiled Markdown report content
 */
export function generateMarkdownReport(querySummary, transactions, slowQueries) {
  const meta = querySummary.metadata;
  const env = querySummary.environment || {};

  const lines = [
    '# AVELIS Database Benchmark Report',
    '',
    `> Generated: ${querySummary.generatedAt || new Date().toISOString()}`,
    `> Schema Version: ${querySummary.schemaVersion || '1.0'} | Phase: ${querySummary.phase || '13.5.6.3'}`,
    '',
    '## 1. Executive Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| **Start Time** | ${querySummary.startedAt || 'N/A'} |`,
    `| **Finish Time** | ${querySummary.finishedAt || 'N/A'} |`,
    `| **Overall Suite Duration** | ${fms(querySummary.durationMs)} |`,
    `| **Node.js Version** | ${env.nodeVersion || 'N/A'} |`,
    `| **Prisma version** | ${env.prismaVersion || 'N/A'} |`,
    `| **PostgreSQL version** | ${env.postgresVersion || 'N/A'} |`,
    `| **Platform / Arch** | ${meta.platform || 'N/A'} / ${meta.arch || 'N/A'} |`,
    `| **Warmup Iterations** | ${querySummary.config?.warmupIterations || config.WARMUP_ITERATIONS} |`,
    `| **Measurement Iterations** | ${querySummary.config?.measurementIterations || config.MEASURE_ITERATIONS} |`,
    '',
  ];

  // ── 2. Query Benchmark Table ──────────────────────────────────────────────
  lines.push('## 2. Query Benchmarks');
  lines.push('');
  lines.push('| Query | Benchmark Status | Performance Status | Iterations | Avg Latency | P95 | P99 | Std Dev | Total Time | Query Count |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');

  for (const q of querySummary.results || []) {
    const isPerfPass = q.metrics.durationMs.avg < config.READ_AVG_LIMIT && q.metrics.durationMs.p95 < config.READ_P95_LIMIT;
    const perfStatus = isPerfPass
      ? '✓ Within recommendation'
      : `⚠ Exceeded limit (Expected Avg < ${config.READ_AVG_LIMIT}ms)`;
    const benchStatus = q.status === 'PASS' ? 'PASS' : 'FAIL';

    lines.push(
      `| **${q.name}** | ${benchStatus} | ${perfStatus} | ${q.metrics.totalRequests} | ${fms(q.metrics.durationMs.avg)} | ${fms(q.metrics.durationMs.p95)} | ${fms(q.metrics.durationMs.p99)} | ${fms(q.metrics.durationMs.stddev)} | ${fms(q.metrics.totalTimeMs)} | ${q.queryAnalysis?.totalQueries || 0} |`
    );
  }
  lines.push('');

  // ── 3. Transaction Benchmark Table ─────────────────────────────────────────
  lines.push('## 3. Transaction Benchmarks');
  lines.push('');
  lines.push('| Transaction | Benchmark Status | Performance Status | Commits (Success) | Rollbacks (Failures) | Retries | Success Rate | Commit Avg | Rollback Avg |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');

  for (const tx of transactions.results || []) {
    const avgCommit = tx.metrics.commitDurationMs?.avg || 0;
    const p95Commit = tx.metrics.commitDurationMs?.p95 || 0;
    const isPerfPass = avgCommit < config.WRITE_AVG_LIMIT && p95Commit < config.WRITE_P95_LIMIT;
    const perfStatus = isPerfPass
      ? '✓ Within recommendation'
      : `⚠ Exceeded limit (Expected Avg < ${config.WRITE_AVG_LIMIT}ms)`;
    const benchStatus = tx.status === 'PASS' ? 'PASS' : 'FAIL';

    lines.push(
      `| **${tx.name}** | ${benchStatus} | ${perfStatus} | ${tx.metrics.success} | ${tx.metrics.failures} | ${tx.metrics.retries} | ${fpct(tx.metrics.successRate)} | ${fms(avgCommit)} | ${fms(tx.metrics.rollbackDurationMs?.avg || 0)} |`
    );
  }
  lines.push('');

  // ── 4. Query Count & N+1 Analysis ──────────────────────────────────────────
  lines.push('## 4. Query Count & N+1 Analysis');
  lines.push('');
  lines.push('| Benchmark | Total Queries | Duplicate Queries | Redundant Lookups | N+1 Risk | Excessive Round Trips |');
  lines.push('| --- | --- | --- | --- | --- | --- |');

  for (const q of querySummary.results || []) {
    const analysis = q.queryAnalysis || {};
    lines.push(
      `| ${q.name} | ${analysis.totalQueries} | ${analysis.duplicateQueries?.length || 0} | ${analysis.redundantLookups?.length || 0} | ${analysis.potentialNPlusOne ? '⚠ HIGH' : 'Low'} | ${analysis.excessiveRoundTrips ? '⚠ YES' : 'No'} |`
    );
  }
  lines.push('');

  // ── 5. Slow Query Findings ────────────────────────────────────────────────
  lines.push('## 5. Slow Query Findings');
  lines.push('');
  if (slowQueries.flagged?.length === 0) {
    lines.push('_No queries exceeded thresholds or flagged anomalies._');
    lines.push('');
  } else {
    lines.push('| Query / Operation | Type | Severity | Metric / Value | Recommendation |');
    lines.push('| --- | --- | --- | --- | --- |');
    for (const f of slowQueries.flagged || []) {
      const metricVal = f.type === 'Slow Query'
        ? `Latency: ${fms(f.duration)}`
        : f.type === 'Large Result Set'
          ? `Result Rows: ${f.resultSize}`
          : f.type === 'Expensive Nested Joins'
            ? `Nested Depth: ${f.depth}`
            : 'N/A';

      lines.push(
        `| **${f.queryName}** | ${f.type} | **${f.severity}** | ${metricVal} | ${f.recommendation} |`
      );
    }
    lines.push('');
  }

  // ── 6. Memory Growth Analysis ──────────────────────────────────────────────
  lines.push('## 6. Memory Analysis');
  lines.push('');
  lines.push('| Benchmark Category | Heap Used Before | Heap Used After | Memory Growth |');
  lines.push('| --- | --- | --- | --- |');

  const qMem = querySummary.memoryUsage || {};
  const txMem = transactions.memoryUsage || {};

  const qGrowth = qMem.heapUsedAfter && qMem.heapUsedBefore ? qMem.heapUsedAfter - qMem.heapUsedBefore : 0;
  const txGrowth = txMem.heapUsedAfter && txMem.heapUsedBefore ? txMem.heapUsedAfter - txMem.heapUsedBefore : 0;

  const fmb = (bytes) => (typeof bytes === 'number' ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : 'N/A');

  lines.push(`| Query Benchmarks | ${fmb(qMem.heapUsedBefore)} | ${fmb(qMem.heapUsedAfter)} | ${fmb(qGrowth)} |`);
  lines.push(`| Transaction Benchmarks | ${fmb(txMem.heapUsedBefore)} | ${fmb(txMem.heapUsedAfter)} | ${fmb(txGrowth)} |`);
  lines.push('');

  // ── 7. Recommendations & Health Summary ──────────────────────────────────
  lines.push('## 7. Recommendations & Health Summary');
  lines.push('');
  const totalSlow = slowQueries.flagged?.filter(f => f.type === 'Slow Query').length || 0;
  const totalFullScans = slowQueries.flagged?.filter(f => f.type === 'Potential Full Table Scan').length || 0;
  const totalN1Risk = querySummary.results?.filter(q => q.queryAnalysis?.potentialNPlusOne).length || 0;

  lines.push('### Overall Health Rating:');
  if (totalSlow === 0 && totalFullScans === 0 && totalN1Risk === 0) {
    lines.push('**OPTIMAL (A+)** — The database access patterns are clean, indexed, and efficient.');
  } else if (totalFullScans > 0 || totalN1Risk > 0) {
    lines.push('**NEEDS ATTENTION (B)** — Several operations contain potential full table scans or duplicate lookups that could degrade performance under high concurrency.');
  } else {
    lines.push('**GOOD (A)** — Access patterns are generally solid; some minor recommendations flagged for query tuning.');
  }
  lines.push('');
  lines.push('### Strategic Recommendations:');
  lines.push('1. **Enforce Pagination**: Ensure all list lookups use bounded pagination arguments (`skip`, `take`) to prevent loading large tables into memory.');
  lines.push('2. **Index Columns**: Add database indexes for query search columns (`isDeleted`, `title`, etc.) to resolve potential full table scans.');
  lines.push('3. **Flatten Relations**: Where expensive nested joins are flagged, optimize select clauses or execute separate primary key fetches instead of deep includes.');
  lines.push('');

  return lines.join('\n');
}
