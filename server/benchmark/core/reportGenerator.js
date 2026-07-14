/**
 * @fileoverview Report generator.
 *
 * Writes benchmark results to scenario-scoped subdirectories under reportDir.
 * Each scenario gets its own folder to prevent overwrites when multiple APIs
 * are benchmarked in sequence (Phase 13.5.6.2 onward).
 *
 * Output structure:
 *   <reportDir>/<scenario>/
 *     summary.json      — aggregated MetricsSummary + metadata (small, CI-parseable)
 *     raw-results.json  — full per-request records (analysis tools, Phase 13.5.6.5)
 *     report.md         — human-readable Markdown report
 *
 * @module benchmark/core/reportGenerator
 */

import fs from 'fs/promises';
import path from 'path';
import { benchmarkConfig as defaultConfig } from '../config/benchmark.config.js';
import { fms, frps, fmb, fpct, mdTable } from '../utils/formatter.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Sanitize a scenario name for use as a directory name.
 * Converts spaces and special characters to hyphens, lowercases.
 *
 * @param {string} name
 * @returns {string}
 */
const toFolderName = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * Generate the observations section based on result metrics.
 *
 * @param {import('./metricsCollector.js').MetricsSummary} metrics
 * @returns {string[]} Array of observation strings
 */
const buildObservations = (metrics) => {
  const obs = [];
  if (metrics.successRate >= 99) obs.push('✓ Excellent success rate (≥ 99%)');
  else if (metrics.successRate >= 95) obs.push('⚠ Good success rate (≥ 95%)');
  else obs.push(`✗ Low success rate (${fpct(metrics.successRate)})`);

  if (metrics.durationMs.p99 < 100)
    obs.push('✓ P99 latency is under 100 ms');
  else if (metrics.durationMs.p99 < 500)
    obs.push(`⚠ P99 latency is ${fms(metrics.durationMs.p99)} (watch under load)`);
  else
    obs.push(`✗ P99 latency is high: ${fms(metrics.durationMs.p99)}`);

  if (metrics.rps > 100) obs.push(`✓ Throughput is strong: ${frps(metrics.rps)}`);
  else obs.push(`⚠ Throughput: ${frps(metrics.rps)}`);

  return obs;
};

/**
 * Build the Markdown report string from a BenchmarkResult.
 *
 * @param {import('./benchmarkRunner.js').BenchmarkResult} result
 * @returns {string}
 */
