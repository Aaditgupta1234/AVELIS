/**
 * @fileoverview Stability and resource utilization monitor.
 *
 * Tracks CPU, Heap/RSS memory, and event loop delays.
 *
 * @module benchmark/stability.metrics
 */

import os from 'os';

let lastCpuUsage = process.cpuUsage();
let lastCpuTime = performance.now();

/**
 * Calculate the CPU utilization percentage of the current Node process.
 * Scales consumption across elapsed time and available CPU cores.
 *
 * @returns {number} CPU utilization fraction (0.0 to 1.0)
 */
export function getProcessCpu() {
  const elapsedMs = performance.now() - lastCpuTime;
  if (elapsedMs <= 0) return 0;

  const usage = process.cpuUsage(lastCpuUsage);

  lastCpuUsage = process.cpuUsage();
  lastCpuTime = performance.now();

  const totalCpuTimeMs = (usage.user + usage.system) / 1000;
  const numCpus = os.cpus().length || 1;
  const cpuFraction = totalCpuTimeMs / elapsedMs / numCpus;
  return Math.min(1, Math.max(0, cpuFraction));
}

/**
 * Retrieve current process heap and RSS memory usage in bytes.
 *
 * @returns {{heapUsed: number, rss: number}} Memory metrics
 */
export function getMemoryUsage() {
  const mem = process.memoryUsage();
  return {
    heapUsed: mem.heapUsed,
    rss: mem.rss,
  };
}

let eventLoopDelay = 0;
let lastLoopTime = performance.now();
let eventLoopTimer = null;

/**
 * Start event loop delay monitoring by running a recurring interval check.
 *
 * @param {number} [intervalMs=100] Checking resolution interval
 */
export function startEventLoopMonitor(intervalMs = 100) {
  if (eventLoopTimer) return;
  lastLoopTime = performance.now();
  eventLoopTimer = setInterval(() => {
    const now = performance.now();
    const elapsed = now - lastLoopTime;
    eventLoopDelay = Math.max(0, elapsed - intervalMs);
    lastLoopTime = now;
  }, intervalMs);
  
  // Unref the timer so it doesn't prevent process exit
  if (eventLoopTimer.unref) {
    eventLoopTimer.unref();
  }
}

/**
 * Stop event loop delay monitoring.
 */
export function stopEventLoopMonitor() {
  if (eventLoopTimer) {
    clearInterval(eventLoopTimer);
    eventLoopTimer = null;
  }
}

/**
 * Retrieve the current tracked event loop delay in milliseconds.
 *
 * @returns {number} Delay in ms
 */
export function getEventLoopDelay() {
  return eventLoopDelay;
}
