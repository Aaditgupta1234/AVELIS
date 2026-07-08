/**
 * Verification script for Phase 12.2.4 - Borrow Service.
 * Run with: node scratch/verify_phase_12.2.4.js
 */

import * as loanService from '../src/services/loan.service.js';

async function runTests() {
  console.log('Running Phase 12.2.4 unit verification...\n');
  let passedCount = 0;
  let totalCount = 0;

  const assert = (condition, message) => {
    totalCount++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${message}`);
    }
  };

  // Test 1: memberBorrowBook is exported
  assert(
    typeof loanService.memberBorrowBook === 'function',
    'memberBorrowBook() is exported as a public function'
  );

  // Test 2: Encapsulation - helper functions are private / NOT exported
  const privateHelpers = [
    'validateBorrowRequest',
    'checkBorrowEligibility',
    'checkBookCopyAvailability',
    'createLoan'
  ];
  for (const helper of privateHelpers) {
    assert(
      loanService[helper] === undefined,
      `Internal helper "${helper}" is private and not part of the module's public interface`
    );
  }

  // Test 3: Runtime verification - missing userId throws 400 ApiError
  try {
    await loanService.memberBorrowBook({ bookCopyId: '550e8400-e29b-41d4-a716-446655440000' });
    assert(false, 'memberBorrowBook should throw 400 if userId is missing');
  } catch (error) {
    assert(
      error.statusCode === 400 && error.message === 'userId is required.',
      'Defensive parameter validation correctly rejects missing userId with 400'
    );
  }

  // Test 4: Runtime verification - missing bookCopyId throws 400 ApiError
  try {
    await loanService.memberBorrowBook({ userId: '00000000-0000-0000-0000-000000000001' });
    assert(false, 'memberBorrowBook should throw 400 if bookCopyId is missing');
  } catch (error) {
    assert(
      error.statusCode === 400 && error.message === 'bookCopyId is required.',
      'Defensive parameter validation correctly rejects missing bookCopyId with 400'
    );
  }

  // Test 5: Runtime verification - valid parameters trigger orchestration and hit first 501 placeholder
  try {
    await loanService.memberBorrowBook({
      userId: '00000000-0000-0000-0000-000000000001',
      bookCopyId: '550e8400-e29b-41d4-a716-446655440000'
    });
    assert(false, 'memberBorrowBook should throw 501');
  } catch (error) {
    assert(
      error.statusCode === 501 && error.message === 'Borrow eligibility checks have not yet been implemented.',
      'Orchestration flow successfully executes validateBorrowRequest and reaches checkBorrowEligibility throwing 501'
    );
  }

  console.log(`\nVerification finished: ${passedCount}/${totalCount} checks passed.`);
  if (passedCount === totalCount) {
    console.log('All contract, encapsulation, and orchestration checks passed successfully!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Unhandled error during tests:', err);
  process.exit(1);
});
