/**
 * @fileoverview Performance metrics aggregator for the final report.
 *
 * Reads all previous benchmark output files, validates them, and normalizes them,
 * tracking warnings for missing metadata or optional fields instead of failing.
 *
 * @module benchmark/performance.aggregator
 */

import fs from 'fs/promises';
import path from 'path';
import { finalConfig } from './final.config.js';

/**
 * Helper to safely read and parse a JSON file.
 * If file does not exist, throws a hard error (required).
 * If content is not valid JSON, throws a hard error.
 *
 * @param {string} filePath - Path to file
 * @returns {Promise<Object>} File contents
 */
async function requireJsonFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

/**
 * Scan the API benchmark reports directory for summaries.
 *
 * @param {string} apiDir - Path to scan
 * @param {Array} warnings - Warning collector
 * @param {Array} analyzedArtifacts - File path collector
 * @returns {Promise<Array>} List of API summaries
 */
async function loadApiSummaries(apiDir, warnings, analyzedArtifacts) {
  const summaries = [];
  try {
    const items = await fs.readdir(apiDir);
    for (const item of items) {
      const subPath = path.join(apiDir, item);
      const stat = await fs.stat(subPath);
      if (stat.isDirectory()) {
        const file = path.join(subPath, 'summary.json');
        try {
          const content = await fs.readFile(file, 'utf8');
          const json = JSON.parse(content);
          analyzedArtifacts.push(file);

          const schemaVer = json.schemaVersion || json.benchmarkVersion;
          if (!schemaVer) {
            warnings.push({
              code: 'UNKNOWN_SCHEMA_VERSION',
              severity: 'INFO',
              message: `API summary for ${item} did not include schemaVersion/benchmarkVersion.`,
              context: { file },
            });
          }

          summaries.push({
            name: item,
            schemaVersion: schemaVer || 'unknown',
            phase: json.phase || '13.5.6.2',
            metrics: json.metrics || {},
            metadata: json.metadata || {},
          });
        } catch (err) {
          // Skip if missing or unparseable
        }
      }
    }
  } catch (err) {
    throw new Error(`Required API benchmark directory ${apiDir} is unreadable: ${err.message}`);
  }
  return summaries;
}

/**
 * Aggregate and validate all benchmark outputs from previous phases.
 *
 * @returns {Promise<{aggregated: Object, warnings: Array, analyzedArtifacts: Array}>} Results
 */
