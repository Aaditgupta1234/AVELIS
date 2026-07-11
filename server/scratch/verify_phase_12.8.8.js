/**
 * Verification script for Phase 12.8.8 - Admin Loan Management Completion Review.
 * Run with: node scratch/verify_phase_12.8.8.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole, CopyStatus, LoanStatus } from '@prisma/client';

const PORT = 5555;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 12.8.8 End-to-End Admin Loan Management Verification...\n');
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

  const uniqueBarcode = () => `BARCODE-12.8.8-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // 0. Setup test data in DB
  console.log('Setting up test database records...');
  
  const memberUser = await prisma.user.create({
    data: {
      username: `member_1288_${Date.now()}`,
      email: `member_1288_${Date.now()}@test.com`,
      passwordHash: 'hashed',
      role: UserRole.MEMBER,
      isActive: true
    }
  });

  const otherMemberUser = await prisma.user.create({
    data: {
      username: `member2_1288_${Date.now()}`,
      email: `member2_1288_${Date.now()}@test.com`,
      passwordHash: 'hashed',
      role: UserRole.MEMBER,
      isActive: true
    }
  });

  const adminUser = await prisma.user.create({
    data: {
      username: `admin_1288_${Date.now()}`,
      email: `admin_1288_${Date.now()}@test.com`,
      passwordHash: 'hashed',
      role: UserRole.ADMIN,
      isActive: true
    }
  });

  const book1 = await prisma.book.create({
    data: {
      title: 'Admin Loan Review Book 1',
      isbn: `ISBN-1288-1-${Date.now()}`,
      isBorrowable: true
    }
  });

  const book2 = await prisma.book.create({
    data: {
      title: 'Admin Loan Review Book 2',
      isbn: `ISBN-1288-2-${Date.now()}`,
      isBorrowable: true
    }
  });

  const copy1 = await prisma.bookCopy.create({
    data: {
      bookId: book1.id,
      barcode: uniqueBarcode(),
      status: CopyStatus.BORROWED
    }
  });

  const copy2 = await prisma.bookCopy.create({
    data: {
      bookId: book2.id,
      barcode: uniqueBarcode(),
      status: CopyStatus.BORROWED
    }
  });

  const loan1 = await prisma.loan.create({
    data: {
      userId: memberUser.id,
      copyId: copy1.id,
      issueDate: new Date('2026-07-01T00:00:00Z'),
      dueDate: new Date('2026-07-15T00:00:00Z'),
      status: LoanStatus.BORROWED
    }
  });

  const loan2 = await prisma.loan.create({
    data: {
      userId: otherMemberUser.id,
      copyId: copy2.id,
      issueDate: new Date('2026-07-05T00:00:00Z'),
      dueDate: new Date('2026-07-19T00:00:00Z'),
      status: LoanStatus.OVERDUE
    }
  });

  console.log('Database setup complete. Generating JWT tokens...');
  const memberToken = generateToken({ id: memberUser.id, email: memberUser.email, role: memberUser.role });
  const adminToken = generateToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });

  // Start the server
  const server = app.listen(PORT, async () => {
    try {
      // 1. Unauthenticated request -> 401
      console.log('\n--- 1. Security check: Unauthenticated ---');
      const resUnauth = await fetch(`${BASE_URL}/admin/loans`);
      assert(resUnauth.status === 401, 'Request without authorization header returns 401');
      const bodyUnauth = await resUnauth.json();
      assert(bodyUnauth.success === false, 'success envelope flag is false');

      // 2. Member request -> 403
      console.log('\n--- 2. Security check: Member Privileges ---');
      const resMember = await fetch(`${BASE_URL}/admin/loans`, {
        headers: { Authorization: `Bearer ${memberToken}` }
      });
      assert(resMember.status === 403, 'Request with member credentials returns 403');
      const bodyMember = await resMember.json();
      assert(bodyMember.message.includes('Administrator privileges required'), 'Error message details missing admin privileges');

      // 3. Admin request -> 200
      console.log('\n--- 3. Security check: Admin Privileges ---');
      const resAdmin = await fetch(`${BASE_URL}/admin/loans`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resAdmin.status === 200, 'Request with admin credentials returns 200');
      const bodyAdmin = await resAdmin.json();
      assert(bodyAdmin.success === true, 'Response returns success envelope flag as true');
      assert(Array.isArray(bodyAdmin.data), 'Response data contains an array of loans');
      assert(bodyAdmin.meta, 'Response contains pagination meta block');

      // 4. Validation failures -> 400
      console.log('\n--- 4. Query Validation failures ---');
      const invalidQueries = [
        { query: 'page=-1', reason: 'negative page' },
        { query: 'limit=150', reason: 'limit exceeding 100' },
        { query: 'status=INVALID', reason: 'invalid LoanStatus enum value' },
        { query: 'memberId=not-a-uuid', reason: 'invalid member UUID format' },
        { query: 'startDate=invalid-date', reason: 'invalid startDate' },
        { query: 'startDate=2026-07-02&endDate=2026-07-01', reason: 'startDate after endDate' },
        { query: 'sortBy=unsupportedField', reason: 'unsupported sortBy field' },
        { query: 'sortOrder=ascending', reason: 'unsupported sortOrder' }
      ];

      for (const iq of invalidQueries) {
        const resVal = await fetch(`${BASE_URL}/admin/loans?${iq.query}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert(resVal.status === 400, `Query validation failure of ${iq.reason} returns 400`);
        const bodyVal = await resVal.json();
        assert(bodyVal.success === false && bodyVal.errors && bodyVal.errors.length > 0, 'Returns structured validation error details');
      }

      // 5. Filtering verification
      console.log('\n--- 5. Dynamic Filtering ---');
      
      // A. Filter by status
      const resFilterStatus = await fetch(`${BASE_URL}/admin/loans?status=OVERDUE`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const bodyFilterStatus = await resFilterStatus.json();
      assert(bodyFilterStatus.data.length > 0 && bodyFilterStatus.data.every(l => l.status === 'OVERDUE'), 'Filters list by status');

      // B. Filter by memberId
      const resFilterMember = await fetch(`${BASE_URL}/admin/loans?memberId=${memberUser.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const bodyFilterMember = await resFilterMember.json();
      assert(bodyFilterMember.data.length === 1 && bodyFilterMember.data[0].userId === memberUser.id, 'Filters list by member ID');

      // C. Filter by bookId
      const resFilterBook = await fetch(`${BASE_URL}/admin/loans?bookId=${book2.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const bodyFilterBook = await resFilterBook.json();
      assert(bodyFilterBook.data.length === 1 && bodyFilterBook.data[0].bookCopy.bookId === book2.id, 'Filters list by book ID');

      // D. Filter by issueDate range
      const resFilterDates = await fetch(`${BASE_URL}/admin/loans?startDate=2026-07-03T00:00:00Z&endDate=2026-07-06T00:00:00Z`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const bodyFilterDates = await resFilterDates.json();
      assert(bodyFilterDates.data.length === 1 && bodyFilterDates.data[0].id === loan2.id, 'Filters list by issueDate range');

      // 6. Pagination verification
      console.log('\n--- 6. Pagination ---');
      const resPaginated = await fetch(`${BASE_URL}/admin/loans?page=1&limit=1`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const bodyPaginated = await resPaginated.json();
      assert(bodyPaginated.data.length === 1, 'Correctly limits return counts to requested page limit');
      assert(bodyPaginated.meta.page === 1, 'Pagination page matches query');
      assert(bodyPaginated.meta.limit === 1, 'Pagination limit matches query');
      assert(bodyPaginated.meta.total >= 2, 'Pagination total tracks total records matching queries');
      assert(bodyPaginated.meta.totalPages >= 2, 'Pagination totalPages tracks total calculated pages');

      // 7. Sorting verification
      console.log('\n--- 7. Sorting ---');
      const resSortAsc = await fetch(`${BASE_URL}/admin/loans?sortBy=loanDate&sortOrder=asc`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const bodySortAsc = await resSortAsc.json();
      const adminLoans = bodySortAsc.data.filter(l => [loan1.id, loan2.id].includes(l.id));
      assert(adminLoans.length === 2, 'Retrieved both test loans');
      assert(new Date(adminLoans[0].issueDate).getTime() < new Date(adminLoans[1].issueDate).getTime(), 'Sorting by loanDate ascending is ordered correctly');

      const resSortDesc = await fetch(`${BASE_URL}/admin/loans?sortBy=loanDate&sortOrder=desc`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const bodySortDesc = await resSortDesc.json();
      const adminLoansDesc = bodySortDesc.data.filter(l => [loan1.id, loan2.id].includes(l.id));
      assert(new Date(adminLoansDesc[0].issueDate).getTime() > new Date(adminLoansDesc[1].issueDate).getTime(), 'Sorting by loanDate descending is ordered correctly');

      // 8. Prisma Projection Regression checks
      console.log('\n--- 8. Prisma Projection Regression check (LOAN_SELECT usage) ---');
      const resProjection = await fetch(`${BASE_URL}/admin/loans?memberId=${memberUser.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const bodyProjection = await resProjection.json();
      const targetLoan = bodyProjection.data[0];
      
      // Check direct fields
      assert(targetLoan.id === loan1.id, 'Returns loan ID');
      assert(targetLoan.status === 'BORROWED', 'Returns loan status');
      
      // Check user relation
      assert(targetLoan.user !== undefined, 'User relation is fetched');
      assert(targetLoan.user.username === memberUser.username, 'User relation includes username');
      assert(targetLoan.user.email === memberUser.email, 'User relation includes email');
      assert(targetLoan.user.passwordHash === undefined, 'User relation excludes sensitive password hash');

      // Check bookCopy and book relation
      assert(targetLoan.bookCopy !== undefined, 'bookCopy relation is fetched');
      assert(targetLoan.bookCopy.barcode === copy1.barcode, 'bookCopy includes barcode');
      assert(targetLoan.bookCopy.book !== undefined, 'bookCopy.book parent relation is fetched');
      assert(targetLoan.bookCopy.book.title === book1.title, 'bookCopy.book includes book title');
      assert(targetLoan.bookCopy.book.isbn === book1.isbn, 'bookCopy.book includes book isbn');

    } catch (e) {
      console.error('E2E tests failed with exception:', e);
    } finally {
      // Cleanup database records
      console.log('\nCleaning up database records...');
      await prisma.loan.deleteMany({ where: { id: { in: [loan1.id, loan2.id] } } });
      await prisma.bookCopy.deleteMany({ where: { id: { in: [copy1.id, copy2.id] } } });
      await prisma.book.deleteMany({ where: { id: { in: [book1.id, book2.id] } } });
      await prisma.user.deleteMany({ where: { id: { in: [memberUser.id, otherMemberUser.id, adminUser.id] } } });

      // Close the server and end process
      server.close(() => {
        console.log('HTTP server closed.');
        console.log(`\nVerification finished: ${passedCount}/${totalCount} checks passed.`);
        if (passedCount === totalCount) {
          console.log('All Admin Loan Management features and specifications verified successfully!');
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
