/**
 * Verification script for Phase 12.8.9 - Loan Module Production Refinement & Verification.
 * Run with: node scratch/verify_phase_12.8.9.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole, CopyStatus, LoanStatus } from '@prisma/client';

const PORT = 5556;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 12.8.9 Loan Module Final Regression Verification...\n');
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

  const uniqueBarcode = () => `BARCODE-12.8.9-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // 0. Setup test records
  console.log('Setting up database records for final regression test...');
  
  const memberUser = await prisma.user.create({
    data: {
      username: `member_1289_${Date.now()}`,
      email: `member_1289_${Date.now()}@test.com`,
      passwordHash: 'hashed',
      role: UserRole.MEMBER,
      isActive: true
    }
  });

  const adminUser = await prisma.user.create({
    data: {
      username: `admin_1289_${Date.now()}`,
      email: `admin_1289_${Date.now()}@test.com`,
      passwordHash: 'hashed',
      role: UserRole.ADMIN,
      isActive: true
    }
  });

  const book1 = await prisma.book.create({
    data: {
      title: 'Regression Book 1',
      isbn: `ISBN-1289-1-${Date.now()}`,
      isBorrowable: true
    }
  });

  const copy1 = await prisma.bookCopy.create({
    data: {
      bookId: book1.id,
      barcode: uniqueBarcode(),
      status: CopyStatus.AVAILABLE
    }
  });

  const copy2 = await prisma.bookCopy.create({
    data: {
      bookId: book1.id,
      barcode: uniqueBarcode(),
      status: CopyStatus.AVAILABLE
    }
  });

  console.log('Database setup complete. Generating JWT tokens...');
  const memberToken = generateToken({ id: memberUser.id, email: memberUser.email, role: memberUser.role });
  const adminToken = generateToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });

  let memberLoanId = null;
  let adminLoanId = null;

  // Start the server
  const server = app.listen(PORT, async () => {
    try {
      // 1. Member Borrow Book
      console.log('\n--- 1. Member Borrow Book (POST /loans) ---');
      const resMemBorrow = await fetch(`${BASE_URL}/loans`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${memberToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bookCopyId: copy1.id })
      });
      assert(resMemBorrow.status === 201, 'Member borrow successful (201 Created)');
      const bodyMemBorrow = await resMemBorrow.json();
      assert(bodyMemBorrow.success === true, 'Member borrow success envelope is true');
      memberLoanId = bodyMemBorrow.data.id;
      assert(memberLoanId, 'Retrieved created member loan ID');

      // 2. Admin Borrow Book
      console.log('\n--- 2. Admin Borrow Book (POST /admin/loans) ---');
      const resAdminBorrow = await fetch(`${BASE_URL}/admin/loans`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: memberUser.id, copyId: copy2.id })
      });
      assert(resAdminBorrow.status === 201, 'Admin borrow successful (201 Created)');
      const bodyAdminBorrow = await resAdminBorrow.json();
      adminLoanId = bodyAdminBorrow.data.id;
      assert(adminLoanId, 'Retrieved created admin loan ID');

      // 3. Get Loan By ID
      console.log('\n--- 3. Get Loan By ID (GET /loans/:loanId) ---');
      const resGetLoan = await fetch(`${BASE_URL}/loans/${memberLoanId}`, {
        headers: { Authorization: `Bearer ${memberToken}` }
      });
      assert(resGetLoan.status === 200, 'Member gets their own loan successfully (200 OK)');
      const bodyGetLoan = await resGetLoan.json();
      assert(bodyGetLoan.data.id === memberLoanId, 'Loan ID in response matches');
      assert(bodyGetLoan.data.bookCopy.book.title === book1.title, 'Nested relations fetched successfully');

      // 4. Get My Active Loans
      console.log('\n--- 4. Get My Active Loans (GET /loans/active) ---');
      const resActive = await fetch(`${BASE_URL}/loans/active`, {
        headers: { Authorization: `Bearer ${memberToken}` }
      });
      assert(resActive.status === 200, 'Get active loans returns 200 OK');
      const bodyActive = await resActive.json();
      assert(bodyActive.data.length >= 2, 'Member has active loans in listing');

      // 5. Renew Loan
      console.log('\n--- 5. Renew Loan (PATCH /loans/:loanId/renew) ---');
      const resRenew = await fetch(`${BASE_URL}/loans/${memberLoanId}/renew`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${memberToken}` }
      });
      assert(resRenew.status === 200, 'Renew loan returns 200 OK');
      const bodyRenew = await resRenew.json();
      assert(bodyRenew.data.renewCount === 1, 'Loan renew count incremented to 1');

      // 6. Overdue Status Sync (POST /loans/overdue/sync)
      console.log('\n--- 6. Sync Overdue Loans ---');
      // Set the due date of member loan to past to trigger overdue sync
      await prisma.loan.update({
        where: { id: memberLoanId },
        data: { dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
      const resSync = await fetch(`${BASE_URL}/loans/overdue/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resSync.status === 200, 'Sync overdue status returns 200 OK');
      const bodySync = await resSync.json();
      assert(bodySync.data.updatedCount >= 1, 'Overdue status updated successfully');

      // 7. Get Loan History (GET /loans/history)
      console.log('\n--- 7. Loan History ---');
      const resHistory = await fetch(`${BASE_URL}/loans/history?status=OVERDUE`, {
        headers: { Authorization: `Bearer ${memberToken}` }
      });
      assert(resHistory.status === 200, 'Retrieve loan history returns 200 OK');
      const bodyHistory = await resHistory.json();
      assert(bodyHistory.data.loans.length >= 1, 'Loan history contains past loans');

      // 8. Admin Loan Management / Listing (GET /api/v1/admin/loans)
      console.log('\n--- 8. Admin Loan Listing ---');
      const resAdminLoans = await fetch(`${BASE_URL}/admin/loans?status=OVERDUE`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resAdminLoans.status === 200, 'Admin loan listing returns 200 OK');
      const bodyAdminLoans = await resAdminLoans.json();
      assert(bodyAdminLoans.data.some(l => l.id === memberLoanId), 'Listing returns synchronized overdue loan');

      // 9. Member Return Book
      console.log('\n--- 9. Member Return Book (POST /loans/:loanId/return) ---');
      const resMemReturn = await fetch(`${BASE_URL}/loans/${memberLoanId}/return`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${memberToken}` }
      });
      assert(resMemReturn.status === 200, 'Member return returns 200 OK');
      const bodyMemReturn = await resMemReturn.json();
      assert(bodyMemReturn.data.status === LoanStatus.RETURNED, 'Loan status updated to RETURNED');

      // 10. Admin Return Book
      console.log('\n--- 10. Admin Return Book (POST /loans/:id/return) ---');
      const resAdminReturn = await fetch(`${BASE_URL}/loans/${adminLoanId}/return`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resAdminReturn.status === 200, 'Admin return returns 200 OK');
      const bodyAdminReturn = await resAdminReturn.json();
      assert(bodyAdminReturn.data.status === LoanStatus.RETURNED, 'Loan status updated to RETURNED');

    } catch (e) {
      console.error('Final Regression check failed with exception:', e);
    } finally {
      // Cleanup database records
      console.log('\nCleaning up database records...');
      if (memberLoanId) {
        await prisma.loan.deleteMany({ where: { id: { in: [memberLoanId, adminLoanId] } } });
      }
      await prisma.bookCopy.deleteMany({ where: { id: { in: [copy1.id, copy2.id] } } });
      await prisma.book.delete({ where: { id: book1.id } });
      await prisma.user.deleteMany({ where: { id: { in: [memberUser.id, adminUser.id] } } });

      // Close the server and end process
      server.close(() => {
        console.log('HTTP server closed.');
        console.log(`\nVerification finished: ${passedCount}/${totalCount} checks passed.`);
        if (passedCount === totalCount) {
          console.log('All Loan Module workflows and refined features verified successfully!');
          process.exit(0);
        } else {
          process.exit(1);
        }
      });
    }
  });
}

runTests().catch((err) => {
  console.error('Fatal unhandled error:', err);
  process.exit(1);
});