export async function aggregateAllMetrics() {
  const warnings = [];
  const analyzedArtifacts = [];

  console.log('Aggregating all performance benchmark artifacts...');

  // ── 1. API Summaries ──────────────────────────────────────────────────────
  const apiSummaries = await loadApiSummaries(finalConfig.INPUT_DIRECTORIES.api, warnings, analyzedArtifacts);

  // ── 2. Database Benchmarks ────────────────────────────────────────────────
  const dbQueriesPath = path.join(finalConfig.INPUT_DIRECTORIES.database, 'query-summary.json');
  const dbTxPath = path.join(finalConfig.INPUT_DIRECTORIES.database, 'transactions.json');
  const dbSlowPath = path.join(finalConfig.INPUT_DIRECTORIES.database, 'slow-queries.json');

  let dbQueries = null;
  let dbTx = null;
  let dbSlow = null;

  try {
    dbQueries = await requireJsonFile(dbQueriesPath);
    analyzedArtifacts.push(dbQueriesPath);
    if (!dbQueries.schemaVersion) {
      warnings.push({
        code: 'MISSING_SCHEMA_VERSION',
        severity: 'INFO',
        message: 'Database query-summary.json did not include schemaVersion.',
        context: { file: dbQueriesPath },
      });
    }
  } catch (err) {
    throw new Error(`Required database query-summary.json is missing or unparseable: ${err.message}`);
  }

  try {
    dbTx = await requireJsonFile(dbTxPath);
    analyzedArtifacts.push(dbTxPath);
  } catch (err) {
    throw new Error(`Required database transactions.json is missing or unparseable: ${err.message}`);
  }

  try {
    dbSlow = await requireJsonFile(dbSlowPath);
    analyzedArtifacts.push(dbSlowPath);
  } catch (err) {
    throw new Error(`Required database slow-queries.json is missing or unparseable: ${err.message}`);
  }

  // ── 3. Load Testing ───────────────────────────────────────────────────────
  const loadSummaryPath = path.join(finalConfig.INPUT_DIRECTORIES.load, 'summary.json');
  const loadStabilityPath = path.join(finalConfig.INPUT_DIRECTORIES.load, 'stability.json');
  const loadSoakPath = path.join(finalConfig.INPUT_DIRECTORIES.load, 'soak-test.json');

  let loadSummary = null;
  let loadStability = null;
  let loadSoak = null;

  try {
    loadSummary = await requireJsonFile(loadSummaryPath);
    analyzedArtifacts.push(loadSummaryPath);
  } catch (err) {
    throw new Error(`Required load testing summary.json is missing or unparseable: ${err.message}`);
  }

  try {
    loadStability = await requireJsonFile(loadStabilityPath);
    analyzedArtifacts.push(loadStabilityPath);
  } catch (err) {
    throw new Error(`Required load testing stability.json is missing or unparseable: ${err.message}`);
  }

  try {
    loadSoak = await requireJsonFile(loadSoakPath);
    analyzedArtifacts.push(loadSoakPath);
  } catch (err) {
    throw new Error(`Required load testing soak-test.json is missing or unparseable: ${err.message}`);
  }

  // ── 4. Bottleneck Analysis ────────────────────────────────────────────────
  const analysisSummaryPath = path.join(finalConfig.INPUT_DIRECTORIES.analysis, 'summary.json');
  const analysisBottlenecksPath = path.join(finalConfig.INPUT_DIRECTORIES.analysis, 'bottlenecks.json');
  const analysisRecommendationsPath = path.join(finalConfig.INPUT_DIRECTORIES.analysis, 'recommendations.json');
  const analysisPriorityPath = path.join(finalConfig.INPUT_DIRECTORIES.analysis, 'optimization-priority.json');

  let analysisSummary = null;
  let bottlenecks = null;
  let recommendations = null;
  let priority = null;

  try {
    analysisSummary = await requireJsonFile(analysisSummaryPath);
    analyzedArtifacts.push(analysisSummaryPath);
  } catch (err) {
    throw new Error(`Required bottleneck analysis summary.json is missing or unparseable: ${err.message}`);
  }

  try {
    bottlenecks = await requireJsonFile(analysisBottlenecksPath);
    analyzedArtifacts.push(analysisBottlenecksPath);
  } catch (err) {
    throw new Error(`Required bottlenecks.json is missing or unparseable: ${err.message}`);
  }

  try {
    recommendations = await requireJsonFile(analysisRecommendationsPath);
    analyzedArtifacts.push(analysisRecommendationsPath);
  } catch (err) {
    throw new Error(`Required recommendations.json is missing or unparseable: ${err.message}`);
  }

  try {
    priority = await requireJsonFile(analysisPriorityPath);
    analyzedArtifacts.push(analysisPriorityPath);
  } catch (err) {
    throw new Error(`Required optimization-priority.json is missing or unparseable: ${err.message}`);
  }

  // Extract shared runId
  const runId = loadSummary?.runId || dbQueries?.runId || analysisSummary?.runId || 'unknown';
  if (runId === 'unknown') {
    warnings.push({
      code: 'MISSING_RUN_ID',
      severity: 'WARNING',
      message: 'Shared runId was not found in any benchmark source files.',
      context: { runId },
    });
  }

  // Environment and metadata
  const environment = loadSummary?.environment || dbQueries?.environment || {};
  const metadata = loadSummary?.metadata || dbQueries?.metadata || {};

  const normalized = {
    runId,
    apiSummaries,
    databaseMetrics: {
      queries: dbQueries?.results || [],
      transactions: dbTx?.results || [],
      slowQueries: dbSlow?.flagged || [],
      queryMemoryUsage: dbQueries?.memoryUsage || {},
      txMemoryUsage: dbTx?.memoryUsage || {},
    },
    loadMetrics: {
      scenarios: loadSummary?.scenarios || [],
      stabilityTrace: loadStability?.trace || [],
      connectionAnalysis: loadStability?.connectionAnalysis || {},
      soakTest: loadSoak || null,
    },
    analysisMetrics: {
      summary: analysisSummary,
      bottlenecks,
      recommendations,
      priority,
    },
    environment,
    metadata,
  };

  return {
    aggregated: normalized,
    warnings,
    analyzedArtifacts,
  };
}
