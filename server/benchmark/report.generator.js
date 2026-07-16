/**
 * @fileoverview Final report markdown generators.
 *
 * Compiles performance-summary.md and before-after.md for deployment readiness.
 *
 * @module benchmark/report.generator
 */

const fms = (ms) => (typeof ms === 'number' ? `${ms.toFixed(2)} ms` : 'N/A');
const frps = (rps) => (typeof rps === 'number' ? `${rps.toFixed(2)} RPS` : 'N/A');
const fpct = (pct) => (typeof pct === 'number' ? `${pct.toFixed(2)}%` : 'N/A');
const fmb = (bytes) => (typeof bytes === 'number' ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : 'N/A');

/**
 * Generate performance-summary.md content.
 *
 * @param {Object} aggregated - Aggregated benchmark data
 * @param {Object} execSummary - Executive summary details
 * @param {Object} comparison - Delta comparison metrics
 * @param {Object} metadata - Consolidated report metadata
 * @returns {string} Markdown content
 */
export function generatePerformanceSummary(aggregated, execSummary, comparison, metadata) {
  const env = aggregated.environment || {};
  const meta = aggregated.metadata || {};

  const lines = [
    '# AVELIS Final Performance Assessment Summary',
    '',
    `> **Run ID**: \`${metadata.runId}\` | **Generated**: ${metadata.generatedAt}`,
    `> **Schema Version**: ${metadata.schemaVersion} | **Report Version**: ${metadata.reportVersion} | **Phase**: ${metadata.phase}`,
    '',
    '## 1. Executive Summary',
    '',
    '| Parameter | Value |',
    '| --- | --- |',
    `| **Production Readiness Score** | **${execSummary.productionReadinessScore} / 100** |`,
    `| **Performance Health Score** | **${execSummary.performanceHealthScore} / 100** |`,
    `| **Overall Scalability Rating** | **${execSummary.scalabilityRating}** |`,
    `| **Benchmark Completion Status** | **${execSummary.benchmarkCompletionStatus}** |`,
    `| **Report Status** | **${metadata.reportStatus}** |`,
    `| **Total Bottlenecks Detected** | ${aggregated.analysisMetrics?.summary?.totalBottlenecks || 0} |`,
    `| **Critical Issues** | ${aggregated.analysisMetrics?.summary?.criticalIssues || 0} |`,
    `| **Historical Baseline Status** | ${comparison.status === 'comparison_completed' ? '✓ Baseline compared' : '⚠ Baseline missing'} |`,
    '',
    '### Executive Conclusion:',
    `> **${execSummary.conclusion}**`,
    '',
    '### Top Strengths:',
  ];

  for (const s of execSummary.topStrengths) {
    lines.push(`* ✓ ${s}`);
  }
  lines.push('');

  lines.push('### Top Performance Risks:');
  for (const r of execSummary.topRisks) {
    lines.push(`* ⚠ ${r}`);
  }
  lines.push('');

  // ── 2. Benchmark Sources ──────────────────────────────────────────────────
  lines.push('## 2. Benchmark Sources');
  lines.push('');
  lines.push('| File Name / Location | Source Phase | Schema | Run ID |');
  lines.push('| --- | --- | --- | --- |');

  for (const [key, src] of Object.entries(metadata.sources || {})) {
    lines.push(
      `| \`server/${src.artifact}\` | Phase ${src.phase} | Version ${src.schemaVersion} | \`${src.runId}\` |`
    );
  }
  lines.push('');

  // ── 3. Environment Metadata ────────────────────────────────────────────────
  lines.push('## 3. Environment Metadata');
  lines.push('');
  lines.push('| Metric | Target |');
  lines.push('| --- | --- |');
  lines.push(`| **Node.js Version** | ${env.nodeVersion || 'N/A'} |`);
  lines.push(`| **Prisma version** | ${env.prismaVersion || 'N/A'} |`);
  lines.push(`| **PostgreSQL version** | ${env.postgresVersion || 'N/A'} |`);
  lines.push(`| **Platform / Arch** | ${meta.platform || 'N/A'} / ${meta.arch || 'N/A'} (CPUs: ${meta.cpus || 'N/A'}) |`);
  lines.push('');

  // ── 4. API Benchmark Summary (Phase 13.5.6.2) ─────────────────────────────
  lines.push('## 4. API Benchmark Summary');
  lines.push('');
  lines.push('| API Route | RPS | Avg Latency | P95 | Success Rate |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const api of aggregated.apiSummaries || []) {
    lines.push(
      `| **${api.name}** | ${frps(api.metrics?.rps)} | ${fms(api.metrics?.durationMs?.avg)} | ${fms(api.metrics?.durationMs?.p95)} | ${fpct(api.metrics?.successRate * 100)} |`
    );
  }
  lines.push('');

  // ── 5. Database Benchmark Summary (Phase 13.5.6.3) ──────────────────────────
  lines.push('## 5. Database Benchmark Summary');
  lines.push('');
  lines.push('### Core Database Queries');
  lines.push('');
  lines.push('| Prisma Operation | Total Queries | Avg Latency | P95 | N+1 Pattern? | Duplicate? |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  for (const q of aggregated.databaseMetrics?.queries || []) {
    const isN1 = q.queryAnalysis?.potentialNPlusOne ? '⚠ YES' : '✓ NO';
    const hasDup = (q.queryAnalysis?.duplicateQueries?.length || 0) > 0 ? '⚠ YES' : '✓ NO';
    lines.push(
      `| **${q.name}** | ${q.metrics?.count || 0} | ${fms(q.metrics?.durationMs?.avg)} | ${fms(q.metrics?.durationMs?.p95)} | ${isN1} | ${hasDup} |`
    );
  }
  lines.push('');

  lines.push('### Isolated Transactions');
  lines.push('');
  lines.push('| Transaction | Success Rate | Avg Commit | P95 Commit |');
  lines.push('| --- | --- | --- | --- |');
  for (const tx of aggregated.databaseMetrics?.transactions || []) {
    lines.push(
      `| **${tx.name}** | ${fpct(tx.metrics?.successRate)} | ${fms(tx.metrics?.commitDurationMs?.avg)} | ${fms(tx.metrics?.commitDurationMs?.p95)} |`
    );
  }
  lines.push('');

  // ── 6. Load Test Summary (Phase 13.5.6.4) ──────────────────────────────────
  lines.push('## 6. Load Test Summary');
  lines.push('');
  lines.push('### Concurrency Load Scenarios');
  lines.push('');
  lines.push('| Concurrency | Total Requests | RPS | Avg Latency | P95 | Error Rate | Timeout Rate | Peak Process CPU |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const scen of aggregated.loadMetrics?.scenarios || []) {
    const total = scen.metrics?.totalRequests || 1;
    const errRate = (scen.metrics?.failures || 0) / total;
    const timeoutRate = (scen.metrics?.errors?.timeout || 0) / total;
    lines.push(
      `| **${scen.concurrency} Users** | ${scen.metrics?.totalRequests} | ${frps(scen.metrics?.rps)} | ${fms(scen.metrics?.durationMs?.avg)} | ${fms(scen.metrics?.durationMs?.p95)} | ${fpct(errRate * 100)} | ${fpct(timeoutRate * 100)} | ${fpct(scen.metrics?.cpuFraction * 100)} |`
    );
  }
  lines.push('');

  const soak = aggregated.loadMetrics?.soakTest;
  if (soak) {
    lines.push('### Soak Test Stability Analysis');
    lines.push('');
    lines.push(`* **Duration**: \`${soak.durationMs} ms\``);
    lines.push(`* **Heap Growth**: \`${fmb(soak.metrics?.memory?.heapGrowthBytes)}\` (Start: \`${fmb(soak.metrics?.memory?.heapUsedStart)}\` | End: \`${fmb(soak.metrics?.memory?.heapUsedEnd)}\`)`);
    lines.push(`* **RSS Growth**: \`${fmb(soak.metrics?.memory?.rssGrowthBytes)}\` (Start: \`${fmb(soak.metrics?.memory?.rssStart)}\` | End: \`${fmb(soak.metrics?.memory?.rssEnd)}\`)`);
    if (soak.metrics?.activeHandles) {
      lines.push(`* **Active Event Loop Handles**: \`${soak.metrics.activeHandles.start} -> ${soak.metrics.activeHandles.end}\` (Growth: \`${soak.metrics.activeHandles.growth}\`)`);
    }
    lines.push(`* **Throughput Degradation**: \`${fpct(soak.metrics?.trends?.throughputDegradationPercent)}\` (First Half: \`${soak.metrics?.trends?.firstHalfRps.toFixed(2)} RPS\` | Second Half: \`${soak.metrics?.trends?.secondHalfRps.toFixed(2)} RPS\`)`);
    lines.push(`* **Latency Drift**: \`${fms(soak.metrics?.trends?.latencyDriftMs)}\``);
    lines.push('');
  }

  // ── 7. Bottleneck Analysis Summary (Phase 13.5.6.5) ────────────────────────
  lines.push('## 7. Bottleneck Analysis Summary');
  lines.push('');
  lines.push('| ID | Component | Category | Severity | Confidence | Confidence Reason |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  for (const b of aggregated.analysisMetrics?.bottlenecks || []) {
    lines.push(
      `| \`${b.id}\` | **${b.component}** | ${b.category} | \`${b.severity}\` | ${b.confidence} | ${b.confidenceReason || ''} |`
    );
  }
  lines.push('');

  // ── 8. Comparative Analysis ───────────────────────────────────────────────
  lines.push('## 8. Comparative Analysis');
  lines.push('');
  if (comparison.status === 'baseline_unavailable') {
    lines.push('_Comparative analysis with historical baseline is unavailable for this run._');
  } else {
    lines.push('### Core Performance Improvements');
    if (comparison.improvements?.length > 0) {
      lines.push('| Metric | Current | Baseline | Delta |');
      lines.push('| --- | --- | --- | --- |');
      for (const imp of comparison.improvements) {
        lines.push(`| ${imp.metric} | \`${imp.current.toFixed(2)}\` | \`${imp.baseline.toFixed(2)}\` | \`${imp.changePercent.toFixed(2)}%\` |`);
      }
    } else {
      lines.push('_No metric improvements detected relative to historical baseline._');
    }
    lines.push('');

    lines.push('### Performance Regressions');
    if (comparison.regressions?.length > 0) {
      lines.push('| Metric | Current | Baseline | Delta |');
      lines.push('| --- | --- | --- | --- |');
      for (const reg of comparison.regressions) {
        lines.push(`| ⚠ ${reg.metric} | \`${reg.current.toFixed(2)}\` | \`${reg.baseline.toFixed(2)}\` | \`+${reg.changePercent.toFixed(2)}%\` |`);
      }
    } else {
      lines.push('_No metric regressions detected relative to historical baseline._');
    }
    lines.push('');

    lines.push('### Stable Metrics');
    if (comparison.stable?.length > 0) {
      lines.push('| Metric | Current | Baseline | Delta |');
      lines.push('| --- | --- | --- | --- |');
      for (const stb of comparison.stable) {
        lines.push(`| ${stb.metric} | \`${stb.current.toFixed(2)}\` | \`${stb.baseline.toFixed(2)}\` | \`${stb.changePercent.toFixed(2)}%\` |`);
      }
    } else {
      lines.push('_No stable metrics recorded._');
    }
  }
  lines.push('');

  // ── 9/10/11. Health, Readiness, and Recommendation Matrices ───────────────
  lines.push('## 9. Performance Health Assessment');
  lines.push('');
  lines.push(`The overall performance health of the system is scored at **${execSummary.performanceHealthScore} / 100** based on the severity of active bottlenecks.`);
  lines.push('');

  lines.push('## 10. Production Readiness Assessment');
  lines.push('');
  lines.push(`Deployability readiness is calculated at **${execSummary.productionReadinessScore} / 100**.`);
  if (execSummary.productionReadinessScore >= 85) {
    lines.push('**RECOMMENDED FOR PRODUCTION RELEASE**: The system meets all stability and resource constraints.');
  } else if (execSummary.productionReadinessScore >= 70) {
    lines.push('**CONDITIONAL RELEASE**: Suitable for testing/staging environments. Address critical risks prior to final production release.');
  } else {
    lines.push('**DEPLOYMENT BLOCKED**: The backend has critical database N+1 loop structures or memory leaks.');
  }
  lines.push('');

  lines.push('## 11. Recommendation Matrix');
  lines.push('');
  lines.push('| Priority Rank | Score | Recommendation | Performance Impact | Effort | Risk | relatedBottlenecks |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const rec of aggregated.analysisMetrics?.priority || []) {
    const botsStr = rec.relatedBottlenecks.map(id => `\`${id}\``).join(', ') || 'N/A';
    lines.push(
      `| \`${rec.priorityRank}\` | \`${rec.score.toFixed(2)}\` | **${rec.title}**<br>_${rec.description}_ | ${rec.estimatedPerformanceImpact} | ${rec.estimatedImplementationEffort} | ${rec.riskLevel} | ${botsStr} |`
    );
  }
  lines.push('');

  // ── 12. Future Optimization Opportunities ──────────────────────────────────
  lines.push('## 12. Future Optimization Opportunities');
  lines.push('');
  lines.push('1. **Dataloader Batching**: Implement Dataloader utility layers in the Node service tier to coalesce isolated child reads.');
  lines.push('2. **Redis Distributed Caching**: Offload catalog book search queries to Redis cluster setups.');
  lines.push('3. **PgBouncer Scaling**: Implement connection proxies to scale past connection limits under load.');
  lines.push('');

  // ── 13. Final Conclusion ──────────────────────────────────────────────────
  lines.push('## 13. Final Conclusion');
  lines.push('');
  lines.push(`Deployability readiness assessment complete. **Conclusion: ${execSummary.conclusion}**`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate before-after.md content.
 *
 * @param {Object} comparison - Delta comparison metrics
 * @returns {string} Markdown content
 */
export function generateBeforeAfterReport(comparison) {
  const lines = [
    '# AVELIS Performance Before/After Assessment Report',
    '',
  ];

  if (comparison.status === 'baseline_unavailable') {
    lines.push('## Historical Baseline Unavailable');
    lines.push('');
    lines.push('Historical before/after comparisons are not possible because no previous benchmark runs exist in history.');
    lines.push('To run comparisons, ensure at least one historical final report summary is archived under `benchmark/final/history/.`');
    return lines.join('\n');
  }

  lines.push('## 1. Summary of Changes');
  lines.push('');
  lines.push(`* **Improvements**: \`${comparison.improvements.length}\` metrics improved.`);
  lines.push(`* **Regressions**: \`${comparison.regressions.length}\` metrics regressed.`);
  lines.push(`* **Stable Metrics**: \`${comparison.stable.length}\` metrics stayed stable.`);
  lines.push('');

  // Improvements
  lines.push('## 2. Core Improvements');
  lines.push('');
  if (comparison.improvements.length > 0) {
    lines.push('| Metric Name | Baseline Value | Current Value | Delta Percent |');
    lines.push('| --- | --- | --- | --- |');
    for (const r of comparison.improvements) {
      lines.push(`| **${r.metric}** | \`${r.baseline.toFixed(2)}\` | \`${r.current.toFixed(2)}\` | \`${r.changePercent.toFixed(2)}%\` |`);
    }
  } else {
    lines.push('_No metric improvements detected relative to historical baseline._');
  }
  lines.push('');

  // Regressions
  lines.push('## 3. Performance Regressions');
  lines.push('');
  if (comparison.regressions.length > 0) {
    lines.push('| Metric Name | Baseline Value | Current Value | Delta Percent |');
    lines.push('| --- | --- | --- | --- |');
    for (const r of comparison.regressions) {
      lines.push(`| ⚠ **${r.metric}** | \`${r.baseline.toFixed(2)}\` | \`${r.current.toFixed(2)}\` | \`+${r.changePercent.toFixed(2)}%\` |`);
    }
  } else {
    lines.push('_No regressions detected relative to historical baseline._');
  }
  lines.push('');

  // Stable
  lines.push('## 4. Stable Metrics');
  lines.push('');
  if (comparison.stable.length > 0) {
    lines.push('| Metric Name | Baseline Value | Current Value | Delta Percent |');
    lines.push('| --- | --- | --- | --- |');
    for (const r of comparison.stable) {
      lines.push(`| **${r.metric}** | \`${r.baseline.toFixed(2)}\` | \`${r.current.toFixed(2)}\` | \`${r.changePercent.toFixed(2)}%\` |`);
    }
  } else {
    lines.push('_No stable metrics recorded._');
  }
  lines.push('');

  return lines.join('\n');
}
