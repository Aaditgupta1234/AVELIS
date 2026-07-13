/**
 * Verification script for Phase 13.5.5 — Memory Optimization.
 *
 * Run with: node --expose-gc scratch/verify_phase_13.5.5.js
 *
 * Verifies:
 *  1. Static Allocation Audit (module-level constants)
 *  2. Response Snapshot Parity
 *  3. Heap Workload Benchmark (5 rounds × 100 concurrent requests)
 *  4. Memory Leak Detection (500 sequential requests — no monotonic growth)
 *  5. Performance Regression Thresholds (avg latency, p95 latency)
 *  6. Allocation Hotspot Analysis (heap delta per round)
 *  7. Graceful Cleanup
 *  8. Final PASS/FAIL Summary Table
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import http from 'http';
import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole } from '@prisma/client';

const PORT = 5595;
const WARMUP_ROUNDS = 3;
const BENCHMARK_ROUNDS = 5;
const CONCURRENT_REQUESTS = 100;
const LEAK_REQUEST_COUNT = 500;
const MAX_LATENCY_REGRESSION_PCT = 15;
const MAX_HEAP_MB = 512;

// ─────────────────────────────────────────────
// Assertion helpers
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// HTTP helpers
// ─────────────────────────────────────────────

const request = (method, urlPath, { body, token } = {}) =>
  new Promise((resolve) => {
    const bodyStr = body ? JSON.stringify(body) : undefined;
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: urlPath,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json;
        try { json = JSON.parse(data); } catch { json = null; }
        resolve({ status: res.statusCode, body: json, raw: data });
      });
    });
    req.on('error', (err) => resolve({ status: 0, body: null, error: err.message }));
    if (bodyStr) req.write(bodyStr);
    req.end();
  });

// ─────────────────────────────────────────────
// Stats helpers
// ─────────────────────────────────────────────

const percentile = (sorted, p) => {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
};

const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

const heapMB = () => {
  if (typeof global.gc === 'function') global.gc();
  return process.memoryUsage().heapUsed / 1024 / 1024;
};

// Normalize CRLF for cross-platform regex matching
const readFile = (filePath) =>
  fs.readFileSync(path.resolve(filePath), 'utf8').replace(/\r\n/g, '\n');

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

async function runTests() {
  process.env.DISABLE_RATE_LIMIT = 'true';

  console.log('================================================================');
  console.log('  Phase 13.5.5 — Memory Optimization Verification');
  console.log('================================================================\n');

  // ── Environment Metadata ─────────────────────────────────────────────────
  const pkgPath = path.resolve('package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const prismaVersion = pkg.dependencies?.['@prisma/client'] || 'unknown';

  console.log('Environment');
  console.log('-----------');
  console.log(`  Node.js    : ${process.version}`);
  console.log(`  Prisma     : ${prismaVersion}`);
  console.log(`  CPU Cores  : ${os.cpus().length}`);
  console.log(`  Memory     : ${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`);
  console.log(`  NODE_ENV   : ${process.env.NODE_ENV || 'development'}`);
  console.log(`  GC exposed : ${typeof global.gc === 'function' ? 'yes (--expose-gc)' : 'no (run with --expose-gc for accurate heap metrics)'}`);
  console.log(`\n  Warm-up rounds       : ${WARMUP_ROUNDS}`);
  console.log(`  Benchmark rounds     : ${BENCHMARK_ROUNDS}`);
  console.log(`  Concurrent requests  : ${CONCURRENT_REQUESTS}`);
  console.log(`  Leak detection reqs  : ${LEAK_REQUEST_COUNT}`);

  const cleanUps = { userIds: [] };
  let adminToken = null;
  let memberToken = null;
  let server = null;

  try {
    // ── Setup ────────────────────────────────────────────────────────────────
    await prisma.$connect();
    server = http.createServer(app);
    await new Promise((res) => server.listen(PORT, res));

    // ── 1. Static Allocation Audit ───────────────────────────────────────────
    section('1. Static Allocation Audit');
    let staticPass = true;

    // 1a. loan.validation.js
    const loanValidation = readFile('src/validations/loan.validation.js');

    staticPass &= assert(
      /^const ALLOWED_LOAN_STATUSES\s*=\s*Object\.freeze/m.test(loanValidation),
      'loan.validation.js: ALLOWED_LOAN_STATUSES is frozen at module scope'
    );
    staticPass &= assert(
      /^const ALLOWED_QUERY_SORT_FIELDS\s*=/m.test(loanValidation),
      'loan.validation.js: ALLOWED_QUERY_SORT_FIELDS hoisted to module scope'
    );
    staticPass &= assert(
      /^const ALLOWED_BORROW_KEYS\s*=/m.test(loanValidation),
      'loan.validation.js: ALLOWED_BORROW_KEYS hoisted to module scope'
    );
    // No inline Object.values(LoanStatus) inside function bodies
    const loanNoModuleLevel = loanValidation.replace(/^const[^\n]+Object\.values\(LoanStatus\)[^\n]*/m, '');
    staticPass &= assert(
      !loanNoModuleLevel.includes('Object.values(LoanStatus)'),
      'loan.validation.js: no inline Object.values(LoanStatus) inside function bodies'
    );
    // No inline allowedSortFields inside functions
    staticPass &= assert(
      !loanValidation.includes('const allowedSortFields'),
      'loan.validation.js: no inline allowedSortFields inside function bodies'
    );

    // 1b. reservation.validation.js
    const resValidation = readFile('src/validations/reservation.validation.js');
    staticPass &= assert(
      /^const ALLOWED_RESERVATION_STATUSES\s*=/m.test(resValidation),
      'reservation.validation.js: ALLOWED_RESERVATION_STATUSES hoisted to module scope'
    );
    staticPass &= assert(
      /^const ALLOWED_SORT_FIELDS\s*=/m.test(resValidation),
      'reservation.validation.js: ALLOWED_SORT_FIELDS hoisted to module scope'
    );
    staticPass &= assert(
      !resValidation.includes('const allowedSortFields'),
      'reservation.validation.js: no inline allowedSortFields inside function bodies'
    );
    const resNoModuleLevel = resValidation.replace(/^const[^\n]+Object\.values\(ReservationStatus\)[^\n]*/m, '');
    staticPass &= assert(
      !resNoModuleLevel.includes('Object.values(ReservationStatus)'),
      'reservation.validation.js: no inline Object.values(ReservationStatus) inside function bodies'
    );

    // 1c. loan.service.js
    const loanService = readFile('src/services/loan.service.js');
    staticPass &= assert(
      /^const MAX_ACTIVE_LOANS\s*=/m.test(loanService),
      'loan.service.js: MAX_ACTIVE_LOANS hoisted to module scope'
    );
    staticPass &= assert(
      !loanService.includes("...(status !== undefined && status !== null ? { status } : {})"),
      'loan.service.js: no conditional spread allocation in retrieveLoanHistory'
    );

    // 1d. reservation.service.js
    const resService = readFile('src/services/reservation.service.js');
    staticPass &= assert(
      /^const CANCELLABLE_RESERVATION_STATUSES\s*=/m.test(resService),
      'reservation.service.js: CANCELLABLE_RESERVATION_STATUSES hoisted to module scope'
    );
    staticPass &= assert(
      !resService.includes('const allowedStatuses = [ReservationStatus'),
      'reservation.service.js: no inline allowedStatuses array inside cancelReservation'
    );

    // 1e. analytics.service.js
    const analyticsService = readFile('src/services/analytics.service.js');
    staticPass &= assert(
      !analyticsService.includes(".split('T')[0]"),
      'analytics.service.js: no .split("T")[0] (replaced with .substring(0,10))'
    );
    staticPass &= assert(
      !analyticsService.includes('.filter(Boolean)'),
      'analytics.service.js: no chained .filter(Boolean) after .map()'
    );
    staticPass &= assert(
      (analyticsService.match(/new Map\(books\.map/g) || []).length >= 2,
      'analytics.service.js: O(n²) book.find() replaced with O(n) Map lookup (≥2 occurrences)'
    );

    // 1f. loan.controller.js
    const loanController = readFile('src/controllers/loan.controller.js');
    staticPass &= assert(
      !loanController.includes('...req.query,'),
      'loan.controller.js: no spread of req.query into new temporary object'
    );

    sectionResults['Static Allocation Audit'] = staticPass ? 'PASS' : 'FAIL';

    // ── Token Setup ──────────────────────────────────────────────────────────
    const seed = Date.now();

    const admin = await prisma.user.findFirst({ where: { role: UserRole.ADMIN } });
    if (admin) {
      adminToken = generateToken({ id: admin.id, email: admin.email, role: admin.role });
    }

    const memberEmail = `bench_member_${seed}@example.com`;
    const memberName = `BenchMember${seed}`;
    const regResp = await request('POST', '/api/v1/auth/register', {
      body: { name: memberName, email: memberEmail, password: 'Bench@1234!' }
    });
    if (regResp.status === 201 && regResp.body?.data?.id) {
      cleanUps.userIds.push(regResp.body.data.id);
      const loginResp = await request('POST', '/api/v1/auth/login', {
        body: { email: memberEmail, password: 'Bench@1234!' }
      });
      if (loginResp.status === 200) {
        memberToken = loginResp.body?.data?.token;
      }
    }

    // ── 2. Response Snapshot Parity ──────────────────────────────────────────
    section('2. Response Snapshot Parity');
    let snapshotPass = true;

    // Auth /me
    if (memberToken) {
      const meResp = await request('GET', '/api/v1/auth/me', { token: memberToken });
      snapshotPass &= assert(meResp.status === 200, 'GET /auth/me returns 200');
      snapshotPass &= assert(meResp.body?.data?.id !== undefined, 'GET /auth/me: data.id present');
      snapshotPass &= assert(meResp.body?.data?.email !== undefined, 'GET /auth/me: data.email present');
      snapshotPass &= assert(meResp.body?.data?.role !== undefined, 'GET /auth/me: data.role present');
    }

    // Books list — response shape: { data: { books: [...], pagination: {...} } }
    const booksResp = await request('GET', '/api/v1/books?page=1&limit=5');
    snapshotPass &= assert(booksResp.status === 200, 'GET /books returns 200');
    snapshotPass &= assert(
      Array.isArray(booksResp.body?.data?.books),
      'GET /books: data.books is an array'
    );
    snapshotPass &= assert(
      typeof booksResp.body?.data?.pagination === 'object',
      'GET /books: data.pagination is an object'
    );

    // Loans — admin only
    if (adminToken) {
      const loansResp = await request('GET', '/api/v1/loans?page=1&limit=5', { token: adminToken });
      snapshotPass &= assert(loansResp.status === 200, 'GET /loans (admin) returns 200');
      snapshotPass &= assert(Array.isArray(loansResp.body?.data), 'GET /loans: data is an array');
    }

    // Validation error shapes unchanged
    const badLoan = await request('POST', '/api/v1/loans', {
      body: { userId: 'not-a-uuid', copyId: 'not-a-uuid' },
      token: adminToken
    });
    snapshotPass &= assert(badLoan.status === 400, 'POST /loans with invalid UUIDs returns 400');
    snapshotPass &= assert(Array.isArray(badLoan.body?.errors), 'POST /loans 400 has errors array');

    sectionResults['Snapshot Parity'] = snapshotPass ? 'PASS' : 'FAIL';

    // ── 3. Warm-up + Baseline (collected first, before benchmark pressure) ───
    const endpoint = '/api/v1/books?page=1&limit=10';

    for (let r = 0; r < WARMUP_ROUNDS; r++) {
      await Promise.all(Array.from({ length: CONCURRENT_REQUESTS }, () => request('GET', endpoint)));
    }

    // Collect baseline after warm-up (DB and V8 JIT are fully warm)
    const baselineLatencies = (await Promise.all(
      Array.from({ length: CONCURRENT_REQUESTS }, async () => {
        const t0 = Date.now();
        await request('GET', endpoint);
        return Date.now() - t0;
      })
    )).sort((a, b) => a - b);

    // ── 4. Heap Workload Benchmark ───────────────────────────────────────────
    section('3. Heap Workload Benchmark');

    const roundDeltas = [];
    const allLatencies = [];
    let peakHeap = heapMB();

    for (let r = 0; r < BENCHMARK_ROUNDS; r++) {
      const heapBefore = heapMB();
      const start = Date.now();

      const latencies = await Promise.all(
        Array.from({ length: CONCURRENT_REQUESTS }, async () => {
          const t0 = Date.now();
          await request('GET', endpoint);
          return Date.now() - t0;
        })
      );

      const elapsed = Date.now() - start;
      const heapAfter = heapMB();
      const delta = heapAfter - heapBefore;

      roundDeltas.push(delta);
      allLatencies.push(...latencies);
      if (heapAfter > peakHeap) peakHeap = heapAfter;

      const rps = (CONCURRENT_REQUESTS / elapsed) * 1000;
      console.log(`  Round ${r + 1}: heap Δ=${delta.toFixed(2)} MB | peak=${heapAfter.toFixed(2)} MB | RPS=${rps.toFixed(1)}`);
    }

    const retainedHeap = heapMB();

    const heapOk = assert(retainedHeap < MAX_HEAP_MB,
      `Retained heap < ${MAX_HEAP_MB} MB (actual: ${retainedHeap.toFixed(2)} MB)`);
    const peakOk = assert(peakHeap < MAX_HEAP_MB,
      `Peak heap < ${MAX_HEAP_MB} MB (actual: ${peakHeap.toFixed(2)} MB)`);

    sectionResults['Heap Workload Benchmark'] = (heapOk && peakOk) ? 'PASS' : 'FAIL';

    // ── 5. Memory Leak Detection ─────────────────────────────────────────────
    section('4. Memory Leak Detection');

    const leakSamples = [];
    const sampleInterval = Math.floor(LEAK_REQUEST_COUNT / 10);

    for (let i = 0; i < LEAK_REQUEST_COUNT; i++) {
      await request('GET', endpoint);
      if ((i + 1) % sampleInterval === 0) {
        leakSamples.push(heapMB());
      }
    }

    const heapGrowth = leakSamples[leakSamples.length - 1] - leakSamples[0];
    console.log(`  Heap samples (MB): ${leakSamples.map(h => h.toFixed(1)).join(' → ')}`);
    console.log(`  Total growth over ${LEAK_REQUEST_COUNT} requests: ${heapGrowth.toFixed(2)} MB`);

    const leakOk = assert(heapGrowth < 20,
      `No monotonic heap growth (growth: ${heapGrowth.toFixed(2)} MB < 20 MB threshold)`);
    sectionResults['Memory Leak Detection'] = leakOk ? 'PASS' : 'FAIL';

    // ── 6. Performance Regression Thresholds ────────────────────────────────
    section('5. Performance Regression Thresholds');

    allLatencies.sort((a, b) => a - b);

    const baselineAvg = avg(baselineLatencies);
    const baselineP95 = percentile(baselineLatencies, 95);
    const benchAvg = avg(allLatencies);
    const benchP95 = percentile(allLatencies, 95);

    // Regression = how much the benchmark is WORSE than the baseline
    const avgRegression = ((benchAvg - baselineAvg) / baselineAvg) * 100;
    const p95Regression = ((benchP95 - baselineP95) / baselineP95) * 100;

    console.log(`  Baseline avg: ${baselineAvg.toFixed(2)} ms | Benchmark avg: ${benchAvg.toFixed(2)} ms (Δ${avgRegression.toFixed(1)}%)`);
    console.log(`  Baseline p95: ${baselineP95} ms | Benchmark p95: ${benchP95} ms (Δ${p95Regression.toFixed(1)}%)`);

    const avgOk = assert(avgRegression <= MAX_LATENCY_REGRESSION_PCT,
      `Avg latency regression ≤ ${MAX_LATENCY_REGRESSION_PCT}% (actual: ${avgRegression.toFixed(1)}%)`);
    const p95Ok = assert(p95Regression <= MAX_LATENCY_REGRESSION_PCT,
      `P95 latency regression ≤ ${MAX_LATENCY_REGRESSION_PCT}% (actual: ${p95Regression.toFixed(1)}%)`);

    sectionResults['Performance Regression'] = (avgOk && p95Ok) ? 'PASS' : 'FAIL';

    // ── 7. Allocation Hotspot Analysis ───────────────────────────────────────
    section('6. Allocation Hotspot Analysis');

    const avgDelta = avg(roundDeltas);
    const maxDelta = Math.max(...roundDeltas);

    console.log(`  Heap delta per round (MB): ${roundDeltas.map(d => d.toFixed(2)).join(', ')}`);
    console.log(`  Avg Δ: ${avgDelta.toFixed(2)} MB | Max Δ: ${maxDelta.toFixed(2)} MB`);

    const hotspotThreshold = Math.max(50, Math.abs(avgDelta) * 5 + 10);
    const hotspotOk = assert(maxDelta < hotspotThreshold,
      `No single-round heap spike > ${hotspotThreshold.toFixed(0)} MB (max: ${maxDelta.toFixed(2)} MB)`);

    const analyticsContent = readFile('src/services/analytics.service.js');
    const hotspot2 = assert(
      !analyticsContent.includes(".split('T')[0]"),
      'Hotspot eliminated: .split("T")[0] → .substring(0,10) in analytics'
    );
    const hotspot3 = assert(
      (analyticsContent.match(/new Map\(books\.map/g) || []).length >= 2,
      'Hotspot eliminated: O(n²) book.find() → O(n) Map lookup (≥2 occurrences)'
    );

    sectionResults['Allocation Hotspot Analysis'] = (hotspotOk && hotspot2 && hotspot3) ? 'PASS' : 'FAIL';

  } catch (err) {
    console.error('\n[ERROR] Unexpected failure during test run:', err.message);
    console.error(err.stack);
  } finally {
    // ── 7. Graceful Cleanup ───────────────────────────────────────────────────
    section('7. Graceful Cleanup');

    try {
      if (cleanUps.userIds.length > 0) {
        for (const userId of cleanUps.userIds) {
          await prisma.loan.deleteMany({ where: { userId } });
          await prisma.reservation.deleteMany({ where: { userId } });
        }
        await prisma.user.deleteMany({ where: { id: { in: cleanUps.userIds } } });
        console.log(`  Cleaned up ${cleanUps.userIds.length} test user(s)`);
      }
    } catch (cleanErr) {
      console.warn(`  [WARN] Cleanup partial failure: ${cleanErr.message}`);
    }

    await prisma.$disconnect().catch(() => {});
    if (server) await new Promise((res) => server.close(res));
    console.log('  Server closed. Prisma disconnected.');
  }

  // ── 8. Final PASS/FAIL Summary Table ─────────────────────────────────────
  section('8. Final Summary');

  const colW = 35;
  console.log('\n' + '='.repeat(52));
  console.log('  Phase 13.5.5 — Memory Optimization Results');
  console.log('='.repeat(52));
  for (const [name, status] of Object.entries(sectionResults)) {
    const icon = status === 'PASS' ? '✓' : '✗';
    console.log(`  ${icon} ${name.padEnd(colW)} ${status}`);
  }
  console.log('='.repeat(52));

  const sectionPassCount = Object.values(sectionResults).filter(s => s === 'PASS').length;
  const sectionTotal = Object.keys(sectionResults).length;
  console.log(`\n  Individual assertions : ${passedCount} / ${totalCount} PASS`);
  console.log(`  Sections             : ${sectionPassCount} / ${sectionTotal} PASS`);

  const allPass = passedCount === totalCount;
  if (allPass) {
    console.log('\n  ✓ Phase 13.5.5 COMPLETE — all checks passed.\n');
    process.exit(0);
  } else {
    console.error(`\n  ✗ Phase 13.5.5 INCOMPLETE — ${totalCount - passedCount} assertion(s) failed.\n`);
    process.exit(1);
  }
}

runTests();
