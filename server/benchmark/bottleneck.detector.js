/**
 * @fileoverview Performance bottleneck detector.
 *
 * Scans normalized benchmark metrics, applies severity configurations,
 * assigns unique tracking IDs, and adds traceability source audit metadata.
 *
 * @module benchmark/bottleneck.detector
 */

import { analysisConfig } from './analysis.config.js';

/**
 * Determine severity based on configured thresholds.
 *
 * @param {number} value - Measured value
 * @param {Object} limits - Configured thresholds per level
 * @param {string} metricKey - Key of the metric
 * @returns {string} Severity level (CRITICAL, HIGH, MEDIUM, LOW)
 */
function getSeverity(value, limits, metricKey) {
  if (value > (limits.CRITICAL[metricKey] ?? Infinity)) return 'CRITICAL';
  if (value > (limits.HIGH[metricKey] ?? Infinity)) return 'HIGH';
  if (value > (limits.MEDIUM[metricKey] ?? Infinity)) return 'MEDIUM';
  return 'LOW';
}

/**
 * Scan aggregated metrics and identify bottlenecks.
 *
 * @param {Object} aggregated - Aggregated and normalized benchmark data
 * @returns {Array} List of identified bottlenecks
 */
export function detectBottlenecks(aggregated) {
  const bottlenecks = [];
  let counter = 0;
  const nextId = () => `BTL-${String(++counter).padStart(3, '0')}`;

  const thresholds = analysisConfig.BOTTLENECK_THRESHOLDS;
  const sevLimits = analysisConfig.SEVERITY_THRESHOLDS;

  // ── 1. API Latency Bottlenecks (Phase 13.5.6.2) ───────────────────────────
  for (const api of aggregated.apiMetrics || []) {
    const avg = api.metrics.durationMs?.avg || 0;
    if (avg > thresholds.API_LATENCY_LIMIT) {
      const isRead = ['list', 'get', 'search', 'mine', 'book', 'active', 'history'].some((key) =>
        api.name.toLowerCase().includes(key)
      );

      const severity = getSeverity(avg, sevLimits, 'API_LATENCY');

      bottlenecks.push({
        id: nextId(),
        component: api.name,
        category: isRead ? 'Read' : 'Write',
        severity,
        confidence: 'HIGH',
        confidenceReason: 'Observed consistently high response latency in API benchmarking.',
        supportingMetrics: {
          averageLatencyMs: avg,
          p95LatencyMs: api.metrics.durationMs?.p95,
          rps: api.metrics.rps,
        },
        source: {
          phase: '13.5.6.2',
          artifact: 'summary.json',
          metric: api.name,
        },
      });
    }
  }

  // ── 2. Database Queries Latency & N+1 Patterns (Phase 13.5.6.3) ───────────
  for (const q of aggregated.databaseMetrics.queries || []) {
    const avg = q.metrics?.durationMs?.avg || 0;
    
    // Check Latency
    if (avg > thresholds.DB_LATENCY_LIMIT) {
      const severity = getSeverity(avg, sevLimits, 'DB_LATENCY');
      bottlenecks.push({
        id: nextId(),
        component: `Prisma Query: ${q.name}`,
        category: 'Database',
        severity,
        confidence: 'HIGH',
        confidenceReason: 'Measured high latency directly in isolated database query bench.',
        supportingMetrics: {
          averageQueryMs: avg,
          p95QueryMs: q.metrics?.durationMs?.p95,
        },
        source: {
          phase: '13.5.6.3',
          artifact: 'query-summary.json',
          metric: q.name,
        },
      });
    }

    // Check N+1 query patterns
    if (q.queryAnalysis?.potentialNPlusOne) {
      bottlenecks.push({
        id: nextId(),
        component: q.name,
        category: 'Database',
        severity: 'HIGH',
        confidence: 'HIGH',
        confidenceReason: 'High database read repetition count detected within a single endpoint context.',
        supportingMetrics: {
          totalQueriesRun: q.queryAnalysis.totalQueries,
          uniqueQueries: q.queryAnalysis.totalQueries - (q.queryAnalysis.duplicateQueries?.length || 0),
        },
        source: {
          phase: '13.5.6.3',
          artifact: 'query-summary.json',
          metric: `${q.name} query count`,
        },
      });
    }

    // Check duplicate queries
    if (q.queryAnalysis?.duplicateQueries?.length > 0) {
      bottlenecks.push({
        id: nextId(),
        component: q.name,
        category: 'Database',
        severity: 'MEDIUM',
        confidence: 'HIGH',
        confidenceReason: 'Identified identical query structures executed multiple times in sequence.',
        supportingMetrics: {
          duplicateQueriesCount: q.queryAnalysis.duplicateQueries.length,
        },
        source: {
          phase: '13.5.6.3',
          artifact: 'query-summary.json',
          metric: `${q.name} duplicate count`,
        },
      });
    }
  }

  // ── 3. Database Transactions Latency (Phase 13.5.6.3) ──────────────────────
  for (const tx of aggregated.databaseMetrics.transactions || []) {
    const avg = tx.metrics?.commitDurationMs?.avg || 0;
    if (avg > thresholds.DB_TX_LIMIT) {
      const severity = getSeverity(avg, sevLimits, 'DB_TX');
      bottlenecks.push({
        id: nextId(),
        component: `Transaction: ${tx.name}`,
        category: 'Transaction',
        severity,
        confidence: 'HIGH',
        confidenceReason: 'Measured high commit latency in database transaction benchmark.',
        supportingMetrics: {
          averageCommitMs: avg,
          p95CommitMs: tx.metrics?.commitDurationMs?.p95,
          successRatePercent: tx.metrics?.successRate,
        },
        source: {
          phase: '13.5.6.3',
          artifact: 'transactions.json',
          metric: tx.name,
        },
      });
    }
  }

  // ── 4. Prisma Slow Queries (Phase 13.5.6.3 slow-queries) ───────────────────
  for (const f of aggregated.databaseMetrics.slowQueries || []) {
    // Only process non-mock queries
    if (f.queryName?.includes('mock') || f.fingerprint?.includes('mock')) {
      continue;
    }
    bottlenecks.push({
      id: nextId(),
      component: `Prisma: ${f.queryName}`,
      category: 'Database',
      severity: f.severity || 'MEDIUM',
      confidence: 'HIGH',
      confidenceReason: `Flagged by slow query anomaly detector: ${f.type}.`,
      supportingMetrics: {
        type: f.type,
        duration: f.duration || 'N/A',
        resultSize: f.resultSize || 'N/A',
      },
      source: {
        phase: '13.5.6.3',
        artifact: 'slow-queries.json',
        metric: f.queryName,
      },
    });
  }

  // ── 5. Load Testing Concurrency Scenarios & Resource Constraints ───────────
  for (const scen of aggregated.loadMetrics.scenarios || []) {
    const errorRate = scen.metrics?.failures / (scen.metrics?.totalRequests || 1);
    const timeoutRate = (scen.metrics?.errors?.timeout || 0) / (scen.metrics?.totalRequests || 1);

    if (errorRate > thresholds.LOAD_ERROR_LIMIT) {
      const severity = getSeverity(errorRate, sevLimits, 'ERROR_RATE');
      bottlenecks.push({
        id: nextId(),
        component: `Backend Concurrency: ${scen.concurrency} Users`,
        category: 'Network',
        severity,
        confidence: 'HIGH',
        confidenceReason: 'High HTTP connection failure rate observed during concurrent load tests.',
        supportingMetrics: {
          concurrency: scen.concurrency,
          errorRatePercent: errorRate * 100,
        },
        source: {
          phase: '13.5.6.4',
          artifact: 'summary.json',
          metric: `${scen.concurrency} users failure rate`,
        },
      });
    }

    if (timeoutRate > thresholds.LOAD_TIMEOUT_LIMIT) {
      const severity = getSeverity(timeoutRate, sevLimits, 'TIMEOUT_RATE');
      bottlenecks.push({
        id: nextId(),
        component: `Backend Concurrency: ${scen.concurrency} Users`,
        category: 'Network',
        severity,
        confidence: 'HIGH',
        confidenceReason: 'Request timeouts exceeded limit under heavy concurrent user stress.',
        supportingMetrics: {
          concurrency: scen.concurrency,
          timeoutRatePercent: timeoutRate * 100,
        },
        source: {
          phase: '13.5.6.4',
          artifact: 'summary.json',
          metric: `${scen.concurrency} users timeout rate`,
        },
      });
    }

    const cpu = scen.metrics?.cpuFraction || 0;
    if (cpu > thresholds.CPU_LIMIT) {
      const severity = getSeverity(cpu, sevLimits, 'CPU_FRACTION');
      bottlenecks.push({
        id: nextId(),
        component: 'Node Process CPU',
        category: 'CPU-bound',
        severity,
        confidence: 'HIGH',
        confidenceReason: 'Node process CPU utilization exceeded baseline parameters.',
        supportingMetrics: {
          concurrency: scen.concurrency,
          cpuPercent: cpu * 100,
        },
        source: {
          phase: '13.5.6.4',
          artifact: 'summary.json',
          metric: 'Node Process CPU',
        },
      });
    }
  }

  // Event loop delay
  for (const entry of aggregated.loadMetrics.stabilityTrace || []) {
    if (entry.eventLoopDelayMs > thresholds.EVENT_LOOP_LIMIT) {
      bottlenecks.push({
        id: nextId(),
        component: 'Node Event Loop',
        category: 'CPU-bound',
        severity: 'HIGH',
        confidence: 'HIGH',
        confidenceReason: 'Event loop delays indicate potential single-threaded blockages under load.',
        supportingMetrics: {
          concurrency: entry.concurrency,
          eventLoopDelayMs: entry.eventLoopDelayMs,
        },
        source: {
          phase: '13.5.6.4',
          artifact: 'stability.json',
          metric: 'eventLoopDelayMs',
        },
      });
      break; // Avoid logging duplicate loop delay bottlenecks across all scen steps
    }
  }

  // Connection Pool Saturation
  const conn = aggregated.loadMetrics.connectionAnalysis || {};
  if (conn.recommendations?.length > 0 || (typeof conn.postgresConnections === 'number' && conn.postgresConnections >= 8)) {
    bottlenecks.push({
      id: nextId(),
      component: 'Database Connection Pool',
      category: 'Connection Pool',
      severity: 'HIGH',
      confidence: 'HIGH',
      confidenceReason: 'Active Postgres database connections approaching pool limit under stress.',
      supportingMetrics: {
        activeConnections: conn.postgresConnections,
      },
      source: {
        phase: '13.5.6.4',
        artifact: 'stability.json',
        metric: 'connectionAnalysis',
      },
    });
  }

  // Soak Test Memory Leaks / Latency drift
  const soak = aggregated.loadMetrics.soakTest;
  if (soak && soak.anomalies) {
    if (soak.anomalies.potentialMemoryLeak) {
      bottlenecks.push({
        id: nextId(),
        component: 'Heap Memory Allocations',
        category: 'Memory-bound',
        severity: 'HIGH',
        confidence: 'HIGH',
        confidenceReason: 'Unbounded heap memory growth observed during long-running soak test.',
        supportingMetrics: {
          heapGrowthBytes: soak.metrics?.memory?.heapGrowthBytes,
          rssGrowthBytes: soak.metrics?.memory?.rssGrowthBytes,
        },
        source: {
          phase: '13.5.6.4',
          artifact: 'soak-test.json',
          metric: 'heapGrowth',
        },
      });
    }

    if (soak.anomalies.handleLeak) {
      bottlenecks.push({
        id: nextId(),
        component: 'Node Active Handles',
        category: 'Memory-bound',
        severity: 'HIGH',
        confidence: 'MEDIUM',
        confidenceReason: 'Persistent event loop active handle growth detected during soak.',
        supportingMetrics: {
          growth: soak.metrics?.activeHandles?.growth,
        },
        source: {
          phase: '13.5.6.4',
          artifact: 'soak-test.json',
          metric: 'activeHandles',
        },
      });
    }

    if (soak.anomalies.throughputDegradation) {
      bottlenecks.push({
        id: nextId(),
        component: 'Backend Throughput',
        category: 'Network',
        severity: 'MEDIUM',
        confidence: 'HIGH',
        confidenceReason: 'Requests per second dropped significantly in the second half of the soak.',
        supportingMetrics: {
          degradationPercent: soak.metrics?.trends?.throughputDegradationPercent,
        },
        source: {
          phase: '13.5.6.4',
          artifact: 'soak-test.json',
          metric: 'throughputDegradation',
        },
      });
    }
  }

  return bottlenecks;
}
