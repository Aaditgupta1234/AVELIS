/**
 * @fileoverview Final reporting orchestrator runner.
 *
 * Coordinates aggregation, baseline comparison, executive calculations, report MD generation,
 * and historical archiving.
 *
 * @module benchmark/final.runner
 */

import fs from 'fs/promises';
import path from 'path';
import { finalConfig } from './final.config.js';
import { aggregateAllMetrics } from './performance.aggregator.js';
import { getPreviousBaseline, archiveRun } from './history.manager.js';
import { generateComparisons } from './comparison.engine.js';
import { generateExecutiveSummary } from './executive.summary.js';
import { generatePerformanceSummary, generateBeforeAfterReport } from './report.generator.js';

async function run() {
  console.log('============================================================');
  console.log('  AVELIS Final Performance Report Generator (Phase 13.5.6.6)');
  console.log('============================================================');

  const startedAt = new Date().toISOString();
  const startTime = performance.now();

  try {
    // ── 1. Aggregation ────────────────────────────────────────────────────────
    const { aggregated, warnings, analyzedArtifacts } = await aggregateAllMetrics();

    // ── 2. Load History Baseline ──────────────────────────────────────────────
    console.log('Resolving historical baseline for comparison...');
    const baseline = await getPreviousBaseline();

    // ── 3. Compile Executive Calculations ─────────────────────────────────────
    console.log('Compiling executive readiness assessment...');
    const execSummaryDetails = generateExecutiveSummary(aggregated);

    // ── 4. Execute Delta Comparison Engine ────────────────────────────────────
    console.log('Executing comparison engine...');
    const comparisonResults = generateComparisons(aggregated, baseline, warnings);

    // ── 5. Build Consolidated Metadata Section ────────────────────────────────
    const finishedAt = new Date().toISOString();
    const durationMs = performance.now() - startTime;

    // Build source provenance references
    const sources = {
      api: {
        phase: '13.5.6.2',
        artifact: 'benchmark/reports/',
        schemaVersion: '1.0',
        runId: aggregated.runId,
      },
      database: {
        phase: '13.5.6.3',
        artifact: 'benchmark/database/query-summary.json',
        schemaVersion: '1.0',
        runId: aggregated.runId,
      },
      load: {
        phase: '13.5.6.4',
        artifact: 'benchmark/load/summary.json',
        schemaVersion: '1.0',
        runId: aggregated.runId,
      },
      analysis: {
        phase: '13.5.6.5',
        artifact: 'benchmark/analysis/summary.json',
        schemaVersion: '1.0',
        runId: aggregated.runId,
      },
    };

    // Determine reportStatus dynamically
    const reportStatus = warnings.length > 0 ? 'PASS_WITH_WARNINGS' : 'PASS';

    const metadata = {
      schemaVersion: finalConfig.SCHEMA_VERSION,
      reportVersion: finalConfig.REPORT_VERSION,
      phase: finalConfig.REPORT_PHASE,
      runId: aggregated.runId,
      generatedAt: finishedAt,
      startedAt,
      finishedAt,
      durationMs,
      benchmarkStatus: 'PASS',
      reportStatus,
      warnings: {
        count: warnings.length,
        items: warnings,
      },
      sources,
    };

    // ── 6. Formulate Output JSON Payloads ─────────────────────────────────────
    const performanceSummaryJson = {
      metadata,
      apiSummaries: aggregated.apiSummaries,
      databaseMetrics: aggregated.databaseMetrics,
      loadMetrics: aggregated.loadMetrics,
      analysisSummary: aggregated.analysisMetrics.summary,
      comparison: comparisonResults,
    };

    const executiveSummaryJson = {
      metadata,
      executiveSummary: execSummaryDetails,
    };

    // ── 7. Generate Markdown Reports ──────────────────────────────────────────
    console.log('Generating markdown reports...');
    const performanceSummaryMd = generatePerformanceSummary(aggregated, execSummaryDetails, comparisonResults, metadata);
    const beforeAfterMd = generateBeforeAfterReport(comparisonResults);

    // Ensure output folder exists
    await fs.mkdir(finalConfig.OUTPUT_DIRECTORY, { recursive: true });

    // Write outputs to target directories
    const summaryPath = path.join(finalConfig.OUTPUT_DIRECTORY, 'performance-summary.json');
    const execPath = path.join(finalConfig.OUTPUT_DIRECTORY, 'executive-summary.json');
    const summaryMdPath = path.join(finalConfig.OUTPUT_DIRECTORY, 'performance-summary.md');
    const beforeAfterMdPath = path.join(finalConfig.OUTPUT_DIRECTORY, 'before-after.md');

    await fs.writeFile(summaryPath, JSON.stringify(performanceSummaryJson, null, 2));
    await fs.writeFile(execPath, JSON.stringify(executiveSummaryJson, null, 2));
    await fs.writeFile(summaryMdPath, performanceSummaryMd);
    await fs.writeFile(beforeAfterMdPath, beforeAfterMd);

    console.log(`Saved reports inside: ${finalConfig.OUTPUT_DIRECTORY}`);

    // ── 8. Archive & Prune Runs ───────────────────────────────────────────────
    await archiveRun(aggregated.runId, performanceSummaryJson, executiveSummaryJson, performanceSummaryMd, beforeAfterMd);

    console.log('============================================================');
    console.log('  Final Performance Report Generation COMPLETE');
    console.log('============================================================\n');

  } catch (error) {
    console.error('\nFinal report generation failed:', error);
    process.exitCode = 1;
  }
}

run();
