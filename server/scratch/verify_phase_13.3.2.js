/**
 * Verification script for Phase 13.3.2 - Borrowing Analytics API.
 * Run with: node scratch/verify_phase_13.3.2.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole, CopyStatus, LoanStatus } from '@prisma/client';

const PORT = 5565;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.3.2 Borrowing Analytics Verification...\n');
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
  let memberUser, adminUser;
  let authorA, authorB;
  let categoryFiction, categoryScience;
  let book1, book2, book3Deleted, book4;
  let copy1, copy2, copy3, copy4, copy5;
  const createdLoanIds = [];

  try {
    // 0. Setup test users
    console.log('Setting up database users...');
    memberUser = await prisma.user.create({
      data: {
        username: `member_1332_${Date.now()}`,
        email: `member_1332_${Date.now()}@test.com`,
        passwordHash: 'hashed',
        role: UserRole.MEMBER,
        isActive: true
      }
    });

    adminUser = await prisma.user.create({
      data: {
        username: `admin_1332_${Date.now()}`,
        email: `admin_1332_${Date.now()}@test.com`,
        passwordHash: 'hashed',
        role: UserRole.ADMIN,
        isActive: true
      }
    });

    console.log('Generating JWT tokens...');
    const memberToken = generateToken({ id: memberUser.id, email: memberUser.email, role: memberUser.role });
    const adminToken = generateToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });

    console.log('Setting up test metadata (authors, categories)...');
    authorA = await prisma.author.create({ data: { fullName: 'Author A' } });
    authorB = await prisma.author.create({ data: { fullName: 'Author B' } });

    categoryFiction = await prisma.category.create({ data: { name: `Fiction_1332_${Date.now()}` } });
    categoryScience = await prisma.category.create({ data: { name: `Science_1332_${Date.now()}` } });

    console.log('Setting up test books...');
    // Book 1: "Book 1 Title", fiction, Author A
    book1 = await prisma.book.create({
      data: {
        title: 'Book 1 Title',
        isbn: `isbn1_1332_${Date.now()}`,
        isDeleted: false,
        authors: { create: { authorId: authorA.id } },
        categories: { create: { categoryId: categoryFiction.id } }
      }
    });

    // Book 2: "Book 2 Title", fiction & science, Author B
    book2 = await prisma.book.create({
      data: {
        title: 'Book 2 Title',
        isbn: `isbn2_1332_${Date.now()}`,
        isDeleted: false,
        authors: { create: { authorId: authorB.id } },
        categories: {
          createMany: {
            data: [
              { categoryId: categoryFiction.id },
              { categoryId: categoryScience.id }
            ]
          }
        }
      }
    });

    // Book 3: "Book 3 Title" (Deleted book!), science, Author A
    book3Deleted = await prisma.book.create({
      data: {
        title: 'Book 3 Title Deleted',
        isbn: `isbn3_1332_${Date.now()}`,
        isDeleted: true,
        authors: { create: { authorId: authorA.id } },
        categories: { create: { categoryId: categoryScience.id } }
      }
    });

    // Book 4: "Book 4 Title" (same borrow count as book 1 to test stable secondary sort), fiction, Author B
    book4 = await prisma.book.create({
      data: {
        title: 'Book 4 Title',
        isbn: `isbn4_1332_${Date.now()}`,
        isDeleted: false,
        authors: { create: { authorId: authorB.id } },
        categories: { create: { categoryId: categoryFiction.id } }
      }
    });

    console.log('Setting up test book copies...');
    copy1 = await prisma.bookCopy.create({ data: { bookId: book1.id, barcode: `bc1_${Date.now()}`, status: CopyStatus.AVAILABLE } });
    copy2 = await prisma.bookCopy.create({ data: { bookId: book1.id, barcode: `bc2_${Date.now()}`, status: CopyStatus.AVAILABLE } });
    copy3 = await prisma.bookCopy.create({ data: { bookId: book2.id, barcode: `bc3_${Date.now()}`, status: CopyStatus.AVAILABLE } });
    copy4 = await prisma.bookCopy.create({ data: { bookId: book3Deleted.id, barcode: `bc4_${Date.now()}`, status: CopyStatus.AVAILABLE } });
    copy5 = await prisma.bookCopy.create({ data: { bookId: book4.id, barcode: `bc5_${Date.now()}`, status: CopyStatus.AVAILABLE } });

    console.log('Seeding custom loans with specific dates/statuses...');
    const createLoan = async (copyId, status, createdAt) => {
      const loan = await prisma.loan.create({
        data: {
          userId: memberUser.id,
          copyId,
          status,
          issueDate: new Date(createdAt),
          dueDate: new Date(new Date(createdAt).getTime() + 14 * 24 * 60 * 60 * 1000),
          createdAt: new Date(createdAt)
        }
      });
      createdLoanIds.push(loan.id);
      return loan;
    };

    // Loan 1: Copy 1, Returned, 2026-07-10T12:00:00Z
    await createLoan(copy1.id, LoanStatus.RETURNED, '2026-07-10T12:00:00.000Z');
    // Loan 2: Copy 1, Returned, 2026-07-11T23:59:59.999Z (midnight UTC boundary check!)
    await createLoan(copy1.id, LoanStatus.RETURNED, '2026-07-11T23:59:59.999Z');
    // Loan 3: Copy 2, Returned, 2026-07-12T00:00:00.001Z (midnight UTC boundary check!)
    await createLoan(copy2.id, LoanStatus.RETURNED, '2026-07-12T00:00:00.001Z');
    // Loan 4: Copy 3, Borrowed, 2026-07-12T15:00:00Z (Active count)
    await createLoan(copy3.id, LoanStatus.BORROWED, '2026-07-12T15:00:00.000Z');
    // Loan 5: Copy 3, Overdue, 2026-07-13T10:00:00Z (Active and Overdue count)
    await createLoan(copy3.id, LoanStatus.OVERDUE, '2026-07-13T10:00:00.000Z');
    // Loan 6 (Deleted Book): Copy 4, Returned, 2026-07-10T10:00:00Z
    await createLoan(copy4.id, LoanStatus.RETURNED, '2026-07-10T10:00:00.000Z');
    // Loan 7: Copy 5, Returned, 2026-07-11T09:00:00Z
    await createLoan(copy5.id, LoanStatus.RETURNED, '2026-07-11T09:00:00.000Z');
    // Loan 8: Copy 5, Returned, 2026-07-11T14:00:00Z
    await createLoan(copy5.id, LoanStatus.RETURNED, '2026-07-11T14:00:00.000Z');
    // Loan 9: Copy 5, Returned, 2026-07-11T20:00:00Z
    await createLoan(copy5.id, LoanStatus.RETURNED, '2026-07-11T20:00:00.000Z');

    console.log('Starting HTTP server...');
    const server = app.listen(PORT, async () => {
      try {
        // 1. Security check
        console.log('\n--- 1. Security Check ---');
        const resUnauth = await fetch(`${BASE_URL}/admin/dashboard/analytics/borrowing`);
        assert(resUnauth.status === 401, 'Unauthenticated request returns 401');

        const resMember = await fetch(`${BASE_URL}/admin/dashboard/analytics/borrowing`, {
          headers: { Authorization: `Bearer ${memberToken}` }
        });
        assert(resMember.status === 403, 'Member request returns 403 Forbidden');

        // 2. Fetch Borrowing Analytics with No Filters (verifying schema/types)
        console.log('\n--- 2. GET /borrowing (All Data - Structure Check) ---');
        const resAll = await fetch(`${BASE_URL}/admin/dashboard/analytics/borrowing`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert(resAll.status === 200, 'Admin request returns 200 OK');
        const bodyAll = await resAll.json();
        assert(bodyAll.success === true, 'Success field is true in response envelope');
        assert(bodyAll.data !== undefined, 'Response body has data block');
        
        const rawAnalytics = bodyAll.data;
        assert(typeof rawAnalytics.overview.totalLoans === 'number', 'overview.totalLoans is numeric');
        assert(typeof rawAnalytics.overview.activeLoans === 'number', 'overview.activeLoans is numeric');
        assert(typeof rawAnalytics.overview.returnedLoans === 'number', 'overview.returnedLoans is numeric');
        assert(typeof rawAnalytics.overview.overdueLoans === 'number', 'overview.overdueLoans is numeric');
        assert(Array.isArray(rawAnalytics.mostBorrowedBooks), 'mostBorrowedBooks is an array');
        assert(Array.isArray(rawAnalytics.borrowFrequency), 'borrowFrequency is an array');
        assert(Array.isArray(rawAnalytics.topCategories), 'topCategories is an array');
        assert(typeof rawAnalytics.statusDistribution.active === 'number', 'statusDistribution.active is numeric');

        // 3. Fetch Borrowing Analytics for Seeded Date Range (verifying exact mathematics)
        console.log('\n--- 3. GET /borrowing?startDate=2026-07-10&endDate=2026-07-13 (Precise Mathematics Checks) ---');
        const resFiltered = await fetch(`${BASE_URL}/admin/dashboard/analytics/borrowing?startDate=2026-07-10&endDate=2026-07-13`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert(resFiltered.status === 200, 'Filtered request returns 200 OK');
        const bodyFiltered = await resFiltered.json();
        const analytics = bodyFiltered.data;

        // Verify Overview
        console.log('\n--- Verify Overview statistics ---');
        assert(analytics.overview.totalLoans === 9, `totalLoans is 9 (got ${analytics.overview.totalLoans})`);
        assert(analytics.overview.activeLoans === 2, `activeLoans is 2 (got ${analytics.overview.activeLoans})`);
        assert(analytics.overview.returnedLoans === 7, `returnedLoans is 7 (got ${analytics.overview.returnedLoans})`);
        assert(analytics.overview.overdueLoans === 1, `overdueLoans is 1 (got ${analytics.overview.overdueLoans})`);

        // Verify Status Distribution
        console.log('\n--- Verify Status Distribution ---');
        assert(analytics.statusDistribution.active === 1, `statusDistribution active is 1 (got ${analytics.statusDistribution.active})`);
        assert(analytics.statusDistribution.returned === 7, `statusDistribution returned is 7 (got ${analytics.statusDistribution.returned})`);
        assert(analytics.statusDistribution.overdue === 1, `statusDistribution overdue is 1 (got ${analytics.statusDistribution.overdue})`);

        // Verify Most Borrowed Books
        console.log('\n--- Verify Most Borrowed Books ---');
        // Returned loans: Book 1 has 3 returned, Book 4 has 3 returned, Book 3 is deleted (should be excluded), Book 2 has 0 returned.
        // Limit is 10 by default. So we should see Book 1 and Book 4 with 3 borrows each.
        // Stable secondary sort: Title alphabetical. Book 1 Title comes before Book 4 Title.
        assert(analytics.mostBorrowedBooks.length === 2, `mostBorrowedBooks has 2 entries (got ${analytics.mostBorrowedBooks.length})`);
        assert(analytics.mostBorrowedBooks[0].bookId === book1.id, 'First book is Book 1 (Title alphabetical sorting)');
        assert(analytics.mostBorrowedBooks[0].borrowCount === 3, 'Book 1 has 3 borrows');
        assert(analytics.mostBorrowedBooks[1].bookId === book4.id, 'Second book is Book 4');
        assert(analytics.mostBorrowedBooks[1].borrowCount === 3, 'Book 4 has 3 borrows');

        // Verify Categories
        console.log('\n--- Verify Category ranking ---');
        // Book 1 (Fiction, 3 loans), Book 2 (Fiction & Science, 2 loans), Book 4 (Fiction, 3 loans).
        // Fiction should have: 3 + 2 + 3 = 8 loans.
        // Science should have: 2 loans.
        // Deleted Book 3 is excluded.
        assert(analytics.topCategories.length === 2, `topCategories has 2 entries (got ${analytics.topCategories.length})`);
        assert(analytics.topCategories[0].categoryId === categoryFiction.id, 'Top category is Fiction');
        assert(analytics.topCategories[0].borrowCount === 8, `Fiction has 8 borrows (got ${analytics.topCategories[0].borrowCount})`);
        assert(analytics.topCategories[1].categoryId === categoryScience.id, 'Second category is Science');
        assert(analytics.topCategories[1].borrowCount === 2, `Science has 2 borrows (got ${analytics.topCategories[1].borrowCount})`);

        // Verify Daily Grouping & Date Boundaries
        console.log('\n--- Verify Borrow Frequency (Daily UTC + Midnight Check) ---');
        // Daily:
        // 2026-07-10: Loan 1 (12:00) + Loan 6 (10:00) = 2 loans
        // 2026-07-11: Loan 2 (23:59:59.999Z) + Loan 7 (9:00) + Loan 8 (14:00) + Loan 9 (20:00) = 4 loans
        // 2026-07-12: Loan 3 (00:00:00.001Z) + Loan 4 (15:00) = 2 loans
        // 2026-07-13: Loan 5 (10:00) = 1 loan
        assert(analytics.borrowFrequency.length === 4, `borrowFrequency has 4 days (got ${analytics.borrowFrequency.length})`);
        
        const freqMap = {};
        analytics.borrowFrequency.forEach(f => freqMap[f.date] = f.borrowCount);
        
        assert(freqMap['2026-07-10'] === 2, `2026-07-10 has 2 loans (got ${freqMap['2026-07-10']})`);
        assert(freqMap['2026-07-11'] === 4, `2026-07-11 has 4 loans (got ${freqMap['2026-07-11']}) — Verifies 23:59:59.999Z boundary`);
        assert(freqMap['2026-07-12'] === 2, `2026-07-12 has 2 loans (got ${freqMap['2026-07-12']}) — Verifies 00:00:00.001Z boundary`);
        assert(freqMap['2026-07-13'] === 1, `2026-07-13 has 1 loan (got ${freqMap['2026-07-13']})`);

        // 4. Limit Parameter Verification
        console.log('\n--- 4. Limit Parameter Check ---');
        const resLimit = await fetch(`${BASE_URL}/admin/dashboard/analytics/borrowing?startDate=2026-07-10&endDate=2026-07-13&limit=1`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        const bodyLimit = await resLimit.json();
        assert(bodyLimit.data.mostBorrowedBooks.length === 1, 'Limit parameter restricts mostBorrowedBooks output to 1');

        // 5. Date Filtering Verification
        console.log('\n--- 5. Date Range Sub-filtering Check ---');
        // Let's filter: 2026-07-11 to 2026-07-12
        // Should include:
        // Loan 2: 2026-07-11T23:59:59.999Z
        // Loan 3: 2026-07-12T00:00:00.001Z
        // Loan 4: 2026-07-12T15:00:00.000Z
        // Loan 7, 8, 9: 2026-07-11
        // Total = 6 loans (Loan 2, 3, 4, 7, 8, 9)
        // Active = 1 (Loan 4)
        // Returned = 5 (Loan 2, 3, 7, 8, 9)
        // Overdue = 0
        const resDateRange = await fetch(`${BASE_URL}/admin/dashboard/analytics/borrowing?startDate=2026-07-11&endDate=2026-07-12`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        const bodyDateRange = await resDateRange.json();
        const dateAnalytics = bodyDateRange.data;

        assert(dateAnalytics.overview.totalLoans === 6, `Date range totalLoans is 6 (got ${dateAnalytics.overview.totalLoans})`);
        assert(dateAnalytics.overview.activeLoans === 1, `Date range activeLoans is 1 (got ${dateAnalytics.overview.activeLoans})`);
        assert(dateAnalytics.overview.returnedLoans === 5, `Date range returnedLoans is 5 (got ${dateAnalytics.overview.returnedLoans})`);
        assert(dateAnalytics.overview.overdueLoans === 0, `Date range overdueLoans is 0 (got ${dateAnalytics.overview.overdueLoans})`);

        // 6. Empty State Check
        console.log('\n--- 6. Empty Analytics Check (Future Date Range) ---');
        const resEmpty = await fetch(`${BASE_URL}/admin/dashboard/analytics/borrowing?startDate=2026-08-01&endDate=2026-08-31`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        const bodyEmpty = await resEmpty.json();
        const emptyData = bodyEmpty.data;
        assert(emptyData.overview.totalLoans === 0, 'Empty overview totalLoans is 0');
        assert(emptyData.overview.activeLoans === 0, 'Empty overview activeLoans is 0');
        assert(emptyData.overview.returnedLoans === 0, 'Empty overview returnedLoans is 0');
        assert(emptyData.overview.overdueLoans === 0, 'Empty overview overdueLoans is 0');
        assert(emptyData.mostBorrowedBooks.length === 0, 'Empty mostBorrowedBooks is empty array []');
        assert(emptyData.borrowFrequency.length === 0, 'Empty borrowFrequency is empty array []');
        assert(emptyData.topCategories.length === 0, 'Empty topCategories is empty array []');
        assert(emptyData.statusDistribution.active === 0, 'Empty statusDistribution active is 0');
        assert(emptyData.statusDistribution.returned === 0, 'Empty statusDistribution returned is 0');
        assert(emptyData.statusDistribution.overdue === 0, 'Empty statusDistribution overdue is 0');

        // 7. Validation Failure Check
        console.log('\n--- 7. Validation Failure Checks ---');
        
        const testInvalidParam = async (qs, expectedMsg) => {
          const res = await fetch(`${BASE_URL}/admin/dashboard/analytics/borrowing?${qs}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          assert(res.status === 400, `Query ?${qs} returns HTTP 400`);
          const body = await res.json();
          assert(body.success === false, 'Error body success is false');
          assert(body.message === 'Validation failed.', `Correct error message: "${body.message}"`);
        };

        await testInvalidParam('startDate=invalid-date', 'startDate invalid-date returns 400');
        await testInvalidParam('startDate=2026-07-12&endDate=2026-07-10', 'startDate after endDate returns 400');
        await testInvalidParam('limit=0', 'limit=0 returns 400');
        await testInvalidParam('limit=-5', 'limit=-5 returns 400');
        await testInvalidParam('limit=101', 'limit=101 returns 400');
        await testInvalidParam('limit=abc', 'limit=abc returns 400');
        await testInvalidParam('limit=5.5', 'limit=5.5 returns 400');

        // 8. Regression Checks
        console.log('\n--- 8. Regression & Placeholders Check ---');
        
        const resSummary = await fetch(`${BASE_URL}/admin/dashboard/summary`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert(resSummary.status === 200, 'GET /admin/dashboard/summary continues to return 200 OK');

        const testPlaceholder501 = async (endpoint) => {
          const res = await fetch(`${BASE_URL}/admin/dashboard/analytics/${endpoint}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          assert(res.status === 501, `GET /analytics/${endpoint} placeholder still returns 501`);
        };

        await testPlaceholder501('members');
        await testPlaceholder501('ratings');
        await testPlaceholder501('timeseries');

      } catch (err) {
        console.error('Test execution failed with error:', err);
      } finally {
        // Cleanup database records
        console.log('\nCleaning up database records...');
        try {
          await prisma.loan.deleteMany({ where: { id: { in: createdLoanIds } } });
          
          await prisma.bookCopy.deleteMany({ where: { id: { in: [copy1.id, copy2.id, copy3.id, copy4.id, copy5.id] } } });
          
          await prisma.bookAuthor.deleteMany({ where: { bookId: { in: [book1.id, book2.id, book3Deleted.id, book4.id] } } });
          await prisma.bookCategory.deleteMany({ where: { bookId: { in: [book1.id, book2.id, book3Deleted.id, book4.id] } } });
          
          await prisma.book.deleteMany({ where: { id: { in: [book1.id, book2.id, book3Deleted.id, book4.id] } } });
          
          await prisma.author.deleteMany({ where: { id: { in: [authorA.id, authorB.id] } } });
          await prisma.category.deleteMany({ where: { id: { in: [categoryFiction.id, categoryScience.id] } } });
          
          await prisma.user.deleteMany({ where: { id: { in: [memberUser.id, adminUser.id] } } });
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
            console.log('All Borrowing Analytics checks verified successfully!');
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
