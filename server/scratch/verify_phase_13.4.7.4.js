/**
 * Verification script for Phase 13.4.7.4 - Member Statistics.
 * Run with: node scratch/verify_phase_13.4.7.4.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole, CopyStatus, CopyCondition, LoanStatus, ReservationStatus, PaymentStatus, OrderStatus } from '@prisma/client';

const PORT = 5584;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.4.7.4 Member Statistics Verification...\n');
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
    
    const admin = await createUser(`admin_13474_${Date.now()}`, UserRole.ADMIN);
    const member = await createUser(`member_13474_${Date.now()}`, UserRole.MEMBER);
    const zeroMember = await createUser(`zero_13474_${Date.now()}`, UserRole.MEMBER);

    // Seed Author & Category
    const author = await prisma.author.create({ data: { fullName: `Rowling_${Date.now()}` } });
    cleanUps.authorIds.push(author.id);
    const category = await prisma.category.create({ data: { name: `Fantasy_${Date.now()}` } });
    cleanUps.categoryIds.push(category.id);

    // Seed Books (Book 1 active, Book 2 soft-deleted)
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

    const book1 = await createBook('Book Active', `isbn1_${Date.now()}`, false);
    const book2 = await createBook('Book Deleted', `isbn2_${Date.now()}`, true);
    const book3 = await createBook('Book Active 2', `isbn3_${Date.now()}`, false);
    const book4 = await createBook('Book Active 3', `isbn4_${Date.now()}`, false);

    // Seed Book Copies
    const createCopy = async (bookId, barcode) => {
      const copy = await prisma.bookCopy.create({
        data: { bookId, barcode, condition: CopyCondition.GOOD, status: CopyStatus.AVAILABLE }
      });
      cleanUps.bookCopyIds.push(copy.id);
      return copy;
    };

    const copy1 = await createCopy(book1.id, `barcode1_${Date.now()}`);
    const copy2 = await createCopy(book2.id, `barcode2_${Date.now()}`); // soft-deleted copy

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

    // Loan durations calculated as diffDays using Math.floor
    const nowMs = Date.now();
    const activeLoan1 = await createLoan(copy1.id, new Date(nowMs - 4 * 24 * 60 * 60 * 1000), new Date(nowMs + 10 * 24 * 60 * 60 * 1000), null, LoanStatus.BORROWED, 2.50);
    const overdueLoan1 = await createLoan(copy1.id, new Date(nowMs - 10 * 24 * 60 * 60 * 1000), new Date(nowMs - 2 * 24 * 60 * 60 * 1000), null, LoanStatus.OVERDUE, 5.00);
    const returnedLoan1 = await createLoan(copy1.id, new Date(nowMs - 15 * 24 * 60 * 60 * 1000), new Date(nowMs - 10 * 24 * 60 * 60 * 1000), new Date(nowMs - 12 * 24 * 60 * 60 * 1000), LoanStatus.RETURNED, 1.00); // duration = 3 days
    const returnedLoan2 = await createLoan(copy1.id, new Date(nowMs - 20 * 24 * 60 * 60 * 1000), new Date(nowMs - 10 * 24 * 60 * 60 * 1000), new Date(nowMs - 13 * 24 * 60 * 60 * 1000), LoanStatus.RETURNED, 1.00); // duration = 7 days
    const deletedBookActiveLoan = await createLoan(copy2.id, new Date(nowMs - 5 * 24 * 60 * 60 * 1000), new Date(nowMs + 9 * 24 * 60 * 60 * 1000), null, LoanStatus.BORROWED, 10.00); // soft-deleted copy

    // Seed Reservations
    const createReservation = async (bookId, copyId, status, createdAt) => {
      const res = await prisma.reservation.create({
        data: {
          userId: member.id,
          bookId,
          copyId,
          status,
          createdAt
        }
      });
      cleanUps.reservationIds.push(res.id);
      return res;
    };

    await createReservation(book1.id, copy1.id, ReservationStatus.PENDING, new Date('2026-07-02'));
    await createReservation(book1.id, copy1.id, ReservationStatus.PENDING, new Date('2026-07-05'));
    await createReservation(book2.id, copy2.id, ReservationStatus.PENDING, new Date('2026-07-06')); // soft-deleted book2

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
    await createOrder(`ORD2_${Date.now()}`, new Date('2026-07-03'));

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
    await createReview(book3.id, 4, 'Very good', new Date('2026-07-03'));
    await createReview(book4.id, 2, 'Average', new Date('2026-07-04'));
    await createReview(book2.id, 1, 'Deleted book review', new Date('2026-07-04')); // soft-deleted book2

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

        // 1. Verify Member Summary Statistics Calculations (fetchAll = true)
        console.log('\n--- 1. Summary Statistics Calculations ---');
        const { status: status200, body: body200 } = await getRequest(`admin/dashboard/reports/member/${member.id}`);
        assert(status200 === 200, 'Request with valid member returns 200 OK');
        
        const sum = body200.data.summary;
        assert(sum !== undefined, 'Summary object is returned in response');
        
        // Assertions matching calculations
        assert(sum.totalLoans === 4, `totalLoans count is correct: expected 4, got ${sum.totalLoans}`);
        assert(sum.activeLoans === 2, `activeLoans count is correct: expected 2, got ${sum.activeLoans}`);
        assert(sum.returnedLoans === 2, `returnedLoans count is correct: expected 2, got ${sum.returnedLoans}`);
        assert(sum.overdueLoans === 1, `overdueLoans count is correct: expected 1, got ${sum.overdueLoans}`);
        assert(sum.currentlyBorrowedBooks === 2, `currentlyBorrowedBooks count matches activeLoans: expected 2, got ${sum.currentlyBorrowedBooks}`);
        assert(sum.totalBooksBorrowed === 4, `totalBooksBorrowed count matches totalLoans: expected 4, got ${sum.totalBooksBorrowed}`);
        
        assert(sum.totalReservations === 2, `totalReservations is correct: expected 2, got ${sum.totalReservations}`);
        assert(sum.totalOrders === 2, `totalOrders is correct: expected 2, got ${sum.totalOrders}`);
        assert(sum.totalReviews === 3, `totalReviews is correct: expected 3, got ${sum.totalReviews}`);
        
        assert(sum.averageReviewRating === 3.67, `averageReviewRating is correct (rounded average of 5, 4, 2): expected 3.67, got ${sum.averageReviewRating}`);
        assert(sum.averageLoanDurationDays === 5.00, `averageLoanDurationDays is correct (average of 3 and 7 days): expected 5.00, got ${sum.averageLoanDurationDays}`);
        
        assert(sum.totalFines === 9.50, `totalFines is correct (sum of 2.50, 5.00, 1.00, 1.00): expected 9.50, got ${sum.totalFines}`);
        assert(sum.outstandingFines === 7.50, `outstandingFines is correct (sum of 2.50, 5.00): expected 7.50, got ${sum.outstandingFines}`);

        // 2. Verify Zero Values Correctness
        console.log('\n--- 2. Zero Values Correctness ---');
        const { body: zeroBody } = await getRequest(`admin/dashboard/reports/member/${zeroMember.id}`);
        const zeroSum = zeroBody.data.summary;
        assert(zeroSum.totalLoans === 0, 'zero totalLoans');
        assert(zeroSum.activeLoans === 0, 'zero activeLoans');
        assert(zeroSum.returnedLoans === 0, 'zero returnedLoans');
        assert(zeroSum.overdueLoans === 0, 'zero overdueLoans');
        assert(zeroSum.totalReservations === 0, 'zero totalReservations');
        assert(zeroSum.totalOrders === 0, 'zero totalOrders');
        assert(zeroSum.totalReviews === 0, 'zero totalReviews');
        assert(zeroSum.currentlyBorrowedBooks === 0, 'zero currentlyBorrowedBooks');
        assert(zeroSum.totalBooksBorrowed === 0, 'zero totalBooksBorrowed');
        assert(zeroSum.averageLoanDurationDays === 0, 'zero averageLoanDurationDays');
        assert(zeroSum.averageReviewRating === 0, 'zero averageReviewRating');
        assert(zeroSum.totalFines === 0, 'zero totalFines');
        assert(zeroSum.outstandingFines === 0, 'zero outstandingFines');

        // 3. Verify Activity Filtering
        console.log('\n--- 3. Activity Filtering Checks ---');
        const { body: filterBody } = await getRequest(`admin/dashboard/reports/member/${member.id}`, '?activityType=reviews');
        const filteredData = filterBody.data;
        const filteredSum = filteredData.summary;
        
        // Assert details are empty
        assert(filteredData.loans.length === 0, 'loans details array is empty');
        assert(filteredData.loanHistory.length === 0, 'loanHistory details array is empty');
        assert(filteredData.reservations.length === 0, 'reservations details array is empty');
        assert(filteredData.orders.length === 0, 'orders details array is empty');
        assert(filteredData.reviews.length === 3, 'reviews details array is fetched (3 reviews)');

        // Assert summary statistics are STILL fully populated
        assert(filteredSum.totalLoans === 4, `totalLoans summary is still correct: expected 4, got ${filteredSum.totalLoans}`);
        assert(filteredSum.averageLoanDurationDays === 5.00, `averageLoanDurationDays summary is still correct: expected 5.00, got ${filteredSum.averageLoanDurationDays}`);
        assert(filteredSum.totalFines === 9.50, `totalFines summary is still correct: expected 9.50, got ${filteredSum.totalFines}`);
        assert(filteredSum.totalReservations === 2, `totalReservations summary is still correct: expected 2, got ${filteredSum.totalReservations}`);

        // 4. Regression Checks
        console.log('\n--- 4. Regression Checks ---');
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
            console.log('All Member Statistics checks verified successfully!');
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
