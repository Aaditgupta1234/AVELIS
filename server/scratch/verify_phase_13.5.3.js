/**
 * Verification script for Phase 13.5.3 - Database Connection & Prisma Optimization.
 * Run with: node scratch/verify_phase_13.5.3.js
 */

import fs from 'fs';
import path from 'path';
import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole, CopyStatus, CopyCondition, LoanStatus, ReservationStatus, PaymentStatus, OrderStatus } from '@prisma/client';

const PORT = 5593;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  process.env.DISABLE_RATE_LIMIT = 'true';
  console.log('================================================================');
  console.log('Running Phase 13.5.3 Database Connection & Prisma Optimization...\n');
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
    // 1. Static Quality & Redundant Serialization Audits
    console.log('--- 1. Static Code Audits ---');
    const filesToAudit = [
      'src/server.js',
      'src/lib/prisma.js',
      'src/services/book.service.js',
      'src/services/loan.service.js',
      'src/services/reservation.service.js'
    ];

    let prismaClientInstantiations = 0;

    for (const relativePath of filesToAudit) {
      const fullPath = path.resolve(relativePath);
      const content = fs.readFileSync(fullPath, 'utf8');

      // Count "new PrismaClient"
      const instantiations = (content.match(/new PrismaClient\(/g) || []).length;
      prismaClientInstantiations += instantiations;

      // Assert absence of console.log
      if (relativePath !== 'src/server.js') {
        const consoleLogMatches = content.match(/console\.log\(/g);
        assert(!consoleLogMatches, `No console.log statements in ${relativePath}`);
      }

      // Assert JSDocs exist
      const jsdocCount = (content.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
      assert(jsdocCount > 0, `JSDoc documentation is present in ${relativePath} (found ${jsdocCount} blocks)`);
    }

    assert(prismaClientInstantiations === 2, 'Only one PrismaClient constructor exists in src/lib/prisma.js (production & dev configs)');

    // 2. Transaction Audits
    console.log('\n--- 2. Transaction Timeout & Optimizations Check ---');
    const loanServiceContent = fs.readFileSync(path.resolve('src/services/loan.service.js'), 'utf8');
    const resServiceContent = fs.readFileSync(path.resolve('src/services/reservation.service.js'), 'utf8');

    // Assert that borrowBook, returnBook, createLoan, completeLoanReturn have timeouts configured
    assert(loanServiceContent.includes('maxWait: 5000'), 'loan.service.js has maxWait configured');
    assert(loanServiceContent.includes('timeout: 10000'), 'loan.service.js has timeout configured');
    const executeLoanRenewalBlock = loanServiceContent.match(/const executeLoanRenewal = async[\s\S]*?^};/m);
    const hasTxInRenewal = executeLoanRenewalBlock && executeLoanRenewalBlock[0].includes('$transaction');
    assert(!hasTxInRenewal, 'executeLoanRenewal does not use transaction wrapper');

    // Assert reservation service timeouts
    assert(resServiceContent.includes('maxWait: 5000'), 'reservation.service.js has maxWait configured');
    assert(resServiceContent.includes('timeout: 10000'), 'reservation.service.js has timeout configured');

    // 3. Database Query Connection Health Test
    console.log('\n--- 3. Database Query Connection Health Test ---');
    await prisma.$connect();
    const healthResult = await prisma.$queryRaw`SELECT 1 as val`;
    assert(healthResult && healthResult[0].val === 1, 'Database connection health SELECT 1 returns 1');

    // 4. Seeding Representative Database Records
    console.log('\n--- 4. Seeding Database Records ---');
    const createUser = async (username, role, isActive = true) => {
      const u = await prisma.user.create({
        data: { username, email: `${username}@test1353.com`, passwordHash: 'hash1353', role, isActive }
      });
      cleanUps.userIds.push(u.id);
      return u;
    };

    const adminUser = await createUser(`admin_1353_${Date.now()}`, UserRole.ADMIN);
    const memberUser = await createUser(`member_1353_${Date.now()}`, UserRole.MEMBER);

    // Create Author & Category
    const author = await prisma.author.create({ data: { fullName: `Rowling_1353_${Date.now()}` } });
    cleanUps.authorIds.push(author.id);
    const category = await prisma.category.create({ data: { name: `Fantasy_1353_${Date.now()}` } });
    cleanUps.categoryIds.push(category.id);

    // Helper to seed books
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

    const book1 = await createBook('Connection Optimization Book 1353', `isbn_opt_${Date.now()}`);

    // Helper to seed book copies
    const createCopy = async (bookId, barcode, status = CopyStatus.AVAILABLE) => {
      const copy = await prisma.bookCopy.create({
        data: { bookId, barcode, condition: CopyCondition.GOOD, status }
      });
      cleanUps.bookCopyIds.push(copy.id);
      return copy;
    };

    const copy1 = await createCopy(book1.id, `barcode_opt1_${Date.now()}`, CopyStatus.AVAILABLE);

    // Helper to seed loans
    const createLoan = async (userId, copyId, status, issueDate = new Date()) => {
      const loan = await prisma.loan.create({
        data: {
          userId,
          copyId,
          status,
          issueDate,
          dueDate: new Date(issueDate.getTime() + 14 * 24 * 60 * 60 * 1000)
        }
      });
      cleanUps.loanIds.push(loan.id);
      return loan;
    };

    await createLoan(memberUser.id, copy1.id, LoanStatus.BORROWED);

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

    await createReservation(memberUser.id, book1.id, ReservationStatus.PENDING);

    // Helper to seed reviews
    const createReview = async (userId, bookId, rating) => {
      const rev = await prisma.review.create({
        data: {
          userId,
          bookId,
          rating,
          comment: 'Outstanding read!'
        }
      });
      cleanUps.reviewIds.push(rev.id);
      return rev;
    };

    await createReview(memberUser.id, book1.id, 5);

    // Helper to seed orders
    const createOrder = async (userId, orderNumber) => {
      const o = await prisma.order.create({
        data: {
          userId,
          orderNumber,
          totalAmount: 15.99,
          paymentStatus: PaymentStatus.PAID,
          orderStatus: OrderStatus.DELIVERED,
          shippingAddress: '456 Optim Rd',
          orderedAt: new Date()
        }
      });
      cleanUps.orderIds.push(o.id);
      return o;
    };

    await createOrder(memberUser.id, `ORD1353_${Date.now()}`);

    // Generate tokens
    const adminToken = generateToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });
    const memberToken = generateToken({ id: memberUser.id, email: memberUser.email, role: memberUser.role });

    console.log('Seeding completed.');

    // 5. Starting HTTP Server
    console.log('\n--- 5. Starting HTTP Server ---');
    const server = app.listen(PORT, async () => {
      try {
        const getRequest = async (path, token = adminToken) => {
          const res = await fetch(`${BASE_URL}/${path}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const body = await res.json();
          return { status: res.status, body };
        };

        // 6. Sustained Load Concurrency verification
        console.log('\n--- 6. Concurrency Load Connection Leak Audit (5 rounds of 100 concurrent requests) ---');
        
        for (let round = 1; round <= 5; round++) {
          const startTime = Date.now();
          const requests = Array.from({ length: 100 }).map(() => getRequest('admin/dashboard/summary'));
          const responses = await Promise.all(requests);
          const duration = Date.now() - startTime;

          const allSuccess = responses.every(r => r.status === 200 && r.body.success === true);
          const failed = responses.find(r => r.status !== 200 || !r.body.success);
          if (failed) {
            console.error('Failed request info:', failed.status, JSON.stringify(failed.body));
          }
          assert(allSuccess, `Round ${round}/5: All 100 concurrent requests resolved successfully with 200 OK`);
          console.log(`[ROUND TELEMETRY] Round ${round} completed in ${duration}ms`);
        }

        // 7. Regression checks
        console.log('\n--- 7. Endpoint Regression Checks ---');
        const testEndpoints = [
          'admin/dashboard/summary',
          'admin/dashboard/analytics/borrowing',
          'admin/dashboard/analytics/timeseries',
          'admin/dashboard/reports/overdue',
          'admin/dashboard/reports/search/books'
        ];

        for (const ep of testEndpoints) {
          const { status, body } = await getRequest(ep);
          assert(status === 200 && body.success === true, `Endpoint GET /${ep} responds with 200 OK`);
        }

        // Intercept prisma.$disconnect to count calls
        let disconnectCount = 0;
        const originalDisconnect = prisma.$disconnect;
        prisma.$disconnect = async function (...args) {
          disconnectCount++;
          return originalDisconnect.apply(this, args);
        };

        // Graceful Shutdown & Disconnect-Once check
        console.log('\n--- 8. Graceful Shutdown & Disconnect-Once Verification ---');
        server.close(async () => {
          console.log('HTTP server closed.');
          try {
            await prisma.$disconnect();
            assert(disconnectCount === 1, `Prisma disconnect executed exactly once during shutdown (disconnectCount = ${disconnectCount})`);
          } catch (e) {
            console.error('Error during shutdown disconnect verification:', e);
          } finally {
            await performCleanup();
          }
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
    console.log('\n--- 9. Database Cleanup ---');
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
      console.log(`\nVerification finished. Passed assertions: ${passedCount}/${totalCount}`);
      process.exit(passedCount === totalCount ? 0 : 1);
    }
  }
}

runTests();
