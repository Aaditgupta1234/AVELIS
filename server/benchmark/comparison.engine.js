/**
 * @fileoverview Performance comparison engine.
 *
 * Compares current benchmark statistics with a historical baseline,
 * categorizing them into improvements, regressions, and stable metrics.
 *
 * @module benchmark/comparison.engine
 */

/**
 * Compare current metrics with a baseline summary.
 *
 * @param {Object} current - Current performance-summary structure
 * @param {Object|null} baseline - Baseline performance-summary from history
 * @param {Array} warnings - Warning collector
 * @returns {Object} Comparison report results
 */
export function generateComparisons(current, baseline, warnings) {
  if (!baseline) {
    warnings.push({
      code: 'MISSING_BASELINE',
      severity: 'INFO',
      message: 'No previous performance-summary.json found in history. Historical delta comparisons are disabled.',
      context: { comparisonEnabled: false },
    });

    return {
      status: 'baseline_unavailable',
      message: 'Historical comparisons are not possible because no previous run baseline was found.',
      improvements: [],
      regressions: [],
      stable: [],
    };
  }

  const improvements = [];
  const regressions = [];
  const stable = [];

  const compareMetric = (name, currVal, baseVal, lowerIsBetter = true, thresholdPct = 5) => {
    if (typeof currVal !== 'number' || typeof baseVal !== 'number' || baseVal === 0) {
      return;
    }

    const diff = currVal - baseVal;
    const diffPct = (diff / baseVal) * 100;

    const record = {
      metric: name,
      current: currVal,
      baseline: baseVal,
      changePercent: diffPct,
    };

    if (Math.abs(diffPct) <= thresholdPct) {
      stable.push(record);
    } else {
      const isImprovement = lowerIsBetter ? diffPct < 0 : diffPct > 0;
      if (isImprovement) {
        improvements.push(record);
      } else {
        regressions.push(record);
      }
    }
  };

  // ── 1. Compare Health and Readiness Scores ────────────────────────────────
  const currHealth = current.analysisSummary?.performanceHealthScore;
  const baseHealth = baseline.analysisSummary?.performanceHealthScore;
  compareMetric('Performance Health Score', currHealth, baseHealth, false);

  const currReadiness = current.executiveSummary?.productionReadinessScore;
  const baseReadiness = baseline.executiveSummary?.productionReadinessScore;
  compareMetric('Production Readiness Score', currReadiness, baseReadiness, false);

  // ── 2. Compare API Latencies ──────────────────────────────────────────────
  for (const api of current.apiSummaries || []) {
    const baseApi = (baseline.apiSummaries || []).find((a) => a.name === api.name);
    if (baseApi) {
      const currAvg = api.metrics?.durationMs?.avg;
      const baseAvg = baseApi.metrics?.durationMs?.avg;
      compareMetric(`API ${api.name} Avg Latency`, currAvg, baseAvg, true);
    }
  }

  // ── 3. Compare Database Query Latencies ────────────────────────────────────
  for (const q of current.databaseMetrics?.queries || []) {
    const baseQ = (baseline.databaseMetrics?.queries || []).find((x) => x.name === q.name);
    if (baseQ) {
      const currAvg = q.metrics?.durationMs?.avg;
      const baseAvg = baseQ.metrics?.durationMs?.avg;
      compareMetric(`Prisma Query ${q.name} Avg Latency`, currAvg, baseAvg, true);
    }
  }

  // ── 4. Compare Concurrency Load Metrics ───────────────────────────────────
  for (const scen of current.loadMetrics?.scenarios || []) {
    const baseScen = (baseline.loadMetrics?.scenarios || []).find((s) => s.concurrency === scen.concurrency);
    if (baseScen) {
      const currRps = scen.metrics?.rps;
      const baseRps = baseScen.metrics?.rps;
      compareMetric(`Load Scen ${scen.concurrency} Users RPS`, currRps, baseRps, false);

      const currAvg = scen.metrics?.durationMs?.avg;
      const baseAvg = baseScen.metrics?.durationMs?.avg;
      compareMetric(`Load Scen ${scen.concurrency} Users Avg Latency`, currAvg, baseAvg, true);
    }
  }

  // ── 5. Compare Soak Test Trends ───────────────────────────────────────────
  const currSoakDegradation = current.loadMetrics?.soakTest?.metrics?.trends?.throughputDegradationPercent;
  const baseSoakDegradation = baseline.loadMetrics?.soakTest?.metrics?.trends?.throughputDegradationPercent;
  compareMetric('Soak Test Throughput Degradation %', currSoakDegradation, baseSoakDegradation, true);

  const currSoakDrift = current.loadMetrics?.soakTest?.metrics?.trends?.latencyDriftMs;
  const baseSoakDrift = baseline.loadMetrics?.soakTest?.metrics?.trends?.latencyDriftMs;
  compareMetric('Soak Test Latency Drift Ms', currSoakDrift, baseSoakDrift, true);

  return {
    status: 'comparison_completed',
    improvements,
    regressions,
    stable,
  };
}
