/**
 * Verification script for Phase 13.4.7.3 - Member Report Service.
 * Run with: node scratch/verify_phase_13.4.7.3.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole, CopyStatus, CopyCondition, LoanStatus, ReservationStatus, PaymentStatus, OrderStatus } from '@prisma/client';

const PORT = 5583;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.4.7.3 Member Report Service Verification...\n');
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
    
    const admin = await createUser(`admin_13473_${Date.now()}`, UserRole.ADMIN);
    const member = await createUser(`member_13473_${Date.now()}`, UserRole.MEMBER);
    const nonMember = await createUser(`nonmem_13473_${Date.now()}`, UserRole.ADMIN); // Admin is not a member

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

    const book1 = await createBook('Harry Potter Active', `isbn1_${Date.now()}`, false);
    const book2 = await createBook('Harry Potter Deleted', `isbn2_${Date.now()}`, true);

    // Seed Book Copies
    const createCopy = async (bookId, barcode) => {
      const copy = await prisma.bookCopy.create({
        data: { bookId, barcode, condition: CopyCondition.GOOD, status: CopyStatus.AVAILABLE }
      });
      cleanUps.bookCopyIds.push(copy.id);
      return copy;
    };

    const copy1 = await createCopy(book1.id, `barcode1_${Date.now()}`);
    const copy2 = await createCopy(book2.id, `barcode2_${Date.now()}`); // Linked to soft-deleted book

    // Seed Loans for Member
    const createLoan = async (copyId, issueDate, dueDate, returnDate, status) => {
      const loan = await prisma.loan.create({
        data: {
          userId: member.id,
          copyId,
          issueDate,
          dueDate,
          returnDate,
          status
        }
      });
      cleanUps.loanIds.push(loan.id);
      return loan;
    };

    // Active Loans: Expect only activeLoan1 to show up (activeLoan2 is linked to a soft-deleted book)
    const activeLoan1 = await createLoan(copy1.id, new Date('2026-07-02'), new Date('2026-07-16'), null, LoanStatus.BORROWED);
    const activeLoan2 = await createLoan(copy2.id, new Date('2026-07-05'), new Date('2026-07-19'), null, LoanStatus.BORROWED); // linked to soft-deleted copy2
    
    // Loan History: Returned loans. Test returnDate DESC ordering (returnedLoan2 returned on July 10, returnedLoan1 on July 5)
    const returnedLoan1 = await createLoan(copy1.id, new Date('2026-06-25'), new Date('2026-07-09'), new Date('2026-07-05'), LoanStatus.RETURNED);
    const returnedLoan2 = await createLoan(copy1.id, new Date('2026-06-28'), new Date('2026-07-12'), new Date('2026-07-10'), LoanStatus.RETURNED);

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

    // Expect res1 and res2 to show. res3 is linked to soft-deleted book2. Test createdAt DESC ordering (res2 created on July 5, res1 on July 2)
    const res1 = await createReservation(book1.id, copy1.id, ReservationStatus.PENDING, new Date('2026-07-02'));
    const res2 = await createReservation(book1.id, copy1.id, ReservationStatus.PENDING, new Date('2026-07-05'));
    const res3 = await createReservation(book2.id, copy2.id, ReservationStatus.PENDING, new Date('2026-07-06'));

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

    // Test orderedAt DESC ordering (order2 ordered on July 3, order1 on July 1)
    const order1 = await createOrder(`ORD1_${Date.now()}`, new Date('2026-07-01'));
    const order2 = await createOrder(`ORD2_${Date.now()}`, new Date('2026-07-03'));

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

    // Expect rev1 to show. rev2 linked to soft-deleted book2.
    const rev1 = await createReview(book1.id, 5, 'Awesome book!', new Date('2026-07-02'));
    const rev2 = await createReview(book2.id, 2, 'Deleted book review', new Date('2026-07-04'));

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

        // 1. Nonexistent Member Check (404)
        console.log('\n--- 1. Nonexistent Member Check ---');
        const invalidUUID = '00000000-0000-0000-0000-000000000000';
        const { status: status404, body: body404 } = await getRequest(`admin/dashboard/reports/member/${invalidUUID}`);
        assert(status404 === 404, 'Request with nonexistent memberId returns 404 Not Found');
        assert(body404.message === 'Member not found.', 'Error message is "Member not found."');

        // 2. Non-member Role Check (400)
        console.log('\n--- 2. Non-member Role Check ---');
        const { status: status400, body: body400 } = await getRequest(`admin/dashboard/reports/member/${nonMember.id}`);
        assert(status400 === 400, 'Request with non-member role (ADMIN) returns 400 Bad Request');
        assert(body400.message === 'User is not a member.', 'Error message is "User is not a member."');

        // 3. Complete Activity Report Retrieval (fetchAll = true)
        console.log('\n--- 3. Complete Activity Report Retrieval ---');
        const { status: status200, body: body200 } = await getRequest(`admin/dashboard/reports/member/${member.id}`);
        assert(status200 === 200, 'Request with valid member returns 200 OK');
        
        const data = body200.data;
        assert(data.member !== undefined && data.member.id === member.id, 'Member profile is returned correctly');
        
        // Active Loans Check
        assert(data.loans.length === 1 && data.loans[0].id === activeLoan1.id, 'Only active loans of non-deleted books are fetched (excludes returned and soft-deleted)');
        
        // Loan History Check & returnDate DESC ordering
        assert(data.loanHistory.length === 2, 'Loan history fetched both returned records');
        assert(data.loanHistory[0].id === returnedLoan2.id, 'Loan history sorted deterministically by returnDate DESC (newest first)');
        assert(data.loanHistory[1].id === returnedLoan1.id, 'Loan history second item is correct');

        // Reservations Check & createdAt DESC ordering
        assert(data.reservations.length === 2, 'Reservations fetched both non-deleted records');
        assert(data.reservations[0].id === res2.id, 'Reservations sorted deterministically by createdAt DESC (newest first)');
        assert(data.reservations[1].id === res1.id, 'Reservations second item is correct');

        // Orders Check & orderedAt DESC ordering
        assert(data.orders.length === 2, 'Orders fetched both records');
        assert(data.orders[0].id === order2.id, 'Orders sorted deterministically by orderedAt DESC (newest first)');
        assert(data.orders[1].id === order1.id, 'Orders second item is correct');

        // Reviews Check
        assert(data.reviews.length === 1 && data.reviews[0].id === rev1.id, 'Reviews fetched non-deleted review records');

        // 4. Activity Type Filtering Check
        console.log('\n--- 4. Activity Type Filtering Checks ---');
        
        // Fetch only reviews
        const { body: bodyReviews } = await getRequest(`admin/dashboard/reports/member/${member.id}`, '?activityType=reviews');
        const dataRev = bodyReviews.data;
        assert(dataRev.reviews.length === 1, 'activityType=reviews returns reviews');
        assert(dataRev.loans.length === 0, 'activityType=reviews skips loans (returns empty array)');
        assert(dataRev.loanHistory.length === 0, 'activityType=reviews skips loan history (returns empty array)');
        assert(dataRev.reservations.length === 0, 'activityType=reviews skips reservations (returns empty array)');
        assert(dataRev.orders.length === 0, 'activityType=reviews skips orders (returns empty array)');

        // Fetch only loans
        const { body: bodyLoans } = await getRequest(`admin/dashboard/reports/member/${member.id}`, '?activityType=loans');
        const dataLoans = bodyLoans.data;
        assert(dataLoans.loans.length === 1, 'activityType=loans returns active loans');
        assert(dataLoans.loanHistory.length === 2, 'activityType=loans returns loan history');
        assert(dataLoans.reservations.length === 0, 'activityType=loans skips reservations (returns empty array)');
        assert(dataLoans.orders.length === 0, 'activityType=loans skips orders (returns empty array)');
        assert(dataLoans.reviews.length === 0, 'activityType=loans skips reviews (returns empty array)');

        // 5. Regression Checks
        console.log('\n--- 5. Regression Checks ---');
        const { status: codeSum } = await getRequest('admin/dashboard/summary');
        assert(codeSum === 200, 'GET /admin/dashboard/summary continues to work (returns 200)');

        const { status: codeOverdue } = await getRequest('admin/dashboard/reports/overdue');
        assert(codeOverdue === 200, 'GET /admin/dashboard/reports/overdue continues to work (returns 200)');

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
            console.log('All Member Report Service checks verified successfully!');
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
