/**
 * Verification script for Phase 13.5.6.2 — API Benchmarking.
 *
 * Run with: node scratch/verify_phase_13.5.6.2.js
 *
 * Verifies:
 *   1. Scenario Files Exist
 *   2. Helper Files Exist
 *   3. Scenario Shape
 *   4. Endpoint Tags
 *   5. Endpoint Lifecycle
 *   6. Endpoint Coverage
 *   7. Auth Helper
 *   8. Seed Helper
 *   9. Runner Execution
 *   10. Report Directories
 *   11. summary.json Valid
 *   12. raw-results.json Valid
 *   13. report.md Generated
 *   14. index.md Generated
 *   15. Seed Cleanup
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import child_process from 'child_process';
import { fileURLToPath } from 'url';

import { prisma } from '../src/lib/prisma.js';
import { getAdminToken, getMemberToken, clearTokenCache, getSeededMemberInfo } from '../benchmark/helpers/authHelper.js';
import { createSeedContext } from '../benchmark/helpers/seedHelper.js';
import { benchmarkConfig } from '../benchmark/config/benchmark.config.js';

// ── 1. Scenarios imports ──────────────────────────────────────────────────────
import authScenario from '../benchmark/scenarios/auth.scenario.js';
import booksScenario from '../benchmark/scenarios/books.scenario.js';
import loansScenario from '../benchmark/scenarios/loans.scenario.js';
import reservationsScenario from '../benchmark/scenarios/reservations.scenario.js';
import reviewsScenario from '../benchmark/scenarios/reviews.scenario.js';
import dashboardScenario from '../benchmark/scenarios/dashboard.scenario.js';
import analyticsScenario from '../benchmark/scenarios/analytics.scenario.js';
import reportsScenario from '../benchmark/scenarios/reports.scenario.js';

const SCENARIOS = [
  authScenario,
  booksScenario,
  loansScenario,
  reservationsScenario,
  reviewsScenario,
  dashboardScenario,
  analyticsScenario,
  reportsScenario,
];

// ─────────────────────────────────────────────────────────────────────────────
// Assertion helpers
// ─────────────────────────────────────────────────────────────────────────────

const sectionResults = {};
let passedCount = 0;
let totalCount = 0;

const assert = (condition, message) => {
  totalCount++;
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedCount++;
    return true;
  } else {
    console.error(`  [FAIL] ${message}`);
    return false;
  }
};

const section = (label) => console.log(`\n--- ${label} ---`);

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function runVerification() {
  console.log('================================================================');
  console.log('  Phase 13.5.6.2 — API Benchmarking Verification');
  console.log('================================================================\n');
  console.log(`  Node.js    : ${process.version}`);
  console.log(`  Platform   : ${process.platform} / ${process.arch}`);

  // ── 1. Scenario Files Exist ───────────────────────────────────────────────
  section('1. Scenario Files Exist');
  let scenariosExist = true;
  const scenarioFiles = [
    'auth.scenario.js',
    'books.scenario.js',
    'loans.scenario.js',
    'reservations.scenario.js',
    'reviews.scenario.js',
    'dashboard.scenario.js',
    'analytics.scenario.js',
    'reports.scenario.js',
  ];
  for (const file of scenarioFiles) {
    const p = path.resolve('benchmark/scenarios', file);
    scenariosExist &= assert(fs.existsSync(p), `Exists: benchmark/scenarios/${file}`);
  }
  sectionResults['1. Scenario Files Exist'] = scenariosExist ? 'PASS' : 'FAIL';

  // ── 2. Helper Files Exist ─────────────────────────────────────────────────
  section('2. Helper Files Exist');
  let helpersExist = true;
  const helperFiles = ['authHelper.js', 'seedHelper.js'];
  for (const file of helperFiles) {
    const p = path.resolve('benchmark/helpers', file);
    helpersExist &= assert(fs.existsSync(p), `Exists: benchmark/helpers/${file}`);
  }
  sectionResults['2. Helper Files Exist'] = helpersExist ? 'PASS' : 'FAIL';

  // ── 3. Scenario Shape ─────────────────────────────────────────────────────
  section('3. Scenario Shape');
  let shapePass = true;
  for (const s of SCENARIOS) {
    shapePass &= assert(typeof s.name === 'string' && s.name.length > 0, `Scenario has name: ${s.name}`);
    shapePass &= assert(typeof s.description === 'string', `Scenario "${s.name}" has description`);
    shapePass &= assert(Array.isArray(s.endpoints), `Scenario "${s.name}" has endpoints array`);
    if (Array.isArray(s.endpoints)) {
      for (const e of s.endpoints) {
        const pathPrefix = `Endpoint "${e.name}" in "${s.name}"`;
        shapePass &= assert(typeof e.name === 'string', `${pathPrefix} has name`);
        shapePass &= assert(typeof e.method === 'string', `${pathPrefix} has method`);
        shapePass &= assert(Array.isArray(e.tags), `${pathPrefix} has tags array`);
        shapePass &= assert(typeof e.expectedStatus === 'number', `${pathPrefix} has expectedStatus`);
        shapePass &= assert(typeof e.readOnly === 'boolean', `${pathPrefix} has readOnly`);
        shapePass &= assert(typeof e.buildUrl === 'function', `${pathPrefix} has buildUrl`);
        shapePass &= assert(typeof e.buildHeaders === 'function', `${pathPrefix} has buildHeaders`);
        if (e.buildBody !== undefined) {
          shapePass &= assert(typeof e.buildBody === 'function', `${pathPrefix} buildBody is a function`);
        }
      }
    }
  }
  sectionResults['3. Scenario Shape'] = shapePass ? 'PASS' : 'FAIL';

  // ── 4. Endpoint Tags ──────────────────────────────────────────────────────
  section('4. Endpoint Tags');
  let tagsPass = true;
  for (const s of SCENARIOS) {
    for (const e of s.endpoints) {
      const label = `Endpoint "${e.name}"`;
      tagsPass &= assert(e.tags.length > 0, `${label} has tags`);
      tagsPass &= assert(e.tags.includes('read') || e.tags.includes('write'), `${label} has read/write tag`);
    }
  }
  sectionResults['4. Endpoint Tags'] = tagsPass ? 'PASS' : 'FAIL';

  // ── 5. Endpoint Lifecycle ─────────────────────────────────────────────────
  section('5. Endpoint Lifecycle');
  let lifecyclePass = true;
  for (const s of SCENARIOS) {
    for (const e of s.endpoints) {
      if (e.readOnly === false) {
        // Write endpoints (except auth-register) must have beforeIteration or afterIteration
        if (e.name === 'auth-register') {
          lifecyclePass &= assert(typeof e.cleanup === 'function', `Write endpoint "auth-register" has cleanup`);
        } else {
          lifecyclePass &= assert(
            typeof e.beforeIteration === 'function' || typeof e.afterIteration === 'function',
            `Write endpoint "${e.name}" has beforeIteration or afterIteration`
          );
        }
      }
    }
  }
  sectionResults['5. Endpoint Lifecycle'] = lifecyclePass ? 'PASS' : 'FAIL';

  // ── 6. Endpoint Coverage ──────────────────────────────────────────────────
  section('6. Endpoint Coverage');
  let totalEndpointsCount = 0;
  for (const s of SCENARIOS) {
    totalEndpointsCount += s.endpoints.length;
  }
  const coveragePass = assert(totalEndpointsCount >= 26, `Total endpoint coverage: ${totalEndpointsCount} (expected >= 26)`);
  sectionResults['6. Endpoint Coverage'] = coveragePass ? 'PASS' : 'FAIL';

  // ── 7. Auth Helper ────────────────────────────────────────────────────────
  section('7. Auth Helper');
  let authPass = true;
  clearTokenCache();
  try {
    // Seed temporary records needed for authHelper tests
    const seedCtx = createSeedContext(prisma);
    await seedCtx.seed();

    const adminToken = await getAdminToken(prisma);
    const memberToken = await getMemberToken(prisma);

    authPass &= assert(typeof adminToken === 'string' && adminToken.length > 0, 'getAdminToken returns non-empty string');
    authPass &= assert(typeof memberToken === 'string' && memberToken.length > 0, 'getMemberToken returns non-empty string');
    authPass &= assert(getSeededMemberInfo() !== null, 'getSeededMemberInfo tracks created member info');

    await seedCtx.cleanup();
  } catch (err) {
    console.error('Error during Auth Helper test:', err);
    authPass = false;
  }
  sectionResults['7. Auth Helper'] = authPass ? 'PASS' : 'FAIL';

  // ── 8. Seed Helper ────────────────────────────────────────────────────────
  section('8. Seed Helper');
  let seedPass = true;
  try {
    const seedCtx = createSeedContext(prisma);
    const seedData = await seedCtx.seed();

    seedPass &= assert(typeof seedData === 'object' && seedData !== null, 'seed() returns data object');
    seedPass &= assert(typeof seedData.adminUserId === 'string', 'seed() returns adminUserId');
    seedPass &= assert(typeof seedData.memberUserId === 'string', 'seed() returns memberUserId');
    seedPass &= assert(typeof seedData.bookId === 'string', 'seed() returns bookId');
    seedPass &= assert(typeof seedData.copyId === 'string', 'seed() returns copyId');
    seedPass &= assert(typeof seedData.loanId === 'string', 'seed() returns loanId');
    seedPass &= assert(typeof seedData.reservationId === 'string', 'seed() returns reservationId');
    seedPass &= assert(typeof seedData.reviewId === 'string', 'seed() returns reviewId');

    const retrieved = seedCtx.getData();
    seedPass &= assert(retrieved.memberUserId === seedData.memberUserId, 'getData() returns seeded values');

    await seedCtx.cleanup();
    seedPass &= assert(true, 'cleanup() runs successfully');
  } catch (err) {
    console.error('Error during Seed Helper test:', err);
    seedPass = false;
  }
  sectionResults['8. Seed Helper'] = seedPass ? 'PASS' : 'FAIL';

  // ── 9. Runner Execution ───────────────────────────────────────────────────
  section('9. Runner Execution');
  let runnerPass = false;
  let runStdout = '';
  try {
    console.log('  Executing fast-run of runAllBenchmarks.js...');
    const result = child_process.spawnSync(
      'node',
      ['benchmark/runAllBenchmarks.js'],
      {
        env: {
          ...process.env,
          BENCHMARK_READ_ITERATIONS: '1',
          BENCHMARK_WRITE_ITERATIONS: '1',
          BENCHMARK_WARMUP_ITERATIONS: '1',
          NODE_ENV: 'development',
        },
        encoding: 'utf8',
      }
    );

    runStdout = result.stdout;
    const hasCompletedText = runStdout.includes('Phase 13.5.6.2 Complete');
    const validStatus = result.status === 0 || result.status === 1;
    runnerPass = assert(validStatus && hasCompletedText, `runAllBenchmarks.js completed successfully (status: ${result.status}, found completion text: ${hasCompletedText})`);
    if (!runnerPass) {
      console.error(result.stderr);
    }
  } catch (err) {
    console.error('Error during Runner Execution:', err);
    runnerPass = false;
  }
  sectionResults['9. Runner Execution'] = runnerPass ? 'PASS' : 'FAIL';

  // Get all endpoint names
  const allEndpointNames = SCENARIOS.flatMap((s) => s.endpoints.map((e) => e.name));

  // ── 10. Report Directories ────────────────────────────────────────────────
  section('10. Report Directories');
  let dirsPass = true;
  for (const name of allEndpointNames) {
    const dir = path.resolve('benchmark/reports', name);
    dirsPass &= assert(fs.existsSync(dir), `Report directory exists for: ${name}`);
  }
  sectionResults['10. Report Directories'] = dirsPass ? 'PASS' : 'FAIL';

  // ── 11. summary.json Valid ────────────────────────────────────────────────
  section('11. summary.json Valid');
  let summaryPass = true;
  for (const name of allEndpointNames) {
    const summaryFile = path.resolve('benchmark/reports', name, 'summary.json');
    const exists = fs.existsSync(summaryFile);
    if (!exists) {
      summaryPass = assert(false, `summary.json missing for: ${name}`);
      continue;
    }
    try {
      const data = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
      summaryPass &= assert(typeof data.benchmarkVersion === 'string', `${name} summary.json has benchmarkVersion`);
      summaryPass &= assert(typeof data.metrics === 'object', `${name} summary.json has metrics`);
      summaryPass &= assert(typeof data.metadata === 'object', `${name} summary.json has metadata`);
    } catch (err) {
      summaryPass = assert(false, `${name} summary.json is not valid JSON: ${err.message}`);
    }
  }
  sectionResults['11. summary.json Valid'] = summaryPass ? 'PASS' : 'FAIL';

  // ── 12. raw-results.json Valid ────────────────────────────────────────────
  section('12. raw-results.json Valid');
  let rawPass = true;
  for (const name of allEndpointNames) {
    const rawFile = path.resolve('benchmark/reports', name, 'raw-results.json');
    const exists = fs.existsSync(rawFile);
    if (!exists) {
      rawPass = assert(false, `raw-results.json missing for: ${name}`);
      continue;
    }
    try {
      const data = JSON.parse(fs.readFileSync(rawFile, 'utf8'));
      rawPass &= assert(typeof data.benchmarkVersion === 'string', `${name} raw-results.json has benchmarkVersion`);
      rawPass &= assert(Array.isArray(data.raw), `${name} raw-results.json has raw array`);
      rawPass &= assert(typeof data.metadata === 'object', `${name} raw-results.json has metadata`);
      if (Array.isArray(data.raw) && data.raw.length > 0) {
        const item = data.raw[0];
        rawPass &= assert(
          'durationMs' in item && 'status' in item && 'success' in item && 'timestamp' in item,
          `${name} raw-results.json entry has correct keys`
        );
      }
    } catch (err) {
      rawPass = assert(false, `${name} raw-results.json is not valid JSON: ${err.message}`);
    }
  }
  sectionResults['12. raw-results.json Valid'] = rawPass ? 'PASS' : 'FAIL';

  // ── 13. report.md Generated ───────────────────────────────────────────────
  section('13. report.md Generated');
  let reportPass = true;
  for (const name of allEndpointNames) {
    const mdFile = path.resolve('benchmark/reports', name, 'report.md');
    const exists = fs.existsSync(mdFile);
    if (!exists) {
      reportPass = assert(false, `report.md missing for: ${name}`);
      continue;
    }
    const content = fs.readFileSync(mdFile, 'utf8');
    reportPass &= assert(content.includes('# Benchmark Report'), `${name} report.md has correct title`);
    reportPass &= assert(content.includes('Observations'), `${name} report.md has Observations`);
    reportPass &= assert(content.includes('Percentiles'), `${name} report.md has Percentiles`);
  }
  sectionResults['13. report.md Generated'] = reportPass ? 'PASS' : 'FAIL';

  // ── 14. index.md Generated ────────────────────────────────────────────────
  section('14. index.md Generated');
  let indexPass = true;
  const indexFile = path.resolve('benchmark/reports/index.md');
  indexPass &= assert(fs.existsSync(indexFile), 'Index.md exists');
  if (fs.existsSync(indexFile)) {
    const content = fs.readFileSync(indexFile, 'utf8');
    indexPass &= assert(content.includes('# AVELIS Benchmark Index Report'), 'index.md has correct title');
    indexPass &= assert(
      content.includes('| Endpoint | Tags | Avg | P95 | P99 | RPS | Success% | Status |'),
      'index.md contains table headers with Tags column'
    );
    // Ensure all scenario names are listed as subheaders
    for (const s of SCENARIOS) {
      const subheader = `## ${s.name.charAt(0).toUpperCase() + s.name.slice(1)}`;
      indexPass &= assert(content.includes(subheader), `index.md includes scenario section: ${subheader}`);
    }
  }
  sectionResults['14. index.md Generated'] = indexPass ? 'PASS' : 'FAIL';

  // ── 15. Seed Cleanup ──────────────────────────────────────────────────────
  section('15. Seed Cleanup');
  let cleanupPass = true;
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { startsWith: 'bench_' } },
          { username: { startsWith: 'bench_' } }
        ]
      }
    });
    const books = await prisma.book.findMany({
      where: { title: { startsWith: 'bench_' } }
    });
    const copies = await prisma.bookCopy.findMany({
      where: { barcode: { startsWith: 'bench-' } }
    });
    const reviews = await prisma.review.findMany({
      where: { comment: { startsWith: 'bench_' } }
    });
    const reservations = await prisma.reservation.findMany({
      where: { book: { title: { startsWith: 'bench_' } } }
    });
    const loans = await prisma.loan.findMany({
      where: { bookCopy: { barcode: { startsWith: 'bench-' } } }
    });

    cleanupPass &= assert(users.length === 0, `0 leftover bench_* users (found ${users.length})`);
    cleanupPass &= assert(books.length === 0, `0 leftover bench_* books (found ${books.length})`);
    cleanupPass &= assert(copies.length === 0, `0 leftover bench_* copies (found ${copies.length})`);
    cleanupPass &= assert(reviews.length === 0, `0 leftover bench_* reviews (found ${reviews.length})`);
    cleanupPass &= assert(reservations.length === 0, `0 leftover bench_* reservations (found ${reservations.length})`);
    cleanupPass &= assert(loans.length === 0, `0 leftover bench_* loans (found ${loans.length})`);
  } catch (err) {
    console.error('Error querying DB for cleanup validation:', err);
    cleanupPass = false;
  }
  sectionResults['15. Seed Cleanup'] = cleanupPass ? 'PASS' : 'FAIL';

  // ─────────────────────────────────────────────────────────────────────────
  // Final PASS/FAIL Summary Table
  // ─────────────────────────────────────────────────────────────────────────
  const COL = 38;
  console.log('\n' + '='.repeat(60));
  console.log('  Phase 13.5.6.2 — API Benchmarking Results');
  console.log('='.repeat(60));

  for (const [name, status] of Object.entries(sectionResults)) {
    const icon = status === 'PASS' ? '✓' : '✗';
    console.log(`  ${icon} ${name.padEnd(COL)} ${status}`);
  }

  console.log('='.repeat(60));

  const sectionPassCount = Object.values(sectionResults).filter((s) => s === 'PASS').length;
  const sectionTotal = Object.keys(sectionResults).length;

  console.log(`\n  Individual assertions : ${passedCount} / ${totalCount} PASS`);
  console.log(`  Sections             : ${sectionPassCount} / ${sectionTotal} PASS`);

  const allPass = passedCount === totalCount;
  if (allPass) {
    console.log('\n  ✓ Phase 13.5.6.2 COMPLETE — all checks passed.\n');
    process.exit(0);
  } else {
    console.error(`\n  ✗ Phase 13.5.6.2 INCOMPLETE — ${totalCount - passedCount} assertion(s) failed.\n`);
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('\n[FATAL] Verification script crashed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
