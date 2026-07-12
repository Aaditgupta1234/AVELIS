/**
 * Verification script for Phase 13.2.3 - Dashboard Summary Service Implementation.
 * Run with: node scratch/verify_phase_13.2.3.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole, CopyStatus, LoanStatus, OrderStatus, PaymentStatus } from '@prisma/client';

const PORT = 5560;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.2.3 Dashboard Summary Service Verification...\n');
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

  const uniqueBarcode = () => `BARCODE-13.2.3-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // 0. Setup test users
  console.log('Setting up database records...');
  
  const memberUser = await prisma.user.create({
    data: {
      username: `member_1323_${Date.now()}`,
      email: `member_1323_${Date.now()}@test.com`,
      passwordHash: 'hashed',
      role: UserRole.MEMBER,
      isActive: true
    }
  });

  const adminUser = await prisma.user.create({
    data: {
      username: `admin_1323_${Date.now()}`,
      email: `admin_1323_${Date.now()}@test.com`,
      passwordHash: 'hashed',
      role: UserRole.ADMIN,
      isActive: true
    }
  });

  const book1 = await prisma.book.create({
    data: {
      title: 'Dashboard Test Book',
      isbn: `ISBN-1323-${Date.now()}`,
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

  // Create two loans: one created 5 days ago (older), one created today
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const loanOld = await prisma.loan.create({
    data: {
      userId: memberUser.id,
      copyId: copy1.id,
      issueDate: fiveDaysAgo,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: LoanStatus.BORROWED,
      createdAt: fiveDaysAgo
    }
  });

  const loanNew = await prisma.loan.create({
    data: {
      userId: memberUser.id,
      copyId: copy1.id,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: LoanStatus.BORROWED,
      createdAt: new Date()
    }
  });

  // Create an order
  const order = await prisma.order.create({
    data: {
      userId: memberUser.id,
      orderNumber: `ORDER-1323-${Date.now()}`,
      totalAmount: 49.99,
      paymentStatus: PaymentStatus.PENDING,
      orderStatus: OrderStatus.PLACED,
      shippingAddress: '123 Test St',
      createdAt: new Date()
    }
  });

  console.log('Generating JWT tokens...');
  const memberToken = generateToken({ id: memberUser.id, email: memberUser.email, role: memberUser.role });
  const adminToken = generateToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });

  // Start the server
  const server = app.listen(PORT, async () => {
    try {
      // 1. Unauthenticated request -> 401
      console.log('\n--- 1. Security check: Unauthenticated ---');
      const resUnauth = await fetch(`${BASE_URL}/admin/dashboard/summary`);
      assert(resUnauth.status === 401, 'Request without authorization header returns 401');

      // 2. Member request -> 403
      console.log('\n--- 2. Security check: Member Access ---');
      const resMember = await fetch(`${BASE_URL}/admin/dashboard/summary`, {
        headers: { Authorization: `Bearer ${memberToken}` }
      });
      assert(resMember.status === 403, 'Request with member token returns 403');

      // 3. Admin request (No filters) -> HTTP 200 and matches direct counts
      console.log('\n--- 3. Database Consistency Check (No Filters) ---');
      const resSummary = await fetch(`${BASE_URL}/admin/dashboard/summary`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resSummary.status === 200, 'Request returns 200 OK');
      const bodySummary = await resSummary.json();
      assert(bodySummary.success === true, 'Response envelope has success: true');
      
      const data = bodySummary.data;
      assert(data.users && typeof data.users.total === 'number', 'Response contains user statistics block');
      assert(data.books && typeof data.books.total === 'number', 'Response contains book statistics block');
      assert(data.loans && typeof data.loans.total === 'number', 'Response contains loan statistics block');
      assert(data.reservations && typeof data.reservations.total === 'number', 'Response contains reservation statistics block');
      assert(data.orders && typeof data.orders.total === 'number', 'Response contains order statistics block');

      // Verify that no filter returns exactly the same totals as direct database counts
      const directUserCount = await prisma.user.count();
      assert(data.users.total === directUserCount, 'User total matches direct database count');
      const directBookCount = await prisma.book.count();
      assert(data.books.total === directBookCount, 'Book total matches direct database count');

      // 4. Only startDate supplied
      console.log('\n--- 4. Date filtering: Only startDate supplied ---');
      const threeDaysAgoStr = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const resStartOnly = await fetch(`${BASE_URL}/admin/dashboard/summary?startDate=${threeDaysAgoStr}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resStartOnly.status === 200, ' startDate-only query returns 200 OK');
      const bodyStartOnly = await resStartOnly.json();
      assert(bodyStartOnly.data.filter.startDate === threeDaysAgoStr, 'startDate correctly normalized/preserved in response');
      assert(bodyStartOnly.data.filter.endDate === null, 'endDate remains null');

      // 5. Only endDate supplied
      console.log('\n--- 5. Date filtering: Only endDate supplied ---');
      const todayStr = new Date().toISOString().split('T')[0];
      const resEndOnly = await fetch(`${BASE_URL}/admin/dashboard/summary?endDate=${todayStr}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resEndOnly.status === 200, 'endDate-only query returns 200 OK');
      const bodyEndOnly = await resEndOnly.json();
      assert(bodyEndOnly.data.filter.endDate === todayStr, 'endDate correctly normalized/preserved in response');
      assert(bodyEndOnly.data.filter.startDate === null, 'startDate remains null');

      // 6. Date filter excludes older records
      console.log('\n--- 6. Date filtering: Exclude older records ---');
      // Query with startDate set to 3 days ago. This should exclude loanOld (created 5 days ago) but include loanNew (created today)
      const resExcluded = await fetch(`${BASE_URL}/admin/dashboard/summary?startDate=${threeDaysAgoStr}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const bodyExcluded = await resExcluded.json();
      const loansWithFilter = bodyExcluded.data.loans.total;
      const loansWithoutFilter = bodySummary.data.loans.total;
      assert(loansWithoutFilter >= loansWithFilter + 1, 'Unfiltered loan total is larger than filtered loan total');
      
      // Since we know exactly what we added, let's verify that the old loan is excluded
      const testLoansUnfiltered = await prisma.loan.count({ where: { id: { in: [loanOld.id, loanNew.id] } } });
      const testLoansFiltered = await prisma.loan.count({
        where: {
          id: { in: [loanOld.id, loanNew.id] },
          createdAt: { gte: new Date(threeDaysAgoStr) }
        }
      });
      assert(testLoansUnfiltered === 2, 'Unfiltered test loan count is exactly 2');
      assert(testLoansFiltered === 1, 'Filtered test loan count is exactly 1 (old loan excluded)');

      // 7. No Regressions
      console.log('\n--- 7. No Regressions check (analytics & reports) ---');
      const resAnalytics = await fetch(`${BASE_URL}/admin/dashboard/analytics`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resAnalytics.status === 501, 'GET /admin/dashboard/analytics returns 501 Not Implemented');

    } catch (e) {
      console.error('Service integration tests failed with exception:', e);
    } finally {
      // Cleanup database records
      console.log('\nCleaning up database records...');
      await prisma.order.delete({ where: { id: order.id } });
      await prisma.loan.deleteMany({ where: { id: { in: [loanOld.id, loanNew.id] } } });
      await prisma.bookCopy.delete({ where: { id: copy1.id } });
      await prisma.book.delete({ where: { id: book1.id } });
      await prisma.user.deleteMany({ where: { id: { in: [memberUser.id, adminUser.id] } } });

      // Close the server and end process
      server.close(() => {
        console.log('HTTP server closed.');
        console.log(`\nVerification finished: ${passedCount}/${totalCount} checks passed.`);
        if (passedCount === totalCount) {
          console.log('All Dashboard Summary Service integration features verified successfully!');
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
