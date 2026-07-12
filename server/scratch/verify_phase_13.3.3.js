/**
 * Verification script for Phase 13.3.3 - Member Analytics API.
 * Run with: node scratch/verify_phase_13.3.3.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole, CopyStatus, LoanStatus } from '@prisma/client';

const PORT = 5566;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.3.3 Member Analytics Verification...\n');
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
  let testAdminUser;
  const createdUserIds = [];
  let book, copy1, copy2;
  const createdLoanIds = [];

  try {
    // 0. Setup admin user for requests
    console.log('Setting up database users...');
    testAdminUser = await prisma.user.create({
      data: {
        username: `admin_1333_${Date.now()}`,
        email: `admin_1333_${Date.now()}@test.com`,
        passwordHash: 'hashed',
        role: UserRole.ADMIN,
        isActive: true
      }
    });
    createdUserIds.push(testAdminUser.id);
    const adminToken = generateToken({ id: testAdminUser.id, email: testAdminUser.email, role: testAdminUser.role });

    // Setup helper to create cohort users with custom createdAt dates and active statuses
    const createCohortUser = async (username, isActive, createdAt) => {
      const user = await prisma.user.create({
        data: {
          username,
          email: `${username}@test.com`,
          passwordHash: 'hashed',
          role: UserRole.MEMBER,
          isActive,
          createdAt: new Date(createdAt)
        }
      });
      createdUserIds.push(user.id);
      return user;
    };

    // User 1: Member, active, 2026-07-10T10:00:00Z
    const u1 = await createCohortUser(`member_u1_${Date.now()}`, true, '2026-07-10T10:00:00.000Z');
    // User 2: Member, active, 2026-07-11T23:59:59.999Z (midnight UTC boundary check!)
    const u2 = await createCohortUser(`member_u2_${Date.now()}`, true, '2026-07-11T23:59:59.999Z');
    // User 3: Member, inactive, 2026-07-12T00:00:00.001Z (midnight UTC boundary check!)
    const u3 = await createCohortUser(`member_u3_${Date.now()}`, false, '2026-07-12T00:00:00.001Z');
    // User 4: Member, active, 2026-07-12T15:00:00Z
    const u4 = await createCohortUser(`member_u4_${Date.now()}`, true, '2026-07-12T15:00:00.000Z');
    // User 5: Member, active, 2026-07-13T10:00:00Z
    const u5 = await createCohortUser(`member_u5_${Date.now()}`, true, '2026-07-13T10:00:00.000Z');

    // Non-cohort users (should be excluded)
    // User 6: Admin, active, 2026-07-10T12:00:00Z (ADMIN role excluded)
    const u6Admin = await prisma.user.create({
      data: {
        username: `admin_u6_${Date.now()}`,
        email: `admin_u6_${Date.now()}@test.com`,
        passwordHash: 'hashed',
        role: UserRole.ADMIN,
        isActive: true,
        createdAt: new Date('2026-07-10T12:00:00.000Z')
      }
    });
    createdUserIds.push(u6Admin.id);

    // User 7: Member, active, 2026-07-09T22:00:00Z (Outside date filter range)
    const u7Outside = await createCohortUser(`member_u7_${Date.now()}`, true, '2026-07-09T22:00:00.000Z');

    const memberToken = generateToken({ id: u1.id, email: u1.email, role: u1.role });

    console.log('Setting up books and copies for loan seeds...');
    book = await prisma.book.create({
      data: {
        title: 'Analytics Test Book',
        isbn: `isbn_1333_${Date.now()}`,
        isDeleted: false
      }
    });
    copy1 = await prisma.bookCopy.create({ data: { bookId: book.id, barcode: `bc1_1333_${Date.now()}`, status: CopyStatus.AVAILABLE } });
    copy2 = await prisma.bookCopy.create({ data: { bookId: book.id, barcode: `bc2_1333_${Date.now()}`, status: CopyStatus.AVAILABLE } });

    const createLoan = async (userId, copyId, status) => {
      const loan = await prisma.loan.create({
        data: {
          userId,
          copyId,
          status,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        }
      });
      createdLoanIds.push(loan.id);
      return loan;
    };

    console.log('Seeding loans for activity tracking...');
    // User 1 loans: 1 total historical returned loan
    await createLoan(u1.id, copy1.id, LoanStatus.RETURNED);

    // User 2 loans: 3 total historical loans, 1 current active
    await createLoan(u2.id, copy1.id, LoanStatus.BORROWED);
    await createLoan(u2.id, copy2.id, LoanStatus.RETURNED);
    await createLoan(u2.id, copy2.id, LoanStatus.RETURNED);

    // User 3 loans: 2 total historical loans, both currently active
    await createLoan(u3.id, copy1.id, LoanStatus.BORROWED);
    await createLoan(u3.id, copy2.id, LoanStatus.OVERDUE);

    // User 4: no loans at all

    // User 5 loans: 6 total historical loans, none currently active
    await createLoan(u5.id, copy1.id, LoanStatus.RETURNED);
    await createLoan(u5.id, copy1.id, LoanStatus.RETURNED);
    await createLoan(u5.id, copy1.id, LoanStatus.RETURNED);
    await createLoan(u5.id, copy2.id, LoanStatus.RETURNED);
    await createLoan(u5.id, copy2.id, LoanStatus.RETURNED);
    await createLoan(u5.id, copy2.id, LoanStatus.RETURNED);

    console.log('Starting HTTP server...');
    const server = app.listen(PORT, async () => {
      try {
        // 1. Security & Authentication Checks
        console.log('\n--- 1. Security Check ---');
        const resUnauth = await fetch(`${BASE_URL}/admin/dashboard/analytics/members`);
        assert(resUnauth.status === 401, 'Unauthenticated request returns 401');

        const resMember = await fetch(`${BASE_URL}/admin/dashboard/analytics/members`, {
          headers: { Authorization: `Bearer ${memberToken}` }
        });
        assert(resMember.status === 403, 'Member request returns 403 Forbidden');

        // 2. Schema Structure Verification
        console.log('\n--- 2. GET /members (All Data - Structure Check) ---');
        const resAll = await fetch(`${BASE_URL}/admin/dashboard/analytics/members`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert(resAll.status === 200, 'Admin request returns 200 OK');
        const bodyAll = await resAll.json();
        assert(bodyAll.success === true, 'Success field is true in response envelope');
        
        const rawAnalytics = bodyAll.data;
        assert(typeof rawAnalytics.overview.totalMembers === 'number', 'overview.totalMembers is numeric');
        assert(typeof rawAnalytics.overview.activeMembers === 'number', 'overview.activeMembers is numeric');
        assert(typeof rawAnalytics.overview.inactiveMembers === 'number', 'overview.inactiveMembers is numeric');
        assert(typeof rawAnalytics.overview.membersWithActiveLoans === 'number', 'overview.membersWithActiveLoans is numeric');
        assert(Array.isArray(rawAnalytics.mostActiveMembers), 'mostActiveMembers is an array');
        assert(Array.isArray(rawAnalytics.registrationTrend), 'registrationTrend is an array');
        assert(typeof rawAnalytics.borrowActivityDistribution.zeroLoans === 'number', 'borrowActivityDistribution.zeroLoans is numeric');

        // 3. Mathematical correctness check using dates 2026-07-10 to 2026-07-13
        console.log('\n--- 3. GET /members?startDate=2026-07-10&endDate=2026-07-13 (Cohort Mathematics Checks) ---');
        const resFiltered = await fetch(`${BASE_URL}/admin/dashboard/analytics/members?startDate=2026-07-10&endDate=2026-07-13`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert(resFiltered.status === 200, 'Filtered admin request returns 200 OK');
        const bodyFiltered = await resFiltered.json();
        const analytics = bodyFiltered.data;

        // Verify Overview
        console.log('\n--- Verify Overview statistics ---');
        assert(analytics.overview.totalMembers === 5, `totalMembers is 5 (got ${analytics.overview.totalMembers})`);
        assert(analytics.overview.activeMembers === 4, `activeMembers is 4 (got ${analytics.overview.activeMembers})`);
        assert(analytics.overview.inactiveMembers === 1, `inactiveMembers is 1 (got ${analytics.overview.inactiveMembers})`);
        assert(analytics.overview.membersWithActiveLoans === 2, `membersWithActiveLoans is 2 (got ${analytics.overview.membersWithActiveLoans})`);

        // Verify Privacy in mostActiveMembers
        console.log('\n--- Verify Privacy Compliance ---');
        const firstMember = analytics.mostActiveMembers[0];
        assert(firstMember.memberId !== undefined, 'memberId is exposed');
        assert(firstMember.username !== undefined, 'username is exposed');
        assert(firstMember.fullName === null, 'fullName is returned as null');
        assert(firstMember.email === undefined, 'Privacy Check: email is NOT exposed');
        assert(firstMember.passwordHash === undefined, 'Privacy Check: passwordHash is NOT exposed');
        assert(firstMember.phone === undefined, 'Privacy Check: phone is NOT exposed');

        // Verify Ordering of Most Active Members
        console.log('\n--- Verify Most Active Members rankings ---');
        // Users ranked by historical borrowCount desc:
        // 1. u5 (6 borrowCount, 0 activeLoans)
        // 2. u2 (3 borrowCount, 1 activeLoans)
        // 3. u3 (2 borrowCount, 2 activeLoans)
        // 4. u1 (1 borrowCount, 0 activeLoans)
        // 5. u4 (0 borrowCount, 0 activeLoans)
        assert(analytics.mostActiveMembers.length === 5, `mostActiveMembers has 5 cohort entries (got ${analytics.mostActiveMembers.length})`);
        assert(analytics.mostActiveMembers[0].username === u5.username, '1st is User 5');
        assert(analytics.mostActiveMembers[0].borrowCount === 6, 'User 5 has 6 borrows');
        assert(analytics.mostActiveMembers[0].activeLoans === 0, 'User 5 has 0 active loans');

        assert(analytics.mostActiveMembers[1].username === u2.username, '2nd is User 2');
        assert(analytics.mostActiveMembers[1].borrowCount === 3, 'User 2 has 3 borrows');
        assert(analytics.mostActiveMembers[1].activeLoans === 1, 'User 2 has 1 active loan');

        assert(analytics.mostActiveMembers[2].username === u3.username, '3rd is User 3');
        assert(analytics.mostActiveMembers[2].borrowCount === 2, 'User 3 has 2 borrows');
        assert(analytics.mostActiveMembers[2].activeLoans === 2, 'User 3 has 2 active loans');

        assert(analytics.mostActiveMembers[3].username === u1.username, '4th is User 1');
        assert(analytics.mostActiveMembers[3].borrowCount === 1, 'User 1 has 1 borrow');

        assert(analytics.mostActiveMembers[4].username === u4.username, '5th is User 4');
        assert(analytics.mostActiveMembers[4].borrowCount === 0, 'User 4 has 0 borrows');

        // Verify Registration Trend & UTC Midnight boundaries
        console.log('\n--- Verify Registration Trend & UTC Midnight Check ---');
        // Registrations:
        // 2026-07-10: 1 (u1)
        // 2026-07-11: 1 (u2 - 23:59:59.999Z boundary)
        // 2026-07-12: 2 (u3 - 00:00:00.001Z boundary + u4)
        // 2026-07-13: 1 (u5)
        assert(analytics.registrationTrend.length === 4, `registrationTrend has 4 days (got ${analytics.registrationTrend.length})`);
        
        const trendMap = {};
        analytics.registrationTrend.forEach(t => trendMap[t.date] = t.registrations);
        assert(trendMap['2026-07-10'] === 1, `2026-07-10 has 1 registration (got ${trendMap['2026-07-10']})`);
        assert(trendMap['2026-07-11'] === 1, `2026-07-11 has 1 registration (got ${trendMap['2026-07-11']})`);
        assert(trendMap['2026-07-12'] === 2, `2026-07-12 has 2 registrations (got ${trendMap['2026-07-12']})`);
        assert(trendMap['2026-07-13'] === 1, `2026-07-13 has 1 registration (got ${trendMap['2026-07-13']})`);

        // Verify Activity Distribution
        console.log('\n--- Verify Borrow Activity Distribution ---');
        // Cohort members:
        // u4 has 0 -> zeroLoans (1 member)
        // u1 (1), u2 (3), u3 (2) -> oneToFiveLoans (3 members)
        // u5 (6) -> sixToTenLoans (1 member)
        // moreThanTenLoans (0 members)
        const dist = analytics.borrowActivityDistribution;
        assert(dist.zeroLoans === 1, `zeroLoans is 1 (got ${dist.zeroLoans})`);
        assert(dist.oneToFiveLoans === 3, `oneToFiveLoans is 3 (got ${dist.oneToFiveLoans})`);
        assert(dist.sixToTenLoans === 1, `sixToTenLoans is 1 (got ${dist.sixToTenLoans})`);
        assert(dist.moreThanTenLoans === 0, `moreThanTenLoans is 0 (got ${dist.moreThanTenLoans})`);

        // 4. Limit parameter check
        console.log('\n--- 4. Limit Parameter Check ---');
        const resLimit = await fetch(`${BASE_URL}/admin/dashboard/analytics/members?startDate=2026-07-10&endDate=2026-07-13&limit=2`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        const bodyLimit = await resLimit.json();
        assert(bodyLimit.data.mostActiveMembers.length === 2, `limit restricts mostActiveMembers to 2 (got ${bodyLimit.data.mostActiveMembers.length})`);

        // 5. Empty State Check
        console.log('\n--- 5. Empty Analytics Check (Future Date Range) ---');
        const resEmpty = await fetch(`${BASE_URL}/admin/dashboard/analytics/members?startDate=2026-08-01&endDate=2026-08-31`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        const bodyEmpty = await resEmpty.json();
        const emptyData = bodyEmpty.data;
        assert(emptyData.overview.totalMembers === 0, 'Empty overview totalMembers is 0');
        assert(emptyData.overview.activeMembers === 0, 'Empty overview activeMembers is 0');
        assert(emptyData.overview.inactiveMembers === 0, 'Empty overview inactiveMembers is 0');
        assert(emptyData.overview.membersWithActiveLoans === 0, 'Empty overview membersWithActiveLoans is 0');
        assert(emptyData.mostActiveMembers.length === 0, 'Empty mostActiveMembers is empty array []');
        assert(emptyData.registrationTrend.length === 0, 'Empty registrationTrend is empty array []');
        assert(emptyData.borrowActivityDistribution.zeroLoans === 0, 'Empty borrowActivityDistribution zeroLoans is 0');
        assert(emptyData.borrowActivityDistribution.oneToFiveLoans === 0, 'Empty borrowActivityDistribution oneToFiveLoans is 0');
        assert(emptyData.borrowActivityDistribution.sixToTenLoans === 0, 'Empty borrowActivityDistribution sixToTenLoans is 0');
        assert(emptyData.borrowActivityDistribution.moreThanTenLoans === 0, 'Empty borrowActivityDistribution moreThanTenLoans is 0');

        // 6. Validation Failure Check
        console.log('\n--- 6. Validation Failure Checks ---');
        const testInvalidParam = async (qs) => {
          const res = await fetch(`${BASE_URL}/admin/dashboard/analytics/members?${qs}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          assert(res.status === 400, `Query ?${qs} returns HTTP 400`);
        };
        await testInvalidParam('startDate=invalid');
        await testInvalidParam('startDate=2026-07-12&endDate=2026-07-10');
        await testInvalidParam('limit=0');
        await testInvalidParam('limit=-1');
        await testInvalidParam('limit=101');
        await testInvalidParam('limit=abc');

        // 7. Regression Check
        console.log('\n--- 7. Regression & Placeholders Check ---');
        const resSummary = await fetch(`${BASE_URL}/admin/dashboard/summary`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert(resSummary.status === 200, 'GET /admin/dashboard/summary continues to return 200 OK');

        const resBorrowing = await fetch(`${BASE_URL}/admin/dashboard/analytics/borrowing`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert(resBorrowing.status === 200, 'GET /admin/dashboard/analytics/borrowing continues to return 200 OK');

        const testPlaceholder501 = async (endpoint) => {
          const res = await fetch(`${BASE_URL}/admin/dashboard/analytics/${endpoint}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          assert(res.status === 501, `GET /analytics/${endpoint} placeholder still returns 501`);
        };
        await testPlaceholder501('ratings');
        await testPlaceholder501('timeseries');

      } catch (err) {
        console.error('Test execution failed with error:', err);
      } finally {
        // Cleanup database records
        console.log('\nCleaning up database records...');
        try {
          await prisma.loan.deleteMany({ where: { id: { in: createdLoanIds } } });
          await prisma.bookCopy.deleteMany({ where: { id: { in: [copy1.id, copy2.id] } } });
          await prisma.book.deleteMany({ where: { id: book.id } });
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
            console.log('All Member Analytics checks verified successfully!');
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

runTests().catch((err) => {
  console.error('Unhandled fatal exception:', err);
  process.exit(1);
});
