/**
 * Verification script for Phase 13.5.2 - API Response Optimization.
 * Run with: node scratch/verify_phase_13.5.2.js
 */

import fs from 'fs';
import path from 'path';
import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole, CopyStatus, CopyCondition, LoanStatus, ReservationStatus, PaymentStatus, OrderStatus } from '@prisma/client';

const PORT = 5592;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('================================================================');
  console.log('Running Phase 13.5.2 API Response Optimization Validation...\n');
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
      'src/utils/pagination.js',
      'src/services/dashboard.service.js',
      'src/services/analytics.service.js',
      'src/services/loan.service.js',
      'src/services/reservation.service.js',
      'src/modules/reporting/reporting.service.js'
    ];

    for (const relativePath of filesToAudit) {
      const fullPath = path.resolve(relativePath);
      const content = fs.readFileSync(fullPath, 'utf8');

      // Assert absence of console.log
      const consoleLogMatches = content.match(/console\.log\(/g);
      assert(!consoleLogMatches, `No console.log statements in ${relativePath}`);

      // Assert absence of JSON.parse(JSON.stringify(
      const stringifyMatches = content.match(/JSON\.parse\(JSON\.stringify\(/g);
      assert(!stringifyMatches, `No redundant JSON cloning in ${relativePath}`);

      // Assert JSDocs exist
      const jsdocCount = (content.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
      assert(jsdocCount > 0, `JSDoc documentation is present in ${relativePath} (found ${jsdocCount} blocks)`);
    }

    // 2. Seeding Representative Database Records
    console.log('\n--- 2. Seeding Representative Database Records ---');
    
    const createUser = async (username, role, isActive = true) => {
      const u = await prisma.user.create({
        data: { username, email: `${username}@test1352.com`, passwordHash: 'hash1352', role, isActive }
      });
      cleanUps.userIds.push(u.id);
      return u;
    };

    const adminUser = await createUser(`admin_1352_${Date.now()}`, UserRole.ADMIN);
    const memberUser = await createUser(`member_1352_${Date.now()}`, UserRole.MEMBER);

    // Create Author & Category
    const author = await prisma.author.create({ data: { fullName: `Rowling_1352_${Date.now()}` } });
    cleanUps.authorIds.push(author.id);
    const category = await prisma.category.create({ data: { name: `Fantasy_1352_${Date.now()}` } });
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

    const book1 = await createBook('Optimization Book 1352', `isbn_opt_${Date.now()}`);

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

    await createOrder(memberUser.id, `ORD1352_${Date.now()}`);

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

        // 4. API Response Contract Verification
        console.log('\n--- 4. API response contract & payload verification ---');

        const endpoints = [
          { path: 'admin/dashboard/summary', name: 'Dashboard Summary' },
          { path: 'admin/dashboard/analytics/borrowing', name: 'Analytics Borrowing' },
          { path: 'admin/dashboard/analytics/members', name: 'Analytics Members' },
          { path: 'admin/dashboard/analytics/ratings', name: 'Analytics Ratings' },
          { path: 'admin/dashboard/analytics/timeseries', name: 'Analytics Timeseries' },
          { path: 'admin/dashboard/reports/inventory', name: 'Reports Inventory' },
          { path: 'admin/dashboard/reports/overdue', name: 'Reports Overdue' },
          { path: 'admin/dashboard/reports/search/books', name: 'Search Books' },
          { path: 'admin/dashboard/reports/search/members', name: 'Search Members' },
          { path: 'admin/dashboard/reports/search/loans', name: 'Search Loans' },
          { path: 'admin/dashboard/reports/search/reservations', name: 'Search Reservations' },
          { path: 'admin/dashboard/reports/search/orders', name: 'Search Orders' },
          { path: `admin/dashboard/reports/member/${memberUser.id}`, name: 'Member Report' }
        ];

        for (const endpoint of endpoints) {
          const startMemory = process.memoryUsage().heapUsed;
          const startT = Date.now();
          const { status, body } = await getRequest(endpoint.path);
          const duration = Date.now() - startT;
          const endMemory = process.memoryUsage().heapUsed;
          const payloadSize = Buffer.byteLength(JSON.stringify(body));

          assert(status === 200, `${endpoint.name} responds with status 200`);
          assert(body.success === true, `${endpoint.name} success envelope is true`);
          assert(body.data !== undefined, `${endpoint.name} contains data object`);
          
          console.log(`[TELEMETRY] ${endpoint.name} - Payload Size: ${payloadSize} bytes, Memory Delta: ${((endMemory - startMemory)/1024).toFixed(2)} KB, Duration: ${duration}ms`);

          // Validate pagination keys based on standard vs legacy schema
          if (body.data.pagination) {
            const p = body.data.pagination;
            if (endpoint.path.includes('search/') || endpoint.path.includes('/inventory') || endpoint.path.includes('/overdue') || endpoint.path.includes('/member/')) {
              // Standard schema
              assert(p.totalItems !== undefined, `${endpoint.name} pagination has totalItems`);
              assert(p.hasNextPage !== undefined, `${endpoint.name} pagination has hasNextPage`);
              assert(p.hasPreviousPage !== undefined, `${endpoint.name} pagination has hasPreviousPage`);
              assert(p.totalResults === undefined, `${endpoint.name} pagination does not have totalResults`);
            }
          }
        }

        // 5. Test history schema via GET /loans/history
        console.log('\n--- 5. History Pagination Schema Verification ---');
        const { status: histStatus, body: histBody } = await getRequest('loans/history', memberToken);
        assert(histStatus === 200, 'Member loans/history responds successfully');
        if (histBody.data && histBody.data.pagination) {
          const p = histBody.data.pagination;
          assert(p.total !== undefined, 'loans/history pagination contains total');
          assert(p.pages !== undefined, 'loans/history pagination contains pages');
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
    console.log('\n--- 5. Database Cleanup ---');
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
