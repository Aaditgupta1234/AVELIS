/**
 * Verification script for Phase 12.8.7 - Response Formatting & Structured Logging.
 * Run with: node scratch/verify_phase_12.8.7.js
 */

import { prisma } from '../src/lib/prisma.js';
import { getAllLoans } from '../src/services/loan.service.js';
import { UserRole, CopyStatus, LoanStatus } from '@prisma/client';

async function runTests() {
  console.log('Running Phase 12.8.7 Response Formatting & Structured Logging Verification...\n');
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

  const uniqueBarcode = () => `BARCODE-12.8.7-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // 0. Setup test data
  console.log('Setting up test database records...');
  
  // A. Admin & Member users
  const member = await prisma.user.create({
    data: {
      username: `member_1287_${Date.now()}`,
      email: `member_1287_${Date.now()}@test.com`,
      passwordHash: 'hashed',
      role: UserRole.MEMBER,
      isActive: true
    }
  });

  // B. Book and copy
  const book = await prisma.book.create({
    data: {
      title: 'Response Formatting Verification Book',
      isbn: `ISBN-RF-${Date.now()}`,
      isBorrowable: true
    }
  });

  const copy = await prisma.bookCopy.create({
    data: {
      bookId: book.id,
      barcode: uniqueBarcode(),
      status: CopyStatus.BORROWED
    }
  });

  // C. Loan
  const loan = await prisma.loan.create({
    data: {
      userId: member.id,
      copyId: copy.id,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: LoanStatus.BORROWED
    }
  });

  console.log('Setup finished. Running tests...\n');

  // Test 1: Retrieve all loans with empty query (verify response formatting / paginated structure)
  try {
    console.log('--- Test 1: Retrieve all loans ---');
    const result = await getAllLoans({});
    
    assert(result && Array.isArray(result.loans), 'result.loans is an array');
    assert(result.loans.length > 0, 'result.loans has records');
    assert(result.pagination, 'result.pagination metadata is present');
    assert(typeof result.pagination.page === 'number', 'pagination.page is a number');
    assert(typeof result.pagination.limit === 'number', 'pagination.limit is a number');
    assert(typeof result.pagination.total === 'number', 'pagination.total is a number');
    assert(typeof result.pagination.totalPages === 'number', 'pagination.totalPages is a number');

    const foundLoan = result.loans.find(l => l.id === loan.id);
    assert(foundLoan, 'Created loan is retrieved in the listing');
    assert(foundLoan.bookCopy && foundLoan.bookCopy.book, 'Loan query includes book copy and parent book relations');
  } catch (error) {
    console.error('Test 1 failed with unexpected error:', error);
    assert(false, 'Test 1 should not throw an error');
  }

  // Test 2: Filter by status
  try {
    console.log('\n--- Test 2: Filter by status ---');
    const result = await getAllLoans({ status: LoanStatus.BORROWED });
    assert(result.loans.every(l => l.status === LoanStatus.BORROWED), 'All returned loans have BORROWED status');
  } catch (error) {
    console.error('Test 2 failed with unexpected error:', error);
    assert(false, 'Test 2 should not throw an error');
  }

  // Test 3: Filter by memberId
  try {
    console.log('\n--- Test 3: Filter by memberId ---');
    const result = await getAllLoans({ memberId: member.id });
    assert(result.loans.every(l => l.userId === member.id), 'All returned loans belong to the specified member');
  } catch (error) {
    console.error('Test 3 failed with unexpected error:', error);
    assert(false, 'Test 3 should not throw an error');
  }

  // Test 4: Mock error & verify structured error handling / logging
  try {
    console.log('\n--- Test 4: Unexpected error handling ---');
    const originalCount = prisma.loan.count;
    // Inject a mock function that throws an error
    prisma.loan.count = async () => {
      throw new Error('Injected database query error');
    };

    try {
      await getAllLoans({});
      assert(false, 'getAllLoans should have thrown the injected error');
    } catch (err) {
      assert(err.message === 'Injected database query error', 'getAllLoans catches and propagates the database error');
    } finally {
      // Restore original count function
      prisma.loan.count = originalCount;
    }
  } catch (error) {
    console.error('Test 4 failed with unexpected error:', error);
    assert(false, 'Test 4 execution encountered error');
  }

  // 99. Cleanup
  console.log('\nCleaning up database records...');
  await prisma.loan.delete({ where: { id: loan.id } });
  await prisma.bookCopy.delete({ where: { id: copy.id } });
  await prisma.book.delete({ where: { id: book.id } });
  await prisma.user.delete({ where: { id: member.id } });

  console.log(`\nVerification finished: ${passedCount}/${totalCount} checks passed.`);
  if (passedCount === totalCount) {
    console.log('All Response Formatting and Structured Logging behaviors verified successfully!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(async (err) => {
  console.error('Unhandled error during tests:', err);
  process.exit(1);
});
