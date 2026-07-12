/**
 * Verification script for Phase 13.4.8 - Reporting Response Formatting.
 * Run with: node scratch/verify_phase_13.4.8.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole, CopyStatus, CopyCondition, LoanStatus, ReservationStatus, PaymentStatus, OrderStatus } from '@prisma/client';

const PORT = 5588;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.4.8 Reporting Response Formatting Module-wide Verification...\n');
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
    console.log('Seeding test database records...');
    
    // Seed Users
    const createUser = async (username, role) => {
      const u = await prisma.user.create({
        data: { username, email: `${username}@test.com`, passwordHash: 'hash', role, isActive: true }
      });
      cleanUps.userIds.push(u.id);
      return u;
    };
    
    const admin = await createUser(`admin_1348_${Date.now()}`, UserRole.ADMIN);
    const member = await createUser(`member_1348_${Date.now()}`, UserRole.MEMBER);

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
          // Verify no mixed pageSize/currentPage naming
          assert(pagination.pageSize === undefined, 'Mixed key pageSize is undefined');
          assert(pagination.currentPage === undefined, 'Mixed key currentPage is undefined');
        };

        // 1. Dashboard Summary
        console.log('\n--- 1. Dashboard Summary Audit ---');
        const { body: dbBody } = await getRequest('admin/dashboard/summary');
        const dbData = verifyEnvelopeAndGetPayload(dbBody, 'Dashboard summary retrieved successfully');
        const dbKeys = Object.keys(dbData);
        assert(dbKeys[0] === 'filter', `First key is filter (got ${dbKeys[0]})`);
        assert(dbKeys[1] === 'users', `Second key is users (got ${dbKeys[1]})`);
        assert(dbKeys[2] === 'books', `Third key is books (got ${dbKeys[2]})`);
        assert(dbKeys[3] === 'loans', `Fourth key is loans (got ${dbKeys[3]})`);
        assert(dbKeys[4] === 'reservations', `Fifth key is reservations (got ${dbKeys[4]})`);
        assert(dbKeys[5] === 'orders', `Sixth key is orders (got ${dbKeys[5]})`);

        // 2. Inventory Report
        console.log('\n--- 2. Inventory Report Audit ---');
        const { body: invBody } = await getRequest('admin/dashboard/reports/inventory');
        const invData = verifyEnvelopeAndGetPayload(invBody, 'Inventory report retrieved successfully');
        const invKeys = Object.keys(invData);
        assert(invKeys[0] === 'summary', 'First top-level key is summary');
        assert(invKeys[1] === 'items', 'Second top-level key is items');
        assert(invKeys[2] === 'pagination', 'Third top-level key is pagination');
        verifyPaginationBlock(invData.pagination);

        // 3. Overdue Report
        console.log('\n--- 3. Overdue Report Audit ---');
        const { body: ovBody } = await getRequest('admin/dashboard/reports/overdue');
        const ovData = verifyEnvelopeAndGetPayload(ovBody, 'Overdue report retrieved successfully');
        const ovKeys = Object.keys(ovData);
        assert(ovKeys[0] === 'items', 'First top-level key is items');
        assert(ovKeys[1] === 'pagination', 'Second top-level key is pagination');
        verifyPaginationBlock(ovData.pagination);

        // 4. Book Search Report
        console.log('\n--- 4. Book Search Report Audit ---');
        const { body: bsBody } = await getRequest('admin/dashboard/reports/search/books');
        const bsData = verifyEnvelopeAndGetPayload(bsBody, 'Books search report retrieved successfully');
        assert(Object.keys(bsData)[0] === 'items', 'First top-level key is items');
        assert(Object.keys(bsData)[1] === 'pagination', 'Second top-level key is pagination');
        verifyPaginationBlock(bsData.pagination);

        // 5. Member Search Report
        console.log('\n--- 5. Member Search Report Audit ---');
        const { body: msBody } = await getRequest('admin/dashboard/reports/search/members');
        const msData = verifyEnvelopeAndGetPayload(msBody, 'Members search report retrieved successfully');
        assert(Object.keys(msData)[0] === 'items', 'First top-level key is items');
        verifyPaginationBlock(msData.pagination);

        // 6. Loan Search Report
        console.log('\n--- 6. Loan Search Report Audit ---');
        const { body: lsBody } = await getRequest('admin/dashboard/reports/search/loans');
        const lsData = verifyEnvelopeAndGetPayload(lsBody, 'Loans search report retrieved successfully');
        assert(Object.keys(lsData)[0] === 'items', 'First top-level key is items');
        verifyPaginationBlock(lsData.pagination);

        // 7. Reservation Search Report
        console.log('\n--- 7. Reservation Search Report Audit ---');
        const { body: rsBody } = await getRequest('admin/dashboard/reports/search/reservations');
        const rsData = verifyEnvelopeAndGetPayload(rsBody, 'Reservations search report retrieved successfully');
        assert(Object.keys(rsData)[0] === 'items', 'First top-level key is items');
        verifyPaginationBlock(rsData.pagination);

        // 8. Order Search Report
        console.log('\n--- 8. Order Search Report Audit ---');
        const { body: osBody } = await getRequest('admin/dashboard/reports/search/orders');
        const osData = verifyEnvelopeAndGetPayload(osBody, 'Orders search report retrieved successfully');
        assert(Object.keys(osData)[0] === 'items', 'First top-level key is items');
        verifyPaginationBlock(osData.pagination);

        // 9. Member Report
        console.log('\n--- 9. Member Report Audit ---');
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
            console.log('All Reporting Response Formatting checks passed successfully!');
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
