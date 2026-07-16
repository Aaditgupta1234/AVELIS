/**
 * @fileoverview History manager for final performance reports.
 *
 * Saves timestamped reports, extracts the immediately preceding baseline summary,
 * and prunes historical logs exceeding MAX_HISTORY_RUNS.
 *
 * @module benchmark/history.manager
 */

import fs from 'fs/promises';
import path from 'path';
import { finalConfig } from './final.config.js';

/**
 * Scan history directory and return the path to the most recent prior execution run's summary.json.
 *
 * @returns {Promise<Object|null>} Baseline performance-summary object or null
 */
export async function getPreviousBaseline() {
  try {
    const items = await fs.readdir(finalConfig.HISTORY_DIRECTORY);
    const dirs = [];
    for (const item of items) {
      const fullPath = path.join(finalConfig.HISTORY_DIRECTORY, item);
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        dirs.push({ name: item, path: fullPath, mtime: stat.mtimeMs });
      }
    }

    if (dirs.length === 0) {
      return null;
    }

    // Sort by mtime descending (newest first)
    dirs.sort((a, b) => b.mtime - a.mtime);

    const newestDir = dirs[0];
    const summaryFile = path.join(newestDir.path, 'performance-summary.json');
    try {
      const content = await fs.readFile(summaryFile, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      // Summary not found or unparseable, skip
      return null;
    }
  } catch (err) {
    // History directory does not exist yet or unreadable
    return null;
  }
}

/**
 * Save current final report outputs to a timestamped folder under history.
 *
 * @param {string} runId - Current run ID
 * @param {Object} perfSummary - performance-summary.json details
 * @param {Object} execSummary - executive-summary.json details
 * @param {string} perfSummaryMd - performance-summary.md details
 * @param {string} beforeAfterMd - before-after.md details
 */
export async function archiveRun(runId, perfSummary, execSummary, perfSummaryMd, beforeAfterMd) {
  if (!finalConfig.SAVE_HISTORY) return;

  try {
    await fs.mkdir(finalConfig.HISTORY_DIRECTORY, { recursive: true });

    // Format folder timestamp: YYYY-MM-DD_HH-mm-ss
    const timestamp = new Date().toISOString()
      .replace(/T/, '_')
      .replace(/\..+/, '')
      .replace(/:/g, '-');

    const runDir = path.join(finalConfig.HISTORY_DIRECTORY, timestamp);
    await fs.mkdir(runDir, { recursive: true });

    await fs.writeFile(path.join(runDir, 'performance-summary.json'), JSON.stringify(perfSummary, null, 2));
    await fs.writeFile(path.join(runDir, 'executive-summary.json'), JSON.stringify(execSummary, null, 2));
    await fs.writeFile(path.join(runDir, 'performance-summary.md'), perfSummaryMd);
    await fs.writeFile(path.join(runDir, 'before-after.md'), beforeAfterMd);

    console.log(`  Saved final report history run to: ${runDir}`);
    await pruneHistory();
  } catch (error) {
    console.error(`  Error archiving final run: ${error.message}`);
  }
}

/**
 * Prune folders under history directory exceeding MAX_HISTORY_RUNS.
 */
async function pruneHistory() {
  try {
    const items = await fs.readdir(finalConfig.HISTORY_DIRECTORY);
    const dirs = [];
    for (const item of items) {
      const fullPath = path.join(finalConfig.HISTORY_DIRECTORY, item);
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        dirs.push({ name: item, path: fullPath, mtime: stat.mtimeMs });
      }
    }

    dirs.sort((a, b) => a.mtime - b.mtime); // Oldest first

    while (dirs.length > finalConfig.MAX_HISTORY_RUNS) {
      const oldest = dirs.shift();
      console.log(`  Pruning old history final report run: ${oldest.name}...`);
      await fs.rm(oldest.path, { recursive: true, force: true });
    }
  } catch (error) {
    console.warn(`  Warning: Failed to prune final reports history: ${error.message}`);
  }
}
