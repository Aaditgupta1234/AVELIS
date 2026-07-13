/**
 * Verification script for Phase 13.5.1 - backend database query audit and optimizations.
 * Run with: node scratch/verify_phase_13.5.1.js
 */

import fs from 'fs';
import path from 'path';
import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole, CopyStatus, CopyCondition, LoanStatus, ReservationStatus, PaymentStatus, OrderStatus } from '@prisma/client';

const PORT = 5591;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

// Query counting telemetry
let queryLog = [];
let queryCounter = 0;
let transactionDurations = [];

// Dynamic model interceptor to count database query calls in Prisma 6
const modelsToIntercept = ['user', 'book', 'bookCopy', 'loan', 'reservation', 'review', 'order', 'author', 'category'];
const methodsToIntercept = ['findUnique', 'findFirst', 'findMany', 'create', 'update', 'delete', 'count', 'aggregate', 'groupBy', 'updateMany', 'deleteMany'];

for (const modelName of modelsToIntercept) {
  const model = prisma[modelName];
  if (model) {
    for (const methodName of methodsToIntercept) {
      const original = model[methodName];
      if (typeof original === 'function') {
        model[methodName] = async function(...args) {
          queryCounter++;
          queryLog.push({ model: modelName, action: methodName, timestamp: Date.now() });
          return original.apply(this, args);
        };
      }
    }
  }
}

// Wrap $transaction to track durations
const originalTransaction = prisma.$transaction;
prisma.$transaction = async function(arg, options) {
  const startTime = Date.now();
  // If transaction is passed a function (interactive transaction)
  if (typeof arg === 'function') {
    const res = await originalTransaction.call(prisma, async (tx) => {
      // Also intercept queries inside the transaction client
      for (const modelName of modelsToIntercept) {
        const txModel = tx[modelName];
        if (txModel) {
          for (const methodName of methodsToIntercept) {
            const originalTxMethod = txModel[methodName];
            if (typeof originalTxMethod === 'function') {
              txModel[methodName] = async function(...txArgs) {
                queryCounter++;
                queryLog.push({ model: modelName, action: methodName, isTx: true, timestamp: Date.now() });
                return originalTxMethod.apply(this, txArgs);
              };
            }
          }
        }
      }
      return arg(tx);
    }, options);
    transactionDurations.push(Date.now() - startTime);
    return res;
  } else {
    // Sequential transaction
    const res = await originalTransaction.call(prisma, arg, options);
    transactionDurations.push(Date.now() - startTime);
    return res;
  }
};

