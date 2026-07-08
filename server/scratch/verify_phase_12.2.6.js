/**
 * Verification script for Phase 12.2.6 - Book Copy Availability Checks.
 * Run with: node scratch/verify_phase_12.2.6.js
 */

import { prisma } from '../src/lib/prisma.js';
import { memberBorrowBook } from '../src/services/loan.service.js';
import { UserRole, CopyStatus } from '@prisma/client';

async function runTests() {
  console.log('Running Phase 12.2.6 database-backed unit verification...\n');
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

  // B. Soft-deleted book and its copy
  const deletedBook = await prisma.book.create({
    data: {
      title: 'Soft Deleted Book',
      isbn: `ISBN-DEL-${Date.now()}`,
      isDeleted: true
    }
  });
  const copyOfDeletedBook = await prisma.bookCopy.create({
    data: {
      bookId: deletedBook.id,
      barcode: uniqueBarcode(),
      status: CopyStatus.AVAILABLE
    }
  });

  // C. Non-borrowable book and its copy
  const nonBorrowableBook = await prisma.book.create({
    data: {
      title: 'Non Borrowable Book',
      isbn: `ISBN-NON-${Date.now()}`,
      isBorrowable: false
    }
  });
  const copyOfNonBorrowableBook = await prisma.bookCopy.create({
    data: {
      bookId: nonBorrowableBook.id,
      barcode: uniqueBarcode(),
      status: CopyStatus.AVAILABLE
    }
  });

  // D. Copy that is not AVAILABLE (e.g. BORROWED)
  const borrowableBook = await prisma.book.create({
    data: {
      title: 'Borrowable Book',
      isbn: `ISBN-OK-${Date.now()}`,
      isBorrowable: true
    }
  });
  const unavailableCopy = await prisma.bookCopy.create({
    data: {
      bookId: borrowableBook.id,
      barcode: uniqueBarcode(),
      status: CopyStatus.BORROWED
    }
  });

  // E. Valid AVAILABLE copy
  const availableCopy = await prisma.bookCopy.create({
    data: {
      bookId: borrowableBook.id,
      barcode: uniqueBarcode(),
      status: CopyStatus.AVAILABLE
    }
  });

  console.log('Setup finished. Running tests...');

  // Test 1: Non-existent copy -> HTTP 404
  try {
    const nonExistentId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    await memberBorrowBook({ userId: member.id, bookCopyId: nonExistentId });
    assert(false, 'Should have failed for non-existent copy');
  } catch (error) {
    assert(
      error.statusCode === 404 && error.message === 'Book copy not found.',
      'Non-existent bookCopyId throws 404 "Book copy not found."'
    );
  }

  // Test 2: Copy belonging to a soft-deleted book -> HTTP 404
  try {
    await memberBorrowBook({ userId: member.id, bookCopyId: copyOfDeletedBook.id });
    assert(false, 'Should have failed for soft-deleted book');
  } catch (error) {
    assert(
      error.statusCode === 404 && error.message === 'Book not found.',
      'Copy belonging to a soft-deleted book throws 404 "Book not found."'
    );
  }

  // Test 3: Copy belonging to a non-borrowable book -> HTTP 400
  try {
    await memberBorrowBook({ userId: member.id, bookCopyId: copyOfNonBorrowableBook.id });
    assert(false, 'Should have failed for non-borrowable book');
  } catch (error) {
    assert(
      error.statusCode === 400 && error.message === 'Book is not borrowable.',
      'Copy belonging to a non-borrowable book throws 400 "Book is not borrowable."'
    );
  }

  // Test 4: Copy with status other than AVAILABLE (e.g. BORROWED) -> HTTP 409
  try {
    await memberBorrowBook({ userId: member.id, bookCopyId: unavailableCopy.id });
    assert(false, 'Should have failed for unavailable copy');
  } catch (error) {
    assert(
      error.statusCode === 409 && error.message === 'Requested book copy is not available.',
      'Unavailable copy throws 409 "Requested book copy is not available."'
    );
  }

  // Test 5: Valid AVAILABLE copy belonging to a borrowable book -> proceeds to createLoan() throwing 501
  try {
    await memberBorrowBook({ userId: member.id, bookCopyId: availableCopy.id });
    assert(false, 'Should have thrown 501 for createLoan');
  } catch (error) {
    assert(
      error.statusCode === 501 && error.message === 'Prisma database transaction for loan creation has not yet been implemented.',
      'Valid AVAILABLE copy passes all checks and reaches createLoan() throwing 501'
    );
  }

  // 99. Cleanup
  console.log('\nCleaning up database records...');
  // Delete created users
  await prisma.user.delete({
    where: { id: member.id }
  });

  // Delete created copies
  await prisma.bookCopy.deleteMany({
    where: {
      id: {
        in: [copyOfDeletedBook.id, copyOfNonBorrowableBook.id, unavailableCopy.id, availableCopy.id]
      }
    }
  });

  // Delete created books
  await prisma.book.deleteMany({
    where: {
      id: {
        in: [deletedBook.id, nonBorrowableBook.id, borrowableBook.id]
      }
    }
  });

  console.log(`\nVerification finished: ${passedCount}/${totalCount} checks passed.`);
  if (passedCount === totalCount) {
    console.log('All book copy availability checks, status codes, and error messages verified successfully!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(async (err) => {
  console.error('Unhandled error during tests:', err);
  process.exit(1);
});