const buildMarkdown = (result) => {
  const { benchmarkVersion, scenario, date, metadata, config, warmup, metrics } = result;
  const m = metrics;

  const lines = [
    `# Benchmark Report — ${scenario}`,
    '',
    `> Generated: ${date}`,
    '',
    '## Environment',
    '',
    mdTable(
      ['Field', 'Value'],
      [
        ['Scenario', scenario],
        ['Benchmark Version', benchmarkVersion],
        ['Node.js', metadata.nodeVersion],
        ['Platform', metadata.platform],
        ['Arch', metadata.arch],
        ['Date', date],
      ]
    ),
    '',
    '## Configuration',
    '',
    mdTable(
      ['Setting', 'Value'],
      [
        ['Base URL', config.baseUrl],
        ['Warmup Iterations', String(config.warmupIterations)],
        ['Iterations', String(config.iterations)],
        ['Concurrency Levels', config.concurrencyLevels.join(', ')],
        ['Timeout', `${config.timeoutMs} ms`],
        ['Collect Memory', String(config.collectMemory)],
        ['Collect CPU', String(config.collectCpu)],
      ]
    ),
    '',
    '## Warm-up',
    '',
    mdTable(
      ['Field', 'Value'],
      [
        ['Iterations Run', String(warmup.iterationsRun)],
        ['Elapsed', fms(warmup.elapsedMs)],
      ]
    ),
    '',
    '## Latency Summary',
    '',
    mdTable(
      ['Metric', 'Value'],
      [
        ['Average', fms(m.durationMs.avg)],
        ['Median', fms(m.durationMs.median)],
        ['Minimum', fms(m.durationMs.min)],
        ['Maximum', fms(m.durationMs.max)],
        ['Std Dev', fms(m.durationMs.stddev)],
      ]
    ),
    '',
    '## Percentiles',
    '',
    mdTable(
      ['Percentile', 'Latency'],
      [
        ['P50', fms(m.durationMs.p50)],
        ['P90', fms(m.durationMs.p90)],
        ['P95', fms(m.durationMs.p95)],
        ['P99', fms(m.durationMs.p99)],
      ]
    ),
    '',
    '## Throughput & Reliability',
    '',
    mdTable(
      ['Metric', 'Value'],
      [
        ['Total Requests', String(m.totalRequests)],
        ['Successful', String(m.successCount)],
        ['Failed', String(m.failureCount)],
        ['Success Rate', fpct(m.successRate)],
        ['Failure Rate', fpct(m.failureRate)],
        ['Requests / sec', frps(m.rps)],
        ['Elapsed', fms(m.elapsedMs)],
      ]
    ),
    '',
    '## Memory & CPU',
    '',
  ];

  const sysRows = [
    ['Heap Used', fmb(m.system.memory.heapUsedMb)],
    ['RSS', fmb(m.system.memory.rssMb)],
    ['Uptime', `${m.system.uptime.toFixed(1)} s`],
  ];

  if (config.collectCpu && m.system.cpu) {
    sysRows.push(['CPU User', fms(m.system.cpu.userMs)]);
    sysRows.push(['CPU System', fms(m.system.cpu.systemMs)]);
  } else {
    sysRows.push(['CPU', 'Not collected (collectCpu = false)']);
  }

  lines.push(mdTable(['Metric', 'Value'], sysRows));

  lines.push('', '## Observations', '');
  buildObservations(m).forEach((obs) => lines.push(`- ${obs}`));
  lines.push('');

  return lines.join('\n');
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} ReportPaths
 * @property {string} summaryPath - Absolute path to summary.json
 * @property {string} rawPath     - Absolute path to raw-results.json
 * @property {string} mdPath      - Absolute path to report.md
 */

/**
 * Generate and write all three report files for a benchmark result.
 *
 * Creates <reportDir>/<scenario>/ if it does not exist.
 *
 * @param {import('./benchmarkRunner.js').BenchmarkResult} result
 * @param {Object} [config] - Config override (defaults to benchmarkConfig)
 * @returns {Promise<ReportPaths>}
 *
 * @example
 * const paths = await generateReport(result);
 * console.log('Summary:', paths.summaryPath);
 */
export const generateReport = async (result, config = defaultConfig) => {
  const folder = toFolderName(result.scenario);
  const dir = path.resolve(config.reportDir, folder);
  await fs.mkdir(dir, { recursive: true });

  const summaryPath = path.join(dir, 'summary.json');
  const rawPath = path.join(dir, 'raw-results.json');
  const mdPath = path.join(dir, 'report.md');

  // summary.json — aggregated, without the full raw array (stays small for CI)
  const summary = {
    reportSchemaVersion: undefined, // reserved for future use
    benchmarkVersion: result.benchmarkVersion,
    scenario: result.scenario,
    date: result.date,
    metadata: result.metadata,
    config: result.config,
    warmup: result.warmup,
    metrics: result.metrics,
  };
  // Remove the reserved field to keep the output clean for now
  delete summary.reportSchemaVersion;

  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf8');

  // raw-results.json — per-request records, potentially large
  const rawOutput = {
    benchmarkVersion: result.benchmarkVersion,
    scenario: result.scenario,
    date: result.date,
    metadata: result.metadata,
    raw: result.raw,
  };
  await fs.writeFile(rawPath, JSON.stringify(rawOutput, null, 2), 'utf8');

  // report.md — human-readable Markdown
  await fs.writeFile(mdPath, buildMarkdown(result), 'utf8');

  return { summaryPath, rawPath, mdPath };
};
