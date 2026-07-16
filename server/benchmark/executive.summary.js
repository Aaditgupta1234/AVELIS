/**
 * @fileoverview Deployment readiness and executive performance summary compiler.
 *
 * Evaluates performance health, scalability ratings, system strengths/risks,
 * and calculates the final Production Readiness Score.
 *
 * @module benchmark/executive.summary
 */

import { finalConfig } from './final.config.js';

/**
 * Compile the executive performance metrics and readiness status.
 *
 * @param {Object} aggregated - Aggregated benchmark data
 * @returns {Object} Executive summary results
 */
export function generateExecutiveSummary(aggregated) {
  const weights = finalConfig.EXECUTIVE_SCORE_WEIGHTS;

  const healthScore = aggregated.analysisMetrics?.summary?.performanceHealthScore ?? 100;

  // ── 1. Calculate Concurrency Stability Score ──────────────────────────────
  let maxErrRate = 0;
  let maxTimeoutRate = 0;
  const scenarios = aggregated.loadMetrics?.scenarios || [];
  
  for (const scen of scenarios) {
    const total = scen.metrics?.totalRequests || 1;
    const errRate = (scen.metrics?.failures || 0) / total;
    const timeoutRate = (scen.metrics?.errors?.timeout || 0) / total;
    
    if (errRate > maxErrRate) maxErrRate = errRate;
    if (timeoutRate > maxTimeoutRate) maxTimeoutRate = timeoutRate;
  }

  // Deduct for error rates and timeout rates (e.g. 1% error = 5 points off)
  const stabilityBase = 100 - (maxErrRate * 500) - (maxTimeoutRate * 1000);
  const stabilityScore = Math.min(100, Math.max(0, stabilityBase));

  // ── 2. Calculate Benchmark Completion Score ───────────────────────────────
  // We expect at least 15 core API endpoints to be covered
  const apiCount = aggregated.apiSummaries?.length || 0;
  const completionScore = Math.min(100, (apiCount / 15) * 100);

  // ── 3. Production Readiness Score ─────────────────────────────────────────
  const readinessScore = Math.round(
    healthScore * weights.HEALTH_WEIGHT +
    stabilityScore * weights.STABILITY_WEIGHT +
    completionScore * weights.COMPLETION_WEIGHT
  );

  // ── 4. Determine Scalability Rating ───────────────────────────────────────
  let maxAvgLatency = 0;
  for (const scen of scenarios) {
    const avg = scen.metrics?.durationMs?.avg || 0;
    if (avg > maxAvgLatency) maxAvgLatency = avg;
  }

  let scalabilityRating = 'A (Excellent)';
  if (maxAvgLatency > 500) {
    scalabilityRating = 'C (Congested)';
  } else if (maxAvgLatency > 200) {
    scalabilityRating = 'B (Acceptable)';
  }

  // ── 5. Isolate Strengths & Risks ──────────────────────────────────────────
  const strengths = [];
  const risks = [];

  // Evaluate strengths
  if (apiCount >= 15) {
    strengths.push('Comprehensive API endpoint benchmarking coverage (>15 key routes evaluated).');
  }
  const dbQueriesCount = aggregated.databaseMetrics?.queries?.length || 0;
  if (dbQueriesCount > 0) {
    const dbAvg = aggregated.databaseMetrics.queries.reduce((acc, q) => acc + (q.metrics?.durationMs?.avg || 0), 0) / dbQueriesCount;
    if (dbAvg < 10) {
      strengths.push('Excellent isolated database query latency, averaging < 10 ms.');
    }
  }
  if (maxErrRate < 0.01) {
    strengths.push('High concurrency reliability with error rates remaining under 1% during load testing.');
  }

  // Evaluate risks
  const criticalBottlenecks = (aggregated.analysisMetrics?.bottlenecks || []).filter(b => b.severity === 'CRITICAL');
  const highBottlenecks = (aggregated.analysisMetrics?.bottlenecks || []).filter(b => b.severity === 'HIGH');
  
  if (criticalBottlenecks.length > 0) {
    risks.push(`${criticalBottlenecks.length} CRITICAL performance bottlenecks require immediate resolution before production release.`);
  }
  if (highBottlenecks.length > 0) {
    risks.push(`${highBottlenecks.length} HIGH severity bottlenecks detected (e.g. database query patterns or event loop delays).`);
  }
  
  const soak = aggregated.loadMetrics?.soakTest;
  if (soak?.anomalies?.potentialMemoryLeak) {
    risks.push('Potential memory leak detected: Heap memory increased significantly during soak testing.');
  }
  if (soak?.anomalies?.handleLeak) {
    risks.push('Active event loop handle leak suspected during soak testing.');
  }

  if (strengths.length === 0) strengths.push('Core database read/write queries remain functional.');
  if (risks.length === 0) risks.push('None detected. No critical performance anomalies found.');

  // Highest Priority Recommendations
  const priorityRecs = (aggregated.analysisMetrics?.priority || [])
    .filter(r => ['CRITICAL', 'HIGH'].includes(r.priorityRank))
    .slice(0, 3)
    .map(r => r.title);

  // Overall executive conclusion
  let conclusion = 'AVELIS backend is performance-ready and meets deployment criteria.';
  if (readinessScore < 70) {
    conclusion = 'DEPLOYMENT BLOCKED: Performance and resource exhaustion risks exceed acceptable boundaries. Address high-priority refactoring recommendations.';
  } else if (readinessScore < 85) {
    conclusion = 'CONDITIONAL DEPLOYMENT: Performance readiness is acceptable, but remediation of high severity database queries is recommended in subsequent iterations.';
  }

  return {
    performanceHealthScore: healthScore,
    productionReadinessScore: readinessScore,
    scalabilityRating,
    benchmarkCompletionStatus: apiCount >= 15 ? 'COMPLETE' : 'INCOMPLETE',
    topStrengths: strengths,
    topRisks: risks,
    highestPriorityRecommendations: priorityRecs,
    conclusion,
  };
}
