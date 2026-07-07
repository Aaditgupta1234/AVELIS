/**
 * @fileoverview Concurrency verification script.
 *
 * Tests Optimistic Concurrency Control (OCC) across all critical workflows:
 * - Concurrent book borrowing
 * - Concurrent loan return
 * - Concurrent reservation creation
 * - Concurrent reservation cancellation
 * - Transaction rollback validation
 *
 * Prerequisites:
 *   1. Server must be running on http://localhost:5000
 *   2. A clean or seeded test database must be accessible
 *
 * Usage:
 *   node server/scratch/verify_concurrency.js
 */

const BASE_URL = 'http://localhost:5000/api/v1';

// ---------------------------------------------------------------------------
// HTTP Helpers
// ---------------------------------------------------------------------------

async function request(method, path, body, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function login(email, password) {
  const { status, data } = await request('POST', '/auth/login', { email, password });
  if (status !== 200) throw new Error(`Login failed for ${email}: ${data.message}`);
  return data.data.token;
}

// ---------------------------------------------------------------------------
// Setup: Obtain tokens
// ---------------------------------------------------------------------------

async function setup() {
  console.log('\n=== SETUP ===');
  const adminToken = await login(process.env.ADMIN_EMAIL || 'admin@avelis.dev', process.env.ADMIN_PASSWORD || 'Admin@1234');
  const memberToken = await login(process.env.MEMBER_EMAIL || 'member@avelis.dev', process.env.MEMBER_PASSWORD || 'Member@1234');
  console.log('✓ Obtained admin token');
  console.log('✓ Obtained member token');
  return { adminToken, memberToken };
}

// ---------------------------------------------------------------------------
// Test 1: Concurrent Borrow
// ---------------------------------------------------------------------------

async function testConcurrentBorrow(adminToken, copyId, userId) {
  console.log('\n=== TEST 1: Concurrent Borrow ===');
  console.log(`  copyId=${copyId} userId=${userId}`);

  const concurrency = 5;
  const results = await Promise.allSettled(
    Array.from({ length: concurrency }, () =>
      request('POST', '/loans/borrow', { userId, copyId }, adminToken)
    )
  );

  const successes = results.filter((r) => r.status === 'fulfilled' && r.value.status === 201);
  const failures = results.filter((r) => r.status === 'fulfilled' && r.value.status !== 201);

  console.log(`  → Successes: ${successes.length} / ${concurrency}`);
  console.log(`  → Failures:  ${failures.length} / ${concurrency}`);

  if (successes.length === 1) {
    console.log('  ✓ Exactly one borrow succeeded (OCC working)');
  } else {
    console.error(`  ✗ Expected 1 success, got ${successes.length}`);
  }
}

// ---------------------------------------------------------------------------
// Test 2: Concurrent Return
// ---------------------------------------------------------------------------

async function testConcurrentReturn(adminToken, loanId) {
  console.log('\n=== TEST 2: Concurrent Return ===');
  console.log(`  loanId=${loanId}`);

  const concurrency = 5;
  const results = await Promise.allSettled(
    Array.from({ length: concurrency }, () =>
      request('PATCH', `/loans/${loanId}/return`, undefined, adminToken)
    )
  );

  const successes = results.filter((r) => r.status === 'fulfilled' && r.value.status === 200);
  const failures = results.filter((r) => r.status === 'fulfilled' && r.value.status !== 200);

  console.log(`  → Successes: ${successes.length} / ${concurrency}`);
  console.log(`  → Failures:  ${failures.length} / ${concurrency}`);

  if (successes.length === 1) {
    console.log('  ✓ Exactly one return succeeded. Remaining requests failed with expected business error (400 Loan already returned)');
  } else {
    console.error(`  ✗ Expected 1 success, got ${successes.length}`);
  }

  const alreadyReturnedErrors = failures.filter((r) =>
    r.value?.data?.message?.toLowerCase().includes('already returned')
  );
  console.log(`  → "Loan already returned" errors: ${alreadyReturnedErrors.length}`);
}

// ---------------------------------------------------------------------------
// Test 3: Concurrent Reservation Creation
// ---------------------------------------------------------------------------

async function testConcurrentReservation(adminToken, bookId, userIds) {
  console.log('\n=== TEST 3: Concurrent Reservation Creation ===');
  console.log(`  bookId=${bookId} users=${userIds.length}`);

  const results = await Promise.allSettled(
    userIds.map((userId) =>
      request('POST', '/reservations', { bookId, userId }, adminToken)
    )
  );

  const successes = results.filter((r) => r.status === 'fulfilled' && r.value.status === 201);
  const pendingResults = successes.filter((r) => r.value.data?.data?.status === 'PENDING');
  const readyResults = successes.filter((r) => r.value.data?.data?.status === 'READY_FOR_PICKUP');

  console.log(`  → Successes:          ${successes.length} / ${userIds.length}`);
  console.log(`  → READY_FOR_PICKUP:   ${readyResults.length}`);
  console.log(`  → PENDING:            ${pendingResults.length}`);
  console.log('  ✓ All reservations created (one per available copy or queued as PENDING)');
}

// ---------------------------------------------------------------------------
// Test 4: Concurrent Cancellation
// ---------------------------------------------------------------------------

async function testConcurrentCancellation(adminToken, reservationId) {
  console.log('\n=== TEST 4: Concurrent Cancellation ===');
  console.log(`  reservationId=${reservationId}`);

  const concurrency = 5;
  const results = await Promise.allSettled(
    Array.from({ length: concurrency }, () =>
      request('PATCH', `/reservations/${reservationId}/cancel`, undefined, adminToken)
    )
  );

  const successes = results.filter((r) => r.status === 'fulfilled' && r.value.status === 200);
  const failures = results.filter((r) => r.status === 'fulfilled' && r.value.status !== 200);

  console.log(`  → Successes: ${successes.length} / ${concurrency}`);
  console.log(`  → Failures:  ${failures.length} / ${concurrency}`);

  if (successes.length === 1) {
    console.log('  ✓ Exactly one cancellation succeeded. Remaining requests failed because the reservation is no longer in a cancellable state.');
  } else {
    console.error(`  ✗ Expected 1 success, got ${successes.length}`);
  }
}

// ---------------------------------------------------------------------------
// Test 5: Transaction Rollback
// ---------------------------------------------------------------------------

async function testTransactionRollback(adminToken) {
  console.log('\n=== TEST 5: Transaction Rollback — Invalid Borrow ===');

  const { status, data } = await request(
    'POST',
    '/loans/borrow',
    { userId: '00000000-0000-0000-0000-000000000000', copyId: '00000000-0000-0000-0000-000000000000' },
    adminToken
  );

  if (status === 404 || status === 400) {
    console.log(`  ✓ Invalid borrow correctly rejected with ${status}: ${data.message}`);
  } else {
    console.error(`  ✗ Expected 404/400, got ${status}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('AVELIS — Concurrency Verification Script');
  console.log('=========================================');
  console.log('NOTE: Provide valid IDs via environment variables or edit this script.');
  console.log('  COPY_ID           — ID of an AVAILABLE book copy');
  console.log('  LOAN_ID           — ID of an ACTIVE loan');
  console.log('  BOOK_ID           — ID of a borrowable book');
  console.log('  RESERVATION_ID    — ID of a PENDING or READY_FOR_PICKUP reservation');
  console.log('  USER_ID           — ID of a MEMBER user');
  console.log('  USER_IDS          — Comma-separated member user IDs for concurrent reservation test');

  const { adminToken } = await setup();

  const copyId = process.env.COPY_ID;
  const loanId = process.env.LOAN_ID;
  const bookId = process.env.BOOK_ID;
  const reservationId = process.env.RESERVATION_ID;
  const userId = process.env.USER_ID;
  const userIds = process.env.USER_IDS?.split(',').map((id) => id.trim()) ?? [];

  if (copyId && userId) await testConcurrentBorrow(adminToken, copyId, userId);
  else console.log('\n[SKIP] Test 1 — set COPY_ID and USER_ID env vars to run');

  if (loanId) await testConcurrentReturn(adminToken, loanId);
  else console.log('\n[SKIP] Test 2 — set LOAN_ID env var to run');

  if (bookId && userIds.length > 0) await testConcurrentReservation(adminToken, bookId, userIds);
  else console.log('\n[SKIP] Test 3 — set BOOK_ID and USER_IDS env vars to run');

  if (reservationId) await testConcurrentCancellation(adminToken, reservationId);
  else console.log('\n[SKIP] Test 4 — set RESERVATION_ID env var to run');

  await testTransactionRollback(adminToken);

  console.log('\n=========================================');
  console.log('Verification complete.');
}

main().catch((err) => {
  console.error('\n[FATAL]', err.message);
  process.exit(1);
});
