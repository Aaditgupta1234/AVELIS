/**
 * Verification script for Phase 12.2.5 - Eligibility Checks.
 * Run with: node scratch/verify_phase_12.2.5.js
 */

import { prisma } from '../src/lib/prisma.js';
import { memberBorrowBook } from '../src/services/loan.service.js';
import { UserRole, LoanStatus, CopyStatus } from '@prisma/client';

async function runTests() {
  console.log('Running Phase 12.2.5 database-backed unit verification...\n');
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
  
  // Create a base book and book copy to satisfy schema requirements (if we need to mock loans)
  const category = await prisma.category.create({
    data: { name: `Category-${Date.now()}` }
  });
  
  const book = await prisma.book.create({
    data: {
      title: 'Verification Book',
      isbn: `ISBN-${Date.now()}`
    }
  });

  const copies = [];
  for (let i = 0; i < 7; i++) {
    const copy = await prisma.bookCopy.create({
      data: {
        bookId: book.id,
        barcode: uniqueBarcode(),
        status: CopyStatus.BORROWED
      }
    });
    copies.push(copy);
  }

  // A. Admin user
  const adminUser = await prisma.user.create({
    data: {
      username: `admin_${Date.now()}`,
      email: `admin_${Date.now()}@test.com`,
      passwordHash: 'hashed',
      role: UserRole.ADMIN,
      isActive: true
    }
  });

  // B. Inactive member
  const inactiveMember = await prisma.user.create({
    data: {
      username: `inactive_${Date.now()}`,
      email: `inactive_${Date.now()}@test.com`,
      passwordHash: 'hashed',
      role: UserRole.MEMBER,
      isActive: false
    }
  });

  // C. Member with exactly 5 active loans
  const member5Loans = await prisma.user.create({
    data: {
      username: `member5_${Date.now()}`,
      email: `member5_${Date.now()}@test.com`,
      passwordHash: 'hashed',
      role: UserRole.MEMBER,
      isActive: true
    }
  });
  for (let i = 0; i < 5; i++) {
    await prisma.loan.create({
      data: {
        userId: member5Loans.id,
        copyId: copies[i].id,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: LoanStatus.BORROWED
      }
    });
  }

  // D. Member with 6 active loans (> 5)
  const member6Loans = await prisma.user.create({
    data: {
      username: `member6_${Date.now()}`,
      email: `member6_${Date.now()}@test.com`,
      passwordHash: 'hashed',
      role: UserRole.MEMBER,
      isActive: true
    }
  });
  for (let i = 0; i < 6; i++) {
    await prisma.loan.create({
      data: {
        userId: member6Loans.id,
        copyId: copies[i].id,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: LoanStatus.BORROWED
      }
    });
  }

  // E. Active member with < 5 active loans (0 loans)
  const eligibleMember = await prisma.user.create({
    data: {
      username: `eligible_${Date.now()}`,
      email: `eligible_${Date.now()}@test.com`,
      passwordHash: 'hashed',
      role: UserRole.MEMBER,
      isActive: true
    }
  });

  const dummyCopyId = '550e8400-e29b-41d4-a716-446655440000';
  console.log('Setup finished. Running tests...');

  // Test 1: Non-existent user -> HTTP 404
  try {
    const nonExistentId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    await memberBorrowBook({ userId: nonExistentId, bookCopyId: dummyCopyId });
    assert(false, 'Should have failed for non-existent user');
  } catch (error) {
    assert(
      error.statusCode === 404 && error.message === 'User not found.',
      'Non-existent user throws 404 "User not found."'
    );
  }

  // Test 2: User with non-MEMBER role -> HTTP 403
  try {
    await memberBorrowBook({ userId: adminUser.id, bookCopyId: dummyCopyId });
    assert(false, 'Should have failed for non-member user');
  } catch (error) {
    assert(
      error.statusCode === 403 && error.message === 'Access denied. Member privileges required.',
      'Admin user role throws 403 "Access denied. Member privileges required."'
    );
  }

  // Test 3: Inactive member -> HTTP 403
  try {
    await memberBorrowBook({ userId: inactiveMember.id, bookCopyId: dummyCopyId });
    assert(false, 'Should have failed for inactive member');
  } catch (error) {
    assert(
      error.statusCode === 403 && error.message === 'Member account is inactive.',
      'Inactive member throws 403 "Member account is inactive."'
    );
  }

  // Test 4: Member with exactly 5 active loans -> HTTP 403
  try {
    await memberBorrowBook({ userId: member5Loans.id, bookCopyId: dummyCopyId });
    assert(false, 'Should have failed for member with 5 active loans');
  } catch (error) {
    assert(
      error.statusCode === 403 && error.message === 'Borrowing limit reached. Maximum allowed active loans is 5.',
      'Member with exactly 5 active loans throws 403 "Borrowing limit reached. Maximum allowed active loans is 5."'
    );
  }

  // Test 5: Member with more than 5 active loans -> HTTP 403
  try {
    await memberBorrowBook({ userId: member6Loans.id, bookCopyId: dummyCopyId });
    assert(false, 'Should have failed for member with 6 active loans');
  } catch (error) {
    assert(
      error.statusCode === 403 && error.message === 'Borrowing limit reached. Maximum allowed active loans is 5.',
      'Member with 6 active loans throws 403 "Borrowing limit reached. Maximum allowed active loans is 5."'
    );
  }

  // Test 6: Active MEMBER with < 5 active loans -> Passes eligibility, throws 501 from copy availability
  try {
    await memberBorrowBook({ userId: eligibleMember.id, bookCopyId: dummyCopyId });
    assert(false, 'Should have thrown 501 for book copy availability');
  } catch (error) {
    assert(
      error.statusCode === 501 && error.message === 'Book copy availability checks have not yet been implemented.',
      'Eligible member passes eligibility checks and proceeds to checkBookCopyAvailability() throwing 501'
    );
  }

  // 99. Cleanup
  console.log('\nCleaning up database records...');
  // Delete created loans
  await prisma.loan.deleteMany({
    where: {
      userId: {
        in: [member5Loans.id, member6Loans.id]
      }
    }
  });

  // Delete created users
  await prisma.user.deleteMany({
    where: {
      id: {
        in: [adminUser.id, inactiveMember.id, member5Loans.id, member6Loans.id, eligibleMember.id]
      }
    }
  });

  // Delete created copies & books & categories
  await prisma.bookCopy.deleteMany({
    where: {
      id: {
        in: copies.map(c => c.id)
      }
    }
  });
  await prisma.book.delete({
    where: {
      id: book.id
    }
  });
  await prisma.category.delete({
    where: {
      id: category.id
    }
  });

  console.log(`\nVerification finished: ${passedCount}/${totalCount} checks passed.`);
  if (passedCount === totalCount) {
    console.log('All eligibility checks, status codes, and error messages verified successfully!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(async (err) => {
  console.error('Unhandled error during tests:', err);
  process.exit(1);
});
