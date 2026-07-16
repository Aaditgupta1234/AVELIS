/**
 * @fileoverview Long-duration soak testing runner.
 *
 * Simulates a long-duration workload to identify memory leaks, handle growth,
 * throughput degradation, and response latency drift.
 *
 * @module benchmark/soak.runner
 */

import { config } from './config.js';
import { loadConfig } from './load.config.js';
import { getMemoryUsage, getProcessCpu, getEventLoopDelay } from './stability.metrics.js';
import { computeStats } from './query.metrics.js';

/**
 * Execute the soak test and monitor long-term trends.
 *
 * @param {string} baseUrl - Base URL of the target API server
 * @param {Object} workloadGen - Seeded workload generator
 * @param {number} durationMs - Soak test duration in milliseconds
 * @returns {Promise<Object>} Soak test results
 */
export async function runSoakTest(baseUrl, workloadGen, durationMs) {
  console.log(`  Starting Soak Test (Duration: ${durationMs} ms)...`);

  const startMem = getMemoryUsage();
  const startCpu = getProcessCpu();
  
  // Optional active handles check
  const startHandles = typeof process._getActiveHandles === 'function' ? process._getActiveHandles().length : null;

  const requestTimes = [];
  const midPoint = durationMs / 2;
  const startTime = performance.now();
  
  let firstHalfCount = 0;
  let secondHalfCount = 0;
  const firstHalfLatencies = [];
  const secondHalfLatencies = [];

  let successCount = 0;
  let failureCount = 0;
  const errorBreakdown = {
    timeout: 0,
    http_error: {},
    network_error: 0,
    unexpected_exception: 0,
  };

  const concurrency = 20; // Maintain steady concurrency during soak
  const workerPromises = [];

  const simulateWorker = async () => {
    while (performance.now() - startTime < durationMs) {
      const operation = workloadGen.selectOperation();
      const reqStart = performance.now();
      const relativeTime = reqStart - startTime;

      try {
        await workloadGen.execute(baseUrl, operation);
        const latency = performance.now() - reqStart;
        successCount++;

        if (relativeTime < midPoint) {
          firstHalfCount++;
          firstHalfLatencies.push(latency);
        } else {
          secondHalfCount++;
          secondHalfLatencies.push(latency);
        }
      } catch (err) {
        failureCount++;
        const latency = performance.now() - reqStart;

        if (err.message === 'timeout') {
          errorBreakdown.timeout++;
        } else if (err.message === 'http_error') {
          const code = err.statusCode || 500;
          errorBreakdown.http_error[code] = (errorBreakdown.http_error[code] || 0) + 1;
        } else if (err.message === 'network_error') {
          errorBreakdown.network_error++;
        } else {
          errorBreakdown.unexpected_exception++;
        }

        if (relativeTime < midPoint) {
          firstHalfCount++;
          firstHalfLatencies.push(latency);
        } else {
          secondHalfCount++;
          secondHalfLatencies.push(latency);
        }
      }
    }
  };

  // Spawn parallel workers
  for (let i = 0; i < concurrency; i++) {
    workerPromises.push(simulateWorker());
  }

  await Promise.all(workerPromises);

  const endMem = getMemoryUsage();
  const endCpu = getProcessCpu();
  const endHandles = typeof process._getActiveHandles === 'function' ? process._getActiveHandles().length : null;

  // Calculate trends
  const heapGrowth = endMem.heapUsed - startMem.heapUsed;
  const rssGrowth = endMem.rss - startMem.rss;

  const firstHalfAvg = firstHalfLatencies.reduce((a, b) => a + b, 0) / (firstHalfLatencies.length || 1);
  const secondHalfAvg = secondHalfLatencies.reduce((a, b) => a + b, 0) / (secondHalfLatencies.length || 1);
  const latencyDrift = secondHalfAvg - firstHalfAvg;

  // Throughput degradation
  const firstHalfRps = firstHalfCount / (midPoint / 1000);
  const secondHalfRps = secondHalfCount / (midPoint / 1000);
  const throughputDegradation = firstHalfRps > 0 ? ((firstHalfRps - secondHalfRps) / firstHalfRps) * 100 : 0;

  // Event loop delay
  const evDelay = getEventLoopDelay();

  const handleLeaksDetected = startHandles !== null && endHandles !== null && endHandles > startHandles + 5;

  return {
    status: 'PASS',
    durationMs,
    success: successCount,
    failures: failureCount,
    successRate: (successCount / (successCount + failureCount || 1)) * 100,
    errors: errorBreakdown,
    metrics: {
      memory: {
        heapUsedStart: startMem.heapUsed,
        heapUsedEnd: endMem.heapUsed,
        heapGrowthBytes: heapGrowth,
        rssStart: startMem.rss,
        rssEnd: endMem.rss,
        rssGrowthBytes: rssGrowth,
      },
      cpu: {
        cpuStartFraction: startCpu,
        cpuEndFraction: endCpu,
      },
      activeHandles: startHandles !== null ? {
        start: startHandles,
        end: endHandles,
        growth: endHandles - startHandles,
      } : null,
      trends: {
        firstHalfAvgLatencyMs: firstHalfAvg,
        secondHalfAvgLatencyMs: secondHalfAvg,
        latencyDriftMs: latencyDrift,
        firstHalfRps,
        secondHalfRps,
        throughputDegradationPercent: Math.max(0, throughputDegradation),
      },
      eventLoopDelayMs: evDelay,
    },
    anomalies: {
      potentialMemoryLeak: heapGrowth > 20 * 1024 * 1024, // > 20MB heap growth
      throughputDegradation: throughputDegradation > 15, // > 15% drop
      latencyDrift: latencyDrift > 50, // > 50ms increase
      handleLeak: handleLeaksDetected,
    },
  };
}
