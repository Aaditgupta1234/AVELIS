/**
 * Verification script for Phase 12.2.7 - Prisma Transaction.
 * Run with: node scratch/verify_phase_12.2.7.js
 */

import { prisma } from '../src/lib/prisma.js';
import { memberBorrowBook } from '../src/services/loan.service.js';
import { UserRole, CopyStatus } from '@prisma/client';

async function runTests() {
  console.log('Running Phase 12.2.7 transaction verification...\n');
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

  // Helper to generate a unique barcode
  const uniqueBarcode = () => `BARCODE-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // 0. Setup test data
  console.log('Setting up test database records...');
  
  // A. Eligible member user
  const member = await prisma.user.create({
    data: {
      username: `member_${Date.now()}`,
      email: `member_${Date.now()}@test.com`,
      passwordHash: 'hashed',
      role: UserRole.MEMBER,
      isActive: true
    }
  });

  // B. Borrowable book and copies
  const book = await prisma.book.create({
    data: {
      title: 'Transaction Verification Book',
      isbn: `ISBN-TX-${Date.now()}`,
      isBorrowable: true
    }
  });

  // Copy for successful borrow
  const copySuccess = await prisma.bookCopy.create({
    data: {
      bookId: book.id,
      barcode: uniqueBarcode(),
      status: CopyStatus.AVAILABLE
    }
  });

  // Copy for rollback borrow
  const copyRollback = await prisma.bookCopy.create({
    data: {
      bookId: book.id,
      barcode: uniqueBarcode(),
      status: CopyStatus.AVAILABLE
    }
  });

  console.log('Setup finished. Running tests...');

  // Test 1: Successful borrow flow
  let createdLoanId = null;
  try {
    const loan = await memberBorrowBook({ userId: member.id, bookCopyId: copySuccess.id });
    
    assert(loan && loan.id, 'memberBorrowBook returns the created loan record');
    assert(loan.userId === member.id, 'Loan record contains correct userId');
    assert(loan.bookCopy?.id === copySuccess.id, 'Loan record contains correct copy relation');
    assert(loan.status === 'BORROWED', 'Loan record status is BORROWED');
    
    createdLoanId = loan.id;

    // Verify database updates
    const dbCopy = await prisma.bookCopy.findUnique({ where: { id: copySuccess.id } });
    assert(dbCopy.status === CopyStatus.BORROWED, 'Book copy status updated to BORROWED in database');
  } catch (error) {
    console.error('Test 1 failed with unexpected error:', error);
    assert(false, 'Successful borrow flow should not throw an error');
  }

  // Test 2: Transaction Rollback (Deterministic Failure)
  // We use a test harness to inject a deliberate failure inside the Prisma transaction
  // after the loan record is created but before the transaction completes.
  const originalTransaction = prisma.$transaction;
  prisma.$transaction = async (callback) => {
    return originalTransaction.call(prisma, async (tx) => {
      // Intercept tx.bookCopy.update to inject failure
      const originalUpdate = tx.bookCopy.update;
      tx.bookCopy.update = async (...args) => {
        throw new Error('Forced transaction rollback test error');
      };
      return callback(tx);
    });
  };

  try {
    console.log('\nTesting transaction rollback...');
    await memberBorrowBook({ userId: member.id, bookCopyId: copyRollback.id });
    assert(false, 'Rollback test should have thrown an error');
  } catch (error) {
    assert(
      error.message === 'Forced transaction rollback test error',
      'Transaction call fails and propagates the injected error'
    );

    // Restore original transaction method
    prisma.$transaction = originalTransaction;

    // Verify rollback:
    // A. Confirm no Loan record was created for copyRollback
    const loans = await prisma.loan.findMany({
      where: {
        userId: member.id,
        copyId: copyRollback.id
      }
    });
    assert(loans.length === 0, 'Prisma rolls back loan creation (no loan record remains in DB)');

    // B. Confirm BookCopy status is still AVAILABLE
    const dbCopyRollback = await prisma.bookCopy.findUnique({ where: { id: copyRollback.id } });
    assert(dbCopyRollback.status === CopyStatus.AVAILABLE, 'Prisma rolls back copy status update (copy status remains AVAILABLE)');
  }

  // 99. Cleanup
  console.log('\nCleaning up database records...');
  // Delete created loans
  if (createdLoanId) {
    await prisma.loan.delete({ where: { id: createdLoanId } });
  }

  // Delete created users
  await prisma.user.delete({
    where: { id: member.id }
  });

  // Delete created copies
  await prisma.bookCopy.deleteMany({
    where: {
      id: {
        in: [copySuccess.id, copyRollback.id]
      }
    }
  });

  // Delete created books
  await prisma.book.delete({
    where: { id: book.id }
  });

  console.log(`\nVerification finished: ${passedCount}/${totalCount} checks passed.`);
  if (passedCount === totalCount) {
    console.log('All transaction functionality and rollback behavior verified successfully!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(async (err) => {
  console.error('Unhandled error during tests:', err);
  process.exit(1);
});
