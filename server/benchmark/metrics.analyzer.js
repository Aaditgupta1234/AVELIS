/**
 * @fileoverview Benchmark metrics aggregator and normalizer.
 *
 * Reads JSON artifacts from Phase 13.5.6.2 (API), 13.5.6.3 (DB), and 13.5.6.4 (Load),
 * validates their schema, and normalizes them into a unified format.
 *
 * @module benchmark/metrics.analyzer
 */

import fs from 'fs/promises';
import path from 'path';
import { analysisConfig } from './analysis.config.js';

/**
 * Scan a directory for subdirectories containing a summary.json file.
 *
 * @param {string} dirPath - Path to scan
 * @returns {Promise<Array>} List of parsed summary objects
 */
async function loadApiSummaries(dirPath, analyzedArtifacts) {
  const summaries = [];
  try {
    const items = await fs.readdir(dirPath);
    for (const item of items) {
      const subPath = path.join(dirPath, item);
      const stat = await fs.stat(subPath);
      if (stat.isDirectory()) {
        const file = path.join(subPath, 'summary.json');
        try {
          const content = await fs.readFile(file, 'utf8');
          const json = JSON.parse(content);
          analyzedArtifacts.push(file);
          summaries.push({
            name: item,
            schemaVersion: json.schemaVersion || json.benchmarkVersion || '1.0',
            phase: json.phase || '13.5.6.2',
            metrics: json.metrics || {},
            metadata: json.metadata || {},
          });
        } catch (err) {
          // File missing or not valid JSON, skip scenario folder
        }
      }
    }
  } catch (err) {
    console.warn(`  [WARN] Failed to read API summaries from ${dirPath}: ${err.message}`);
  }
  return summaries;
}

/**
 * Load a single JSON artifact if it exists.
 *
 * @param {string} filePath - Path to JSON file
 * @param {Array} analyzedArtifacts - Collector for read files
 * @returns {Promise<Object|null>} Parsed JSON or null
 */
async function loadJsonFile(filePath, analyzedArtifacts) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const json = JSON.parse(content);
    analyzedArtifacts.push(filePath);
    return json;
  } catch (err) {
    console.warn(`  [WARN] Artifact not found or invalid: ${filePath} (${err.message})`);
    return null;
  }
}

/**
 * Read and normalize all metrics from previous benchmarking phases.
 *
 * @returns {Promise<Object>} Normalized benchmark metrics
 */
export async function aggregateMetrics() {
  const analyzedArtifacts = [];
  console.log('Aggregating benchmark artifacts...');

  // ── 1. Load API summaries ──────────────────────────────────────────────────
  const apiSummaries = await loadApiSummaries(analysisConfig.INPUT_DIRECTORIES.api, analyzedArtifacts);

  // ── 2. Load DB metrics ─────────────────────────────────────────────────────
  const dbQueriesPath = path.join(analysisConfig.INPUT_DIRECTORIES.database, 'query-summary.json');
  const dbTxPath = path.join(analysisConfig.INPUT_DIRECTORIES.database, 'transactions.json');
  const dbSlowPath = path.join(analysisConfig.INPUT_DIRECTORIES.database, 'slow-queries.json');

  const dbQueries = await loadJsonFile(dbQueriesPath, analyzedArtifacts);
  const dbTx = await loadJsonFile(dbTxPath, analyzedArtifacts);
  const dbSlow = await loadJsonFile(dbSlowPath, analyzedArtifacts);

  // ── 3. Load Load Test metrics ──────────────────────────────────────────────
  const loadSummaryPath = path.join(analysisConfig.INPUT_DIRECTORIES.load, 'summary.json');
  const loadStabilityPath = path.join(analysisConfig.INPUT_DIRECTORIES.load, 'stability.json');
  const loadSoakPath = path.join(analysisConfig.INPUT_DIRECTORIES.load, 'soak-test.json');

  const loadSummary = await loadJsonFile(loadSummaryPath, analyzedArtifacts);
  const loadStability = await loadJsonFile(loadStabilityPath, analyzedArtifacts);
  const loadSoak = await loadJsonFile(loadSoakPath, analyzedArtifacts);

  // Extract shared runId
  const runId = loadSummary?.runId || dbQueries?.runId || `RUN-${Date.now()}`;

  // Extract environment and metadata
  const environment = loadSummary?.environment || dbQueries?.environment || {};
  const metadata = loadSummary?.metadata || dbQueries?.metadata || {};

  // Formulate unified aggregated representation
  return {
    runId,
    apiMetrics: apiSummaries,
    databaseMetrics: {
      queries: dbQueries?.results || [],
      transactions: dbTx?.results || [],
      slowQueries: dbSlow?.flagged || [],
      dbMemoryUsage: {
        queries: dbQueries?.memoryUsage || {},
        transactions: dbTx?.memoryUsage || {},
      },
    },
    loadMetrics: {
      scenarios: loadSummary?.scenarios || [],
      stabilityTrace: loadStability?.trace || [],
      connectionAnalysis: loadStability?.connectionAnalysis || {},
      soakTest: loadSoak || null,
    },
    environment,
    metadata,
    analyzedArtifacts,
  };
}
