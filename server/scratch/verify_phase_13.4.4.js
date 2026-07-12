/**
 * Verification script for Phase 13.4.4 - Reporting Search Service Implementation.
 * Run with: node scratch/verify_phase_13.4.4.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole, CopyStatus, LoanStatus, ReservationStatus, OrderStatus, PaymentStatus, CopyCondition } from '@prisma/client';

const PORT = 5573;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.4.4 Reporting Search Service Implementation Verification...\n');
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
    loanIds: [],
    reservationIds: [],
    orderIds: []
  };

  try {
    console.log('Seeding test database records...');
    
    // Seed Users
    const createUser = async (username, email, role) => {
      const u = await prisma.user.create({
        data: { username, email, passwordHash: 'hash', role, isActive: true }
      });
      cleanUps.userIds.push(u.id);
      return u;
    };
    
    const admin = await createUser(`admin_1344_${Date.now()}`, `admin_1344_${Date.now()}@test.com`, UserRole.ADMIN);
    const member1 = await createUser(`member1_1344_${Date.now()}`, `member1_1344_${Date.now()}@test.com`, UserRole.MEMBER);
    const member2 = await createUser(`member2_1344_${Date.now()}`, `member2_1344_${Date.now()}@test.com`, UserRole.MEMBER);

    // Seed Author & Category
    const author1 = await prisma.author.create({ data: { fullName: 'J.K. Rowling' } });
    cleanUps.authorIds.push(author1.id);
    const author2 = await prisma.author.create({ data: { fullName: 'George Orwell' } });
    cleanUps.authorIds.push(author2.id);

    const category1 = await prisma.category.create({ data: { name: 'Fantasy' } });
    cleanUps.categoryIds.push(category1.id);
    const category2 = await prisma.category.create({ data: { name: 'Dystopian' } });
    cleanUps.categoryIds.push(category2.id);

    // Seed Books
    const createBook = async (title, isbn, price, stock, authorId, categoryId) => {
      const b = await prisma.book.create({
        data: {
          title,
          isbn,
          sellingPrice: price,
          stockQuantity: stock,
          isBorrowable: true,
          isForSale: true,
          authors: { create: { authorId } },
          categories: { create: { categoryId } }
        }
      });
      cleanUps.bookIds.push(b.id);
      return b;
    };

    const book1 = await createBook('Harry Potter and the Goblet of Fire', `isbn1_${Date.now()}`, 29.99, 10, author1.id, category1.id);
    const book2 = await createBook('HARRY POTTER AND THE DEATHLY HALLOWS', `isbn2_${Date.now()}`, 39.99, 5, author1.id, category1.id);
    const book3 = await createBook('1984', `isbn3_${Date.now()}`, 15.99, 8, author2.id, category2.id);

    // Seed Book Copies
    const createCopy = async (bookId, barcode, status) => {
      const copy = await prisma.bookCopy.create({
        data: { bookId, barcode, condition: CopyCondition.GOOD, status }
      });
      cleanUps.bookCopyIds.push(copy.id);
      return copy;
    };

    const copy1 = await createCopy(book1.id, `barcode1_${Date.now()}`, CopyStatus.AVAILABLE);
    const copy2 = await createCopy(book1.id, `barcode2_${Date.now()}`, CopyStatus.BORROWED);
    const copy3 = await createCopy(book2.id, `barcode3_${Date.now()}`, CopyStatus.BORROWED);
    const copy4 = await createCopy(book3.id, `barcode4_${Date.now()}`, CopyStatus.MAINTENANCE);

    // Seed Loans
    const createLoan = async (userId, copyId, status, offsetDays = 0) => {
      const issueDate = new Date();
      issueDate.setDate(issueDate.getDate() - offsetDays);
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 14);
      
      const loan = await prisma.loan.create({
        data: { userId, copyId, issueDate, dueDate, status }
      });
      cleanUps.loanIds.push(loan.id);
      return loan;
    };

    const loan1 = await createLoan(member1.id, copy2.id, LoanStatus.BORROWED, 2);
    const loan2 = await createLoan(member2.id, copy3.id, LoanStatus.OVERDUE, 20);

    // Seed Reservations
    const createRes = async (userId, bookId, status) => {
      const res = await prisma.reservation.create({
        data: { userId, bookId, status }
      });
      cleanUps.reservationIds.push(res.id);
      return res;
    };

    const res1 = await createRes(member1.id, book1.id, ReservationStatus.PENDING);
    const res2 = await createRes(member2.id, book3.id, ReservationStatus.EXPIRED);

    // Seed Orders
    const createOrder = async (userId, orderNumber, total, orderStatus, paymentStatus) => {
      const order = await prisma.order.create({
        data: { userId, orderNumber, totalAmount: total, orderStatus, paymentStatus, shippingAddress: 'Test Address' }
      });
      cleanUps.orderIds.push(order.id);
      return order;
    };

    const order1 = await createOrder(member1.id, `ord1_${Date.now()}`, 59.98, OrderStatus.PLACED, PaymentStatus.PENDING);
    const order2 = await createOrder(member2.id, `ord2_${Date.now()}`, 15.99, OrderStatus.DELIVERED, PaymentStatus.PAID);

    const adminToken = generateToken({ id: admin.id, email: admin.email, role: admin.role });
    const validUUID = '87654321-4321-4321-4321-123456789012';

    console.log('Starting HTTP server...');
    const server = app.listen(PORT, async () => {
      try {
        // Helper to perform a GET request
        const getRequest = async (path, queryStr = '') => {
          const res = await fetch(`${BASE_URL}/${path}${queryStr}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          const body = await res.json();
          return { status: res.status, body };
        };

        // 1. Books Search Tests
        console.log('\n--- 1. Book Search API Verification ---');
        
        // Case-Insensitive search (matches "Harry Potter..." and "HARRY POTTER...")
        const { body: bSearch } = await getRequest('admin/dashboard/reports/search/books', '?search=harry');
        assert(bSearch.data.items.length === 2, 'Keyword search matches "harry" case-insensitively (found 2 Harry Potter books)');

        // Search by author
        const { body: bAuthor } = await getRequest('admin/dashboard/reports/search/books', '?search=rowling');
        assert(bAuthor.data.items.length === 2, 'Search by author fullName matches "rowling" (found 2 books)');

        // Search by category
        const { body: bCat } = await getRequest('admin/dashboard/reports/search/books', '?search=fantasy');
        assert(bCat.data.items.length === 2, 'Search by category name matches "fantasy" (found 2 books)');

        // Filter by categoryId
        const { body: bFilterCat } = await getRequest('admin/dashboard/reports/search/books', `?categoryId=${category2.id}`);
        assert(bFilterCat.data.items.length === 1 && bFilterCat.data.items[0].title === '1984', 'Filter by categoryId returns "1984"');

        // Filter by status (CopyStatus)
        const { body: bStatus } = await getRequest('admin/dashboard/reports/search/books', '?status=MAINTENANCE');
        assert(bStatus.data.items.length === 1 && bStatus.data.items[0].title === '1984', 'Filter by CopyStatus (MAINTENANCE) returns "1984"');

        // Pagination metadata
        const { body: bPag } = await getRequest('admin/dashboard/reports/search/books', '?page=1&limit=1');
        assert(bPag.data.items.length === 1, 'Pagination limit is respected (returns 1 item)');
        assert(
          bPag.data.pagination.page === 1 && 
          bPag.data.pagination.limit === 1 && 
          bPag.data.pagination.totalItems >= 3 && 
          bPag.data.pagination.totalPages >= 3, 
          'Pagination metadata is correct'
        );

        // Sorting check (scoped to rowling search to avoid external DB records interference)
        const { body: bSort } = await getRequest('admin/dashboard/reports/search/books', '?search=rowling&sortBy=sellingPrice&sortOrder=asc');
        assert(bSort.data.items[0].title === 'Harry Potter and the Goblet of Fire', 'Sort order is correct (Goblet of Fire is cheaper)');

        // Query optimization select check
        const sampleBook = bSearch.data.items[0];
        assert(sampleBook.description === undefined && sampleBook.stockQuantity !== undefined, 'Prisma select excludes description column from response');

        // 2. Members Search Tests
        console.log('\n--- 2. Member Search API Verification ---');
        const { body: mSearch } = await getRequest('admin/dashboard/reports/search/members', '?search=member1_');
        assert(mSearch.data.items.length === 1 && mSearch.data.items[0].username.startsWith('member1_'), 'Search by username matches keyword');

        const { body: mRole } = await getRequest('admin/dashboard/reports/search/members', '?role=MEMBER');
        assert(mRole.data.items.length >= 2, 'Filter by role (MEMBER) returns at least 2 users');

        // 3. Loans Search Tests
        console.log('\n--- 3. Loan Search API Verification ---');
        const { body: lSearch } = await getRequest('admin/dashboard/reports/search/loans', '?search=member1_');
        assert(lSearch.data.items.length === 1, 'Search loans by member username keyword returns 1 loan');

        const { body: lStatus } = await getRequest('admin/dashboard/reports/search/loans', '?status=OVERDUE');
        assert(lStatus.data.items.length === 1 && lStatus.data.items[0].status === 'OVERDUE', 'Filter loans by status (OVERDUE) returns 1 overdue loan');

        const { body: lBook } = await getRequest('admin/dashboard/reports/search/loans', '?search=deathly');
        assert(lBook.data.items.length === 1, 'Search loans by book title keyword returns 1 loan');

        // 4. Reservations Search Tests
        console.log('\n--- 4. Reservation Search API Verification ---');
        const { body: rSearch } = await getRequest('admin/dashboard/reports/search/reservations', '?search=member1_');
        assert(rSearch.data.items.length === 1, 'Search reservations by member username keyword returns 1 reservation');

        const { body: rStatus } = await getRequest('admin/dashboard/reports/search/reservations', '?status=EXPIRED');
        assert(rStatus.data.items.length === 1 && rStatus.data.items[0].status === 'EXPIRED', 'Filter reservations by status (EXPIRED) returns 1 reservation');

        // 5. Orders Search Tests
        console.log('\n--- 5. Order Search API Verification ---');
        const { body: oSearch } = await getRequest('admin/dashboard/reports/search/orders', '?search=member1_');
        assert(oSearch.data.items.length === 1, 'Search orders by member username returns 1 order');

        const { body: oStatus } = await getRequest('admin/dashboard/reports/search/orders', '?status=PLACED&paymentStatus=PENDING');
        assert(oStatus.data.items.length === 1 && oStatus.data.items[0].orderStatus === 'PLACED', 'Filter orders by status and paymentStatus');

        // 6. General Edge Cases Checks
        console.log('\n--- 6. General Edge Cases Checks ---');
        
        // Empty result sets
        const { body: emptyRes } = await getRequest('admin/dashboard/reports/search/books', '?search=nonexistentkeyword');
        assert(emptyRes.data.items.length === 0 && emptyRes.data.pagination.totalItems === 0, 'Searching for nonexistent keyword returns empty items and 0 totalItems');

        // Large page index returns empty list
        const { body: pageOverRes } = await getRequest('admin/dashboard/reports/search/books', '?page=100');
        assert(pageOverRes.data.items.length === 0, 'Requesting large page index returns empty items array');

        // 7. Regression & Remaining 501 Report Endpoints
        console.log('\n--- 7. Regression & Unfinished 501 Endpoints ---');
        
        const test501 = async (path) => {
          const { status } = await getRequest(path);
          assert(status === 501, `Unimplemented report path /${path} continues to return 501 Not Implemented`);
        };

        await test501('admin/dashboard/reports/overdue');
        await test501('admin/dashboard/reports/inventory');
        await test501(`admin/dashboard/reports/members/${validUUID}`);

        const { status: sumStatus } = await getRequest('admin/dashboard/summary');
        assert(sumStatus === 200, 'GET admin/dashboard/summary continues to work (HTTP 200)');

        const { status: timeseriesStatus } = await getRequest('admin/dashboard/analytics/timeseries');
        assert(timeseriesStatus === 200, 'GET admin/dashboard/analytics/timeseries continues to work (HTTP 200)');

      } catch (err) {
        console.error('Test execution failed with error:', err);
      } finally {
        console.log('\nCleaning up seeded database records...');
        try {
          // Delete in order of dependencies to avoid constraint violations
          await prisma.loan.deleteMany({ where: { id: { in: cleanUps.loanIds } } });
          await prisma.reservation.deleteMany({ where: { id: { in: cleanUps.reservationIds } } });
          await prisma.order.deleteMany({ where: { id: { in: cleanUps.orderIds } } });
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
            console.log('All Reporting Search Service checks verified successfully!');
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
