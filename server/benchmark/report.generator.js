/**
 * @fileoverview Report generator for Phase 13.5.6.5 — Bottleneck Analysis.
 *
 * Compiles detected bottlenecks, priorities, risk assessments, and matrices
 * into a production-ready engineering Markdown report.
 *
 * @module benchmark/report.generator
 */

const fms = (ms) => (typeof ms === 'number' ? `${ms.toFixed(2)} ms` : 'N/A');
const fpct = (pct) => (typeof pct === 'number' ? `${pct.toFixed(2)}%` : 'N/A');
const fmb = (bytes) => (typeof bytes === 'number' ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : 'N/A');

/**
 * Generate report.md contents.
 *
 * @param {Object} summary - Bottleneck summary.json
 * @param {Array} bottlenecks - List of bottlenecks
 * @param {Array} recommendations - List of ranked recommendations
 * @returns {string} Compiled report.md contents
 */
export function generateMarkdownReport(summary, bottlenecks, recommendations) {
  const env = summary.environment || {};
  const meta = summary.metadata || {};

  const lines = [
    '# AVELIS Performance Bottleneck Analysis Report',
    '',
    `> **Run ID**: \`${summary.runId || 'N/A'}\` | **Generated**: ${summary.generatedAt || new Date().toISOString()}`,
    `> **Schema Version**: ${summary.schemaVersion || '1.0'} | **Phase**: ${summary.phase || '13.5.6.5'}`,
    '',
    '## 1. Executive Summary',
    '',
    '| Parameter | Value |',
    '| --- | --- |',
    `| **Analysis Status** | **${summary.analysisStatus || 'PASS'}** |`,
    `| **Overall Performance Health Score** | **${summary.performanceHealthScore || 100} / 100** |`,
    `| **Overall Scalability Rating** | **${summary.performanceHealthScore >= 85 ? 'A (Excellent)' : summary.performanceHealthScore >= 70 ? 'B (Acceptable)' : 'C (Congested)'}** |`,
    `| **Total Bottlenecks Detected** | ${summary.totalBottlenecks || 0} |`,
    `| **Critical Issues** | ${summary.criticalIssues || 0} |`,
    `| **High Priority Recommendations** | ${summary.highPriorityRecommendations || 0} |`,
    `| **Analysis Duration** | ${fms(summary.durationMs)} |`,
    '',
  ];

  // ── 2. Benchmark Sources ──────────────────────────────────────────────────
  lines.push('## 2. Benchmark Sources');
  lines.push('');
  lines.push('The following performance artifacts were parsed and analyzed during this run:');
  lines.push('');
  for (const art of summary.analyzedArtifacts || []) {
    lines.push(`* \`${art}\``);
  }
  lines.push('');

  // ── 3. Environment Information ─────────────────────────────────────────────
  lines.push('## 3. Environment Information');
  lines.push('');
  lines.push('| Environment Key | Configured Target / Version |');
  lines.push('| --- | --- |');
  lines.push(`| **Node.js version** | ${env.nodeVersion || 'N/A'} |`);
  lines.push(`| **Prisma version** | ${env.prismaVersion || 'N/A'} |`);
  lines.push(`| **PostgreSQL version** | ${env.postgresVersion || 'N/A'} |`);
  lines.push(`| **Platform / Arch** | ${meta.platform || 'N/A'} / ${meta.arch || 'N/A'} |`);
  lines.push('');

  // ── 4. Top Bottlenecks ────────────────────────────────────────────────────
  lines.push('## 4. Top Bottlenecks');
  lines.push('');
  lines.push('| ID | Component | Category | Severity | Confidence | Confidence Reason | Trace Source |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');

  const criticalAndHigh = bottlenecks.filter(b => ['CRITICAL', 'HIGH'].includes(b.severity));
  const otherBottles = bottlenecks.filter(b => !['CRITICAL', 'HIGH'].includes(b.severity));
  const sortedBottlenecks = [...criticalAndHigh, ...otherBottles];

  for (const b of sortedBottlenecks) {
    const srcRef = b.source ? `Phase ${b.source.phase} (${b.source.artifact}: ${b.source.metric})` : 'N/A';
    lines.push(
      `| \`${b.id}\` | **${b.component}** | ${b.category} | \`${b.severity}\` | ${b.confidence} | ${b.confidenceReason || ''} | ${srcRef} |`
    );
  }
  lines.push('');

  // Categorized Bottlenecks
  const readBottles = bottlenecks.filter(b => b.category === 'Read');
  const writeBottles = bottlenecks.filter(b => b.category === 'Write');
  const dbBottles = bottlenecks.filter(b => b.category === 'Database');
  const txBottles = bottlenecks.filter(b => b.category === 'Transaction');

  lines.push('### Read Bottlenecks');
  if (readBottles.length > 0) {
    for (const b of readBottles) {
      lines.push(`* **${b.component}** (Severity: \`${b.severity}\`): Average latency recorded at \`${b.supportingMetrics?.averageLatencyMs?.toFixed(2)} ms\`.`);
    }
  } else {
    lines.push('_No read latency bottlenecks detected._');
  }
  lines.push('');

  lines.push('### Write Bottlenecks');
  if (writeBottles.length > 0) {
    for (const b of writeBottles) {
      lines.push(`* **${b.component}** (Severity: \`${b.severity}\`): Average latency recorded at \`${b.supportingMetrics?.averageLatencyMs?.toFixed(2)} ms\`.`);
    }
  } else {
    lines.push('_No write latency bottlenecks detected._');
  }
  lines.push('');

  lines.push('### Database Bottlenecks');
  if (dbBottles.length > 0) {
    for (const b of dbBottles) {
      const detail = b.supportingMetrics?.averageQueryMs
        ? `Avg query duration: \`${b.supportingMetrics.averageQueryMs.toFixed(2)} ms\``
        : b.supportingMetrics?.type
        ? `Anomaly Type: \`${b.supportingMetrics.type}\``
        : `Duplicate count: \`${b.supportingMetrics?.duplicateQueriesCount}\``;
      lines.push(`* **${b.component}** (Severity: \`${b.severity}\`): ${detail}.`);
    }
  } else {
    lines.push('_No database query bottlenecks detected._');
  }
  lines.push('');

  lines.push('### Transaction Bottlenecks');
  if (txBottles.length > 0) {
    for (const b of txBottles) {
      lines.push(`* **${b.component}** (Severity: \`${b.severity}\`): Avg commit duration: \`${b.supportingMetrics?.averageCommitMs?.toFixed(2)} ms\` (Success: \`${b.supportingMetrics?.successRatePercent}%\`).`);
    }
  } else {
    lines.push('_No transaction bottlenecks detected._');
  }
  lines.push('');

  // ── 5. System Resources Analysis ──────────────────────────────────────────
  lines.push('## 5. System Resources Analysis');
  lines.push('');

  const cpuBottles = bottlenecks.filter(b => b.category === 'CPU-bound');
  const memBottles = bottlenecks.filter(b => b.category === 'Memory-bound');
  const poolBottles = bottlenecks.filter(b => b.category === 'Connection Pool');
  const netBottles = bottlenecks.filter(b => b.category === 'Network');

  lines.push('### CPU Analysis');
  if (cpuBottles.length > 0) {
    for (const b of cpuBottles) {
      lines.push(`* ⚠ **${b.component}**: Exceeded target limit. Peak CPU Fraction: \`${b.supportingMetrics?.cpuPercent?.toFixed(2)}%\`.`);
    }
  } else {
    lines.push('_Node Process CPU usage remained stable and within safety limits under load._');
  }
  lines.push('');

  lines.push('### Memory Analysis');
  if (memBottles.length > 0) {
    for (const b of memBottles) {
      const detail = b.supportingMetrics?.heapGrowthBytes
        ? `Heap growth recorded: \`${fmb(b.supportingMetrics.heapGrowthBytes)}\``
        : `Handle leak count growth: \`${b.supportingMetrics?.growth}\``;
      lines.push(`* ⚠ **${b.component}**: ${detail}.`);
    }
  } else {
    lines.push('_No critical memory leaks or handle accumulation detected during soak testing._');
  }
  lines.push('');

  lines.push('### Connection Pool Analysis');
  if (poolBottles.length > 0) {
    for (const b of poolBottles) {
      lines.push(`* ⚠ **${b.component}**: Saturation warning. Active database connections count: \`${b.supportingMetrics?.activeConnections}\`.`);
    }
  } else {
    lines.push('_Database connection pool capacity remained within safe parameters._');
  }
  lines.push('');

  lines.push('### Event Loop Analysis');
  const loopDelay = bottlenecks.find(b => b.component === 'Node Event Loop');
  if (loopDelay) {
    lines.push(`* ⚠ **Node Event Loop Delay**: Event loop delay spikes recorded up to \`${fms(loopDelay.supportingMetrics?.eventLoopDelayMs)}\`, suggesting single-threaded blockages.`);
  } else {
    lines.push('_Event loop delay remained low, ensuring quick asynchronous task processing._');
  }
  lines.push('');

  // ── 6. Recommendation Matrix ──────────────────────────────────────────────
  lines.push('## 6. Recommendation Matrix');
  lines.push('');
  lines.push('| Recommendation | Expected Benefit | Effort | Impact | Risk | Related Bottlenecks |');
  lines.push('| --- | --- | --- | --- | --- | --- |');

  for (const rec of recommendations) {
    const botsStr = rec.relatedBottlenecks.map(id => `\`${id}\``).join(', ') || 'N/A';
    lines.push(
      `| **${rec.title}**<br>_${rec.description}_ | ${rec.expectedBenefit} | ${rec.estimatedImplementationEffort} | ${rec.estimatedPerformanceImpact} | ${rec.riskLevel} | ${botsStr} |`
    );
  }
  lines.push('');

  // ── 7. Priority Matrix ────────────────────────────────────────────────────
  lines.push('## 7. Priority Matrix');
  lines.push('');
  lines.push('| Rank | Score | Recommendation | Expected Benefit | Risk |');
  lines.push('| --- | --- | --- | --- | --- |');

  for (const rec of recommendations) {
    lines.push(
      `| \`${rec.priorityRank}\` | \`${rec.score.toFixed(2)}\` | **${rec.title}** | ${rec.expectedBenefit} | ${rec.riskLevel} |`
    );
  }
  lines.push('');

  // ── 8. Risk Assessment ────────────────────────────────────────────────────
  lines.push('## 8. Risk Assessment');
  lines.push('');
  lines.push('Analyzing optimization safety and refactoring risks:');
  lines.push('');
  const highRiskRecs = recommendations.filter(r => r.riskLevel === 'HIGH');
  const medRiskRecs = recommendations.filter(r => r.riskLevel === 'MEDIUM');

  if (highRiskRecs.length > 0) {
    lines.push('### High Risk Optimizations');
    for (const r of highRiskRecs) {
      lines.push(`* **${r.title}**: Refactoring carries high risk of logical regression. Ensure exhaustive unit testing.`);
    }
  }
  if (medRiskRecs.length > 0) {
    lines.push('### Medium Risk Optimizations');
    for (const r of medRiskRecs) {
      lines.push(`* **${r.title}**: Modifying data fetch paths requires regression testing of active borrowing queues.`);
    }
  }
  if (highRiskRecs.length === 0 && medRiskRecs.length === 0) {
    lines.push('_All suggested recommendations are Low Risk and safe to configure._');
  }
  lines.push('');

  // ── 9. Future Optimization Opportunities ──────────────────────────────────
  lines.push('## 9. Future Optimization Opportunities');
  lines.push('');
  lines.push('1. **Connection Pooling Proxy**: Set up PgBouncer to manage high PostgreSQL client connections efficiently.');
  lines.push('2. **GraphQL or Restructured Schemas**: Reduce join overhead by restructuring large relation lists.');
  lines.push('3. **Query Batching Utilities**: Integrate dataloader patterns in GraphQL/Prisma middleware to completely isolate N+1 lookups.');
  lines.push('');

  return lines.join('\n');
}