async function runTests() {
  console.log('================================================================');
  console.log('Running Phase 13.5.1 Database Query Audit & Verification...\n');
  console.log('================================================================');
  
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
    // 1. Static AST / Code Quality Audit
    console.log('--- 1. Static AST / Code Quality Audit ---');
    const filesToAudit = [
      'src/helpers/resource.helper.js',
      'src/services/book.service.js',
      'src/modules/review/review.service.js',
      'src/services/reservation.service.js',
      'src/services/loan.service.js',
      'src/services/dashboard.service.js',
      'src/services/analytics.service.js',
      'src/modules/reporting/reporting.service.js'
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

      // Assert JSDocs exist
      const jsdocCount = (content.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
      assert(jsdocCount > 0, `JSDoc documentation is present in ${relativePath} (found ${jsdocCount} blocks)`);
    }

    // 2. Seeding Test Data (including active, returned, overdue, deleted books, etc.)
    console.log('\n--- 2. Seeding Representative Database Records ---');
    
    const createUser = async (username, role, isActive = true) => {
      const u = await prisma.user.create({
        data: { username, email: `${username}@test1351.com`, passwordHash: 'hash1351', role, isActive }
      });
      cleanUps.userIds.push(u.id);
      return u;
    };

    const adminUser = await createUser(`admin_1351_${Date.now()}`, UserRole.ADMIN);
    const memberUser = await createUser(`member_1351_${Date.now()}`, UserRole.MEMBER);

    // Create Author & Category
    const author = await prisma.author.create({ data: { fullName: `Rowling_1351_${Date.now()}` } });
    cleanUps.authorIds.push(author.id);
    const category = await prisma.category.create({ data: { name: `Fantasy_1351_${Date.now()}` } });
    cleanUps.categoryIds.push(category.id);

    // Helper to seed books
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

    const activeBook = await createBook('Active Book 1351', `isbn_active_${Date.now()}`);
    const deletedBook = await createBook('Deleted Book 1351', `isbn_deleted_${Date.now()}`, true);

    // Helper to seed book copies
    const createCopy = async (bookId, barcode, status = CopyStatus.AVAILABLE) => {
      const copy = await prisma.bookCopy.create({
        data: { bookId, barcode, condition: CopyCondition.GOOD, status }
      });
      cleanUps.bookCopyIds.push(copy.id);
      return copy;
    };

    const activeCopy = await createCopy(activeBook.id, `barcode_active_${Date.now()}`, CopyStatus.AVAILABLE);
    const borrowedCopy = await createCopy(activeBook.id, `barcode_borrowed_${Date.now()}`, CopyStatus.BORROWED);
    const deletedBookCopy = await createCopy(deletedBook.id, `barcode_deleted_bk_${Date.now()}`, CopyStatus.AVAILABLE);

    // Helper to seed loans
    const createLoan = async (userId, copyId, status, issueDate = new Date(), returnDate = null) => {
      const loan = await prisma.loan.create({
        data: {
          userId,
          copyId,
          status,
          issueDate,
          dueDate: new Date(issueDate.getTime() + 14 * 24 * 60 * 60 * 1000),
          returnDate,
          fineAmount: status === LoanStatus.OVERDUE ? 5.00 : 0.00
        }
      });
      cleanUps.loanIds.push(loan.id);
      return loan;
    };

    const activeLoan = await createLoan(memberUser.id, borrowedCopy.id, LoanStatus.BORROWED);
    const historicalLoan = await createLoan(memberUser.id, activeCopy.id, LoanStatus.RETURNED, new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), new Date(Date.now() - 2 * 24 * 60 * 60 * 1000));
    
    // Seed loan on deleted book copy
    const deletedBookCopyBorrowed = await createCopy(deletedBook.id, `barcode_del_borrowed_${Date.now()}`, CopyStatus.BORROWED);
    const deletedBookLoan = await createLoan(memberUser.id, deletedBookCopyBorrowed.id, LoanStatus.BORROWED);

    // Helper to seed reservations
    const createReservation = async (userId, bookId, status) => {
      const res = await prisma.reservation.create({
        data: {
          userId,
          bookId,
          status,
          createdAt: new Date()
        }
      });
      cleanUps.reservationIds.push(res.id);
      return res;
    };

    const activeReservation = await createReservation(memberUser.id, activeBook.id, ReservationStatus.PENDING);
    const deletedBookReservation = await createReservation(memberUser.id, deletedBook.id, ReservationStatus.PENDING);

    // Helper to seed reviews
    const createReview = async (userId, bookId, rating) => {
      const rev = await prisma.review.create({
        data: {
          userId,
          bookId,
          rating,
          comment: 'Perfect test rating!'
        }
      });
      cleanUps.reviewIds.push(rev.id);
      return rev;
    };

    const activeReview = await createReview(memberUser.id, activeBook.id, 5);
    const deletedBookReview = await createReview(memberUser.id, deletedBook.id, 1);

    // Helper to seed orders
    const createOrder = async (userId, orderNumber) => {
      const o = await prisma.order.create({
        data: {
          userId,
          orderNumber,
          totalAmount: 15.99,
          paymentStatus: PaymentStatus.PAID,
          orderStatus: OrderStatus.DELIVERED,
          shippingAddress: '789 Test Rd',
          orderedAt: new Date()
        }
      });
      cleanUps.orderIds.push(o.id);
      return o;
    };

    const activeOrder = await createOrder(memberUser.id, `ORD1351_${Date.now()}`);

    // Generate token
    const adminToken = generateToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });
    const memberToken = generateToken({ id: memberUser.id, email: memberUser.email, role: memberUser.role });

    console.log('Seeding completed.');

    // 3. Starting HTTP Server
    console.log('\n--- 3. Starting HTTP Server ---');
    const server = app.listen(PORT, async () => {
      try {
        const getRequest = async (path, token = adminToken) => {
          const res = await fetch(`${BASE_URL}/${path}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const body = await res.json();
          return { status: res.status, body };
        };

        // 4. Verification of Soft-Delete Leak Prevention
        console.log('\n--- 4. Verification of Soft-Delete Leak Prevention ---');

        // Review check
        const { body: myReviews } = await getRequest('reviews/me', memberToken);
        const reviewContainsDeleted = myReviews.data.some(r => r.id === deletedBookReview.id);
        assert(!reviewContainsDeleted, 'Reviews list for member does not contain reviews of soft-deleted books');

        // Reservation check
        const { body: myReservations } = await getRequest('reservations/me', memberToken);
        const resContainsDeleted = myReservations.data.reservations.some(r => r.id === deletedBookReservation.id);
        assert(!resContainsDeleted, 'Reservations list for member does not contain reservations of soft-deleted books');

        // Loans check
        const { body: activeLoansList } = await getRequest('loans/active', memberToken);
        const loansContainDeleted = activeLoansList.data.some(l => l.id === deletedBookLoan.id);
        assert(!loansContainDeleted, 'Active loans list for member does not contain loans of soft-deleted books');

        const { body: loanHistoryList } = await getRequest('loans/history', memberToken);
        const histContainsDeleted = loanHistoryList.data.loans.some(l => l.id === deletedBookLoan.id);
        assert(!histContainsDeleted, 'Loan history list does not contain loans of soft-deleted books');

        // 5. Query Count & Parity Metrics
        console.log('\n--- 5. Query Count and Contract Verification ---');

        // Reset query logs
        queryCounter = 0;
        queryLog = [];
        transactionDurations = [];

        const startT = Date.now();
        const { body: dashboardSummary } = await getRequest('admin/dashboard/summary');
        const endT = Date.now();
        const summaryDuration = endT - startT;

        assert(dashboardSummary.success === true, 'Dashboard summary endpoint responds successfully');
        console.log(`[TELEMETRY] Dashboard summary took ${summaryDuration}ms`);
        console.log(`[TELEMETRY] Dashboard summary executed ${queryCounter} Prisma operations (Expected: 6)`);
        assert(queryCounter <= 6, 'Dashboard summary optimized queries to 6 or fewer');

        // Check dashboard summary counts
        const dbUsers = dashboardSummary.data.users;
        const dbBooks = dashboardSummary.data.books;
        const dbLoans = dashboardSummary.data.loans;
        assert(dbUsers.total >= 2, 'Dashboard summary returns correct total users count');
        assert(dbUsers.active >= 2, 'Dashboard summary returns correct active users count');
        assert(dbBooks.total >= 1, 'Dashboard summary returns correct total active books count');
        assert(dbLoans.total >= 2, 'Dashboard summary returns correct total loans count');

        // Query member report
        queryCounter = 0;
        queryLog = [];
        const startReport = Date.now();
        const { body: memberReport } = await getRequest(`admin/dashboard/reports/member/${memberUser.id}`);
        const reportDuration = Date.now() - startReport;

        assert(memberReport.success === true, 'Member report endpoint responds successfully');
        console.log(`[TELEMETRY] Member report took ${reportDuration}ms`);
        console.log(`[TELEMETRY] Member report executed ${queryCounter} Prisma operations (Expected: 6)`);
        assert(queryCounter <= 6, 'Member report fallback metrics optimized to 6 or fewer queries');

        // Check member report statistics values
        const reportSummary = memberReport.data.summary;
        assert(reportSummary.totalLoans === 2, `Member report counts correct total loans (expected 2, got ${reportSummary.totalLoans})`);
        assert(reportSummary.activeLoans === 1, `Member report counts correct active loans (expected 1, got ${reportSummary.activeLoans})`);
        assert(reportSummary.overdueLoans === 0, 'Member report counts correct overdue loans');
        assert(reportSummary.totalReservations === 1, 'Member report counts correct total reservations');
        assert(reportSummary.totalReviews === 1, 'Member report counts correct total reviews');

        // 6. Transaction duration analysis
        console.log('\n--- 6. Transaction Duration & Connection Telemetry ---');
        console.log(`[TELEMETRY] Number of transactions executed: ${transactionDurations.length}`);
        if (transactionDurations.length > 0) {
          const avgTxDuration = transactionDurations.reduce((a, b) => a + b, 0) / transactionDurations.length;
          console.log(`[TELEMETRY] Average transaction hold time: ${avgTxDuration.toFixed(2)}ms`);
        }

        // Close server and database connections gracefully
        server.close(async () => {
          console.log('\nHTTP server stopped.');
          await performCleanup();
        });

      } catch (err) {
        console.error('Error inside HTTP server verification loop:', err);
        server.close(async () => {
          await performCleanup();
        });
      }
    });

  } catch (error) {
    console.error('Global verification test failed:', error);
    await performCleanup();
  }

  async function performCleanup() {
    console.log('\n--- 7. Database Cleanup ---');
    try {
      if (cleanUps.reviewIds.length > 0) {
        await prisma.review.deleteMany({ where: { id: { in: cleanUps.reviewIds } } });
      }
      if (cleanUps.reservationIds.length > 0) {
        await prisma.reservation.deleteMany({ where: { id: { in: cleanUps.reservationIds } } });
      }
      if (cleanUps.loanIds.length > 0) {
        await prisma.loan.deleteMany({ where: { id: { in: cleanUps.loanIds } } });
      }
      if (cleanUps.bookCopyIds.length > 0) {
        await prisma.bookCopy.deleteMany({ where: { id: { in: cleanUps.bookCopyIds } } });
      }
      if (cleanUps.bookIds.length > 0) {
        await prisma.book.deleteMany({ where: { id: { in: cleanUps.bookIds } } });
      }
      if (cleanUps.authorIds.length > 0) {
        await prisma.author.deleteMany({ where: { id: { in: cleanUps.authorIds } } });
      }
      if (cleanUps.categoryIds.length > 0) {
        await prisma.category.deleteMany({ where: { id: { in: cleanUps.categoryIds } } });
      }
      if (cleanUps.orderIds.length > 0) {
        await prisma.order.deleteMany({ where: { id: { in: cleanUps.orderIds } } });
      }
      if (cleanUps.userIds.length > 0) {
        await prisma.user.deleteMany({ where: { id: { in: cleanUps.userIds } } });
      }
      console.log('Cleanup completed successfully.');
    } catch (e) {
      console.error('Error during cleanup:', e);
    } finally {
      await prisma.$disconnect();
      console.log(`\nVerification finished. Passed assertions: ${passedCount}/${totalCount}`);
      process.exit(passedCount === totalCount ? 0 : 1);
    }
  }
}

runTests();
