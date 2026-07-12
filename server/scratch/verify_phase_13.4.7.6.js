/**
 * Verification script for Phase 13.4.7.6 - Member Report Response Formatting.
 * Run with: node scratch/verify_phase_13.4.7.6.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole, CopyStatus, CopyCondition, LoanStatus, ReservationStatus, PaymentStatus, OrderStatus } from '@prisma/client';

const PORT = 5586;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.4.7.6 Member Report Response Formatting Verification...\n');
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
    
    const admin = await createUser(`admin_13476_${Date.now()}`, UserRole.ADMIN);
    const member = await createUser(`member_13476_${Date.now()}`, UserRole.MEMBER);

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
    const book2 = await createBook('Book Active 2', `isbn2_${Date.now()}`);

    // Seed Book Copies
    const createCopy = async (bookId, barcode) => {
      const copy = await prisma.bookCopy.create({
        data: { bookId, barcode, condition: CopyCondition.GOOD, status: CopyStatus.AVAILABLE }
      });
      cleanUps.bookCopyIds.push(copy.id);
      return copy;
    };

    const copy1 = await createCopy(book1.id, `barcode1_${Date.now()}`);
    const copy2 = await createCopy(book2.id, `barcode2_${Date.now()}`);

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
    await createLoan(copy2.id, new Date(nowMs - 15 * 24 * 60 * 60 * 1000), new Date(nowMs - 10 * 24 * 60 * 60 * 1000), new Date(nowMs - 12 * 24 * 60 * 60 * 1000), LoanStatus.RETURNED, 1.00);

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

        // 1. Verify Standardized Response structure and ordering
        console.log('\n--- 1. Standardized Response Keys & Order ---');
        const { status, body } = await getRequest(`admin/dashboard/reports/member/${member.id}`);
        assert(status === 200, 'GET member report returns 200 OK');
        
        const data = body.data;
        const topKeys = Object.keys(data);
        
        // Assert top-level property order: member, summary, activity, pagination
        assert(topKeys[0] === 'member', `First top-level key is member (got ${topKeys[0]})`);
        assert(topKeys[1] === 'summary', `Second top-level key is summary (got ${topKeys[1]})`);
        assert(topKeys[2] === 'activity', `Third top-level key is activity (got ${topKeys[2]})`);
        assert(topKeys[3] === 'pagination', `Fourth top-level key is pagination (got ${topKeys[3]})`);

        // Assert activity property order: loans, loanHistory, reservations, orders, reviews
        const act = data.activity;
        const actKeys = Object.keys(act);
        assert(actKeys[0] === 'loans', `First activity key is loans (got ${actKeys[0]})`);
        assert(actKeys[1] === 'loanHistory', `Second activity key is loanHistory (got ${actKeys[1]})`);
        assert(actKeys[2] === 'reservations', `Third activity key is reservations (got ${actKeys[2]})`);
        assert(actKeys[3] === 'orders', `Fourth activity key is orders (got ${actKeys[3]})`);
        assert(actKeys[4] === 'reviews', `Fifth activity key is reviews (got ${actKeys[4]})`);

        // 2. Legacy Flat Schema Removal Audit
        console.log('\n--- 2. Legacy Flat Keys Audit ---');
        assert(data.loans === undefined, 'data.loans is undefined');
        assert(data.loanHistory === undefined, 'data.loanHistory is undefined');
        assert(data.reservations === undefined, 'data.reservations is undefined');
        assert(data.orders === undefined, 'data.orders is undefined');
        assert(data.reviews === undefined, 'data.reviews is undefined');

        // 3. Serialization and Statistics Verification
        console.log('\n--- 3. Serialization and Statistics Audit ---');
        const sum = data.summary;
        assert(typeof sum.totalLoans === 'number' && sum.totalLoans === 2, 'sum.totalLoans remains numeric');
        assert(typeof sum.averageReviewRating === 'number' && sum.averageReviewRating === 5.00, 'sum.averageReviewRating remains numeric');
        assert(typeof sum.totalFines === 'number' && sum.totalFines === 3.50, 'sum.totalFines remains numeric');
        
        // Assert date formats
        const activeLoanItem = act.loans[0];
        assert(activeLoanItem !== undefined, 'Found active loan item');
        assert(!isNaN(Date.parse(activeLoanItem.issueDate)), `issueDate is serialized as valid date string (${activeLoanItem.issueDate})`);

        // 4. Empty Collection Serialization
        console.log('\n--- 4. Empty Collection Serialization Check ---');
        const { body: filterBody } = await getRequest(`admin/dashboard/reports/member/${member.id}`, '?activityType=reviews');
        const fAct = filterBody.data.activity;
        assert(Array.isArray(fAct.loans) && fAct.loans.length === 0, 'fAct.loans serializes as empty array []');
        assert(Array.isArray(fAct.reservations) && fAct.reservations.length === 0, 'fAct.reservations serializes as empty array []');
        assert(Array.isArray(fAct.reviews) && fAct.reviews.length === 1, 'fAct.reviews serializes as populated array [1 item]');
        assert(filterBody.data.pagination !== undefined, 'pagination object is always present');

        // 5. Regression Check
        console.log('\n--- 5. Regression Checks ---');
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
            console.log('All Response Formatting checks verified successfully!');
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
