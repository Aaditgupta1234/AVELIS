/**
 * Verification script for Phase 13.4.7.5 - Filtering, Sorting & Pagination Refinement.
 * Run with: node scratch/verify_phase_13.4.7.5.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole, CopyStatus, CopyCondition, LoanStatus, ReservationStatus, PaymentStatus, OrderStatus } from '@prisma/client';

const PORT = 5585;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.4.7.5 Refined Filtering, Sorting & Pagination Verification...\n');
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
    
    const admin = await createUser(`admin_13475_${Date.now()}`, UserRole.ADMIN);
    const member = await createUser(`member_13475_${Date.now()}`, UserRole.MEMBER);

    // Seed Author & Category
    const author = await prisma.author.create({ data: { fullName: `Rowling_${Date.now()}` } });
    cleanUps.authorIds.push(author.id);
    const category = await prisma.category.create({ data: { name: `Fantasy_${Date.now()}` } });
    cleanUps.categoryIds.push(category.id);

    // Seed Books (12 active books, 1 soft-deleted book)
    const createBook = async (title, isbn, isDeleted = false) => {
      const b = await prisma.book.create({
        data: {
          title,
          isbn,
          sellingPrice: 15.99,
          stockQuantity: 10,
          isBorrowable: true,
          isForSale: true,
          isDeleted,
          deletedAt: isDeleted ? new Date() : null,
          authors: { create: { authorId: author.id } },
          categories: { create: { categoryId: category.id } }
        }
      });
      cleanUps.bookIds.push(b.id);
      return b;
    };

    const books = [];
    for (let i = 1; i <= 12; i++) {
      const book = await createBook(`Book Active ${i}`, `isbn_active_${i}_${Date.now()}`, false);
      books.push(book);
    }
    const deletedBook = await createBook('Book Deleted', `isbn_del_${Date.now()}`, true);

    // Seed Book Copies
    const createCopy = async (bookId, barcode) => {
      const copy = await prisma.bookCopy.create({
        data: { bookId, barcode, condition: CopyCondition.GOOD, status: CopyStatus.AVAILABLE }
      });
      cleanUps.bookCopyIds.push(copy.id);
      return copy;
    };

    const copies = [];
    for (let i = 0; i < 12; i++) {
      const copy = await createCopy(books[i].id, `barcode_active_${i}_${Date.now()}`);
      copies.push(copy);
    }
    const deletedCopy = await createCopy(deletedBook.id, `barcode_del_${Date.now()}`);

    // Seed Loans
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

    // 4 active loans
    const loanDates = [
      new Date('2026-07-10T12:00:00Z'),
      new Date('2026-07-08T12:00:00Z'),
      new Date('2026-07-06T12:00:00Z'),
      new Date('2026-07-04T12:00:00Z')
    ];
    for (let i = 0; i < 4; i++) {
      await createLoan(copies[i].id, loanDates[i], new Date('2026-07-20'), null, LoanStatus.BORROWED, 1.00);
    }

    // 4 returned loans
    const returnDates = [
      new Date('2026-07-10T12:00:00Z'),
      new Date('2026-07-08T12:00:00Z'),
      new Date('2026-07-06T12:00:00Z'),
      new Date('2026-07-04T12:00:00Z')
    ];
    for (let i = 0; i < 4; i++) {
      await createLoan(copies[i + 4].id, new Date('2026-07-01'), new Date('2026-07-10'), returnDates[i], LoanStatus.RETURNED, 2.00);
    }

    // Soft-deleted copy loan (must be ignored)
    await createLoan(deletedCopy.id, new Date('2026-07-09T12:00:00Z'), new Date('2026-07-25'), null, LoanStatus.BORROWED, 15.00);

    // Seed 4 Reservations
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

    const resDates = [
      new Date('2026-07-10T12:00:00Z'),
      new Date('2026-07-08T12:00:00Z'),
      new Date('2026-07-06T12:00:00Z'),
      new Date('2026-07-04T12:00:00Z')
    ];
    for (let i = 0; i < 4; i++) {
      await createReservation(books[i].id, resDates[i]);
    }
    // Soft-deleted book reservation (must be ignored)
    await createReservation(deletedBook.id, new Date('2026-07-09T12:00:00Z'));

    // Seed 4 Orders
    const createOrder = async (orderNumber, orderedAt) => {
      const order = await prisma.order.create({
        data: {
          userId: member.id,
          orderNumber,
          totalAmount: 10.00,
          paymentStatus: PaymentStatus.PAID,
          orderStatus: OrderStatus.DELIVERED,
          shippingAddress: 'Test Addr',
          orderedAt
        }
      });
      cleanUps.orderIds.push(order.id);
      return order;
    };

    const orderDates = [
      new Date('2026-07-10T12:00:00Z'),
      new Date('2026-07-08T12:00:00Z'),
      new Date('2026-07-06T12:00:00Z'),
      new Date('2026-07-04T12:00:00Z')
    ];
    for (let i = 0; i < 4; i++) {
      await createOrder(`ORD_${i}_${Date.now()}`, orderDates[i]);
    }

    // Seed 8 Reviews (to verify database pagination on page 2)
    // Three of them have identical timestamps to test the secondary ID tie-breaker sorting.
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

    const reviewDates = [
      new Date('2026-07-10T12:00:00Z'),
      new Date('2026-07-08T12:00:00Z'),
      new Date('2026-07-06T12:00:00Z'),
      new Date('2026-07-04T12:00:00Z'),
      new Date('2026-07-04T12:00:00Z'), // Identical timestamp
      new Date('2026-07-04T12:00:00Z'), // Identical timestamp
      new Date('2026-07-02T12:00:00Z'),
      new Date('2026-07-01T12:00:00Z')
    ];

    const reviewsSeeded = [];
    for (let i = 0; i < 8; i++) {
      const r = await createReview(books[i].id, 4, `Comment ${i}`, reviewDates[i]);
      reviewsSeeded.push(r);
    }
    // Soft-deleted book review (must be ignored)
    await createReview(deletedBook.id, 5, 'Deleted Book Review', new Date('2026-07-09T12:00:00Z'));

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

        // 1. Verify Date Range Filters
        console.log('\n--- 1. Date Range Filters ---');
        const { body: dateBody } = await getRequest(
          `admin/dashboard/reports/member/${member.id}`,
          '?fromDate=2026-07-05T00:00:00Z&toDate=2026-07-09T23:59:59Z'
        );
        // Active loans with issueDate in range: 2026-07-06, 2026-07-08 (2 items)
        // Returned loans with returnDate in range: 2026-07-06, 2026-07-08 (2 items)
        // Reservations: 2026-07-06, 2026-07-08 (2 items)
        // Orders: 2026-07-06, 2026-07-08 (2 items)
        // Reviews: 2026-07-06, 2026-07-08 (2 items)
        assert(dateBody.data.loans.length === 2, `Loans count filtered by date: expected 2, got ${dateBody.data.loans.length}`);
        assert(dateBody.data.reservations.length === 2, `Reservations count filtered by date: expected 2, got ${dateBody.data.reservations.length}`);
        assert(dateBody.data.orders.length === 2, `Orders count filtered by date: expected 2, got ${dateBody.data.orders.length}`);

        // 2. Verify Secondary Stable Ordering (Duplicate Timestamps tie-breaker)
        console.log('\n--- 2. Secondary Stable Ordering ---');
        const { body: sortBody } = await getRequest(`admin/dashboard/reports/member/${member.id}`, '?activityType=reviews&limit=10');
        const revs = sortBody.data.reviews;
        // Verify primary sorting (createdAt desc)
        let sorted = true;
        for (let i = 0; i < revs.length - 1; i++) {
          if (new Date(revs[i].createdAt) < new Date(revs[i + 1].createdAt)) {
            sorted = false;
          }
        }
        assert(sorted, 'Reviews are sorted by createdAt descending');

        // Locate reviews with identical timestamp: 2026-07-04
        const dupTReviews = revs.filter(r => new Date(r.createdAt).toISOString() === '2026-07-04T12:00:00.000Z');
        assert(dupTReviews.length === 3, 'Found 3 reviews with identical createdAt timestamp');
        
        // Assert they are sorted deterministically by id descending
        let secondarySorted = true;
        for (let i = 0; i < dupTReviews.length - 1; i++) {
          if (dupTReviews[i].id < dupTReviews[i + 1].id) {
            secondarySorted = false;
          }
        }
        assert(secondarySorted, 'Reviews with identical createdAt are sorted by id descending');

        // 3. Verify Database Pagination Execution (page 2, limit 5)
        console.log('\n--- 3. Database Pagination Execution ---');
        const { body: page2Body } = await getRequest(`admin/dashboard/reports/member/${member.id}`, '?activityType=reviews&page=2&limit=5');
        const p2Revs = page2Body.data.reviews;
        
        // Assert count representing page 2 of 8 seeded reviews
        assert(p2Revs.length === 3, `Returned reviews count on page 2: expected 3, got ${p2Revs.length}`);
        
        // Assert pagination metadata
        const metadata = page2Body.data.pagination;
        assert(metadata !== undefined, 'Pagination metadata is returned');
        assert(metadata.totalItems === 8, `Pagination totalItems reflects full count: expected 8, got ${metadata.totalItems}`);
        assert(metadata.totalPages === 2, `Pagination totalPages is correct: expected 2, got ${metadata.totalPages}`);
        assert(metadata.page === 2, `Pagination page is correct: expected 2, got ${metadata.page}`);
        assert(metadata.hasNextPage === false, 'hasNextPage is false for the last page');
        assert(metadata.hasPreviousPage === true, 'hasPreviousPage is true on page 2');

        // 4. Verify Beyond Page Boundaries Returns Empty Array but Keep Summary Complete
        console.log('\n--- 4. Beyond Page Boundaries Check ---');
        const { body: outBoundsBody } = await getRequest(`admin/dashboard/reports/member/${member.id}`, '?activityType=reviews&page=5&limit=5');
        assert(outBoundsBody.data.reviews.length === 0, 'Returned reviews is empty when page is out of bounds');
        assert(outBoundsBody.data.summary.totalReviews === 8, `Summary stats remain complete and unaffected: expected 8, got ${outBoundsBody.data.summary.totalReviews}`);
        assert(outBoundsBody.data.summary.totalLoans === 8, `Summary loan count remains complete and unaffected: expected 8, got ${outBoundsBody.data.summary.totalLoans}`);

        // 5. Verify Soft-Deleted Book Copies Excluded
        console.log('\n--- 5. Soft-deleted Exclusions ---');
        const { body: fullBody } = await getRequest(`admin/dashboard/reports/member/${member.id}`);
        // Seeded 4 active loans, 4 returned loans, and 1 loan on soft-deleted copy.
        // We expect totalLoans to be 8, activeLoans = 4, outstandingFines = 4.00, totalFines = 12.00 (4*1.00 + 4*2.00)
        assert(fullBody.data.summary.totalLoans === 8, `totalLoans excludes soft-deleted: expected 8, got ${fullBody.data.summary.totalLoans}`);
        assert(fullBody.data.summary.totalReservations === 4, `totalReservations excludes soft-deleted: expected 4, got ${fullBody.data.summary.totalReservations}`);
        assert(fullBody.data.summary.totalReviews === 8, `totalReviews excludes soft-deleted: expected 8, got ${fullBody.data.summary.totalReviews}`);

        // 6. Regression Checks
        console.log('\n--- 6. Regression Checks ---');
        const { status: codeSum } = await getRequest('admin/dashboard/summary');
        assert(codeSum === 200, 'GET /admin/dashboard/summary continues to work (returns 200)');

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
            console.log('All Filtering, Sorting & Pagination checks verified successfully!');
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
