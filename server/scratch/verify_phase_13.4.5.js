/**
 * Verification script for Phase 13.4.5 - Overdue Reports.
 * Run with: node scratch/verify_phase_13.4.5.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole, CopyStatus, LoanStatus, CopyCondition } from '@prisma/client';

const PORT = 5574;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.4.5 Overdue Reports Verification...\n');
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

  const cleanUps = {
    userIds: [],
    bookIds: [],
    authorIds: [],
    categoryIds: [],
    bookCopyIds: [],
    loanIds: []
  };

  try {
    console.log('Seeding test database records...');
    
    // Seed Users (Members)
    const createUser = async (username, email, role) => {
      const u = await prisma.user.create({
        data: { username, email, passwordHash: 'hash', role, isActive: true }
      });
      cleanUps.userIds.push(u.id);
      return u;
    };
    
    const admin = await createUser(`admin_1345_${Date.now()}`, `admin_1345_${Date.now()}@test.com`, UserRole.ADMIN);
    const member1 = await createUser(`member1_1345_${Date.now()}`, `member1_1345_${Date.now()}@test.com`, UserRole.MEMBER);
    const member2 = await createUser(`member2_1345_${Date.now()}`, `member2_1345_${Date.now()}@test.com`, UserRole.MEMBER);

    // Seed Author & Category
    const author = await prisma.author.create({ data: { fullName: 'Orwell' } });
    cleanUps.authorIds.push(author.id);
    const category = await prisma.category.create({ data: { name: 'Dystopian' } });
    cleanUps.categoryIds.push(category.id);

    // Seed Book & Book Copies
    const book = await prisma.book.create({
      data: {
        title: '1984 Overdue Edition',
        isbn: `isbn_${Date.now()}`,
        sellingPrice: 15.99,
        stockQuantity: 10,
        isBorrowable: true,
        isForSale: true,
        authors: { create: { authorId: author.id } },
        categories: { create: { categoryId: category.id } }
      }
    });
    cleanUps.bookIds.push(book.id);

    const createCopy = async (barcode) => {
      const copy = await prisma.bookCopy.create({
        data: { bookId: book.id, barcode, condition: CopyCondition.GOOD, status: CopyStatus.BORROWED }
      });
      cleanUps.bookCopyIds.push(copy.id);
      return copy;
    };

    const copy1 = await createCopy(`bar1_${Date.now()}`);
    const copy2 = await createCopy(`bar2_${Date.now()}`);
    const copy3 = await createCopy(`bar3_${Date.now()}`);
    const copy4 = await createCopy(`bar4_${Date.now()}`);
    const copy5 = await createCopy(`bar5_${Date.now()}`);

    // Seed Loans with varying due dates
    const createLoan = async (userId, copyId, status, offsetDays, isReturned = false) => {
      const now = new Date();
      
      const issueDate = new Date(now.getTime() - (offsetDays + 14) * 24 * 60 * 60 * 1000);
      const dueDate = new Date(now.getTime() - offsetDays * 24 * 60 * 60 * 1000);
      const returnDate = isReturned ? new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) : null;

      const loan = await prisma.loan.create({
        data: { userId, copyId, issueDate, dueDate, returnDate, status }
      });
      cleanUps.loanIds.push(loan.id);
      return loan;
    };

    // Loan 1: Overdue by 3 days (LOW severity)
    const loanLow = await createLoan(member1.id, copy1.id, LoanStatus.BORROWED, 3);
    // Loan 2: Overdue by 15 days (MEDIUM severity)
    const loanMed = await createLoan(member1.id, copy2.id, LoanStatus.OVERDUE, 15);
    // Loan 3: Overdue by 45 days (HIGH severity)
    const loanHigh = await createLoan(member2.id, copy3.id, LoanStatus.OVERDUE, 45);
    // Loan 4: Due in 2 days in the future (Active but NOT overdue)
    const loanFuture = await createLoan(member2.id, copy4.id, LoanStatus.BORROWED, -2);
    // Loan 5: Overdue by 10 days but already RETURNED (not active)
    const loanReturned = await createLoan(member1.id, copy5.id, LoanStatus.RETURNED, 10, true);

    const adminToken = generateToken({ id: admin.id, email: admin.email, role: admin.role });
    const validUUID = '87654321-4321-4321-4321-123456789012';

    console.log('Starting HTTP server...');
    const server = app.listen(PORT, async () => {
      try {
        const getRequest = async (path, queryStr = '') => {
          const res = await fetch(`${BASE_URL}/${path}${queryStr}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          const body = await res.json();
          return { status: res.status, body };
        };

        // 1. Verify Overdue Detection (No Filters)
        console.log('\n--- 1. Overdue Detection Checks ---');
        const { body: overdueAll } = await getRequest('admin/dashboard/reports/overdue');
        
        // Should only return active overdue loans (low, med, high) - ignoring pre-existing records (assert >= 3)
        assert(overdueAll.data.items.length >= 3, 'Returns all overdue active loans');
        
        const ids = overdueAll.data.items.map(i => i.loanId);
        assert(ids.includes(loanLow.id), 'Seeded LOW overdue loan is included');
        assert(ids.includes(loanMed.id), 'Seeded MEDIUM overdue loan is included');
        assert(ids.includes(loanHigh.id), 'Seeded HIGH overdue loan is included');
        assert(!ids.includes(loanFuture.id), 'Future due loan is excluded');
        assert(!ids.includes(loanReturned.id), 'Returned loan is excluded');

        // 2. Verify Severity Computation
        console.log('\n--- 2. Severity Calculations ---');
        const lowItem = overdueAll.data.items.find(i => i.loanId === loanLow.id);
        const medItem = overdueAll.data.items.find(i => i.loanId === loanMed.id);
        const highItem = overdueAll.data.items.find(i => i.loanId === loanHigh.id);

        assert(lowItem.daysOverdue === 3 && lowItem.severity === 'LOW', 'Loan overdue by 3 days has LOW severity');
        assert(medItem.daysOverdue === 15 && medItem.severity === 'MEDIUM', 'Loan overdue by 15 days has MEDIUM severity');
        assert(highItem.daysOverdue === 45 && highItem.severity === 'HIGH', 'Loan overdue by 45 days has HIGH severity');

        // 3. Verify Filters
        console.log('\n--- 3. Overdue Filtering Checks ---');
        
        // Filter by memberId
        const { body: fMember } = await getRequest('admin/dashboard/reports/overdue', `?memberId=${member2.id}`);
        const member2Ids = fMember.data.items.map(i => i.loanId);
        assert(member2Ids.includes(loanHigh.id) && !member2Ids.includes(loanLow.id), 'Filter by memberId works');

        // Filter by bookId
        const { body: fBook } = await getRequest('admin/dashboard/reports/overdue', `?bookId=${book.id}`);
        assert(fBook.data.items.length >= 3, 'Filter by bookId works');

        // Filter by severity
        const { body: fSeverity } = await getRequest('admin/dashboard/reports/overdue', '?severity=MEDIUM');
        const medIds = fSeverity.data.items.map(i => i.loanId);
        assert(medIds.includes(loanMed.id) && !medIds.includes(loanLow.id) && !medIds.includes(loanHigh.id), 'Filter by severity=MEDIUM works');

        // Filter by due date range
        const now = new Date();
        const dateLow = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const dateHigh = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const { body: fDates } = await getRequest('admin/dashboard/reports/overdue', `?fromDate=${dateLow}&toDate=${dateHigh}`);
        const dateIds = fDates.data.items.map(i => i.loanId);
        assert(dateIds.includes(loanLow.id) && !dateIds.includes(loanMed.id), 'Filter by fromDate and toDate range works');

        // 4. Verify Sorting
        console.log('\n--- 4. Overdue Sorting Checks ---');
        
        // Sort by dueDate desc
        const { body: sDueDate } = await getRequest('admin/dashboard/reports/overdue', `?bookId=${book.id}&sortBy=dueDate&sortOrder=desc`);
        // oldest due date is 45 days ago, newest due date is 3 days ago. So desc sort means 3 days ago comes first
        assert(sDueDate.data.items[0].loanId === loanLow.id, 'Sort by dueDate desc works');

        // Sort by daysOverdue desc (stable in-memory sort test)
        const { body: sDays } = await getRequest('admin/dashboard/reports/overdue', `?bookId=${book.id}&sortBy=daysOverdue&sortOrder=desc`);
        assert(sDays.data.items[0].loanId === loanHigh.id, 'Sort by daysOverdue desc (in-memory sort) works (oldest loan has most days overdue)');

        // Sort by username asc
        const { body: sUser } = await getRequest('admin/dashboard/reports/overdue', `?bookId=${book.id}&sortBy=username&sortOrder=asc`);
        const user0 = sUser.data.items[0].member.username;
        const user1 = sUser.data.items[1].member.username;
        assert(user0 <= user1, 'Sort by member username asc works');

        // 5. Verify Pagination
        console.log('\n--- 5. Overdue Pagination Checks ---');
        const { body: fPag } = await getRequest('admin/dashboard/reports/overdue', `?bookId=${book.id}&page=1&limit=1`);
        assert(fPag.data.items.length === 1, 'Limit pagination respected');
        assert(fPag.data.pagination.page === 1 && fPag.data.pagination.limit === 1 && fPag.data.pagination.totalItems === 3 && fPag.data.pagination.totalPages === 3, 'Pagination metadata matches');

        // 6. Verify Payload Optimization
        console.log('\n--- 6. Overdue Response Payload Optimization ---');
        const item = overdueAll.data.items[0];
        assert(item.loanId !== undefined && item.daysOverdue !== undefined && item.severity !== undefined, 'Response includes computed fields daysOverdue and severity');
        assert(item.member.username !== undefined && item.book.title !== undefined && item.copy.barcode !== undefined, 'Response matches structured shapes');
        assert(item.description === undefined && item.phone === undefined && item.returnDate === undefined, 'Prisma select excludes unnecessary properties');

        // 7. Regression Checks
        console.log('\n--- 7. Regression & Unfinished Report Checks ---');
        
        // Reporting search continue to work
        const { status: bSearchStatus } = await getRequest('admin/dashboard/reports/search/books', '?search=goblet');
        assert(bSearchStatus === 200, 'GET /admin/dashboard/reports/search/books continue to return 200');

        // Analytics continue to work
        const { status: borrowingStatus } = await getRequest('admin/dashboard/analytics/borrowing');
        assert(borrowingStatus === 200, 'GET /admin/dashboard/analytics/borrowing continues to return 200');

        // Unfinished routes continue to return 501
        const { status: statusInventory } = await getRequest('admin/dashboard/reports/inventory');
        assert(statusInventory === 501, 'GET /inventory continues to return 501 Not Implemented');
        
        const { status: statusMemberReport } = await getRequest(`admin/dashboard/reports/members/${validUUID}`);
        assert(statusMemberReport === 501, 'GET /members/:memberId continues to return 501 Not Implemented');

      } catch (err) {
        console.error('Test execution failed with error:', err);
      } finally {
        console.log('\nCleaning up seeded database records...');
        try {
          await prisma.loan.deleteMany({ where: { id: { in: cleanUps.loanIds } } });
          await prisma.bookCopy.deleteMany({ where: { id: { in: cleanUps.bookCopyIds } } });
          await prisma.bookAuthor.deleteMany({ where: { bookId: { in: cleanUps.bookIds } } });
          await prisma.bookCategory.deleteMany({ where: { bookId: { in: cleanUps.bookIds } } });
          await prisma.book.deleteMany({ where: { id: { in: cleanUps.bookIds } } });
          await prisma.author.deleteMany({ where: { id: { in: cleanUps.authorIds } } });
          await prisma.category.deleteMany({ where: { id: { in: cleanUps.categoryIds } } });
          await prisma.user.deleteMany({ where: { id: { in: cleanUps.userIds } } });
          console.log('Cleanup successful.');
        } catch (cleanupErr) {
          console.error('Database cleanup error:', cleanupErr);
        }

        try {
          await prisma.$disconnect();
        } catch (disconnectErr) {
          console.error('Prisma disconnect error:', disconnectErr);
        }

        server.close(() => {
          console.log('HTTP server closed.');
          console.log(`\nVerification finished: ${passedCount}/${totalCount} checks passed.`);
          if (passedCount === totalCount) {
            console.log('All Reporting Overdue Report checks verified successfully!');
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
