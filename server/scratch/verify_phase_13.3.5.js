/**
 * Verification script for Phase 13.3.5 - Time-Series Analytics API.
 * Run with: node scratch/verify_phase_13.3.5.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole, CopyStatus, LoanStatus } from '@prisma/client';

const PORT = 5568;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.3.5 Time-Series Analytics Verification...\n');
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

  // Seed data holders for cleanup
  let adminUser;
  const createdUserIds = [];
  let bookActive, bookDeleted, copy;
  const createdLoanIds = [];
  const createdReservationIds = [];
  const createdOrderIds = [];
  const createdReviewIds = [];

  try {
    // 0. Setup test users
    console.log('Setting up database users...');
    const createUser = async (username, role, createdAt) => {
      const user = await prisma.user.create({
        data: {
          username,
          email: `${username}@test.com`,
          passwordHash: 'hashed',
          role,
          isActive: true,
          createdAt: new Date(createdAt)
        }
      });
      createdUserIds.push(user.id);
      return user;
    };

    adminUser = await createUser(`admin_1335_${Date.now()}`, UserRole.ADMIN, '2026-07-09T10:00:00.000Z');
    const adminToken = generateToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });

    // Seed Member Users on specific dates (including boundary checking)
    // Member 1: registered 2026-07-10T12:00:00Z
    const u1 = await createUser(`member_u1_1335_${Date.now()}`, UserRole.MEMBER, '2026-07-10T12:00:00.000Z');
    // Member 2: registered 2026-07-11T23:59:59.999Z (boundary check!)
    const u2 = await createUser(`member_u2_1335_${Date.now()}`, UserRole.MEMBER, '2026-07-11T23:59:59.999Z');
    // Member 3: registered 2026-07-12T00:00:00.001Z (boundary check!)
    const u3 = await createUser(`member_u3_1335_${Date.now()}`, UserRole.MEMBER, '2026-07-12T00:00:00.001Z');
    // Non-cohort user: Admin 2 (User 6) registered 2026-07-10T12:00:00Z (should be excluded!)
    const u6Admin = await createUser(`admin_u6_1335_${Date.now()}`, UserRole.ADMIN, '2026-07-10T12:00:00.000Z');

    const memberToken = generateToken({ id: u1.id, email: u1.email, role: u1.role });

    console.log('Setting up books and copies...');
    bookActive = await prisma.book.create({ data: { title: 'Active Book', isbn: `isbn_active_1335_${Date.now()}`, isDeleted: false } });
    createdBookIds.push(bookActive.id);
    bookDeleted = await prisma.book.create({ data: { title: 'Deleted Book', isbn: `isbn_del_1335_${Date.now()}`, isDeleted: true } });
    createdBookIds.push(bookDeleted.id);

    copy = await prisma.bookCopy.create({ data: { bookId: bookActive.id, barcode: `bc_1335_${Date.now()}`, status: CopyStatus.AVAILABLE } });

    console.log('Seeding transaction activity records...');
    
    // 1. Loans: User 1 loan created 2026-07-10T08:00:00Z
    const loan = await prisma.loan.create({
      data: {
        userId: u1.id,
        copyId: copy.id,
        status: LoanStatus.BORROWED,
        issueDate: new Date('2026-07-10T08:00:00.000Z'),
        dueDate: new Date('2026-07-24T08:00:00.000Z'),
        createdAt: new Date('2026-07-10T08:00:00.000Z')
      }
    });
    createdLoanIds.push(loan.id);

    // 2. Reservations: User 1 reservation created 2026-07-11T12:00:00Z
    const reservation = await prisma.reservation.create({
      data: {
        userId: u1.id,
        bookId: bookActive.id,
        createdAt: new Date('2026-07-11T12:00:00.000Z')
      }
    });
    createdReservationIds.push(reservation.id);

    // 3. Orders: User 1 order created 2026-07-12T15:00:00Z
    const order = await prisma.order.create({
      data: {
        userId: u1.id,
        orderNumber: `order_1335_${Date.now()}`,
        totalAmount: 25.00,
        paymentStatus: 'PENDING',
        orderStatus: 'PLACED',
        shippingAddress: '123 library lane',
        createdAt: new Date('2026-07-12T15:00:00.000Z')
      }
    });
    createdOrderIds.push(order.id);

    // 4. Reviews:
    // User 1 review on Active Book: rating 5, 2026-07-13T10:00:00Z
    const reviewActive = await prisma.review.create({
      data: {
        userId: u1.id,
        bookId: bookActive.id,
        rating: 5,
        comment: 'nice',
        createdAt: new Date('2026-07-13T10:00:00.000Z')
      }
    });
    createdReviewIds.push(reviewActive.id);

    // User 1 review on Deleted Book: rating 5, 2026-07-10T10:00:00Z (should be excluded!)
    const reviewDeleted = await prisma.review.create({
      data: {
        userId: u2.id,
        bookId: bookDeleted.id,
        rating: 5,
        comment: 'ignored',
        createdAt: new Date('2026-07-10T10:00:00.000Z')
      }
    });
    createdReviewIds.push(reviewDeleted.id);

    console.log('Starting HTTP server...');
    const server = app.listen(PORT, async () => {
      try {
        // 1. Security Check
        console.log('\n--- 1. Security Check ---');
        const resUnauth = await fetch(`${BASE_URL}/admin/dashboard/analytics/timeseries`);
        assert(resUnauth.status === 401, 'Unauthenticated request returns 401');

        const resMember = await fetch(`${BASE_URL}/admin/dashboard/analytics/timeseries`, {
          headers: { Authorization: `Bearer ${memberToken}` }
        });
        assert(resMember.status === 403, 'Member request returns 403 Forbidden');

        // 2. Schema Check
        console.log('\n--- 2. Schema Check ---');
        const resAll = await fetch(`${BASE_URL}/admin/dashboard/analytics/timeseries`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert(resAll.status === 200, 'Admin request returns 200 OK');
        const bodyAll = await resAll.json();
        assert(bodyAll.success === true, 'Success field is true in response envelope');
        assert(Array.isArray(bodyAll.data.timeline), 'timeline is an array');

        // 3. Daily grouping, Gap filling, and UTC Boundaries verification
        console.log('\n--- 3. Daily Grouping, Boundaries & Gap-Filling ---');
        // Range: 2026-07-10 to 2026-07-15
        const resDaily = await fetch(`${BASE_URL}/admin/dashboard/analytics/timeseries?startDate=2026-07-10&endDate=2026-07-15&interval=day`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert(resDaily.status === 200, 'GET ?interval=day returns 200');
        const bodyDaily = await resDaily.json();
        const dailyTimeline = bodyDaily.data.timeline;
        
        assert(dailyTimeline.length === 6, `dailyTimeline has 6 days (got ${dailyTimeline.length}) — Verifies Gap-filling up to July 15`);
        
        const dailyMap = {};
        dailyTimeline.forEach(t => dailyMap[t.period] = t);

        // July 10: 1 loan (loan 1), 1 registration (u1), 0 reviews (deleted book review u2 on book4 is excluded!)
        assert(dailyMap['2026-07-10'].loans === 1, 'July 10 loans is 1');
        assert(dailyMap['2026-07-10'].registrations === 1, 'July 10 registrations is 1 (MEMBER only)');
        assert(dailyMap['2026-07-10'].reviews === 0, 'July 10 reviews is 0 (soft-deleted book review excluded)');

        // July 11: 1 registration (u2), 1 reservation
        assert(dailyMap['2026-07-11'].registrations === 1, 'July 11 registrations is 1 (Midnight UTC boundary check - 23:59:59.999Z)');
        assert(dailyMap['2026-07-11'].reservations === 1, 'July 11 reservations is 1');

        // July 12: 1 registration (u3), 1 order
        assert(dailyMap['2026-07-12'].registrations === 1, 'July 12 registrations is 1 (Midnight UTC boundary check - 00:00:00.001Z)');
        assert(dailyMap['2026-07-12'].orders === 1, 'July 12 orders is 1');

        // July 13: 1 review
        assert(dailyMap['2026-07-13'].reviews === 1, 'July 13 reviews is 1 (active book review)');

        // July 14 & 15: 0 for all (gap filling)
        assert(dailyMap['2026-07-14'].loans === 0 && dailyMap['2026-07-14'].orders === 0, 'July 14 has zero values (gap filling)');
        assert(dailyMap['2026-07-15'].loans === 0 && dailyMap['2026-07-15'].orders === 0, 'July 15 has zero values (gap filling)');

        // 4. Weekly grouping verification
        console.log('\n--- 4. Weekly Grouping Check ---');
        // 2026-07-10 (Fri), 2026-07-11 (Sat), 2026-07-12 (Sun) -> 2026-W28
        // 2026-07-13 (Mon) to 2026-07-15 -> 2026-W29
        const resWeekly = await fetch(`${BASE_URL}/admin/dashboard/analytics/timeseries?startDate=2026-07-10&endDate=2026-07-15&interval=week`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert(resWeekly.status === 200, 'GET ?interval=week returns 200');
        const bodyWeekly = await resWeekly.json();
        const weeklyTimeline = bodyWeekly.data.timeline;
        assert(weeklyTimeline.length === 2, `weeklyTimeline has 2 weeks (got ${weeklyTimeline.length})`);
        
        const weeklyMap = {};
        weeklyTimeline.forEach(t => weeklyMap[t.period] = t);
        
        assert(weeklyMap['2026-W28'].loans === 1, '2026-W28 has 1 loan');
        assert(weeklyMap['2026-W28'].registrations === 3, '2026-W28 has 3 registrations (u1, u2, u3)');
        assert(weeklyMap['2026-W28'].reservations === 1, '2026-W28 has 1 reservation');
        assert(weeklyMap['2026-W28'].orders === 1, '2026-W28 has 1 order');
        assert(weeklyMap['2026-W28'].reviews === 0, '2026-W28 has 0 reviews');

        assert(weeklyMap['2026-W29'].reviews === 1, '2026-W29 has 1 review (July 13)');
        assert(weeklyMap['2026-W29'].loans === 0, '2026-W29 has 0 loans');

        // 5. Monthly grouping verification
        console.log('\n--- 5. Monthly Grouping Check ---');
        const resMonthly = await fetch(`${BASE_URL}/admin/dashboard/analytics/timeseries?startDate=2026-07-10&endDate=2026-07-15&interval=month`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert(resMonthly.status === 200, 'GET ?interval=month returns 200');
        const bodyMonthly = await resMonthly.json();
        const monthlyTimeline = bodyMonthly.data.timeline;
        assert(monthlyTimeline.length === 1, `monthlyTimeline has 1 month (got ${monthlyTimeline.length})`);
        assert(monthlyTimeline[0].period === '2026-07', 'Month period is 2026-07');
        assert(monthlyTimeline[0].loans === 1, 'July has 1 loan');
        assert(monthlyTimeline[0].registrations === 3, 'July has 3 registrations');
        assert(monthlyTimeline[0].reservations === 1, 'July has 1 reservation');
        assert(monthlyTimeline[0].orders === 1, 'July has 1 order');
        assert(monthlyTimeline[0].reviews === 1, 'July has 1 review');

        // 6. Validation checks
        console.log('\n--- 6. Validation Failure Checks ---');
        await testInvalidParam('startDate=invalid');
        await testInvalidParam('startDate=2026-07-12&endDate=2026-07-10');
        await testInvalidParam('interval=invalid');
        await testInvalidParam('interval=year');

        // 7. Regression check
        console.log('\n--- 7. Regression Checks ---');
        const checkRoute200 = async (url) => {
          const res = await fetch(`${BASE_URL}/${url}`, { headers: { Authorization: `Bearer ${adminToken}` } });
          assert(res.status === 200, `GET /${url} returns HTTP 200`);
        };
        await checkRoute200('admin/dashboard/summary');
        await checkRoute200('admin/dashboard/analytics/borrowing');
        await checkRoute200('admin/dashboard/analytics/members');
        await checkRoute200('admin/dashboard/analytics/ratings');

      } catch (err) {
        console.error('Test execution failed with error:', err);
      } finally {
        // Cleanup database records
        console.log('\nCleaning up database records...');
        try {
          await prisma.review.deleteMany({ where: { id: { in: createdReviewIds } } });
          await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } });
          await prisma.reservation.deleteMany({ where: { id: { in: createdReservationIds } } });
          await prisma.loan.deleteMany({ where: { id: { in: createdLoanIds } } });
          await prisma.bookCopy.deleteMany({ where: { id: copy.id } });
          await prisma.book.deleteMany({ where: { id: { in: createdBookIds } } });
          await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
          console.log('Cleanup successful.');
        } catch (cleanupErr) {
          console.error('Database cleanup error:', cleanupErr);
        }

        try {
          await prisma.$disconnect();
        } catch (disconnectErr) {
          console.error('Prisma disconnect error:', disconnectErr);
        }

        // Close server
        server.close(() => {
          console.log('HTTP server closed.');
          console.log(`\nVerification finished: ${passedCount}/${totalCount} checks passed.`);
          if (passedCount === totalCount) {
            console.log('All Time-Series Analytics checks verified successfully!');
            setTimeout(() => process.exit(0), 100);
          } else {
            console.log('Some checks failed.');
            setTimeout(() => process.exit(1), 100);
          }
        });
      }
    });

  } catch (e) {
    console.error('Fatal initialization error:', e);
    process.exit(1);
  }
}

// Global helper to check validation 400
async function testInvalidParam(qs) {
  const adminUserTemp = await prisma.user.findFirst({ where: { role: UserRole.ADMIN } });
  const adminToken = generateToken({ id: adminUserTemp.id, email: adminUserTemp.email, role: adminUserTemp.role });
  const res = await fetch(`${BASE_URL}/admin/dashboard/analytics/timeseries?${qs}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  if (res.status === 400) {
    console.log(`[PASS] Query ?${qs} returns HTTP 400`);
  } else {
    console.error(`[FAIL] Query ?${qs} returns HTTP 400 (got ${res.status})`);
  }
}

// Global list of books created to delete
const createdBookIds = [];

runTests().catch((err) => {
  console.error('Unhandled fatal exception:', err);
  process.exit(1);
});
