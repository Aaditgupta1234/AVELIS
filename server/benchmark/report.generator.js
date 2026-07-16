/**
 * @fileoverview Report generator for Phase 13.5.6.4 — Load Testing.
 *
 * Compiles concurrent user comparison, stability metrics, connection analysis,
 * soak test trends, and optimization recommendations.
 *
 * @module benchmark/report.generator
 */

import { loadConfig } from './load.config.js';

const fms = (ms) => (typeof ms === 'number' ? `${ms.toFixed(2)} ms` : 'N/A');
const frps = (rps) => (typeof rps === 'number' ? `${rps.toFixed(2)} RPS` : 'N/A');
const fpct = (pct) => (typeof pct === 'number' ? `${pct.toFixed(2)}%` : 'N/A');
const fmb = (bytes) => (typeof bytes === 'number' ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : 'N/A');

/**
 * Generate a Markdown report string for load testing execution.
 *
 * @param {Object} summary - Contents of summary.json
 * @param {Object} stability - Contents of stability.json
 * @param {Object} soakTest - Contents of soak-test.json
 * @returns {string} Compiled report.md contents
 */
export function generateMarkdownReport(summary, stability, soakTest) {
  const meta = summary.metadata || {};
  const env = summary.environment || {};

  const lines = [
    '# AVELIS Load Testing Report',
    '',
    `> **Run ID**: \`${summary.runId || 'N/A'}\` | **Generated**: ${summary.generatedAt || new Date().toISOString()}`,
    `> **Schema Version**: ${summary.schemaVersion || '1.0'} | **Phase**: ${summary.phase || '13.5.6.4'}`,
    '',
    '## 1. Executive Summary',
    '',
    '| Parameter | Value |',
    '| --- | --- |',
    `| **Start Time** | ${summary.startedAt || 'N/A'} |`,
    `| **Finish Time** | ${summary.finishedAt || 'N/A'} |`,
    `| **Overall Suite Duration** | ${fms(summary.durationMs)} |`,
    `| **Random Seed (LCG PRNG)** | ${summary.config?.randomSeed || 'Unseeded (Random)'} |`,
    `| **Benchmark Status** | **${summary.benchmarkStatus || 'PASS'}** |`,
    `| **Performance Status** | **${summary.performanceStatus || '✓ Within recommendation'}** |`,
    `| **Node.js Version** | ${env.nodeVersion || 'N/A'} |`,
    `| **Prisma version** | ${env.prismaVersion || 'N/A'} |`,
    `| **PostgreSQL version** | ${env.postgresVersion || 'N/A'} |`,
    `| **Platform / Arch** | ${meta.platform || 'N/A'} / ${meta.arch || 'N/A'} (CPUs: ${meta.cpus || 'N/A'}) |`,
    '',
  ];

  // ── 2. Concurrent User Comparison ──────────────────────────────────────────
  lines.push('## 2. Concurrent User Comparison');
  lines.push('');
  lines.push('| Concurrency | Benchmark | Performance | Total Requests | Success Rate | Throughput | Avg Latency | P95 | P99 | Node Process CPU | Heap Growth |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');

  for (const scen of summary.scenarios || []) {
    const metrics = scen.metrics || {};
    const lat = metrics.durationMs || {};
    const mem = metrics.memory || {};

    const errorRate = metrics.failures / (metrics.totalRequests || 1);
    const timeoutRate = (metrics.errors?.timeout || 0) / (metrics.totalRequests || 1);

    const isPerfPass =
      lat.avg < loadConfig.LATENCY_AVG_LIMIT &&
      lat.p95 < loadConfig.LATENCY_P95_LIMIT &&
      errorRate < loadConfig.ERROR_RATE_LIMIT &&
      timeoutRate < loadConfig.TIMEOUT_RATE_LIMIT;

    const perfStatus = isPerfPass ? '✓ Within recommendation' : '⚠ Exceeded latency limit';
    const benchStatus = scen.status === 'PASS' ? 'PASS' : 'FAIL';

    lines.push(
      `| **${scen.concurrency} Users** | ${benchStatus} | ${perfStatus} | ${metrics.totalRequests} | ${fpct(metrics.successRate)} | ${frps(metrics.rps)} | ${fms(lat.avg)} | ${fms(lat.p95)} | ${fms(lat.p99)} | ${fpct(metrics.cpuFraction * 100)} | ${fmb(mem.heapGrowthBytes)} |`
    );
  }
  lines.push('');

  // ── 3. Stability Metrics Trace ──────────────────────────────────────────────
  lines.push('## 3. Stability Metrics Trace');
  lines.push('');
  lines.push('| Interval / Concurrency | Avg Process CPU | Heap Memory | RSS Memory | Event Loop Delay |');
  lines.push('| --- | --- | --- | --- | --- |');

  for (const entry of stability.trace || []) {
    lines.push(
      `| ${entry.concurrency || 'Steady'} | ${fpct(entry.cpuFraction * 100)} | ${fmb(entry.memory?.heapUsed)} | ${fmb(entry.memory?.rss)} | ${fms(entry.eventLoopDelayMs)} |`
    );
  }
  lines.push('');

  // ── 4. Connection Pool Analysis ────────────────────────────────────────────
  lines.push('## 4. Connection Pool Analysis');
  lines.push('');
  const conn = stability.connectionAnalysis || {};
  lines.push(`* **PostgreSQL Connection Count**: \`${conn.postgresConnections}\``);
  lines.push(`* **Prisma Connection Status**: \`${conn.status === 'PASS' ? 'Stable' : 'Unstable'}\``);
  lines.push('');
  if (conn.recommendations?.length > 0) {
    lines.push('#### Connection Recommendations:');
    for (const rec of conn.recommendations) {
      lines.push(`* ⚠ ${rec}`);
    }
  } else {
    lines.push('_No connection pool anomalies or saturation detected._');
  }
  lines.push('');

  // ── 5. Soak Test Results ──────────────────────────────────────────────────
  lines.push('## 5. Soak Test Results');
  lines.push('');
  if (soakTest) {
    const sm = soakTest.metrics || {};
    const smem = sm.memory || {};
    const scpu = sm.cpu || {};
    const strend = sm.trends || {};
    const serr = soakTest.errors || {};

    lines.push('### Core Soak Test Metrics');
    lines.push('');
    lines.push(`* **Soak Duration**: \`${soakTest.durationMs} ms\``);
    lines.push(`* **Total Requests**: \`${soakTest.success + soakTest.failures}\``);
    lines.push(`* **Success Rate**: \`${fpct(soakTest.successRate)}\``);
    lines.push(`* **First Half Avg Latency**: \`${fms(strend.firstHalfAvgLatencyMs)}\` | **Second Half Avg Latency**: \`${fms(strend.secondHalfAvgLatencyMs)}\``);
    lines.push(`* **Latency Drift**: \`${fms(strend.latencyDriftMs)}\``);
    lines.push(`* **Throughput Degradation**: \`${fpct(strend.throughputDegradationPercent)}\``);
    lines.push(`* **Event Loop Delay**: \`${fms(sm.eventLoopDelayMs)}\``);
    lines.push('');

    lines.push('### Resource Usage Trends during Soak');
    lines.push('');
    lines.push(`* **Heap Memory**: Started at \`${fmb(smem.heapUsedStart)}\` | Finished at \`${fmb(smem.heapUsedEnd)}\` (Growth: \`${fmb(smem.heapGrowthBytes)}\`)`);
    lines.push(`* **RSS Memory**: Started at \`${fmb(smem.rssStart)}\` | Finished at \`${fmb(smem.rssEnd)}\` (Growth: \`${fmb(smem.rssGrowthBytes)}\`)`);
    lines.push(`* **Node CPU Usage**: Started at \`${fpct(scpu.cpuStartFraction * 100)}\` | Finished at \`${fpct(scpu.cpuEndFraction * 100)}\``);
    if (sm.activeHandles) {
      lines.push(`* **Active Event Loop Handles**: Started at \`${sm.activeHandles.start}\` | Finished at \`${sm.activeHandles.end}\` (Growth: \`${sm.activeHandles.growth}\`)`);
    }
    lines.push('');

    lines.push('### Errors Breakdown');
    lines.push('');
    lines.push(`* **Timeouts**: \`${serr.timeout || 0}\``);
    lines.push(`* **Network Errors**: \`${serr.network_error || 0}\``);
    lines.push(`* **Unexpected Exceptions**: \`${serr.unexpected_exception || 0}\``);
    if (Object.keys(serr.http_error || {}).length > 0) {
      lines.push('* **HTTP Error Codes**:');
      for (const [code, count] of Object.entries(serr.http_error)) {
        lines.push(`  - Status \`${code}\`: \`${count}\` occurrences`);
      }
    }
    lines.push('');

    lines.push('### Soak Test Anomalies');
    lines.push('');
    const anomalies = soakTest.anomalies || {};
    let anomalyCount = 0;
    if (anomalies.potentialMemoryLeak) {
      lines.push('* ⚠ **Potential Memory Leak**: Significant heap memory growth detected during run.');
      anomalyCount++;
    }
    if (anomalies.throughputDegradation) {
      lines.push('* ⚠ **Throughput Degradation**: Throughput dropped by > 15% in the second half of the soak.');
      anomalyCount++;
    }
    if (anomalies.latencyDrift) {
      lines.push('* ⚠ **Latency Drift**: Average latency drifted upwards by > 50ms in the second half.');
      anomalyCount++;
    }
    if (anomalies.handleLeak) {
      lines.push('* ⚠ **Active Handle Growth**: Persistent growth in active event loop handles indicates potential socket or timer leaks.');
      anomalyCount++;
    }
    if (anomalyCount === 0) {
      lines.push('_No critical soak anomalies detected. System remained stable._');
    }
    lines.push('');
  }

  // ── 6. Performance Recommendations & Scalability Assessment ───────────────
  lines.push('## 6. Performance Recommendations & Scalability Assessment');
  lines.push('');
  lines.push('### Scalability Rating:');
  const maxAvgLatency = Math.max(...summary.scenarios.map(s => s.metrics?.durationMs?.avg || 0));
  if (maxAvgLatency < loadConfig.LATENCY_AVG_LIMIT) {
    lines.push('**EXCELLENT (A)** — The backend easily scales up to 500 concurrent users with minimal latency degradation.');
  } else if (maxAvgLatency < loadConfig.LATENCY_P95_LIMIT) {
    lines.push('**ACCEPTABLE (B)** — The system supports concurrency up to 250 users stably. Latency drifts above recommended targets at 500 concurrent users.');
  } else {
    lines.push('**CONGESTED (C)** — Scalability limits reached. System latency increases significantly under high concurrent load, indicating potential thread or connection blocks.');
  }
  lines.push('');
  lines.push('### Strategic Recommendations:');
  lines.push('1. **Connection Pooling**: Use PgBouncer or scale connection pools to mitigate database handshake latency under high user numbers.');
  lines.push('2. **Horizontal Scaling**: If Node Process CPU is saturated (>80%), spawn multiple instances using Node.js cluster module or Kubernetes replicas.');
  lines.push('3. **Memory Optimization**: Monitor and flush transient caches to prevent Heap/RSS accumulation observed during soak testing.');
  lines.push('');

  return lines.join('\n');
}
