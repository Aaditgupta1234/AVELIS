/**
 * Verification script for Phase 13.4.6.7 - Inventory Report Production Refinement & Verification.
 * Run with: node scratch/verify_phase_13.4.6.7.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole, CopyStatus, CopyCondition, LoanStatus } from '@prisma/client';

const PORT = 5581;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.4.6.7 Inventory Report Production Refinement & Verification...\n');
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
    
    // Seed Users (Admin & Member)
    const createUser = async (username, role) => {
      const u = await prisma.user.create({
        data: { username, email: `${username}@test.com`, passwordHash: 'hash', role, isActive: true }
      });
      cleanUps.userIds.push(u.id);
      return u;
    };
    
    const admin = await createUser(`admin_13467_${Date.now()}`, UserRole.ADMIN);
    const member = await createUser(`member_13467_${Date.now()}`, UserRole.MEMBER);

    // Seed Authors
    const author1 = await prisma.author.create({ data: { fullName: `Rowling_${Date.now()}` } });
    cleanUps.authorIds.push(author1.id);

    // Seed Categories
    const category1 = await prisma.category.create({ data: { name: `Fantasy_${Date.now()}` } });
    cleanUps.categoryIds.push(category1.id);
    const testCategory = await prisma.category.create({ data: { name: `TestCat_${Date.now()}` } });
    cleanUps.categoryIds.push(testCategory.id);

    // Seed Books
    const createBook = async (title, isbn, publisher, authorIds, categoryIds) => {
      const book = await prisma.book.create({
        data: {
          title,
          isbn,
          publisher,
          sellingPrice: 15.99,
          stockQuantity: 10,
          isBorrowable: true,
          isForSale: true,
          authors: {
            create: authorIds.map(authorId => ({ authorId }))
          },
          categories: {
            create: categoryIds.map(categoryId => ({ categoryId }))
          }
        }
      });
      cleanUps.bookIds.push(book.id);
      return book;
    };

    const book1 = await createBook('D Dystopia', `isbn1_${Date.now()}`, 'Bloomsbury', [author1.id], [category1.id, testCategory.id]);
    const book2 = await createBook('A 1984', `isbn2_${Date.now()}`, 'Secker', [author1.id], [category1.id, testCategory.id]);
    const book3 = await createBook('C Animal Farm', `isbn3_${Date.now()}`, 'Secker', [author1.id], [category1.id, testCategory.id]);
    const book4 = await createBook('B Zero Copies Book', `isbn4_${Date.now()}`, 'None', [author1.id], [category1.id, testCategory.id]);

    // Seed Book Copies
    const createCopy = async (bookId, barcode, status, condition) => {
      const copy = await prisma.bookCopy.create({
        data: { bookId, barcode, status, condition }
      });
      cleanUps.bookCopyIds.push(copy.id);
      return copy;
    };

    const copy1 = await createCopy(book1.id, `bar1_${Date.now()}`, CopyStatus.AVAILABLE, CopyCondition.NEW);
    const copy2 = await createCopy(book2.id, `bar2_${Date.now()}`, CopyStatus.BORROWED, CopyCondition.GOOD);
    const copy3 = await createCopy(book3.id, `bar3_${Date.now()}`, CopyStatus.MAINTENANCE, CopyCondition.FAIR);

    // Seed a loan to support Overdue Reports and Search Loans checks
    const loan = await prisma.loan.create({
      data: {
        userId: member.id,
        copyId: copy2.id,
        issueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),   // 5 days ago (Overdue!)
        status: LoanStatus.BORROWED
      }
    });
    cleanUps.loanIds.push(loan.id);

    const adminToken = generateToken({ id: admin.id, email: admin.email, role: admin.role });

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

        const path = 'admin/dashboard/reports/inventory';

        // 1. Verify Inventory Report Contract & Statistics
        console.log('\n--- 1. Inventory Report Response Contract ---');
        const { body: invRes } = await getRequest(path, `?includeZeroAvailable=true&categoryId=${testCategory.id}`);
        assert(invRes.data.summary !== undefined, 'Summary object is present');
        assert(invRes.data.items.length === 4, 'Items array contains matching book items (4)');
        assert(invRes.data.pagination !== undefined, 'Pagination object is present');
        
        const sum = invRes.data.summary;
        assert(sum.totalBooks === 4, 'totalBooks reflects matching books');
        assert(sum.totalCopies === 3, 'totalCopies sum is correct (3)');
        assert(sum.availableCopies === 1, 'availableCopies sum is correct (1)');
        assert(sum.borrowedCopies === 1, 'borrowedCopies sum is correct (1)');
        assert(sum.maintenanceCopies === 1, 'maintenanceCopies sum is correct (1)');

        // 2. Verify Pagination & Page metadata
        console.log('\n--- 2. Pagination metadata ---');
        const pag = invRes.data.pagination;
        assert(pag.page === 1, 'page is 1');
        assert(pag.limit === 20, 'limit is 20');
        assert(pag.totalItems === 4, 'totalItems is 4');
        assert(pag.totalPages === 1, 'totalPages is 1');
        assert(pag.hasNextPage === false, 'hasNextPage is false');
        assert(pag.hasPreviousPage === false, 'hasPreviousPage is false');

        // 3. Verify Combined Filters & Sorting Parity
        console.log('\n--- 3. Sorting & Filtering check ---');
        const { body: sTitle } = await getRequest(path, `?includeZeroAvailable=true&sortBy=title&sortOrder=asc&categoryId=${testCategory.id}`);
        const titleItems = sTitle.data.items;
        // Sorted: A 1984 (Book 2) -> B Zero Copies Book (Book 4) -> C Animal Farm (Book 3) -> D Dystopia (Book 1)
        assert(titleItems[0].id === book2.id, 'Alphabetical title sorting resolves book2 first ("A 1984")');
        assert(titleItems[1].id === book4.id, 'Alphabetical title sorting resolves book4 second ("B Zero Copies Book")');

        // 4. AVELIS Reporting Module Smoke Tests
        console.log('\n--- 4. Reporting Module Regression Smoke Tests ---');
        
        // Dashboard Summary
        const { status: codeSum } = await getRequest('admin/dashboard/summary');
        assert(codeSum === 200, 'GET /admin/dashboard/summary returns 200 OK');

        // Analytics
        const { status: codeAn } = await getRequest('admin/dashboard/analytics/borrowing');
        assert(codeAn === 200, 'GET /admin/dashboard/analytics/borrowing returns 200 OK');

        // Book Search Report
        const { status: codeBookSearch, body: bodyBookSearch } = await getRequest('admin/dashboard/reports/search/books');
        assert(codeBookSearch === 200 && bodyBookSearch.data.pagination.hasNextPage !== undefined, 'GET /reports/search/books returns 200 with pagination');

        // Member Search Report
        const { status: codeMemberSearch } = await getRequest('admin/dashboard/reports/search/members');
        assert(codeMemberSearch === 200, 'GET /reports/search/members returns 200 OK');

        // Loan Search Report
        const { status: codeLoanSearch } = await getRequest('admin/dashboard/reports/search/loans');
        assert(codeLoanSearch === 200, 'GET /reports/search/loans returns 200 OK');

        // Reservation Search Report
        const { status: codeResSearch } = await getRequest('admin/dashboard/reports/search/reservations');
        assert(codeResSearch === 200, 'GET /reports/search/reservations returns 200 OK');

        // Order Search Report
        const { status: codeOrdSearch } = await getRequest('admin/dashboard/reports/search/orders');
        assert(codeOrdSearch === 200, 'GET /reports/search/orders returns 200 OK');

        // Overdue Report
        const { status: codeOverdue, body: overdueBody } = await getRequest('admin/dashboard/reports/overdue');
        assert(codeOverdue === 200 && overdueBody.data.items.length >= 1, 'GET /reports/overdue returns 200 with overdue loans');

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
            console.log('All Production Refinement & Verification checks verified successfully!');
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
