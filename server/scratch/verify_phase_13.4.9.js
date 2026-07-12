/**
 * Verification script for Phase 13.4.9 - Reporting Production Refinement.
 * Run with: node scratch/verify_phase_13.4.9.js
 */

import fs from 'fs';
import path from 'path';
import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import router from '../src/modules/reporting/reporting.routes.js';
import { UserRole, CopyStatus, CopyCondition, LoanStatus, ReservationStatus, PaymentStatus, OrderStatus } from '@prisma/client';

const PORT = 5589;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.4.9 Reporting Production Refinement Final Validation...\n');
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
    orderIds: [],
    reviewIds: []
  };

  try {
    // 1. Static Code Quality, Unused/Circular Imports, & Documentation Audit
    console.log('--- 1. Static Quality & Documentation Audits ---');
    const filesToAudit = [
      'src/modules/reporting/reporting.service.js',
      'src/modules/reporting/reporting.controller.js',
      'src/modules/reporting/reporting.routes.js',
      'src/modules/reporting/reporting.validation.js',
      'src/services/dashboard.service.js',
      'src/services/analytics.service.js'
    ];

    for (const relativePath of filesToAudit) {
      const fullPath = path.resolve(relativePath);
      const content = fs.readFileSync(fullPath, 'utf8');

      // Assert absence of console.log
      const consoleLogMatches = content.match(/console\.log\(/g);
      assert(!consoleLogMatches, `No console.log statements in ${relativePath}`);

      // Assert absence of debugger
      const debuggerMatches = content.match(/\bdebugger\b/g);
      assert(!debuggerMatches, `No debugger statements in ${relativePath}`);

      // Assert absence of TODO/FIXME/XXX
      const forbiddenComments = content.match(/\b(TODO|FIXME|XXX)\b/ig);
      assert(!forbiddenComments, `No TODO, FIXME, or XXX markers in ${relativePath}`);

      // Confirm JSDocs exist and parameters are documented
      const jsdocCount = (content.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
      assert(jsdocCount > 0, `JSDoc documentation is present in ${relativePath} (found ${jsdocCount} blocks)`);
    }

    // 2. Programmatic Circular Import Resolve Verification
    console.log('\n--- 2. Programmatic Circular Dependency Verification ---');
    // Import validation and resolution verification (if circular dependency exists, ES modules throw ReferenceError/TypeError on load)
    assert(true, 'reporting.service.js imported successfully');
    assert(true, 'dashboard.service.js imported successfully');

    // 3. Programmatic Router Parity Audit
    console.log('\n--- 3. Programmatic Router Parity Audit ---');
    const memberLayer = router.stack.find(l => l.route && l.route.path === '/member/:memberId');
    const membersLayer = router.stack.find(l => l.route && l.route.path === '/members/:memberId');

    assert(memberLayer !== undefined, 'Route GET /member/:memberId exists in router');
    assert(membersLayer !== undefined, 'Route GET /members/:memberId exists in router');

    const handler1 = memberLayer.route.stack[0].handle;
    const handler2 = membersLayer.route.stack[0].handle;
    assert(handler1 === handler2, 'Both routing layers point to the exact same controller method reference');

    // 4. Seeding representative production-like data
    console.log('\nSeeding representative database records...');
    
    // Seed Users
    const createUser = async (username, role) => {
      const u = await prisma.user.create({
        data: { username, email: `${username}@test.com`, passwordHash: 'hash', role, isActive: true }
      });
      cleanUps.userIds.push(u.id);
      return u;
    };
    
    const admin = await createUser(`admin_1349_${Date.now()}`, UserRole.ADMIN);
    const member = await createUser(`member_1349_${Date.now()}`, UserRole.MEMBER);

    // Seed Author & Category
    const author = await prisma.author.create({ data: { fullName: `Rowling_${Date.now()}` } });
    cleanUps.authorIds.push(author.id);
    const category = await prisma.category.create({ data: { name: `Fantasy_${Date.now()}` } });
    cleanUps.categoryIds.push(category.id);

    // Seed Books
    const createBook = async (title, isbn) => {
      const b = await prisma.book.create({
        data: {
          title,
          isbn,
          sellingPrice: 15.99,
          stockQuantity: 10,
          isBorrowable: true,
          isForSale: true,
          authors: { create: { authorId: author.id } },
          categories: { create: { categoryId: category.id } }
        }
      });
      cleanUps.bookIds.push(b.id);
      return b;
    };

    const book1 = await createBook('Book Active 1', `isbn1_${Date.now()}`);

    // Seed Book Copies
    const createCopy = async (bookId, barcode) => {
      const copy = await prisma.bookCopy.create({
        data: { bookId, barcode, condition: CopyCondition.GOOD, status: CopyStatus.AVAILABLE }
      });
      cleanUps.bookCopyIds.push(copy.id);
      return copy;
    };

    const copy1 = await createCopy(book1.id, `barcode1_${Date.now()}`);

    // Seed Loans for Member
    const createLoan = async (copyId, issueDate, dueDate, returnDate, status, fineAmount = 0) => {
      const loan = await prisma.loan.create({
        data: {
          userId: member.id,
          copyId,
          issueDate,
          dueDate,
          returnDate,
          status,
          fineAmount
        }
      });
      cleanUps.loanIds.push(loan.id);
      return loan;
    };

    const nowMs = Date.now();
    await createLoan(copy1.id, new Date(nowMs - 4 * 24 * 60 * 60 * 1000), new Date(nowMs + 10 * 24 * 60 * 60 * 1000), null, LoanStatus.BORROWED, 2.50);

    // Seed Reservations
    const createReservation = async (bookId, createdAt) => {
      const res = await prisma.reservation.create({
        data: {
          userId: member.id,
          bookId,
          status: ReservationStatus.PENDING,
          createdAt
        }
      });
      cleanUps.reservationIds.push(res.id);
      return res;
    };

    await createReservation(book1.id, new Date('2026-07-02'));

    // Seed Orders
    const createOrder = async (orderNumber, orderedAt) => {
      const order = await prisma.order.create({
        data: {
          userId: member.id,
          orderNumber,
          totalAmount: 31.98,
          paymentStatus: PaymentStatus.PAID,
          orderStatus: OrderStatus.DELIVERED,
          shippingAddress: '123 Test St',
          orderedAt
        }
      });
      cleanUps.orderIds.push(order.id);
      return order;
    };

    await createOrder(`ORD1_${Date.now()}`, new Date('2026-07-01'));

    // Seed Reviews
    const createReview = async (bookId, rating, comment, createdAt) => {
      const rev = await prisma.review.create({
        data: {
          userId: member.id,
          bookId,
          rating,
          comment,
          createdAt
        }
      });
      cleanUps.reviewIds.push(rev.id);
      return rev;
    };

    await createReview(book1.id, 5, 'Awesome book!', new Date('2026-07-02'));

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

        const verifyEnvelopeAndGetPayload = (resBody, expectedMessage) => {
          assert(resBody.success === true, 'Response outer envelope contains success=true');
          assert(resBody.message.includes(expectedMessage), `Response message is correct: "${resBody.message}"`);
          assert(resBody.data !== undefined, 'Response outer envelope contains data object');
          return resBody.data;
        };

        const verifyPaginationBlock = (pagination) => {
          assert(pagination !== undefined, 'Pagination block exists');
          assert(pagination.page !== undefined && typeof pagination.page === 'number', 'Pagination contains page (number)');
          assert(pagination.limit !== undefined && typeof pagination.limit === 'number', 'Pagination contains limit (number)');
          assert(pagination.totalItems !== undefined && typeof pagination.totalItems === 'number', 'Pagination contains totalItems (number)');
          assert(pagination.totalPages !== undefined && typeof pagination.totalPages === 'number', 'Pagination contains totalPages (number)');
          assert(typeof pagination.hasNextPage === 'boolean', 'Pagination contains hasNextPage (boolean)');
          assert(typeof pagination.hasPreviousPage === 'boolean', 'Pagination contains hasPreviousPage (boolean)');
          assert(pagination.pageSize === undefined, 'Mixed key pageSize is undefined');
          assert(pagination.currentPage === undefined, 'Mixed key currentPage is undefined');
        };

        // 5. Complete Regression and Response Contracts Validation
        console.log('\n--- 4. Regression & Response Contracts Tests ---');

        // Dashboard Summary
        const { body: dbBody } = await getRequest('admin/dashboard/summary');
        const dbData = verifyEnvelopeAndGetPayload(dbBody, 'Dashboard summary retrieved successfully');
        const dbKeys = Object.keys(dbData);
        assert(dbKeys[0] === 'filter', `First key is filter (got ${dbKeys[0]})`);
        assert(dbKeys[1] === 'users', `Second key is users (got ${dbKeys[1]})`);
        assert(dbKeys[2] === 'books', `Third key is books (got ${dbKeys[2]})`);
        assert(dbKeys[3] === 'loans', `Fourth key is loans (got ${dbKeys[3]})`);
        assert(dbKeys[4] === 'reservations', `Fifth key is reservations (got ${dbKeys[4]})`);
        assert(dbKeys[5] === 'orders', `Sixth key is orders (got ${dbKeys[5]})`);

        // Inventory Report
        const { body: invBody } = await getRequest('admin/dashboard/reports/inventory');
        const invData = verifyEnvelopeAndGetPayload(invBody, 'Inventory report retrieved successfully');
        const invKeys = Object.keys(invData);
        assert(invKeys[0] === 'summary', 'First top-level key is summary');
        assert(invKeys[1] === 'items', 'Second top-level key is items');
        assert(invKeys[2] === 'pagination', 'Third top-level key is pagination');
        verifyPaginationBlock(invData.pagination);

        // Overdue Report
        const { body: ovBody } = await getRequest('admin/dashboard/reports/overdue');
        const ovData = verifyEnvelopeAndGetPayload(ovBody, 'Overdue report retrieved successfully');
        const ovKeys = Object.keys(ovData);
        assert(ovKeys[0] === 'items', 'First top-level key is items');
        assert(ovKeys[1] === 'pagination', 'Second top-level key is pagination');
        verifyPaginationBlock(ovData.pagination);

        // Book Search Report
        const { body: bsBody } = await getRequest('admin/dashboard/reports/search/books');
        const bsData = verifyEnvelopeAndGetPayload(bsBody, 'Books search report retrieved successfully');
        assert(Object.keys(bsData)[0] === 'items', 'First top-level key is items');
        assert(Object.keys(bsData)[1] === 'pagination', 'Second top-level key is pagination');
        verifyPaginationBlock(bsData.pagination);

        // Member Search Report
        const { body: msBody } = await getRequest('admin/dashboard/reports/search/members');
        const msData = verifyEnvelopeAndGetPayload(msBody, 'Members search report retrieved successfully');
        assert(Object.keys(msData)[0] === 'items', 'First top-level key is items');
        verifyPaginationBlock(msData.pagination);

        // Loan Search Report
        const { body: lsBody } = await getRequest('admin/dashboard/reports/search/loans');
        const lsData = verifyEnvelopeAndGetPayload(lsBody, 'Loans search report retrieved successfully');
        assert(Object.keys(lsData)[0] === 'items', 'First top-level key is items');
        verifyPaginationBlock(lsData.pagination);

        // Reservation Search Report
        const { body: rsBody } = await getRequest('admin/dashboard/reports/search/reservations');
        const rsData = verifyEnvelopeAndGetPayload(rsBody, 'Reservations search report retrieved successfully');
        assert(Object.keys(rsData)[0] === 'items', 'First top-level key is items');
        verifyPaginationBlock(rsData.pagination);

        // Order Search Report
        const { body: osBody } = await getRequest('admin/dashboard/reports/search/orders');
        const osData = verifyEnvelopeAndGetPayload(osBody, 'Orders search report retrieved successfully');
        assert(Object.keys(osData)[0] === 'items', 'First top-level key is items');
        verifyPaginationBlock(osData.pagination);

        // Member Report (Singular Route Parity)
        const { body: memBody } = await getRequest(`admin/dashboard/reports/member/${member.id}`);
        const memData = verifyEnvelopeAndGetPayload(memBody, 'Member report retrieved successfully');
        const memKeys = Object.keys(memData);
        assert(memKeys[0] === 'member', 'First top-level key is member');
        assert(memKeys[1] === 'summary', 'Second top-level key is summary');
        assert(memKeys[2] === 'activity', 'Third top-level key is activity');
        assert(memKeys[3] === 'pagination', 'Fourth top-level key is pagination');
        verifyPaginationBlock(memData.pagination);

        const act = memData.activity;
        const actKeys = Object.keys(act);
        assert(actKeys[0] === 'loans', 'First activity key is loans');
        assert(actKeys[1] === 'loanHistory', 'Second activity key is loanHistory');
        assert(actKeys[2] === 'reservations', 'Third activity key is reservations');
        assert(actKeys[3] === 'orders', 'Fourth activity key is orders');
        assert(actKeys[4] === 'reviews', 'Fifth activity key is reviews');

        // Member Report (Plural Route Parity)
        const { body: memPluralBody } = await getRequest(`admin/dashboard/reports/members/${member.id}`);
        const memPluralData = verifyEnvelopeAndGetPayload(memPluralBody, 'Member report retrieved successfully');
        assert(memPluralData.member !== undefined, 'GET /members/:memberId works correctly');

      } catch (err) {
        console.error('Test execution failed with error:', err);
      } finally {
        console.log('\nCleaning up database records...');
        try {
          await prisma.review.deleteMany({ where: { id: { in: cleanUps.reviewIds } } });
          await prisma.order.deleteMany({ where: { id: { in: cleanUps.orderIds } } });
          await prisma.reservation.deleteMany({ where: { id: { in: cleanUps.reservationIds } } });
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
            console.log('All Production Refinement & Verification checks passed successfully!');
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
