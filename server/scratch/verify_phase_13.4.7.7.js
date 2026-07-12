/**
 * Verification script for Phase 13.4.7.7 - Production Refinement & Verification.
 * Run with: node scratch/verify_phase_13.4.7.7.js
 */

import fs from 'fs';
import path from 'path';
import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import router from '../src/modules/reporting/reporting.routes.js';
import { UserRole, CopyStatus, CopyCondition, LoanStatus } from '@prisma/client';

const PORT = 5587;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.4.7.7 Production Refinement & Verification...\n');
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
    loanIds: []
  };

  try {
    // 1. Static Code Quality Audit
    console.log('--- 1. Static Code Quality Audit ---');
    const filesToAudit = [
      'src/modules/reporting/reporting.service.js',
      'src/modules/reporting/reporting.controller.js',
      'src/modules/reporting/reporting.routes.js',
      'src/modules/reporting/reporting.validation.js'
    ];

    for (const relativePath of filesToAudit) {
      const fullPath = path.resolve(relativePath);
      const content = fs.readFileSync(fullPath, 'utf8');

      // Check for console.log statements
      const consoleLogMatches = content.match(/console\.log\(/g);
      assert(!consoleLogMatches, `No console.log statements in ${relativePath}`);

      // Check for debugger statements
      const debuggerMatches = content.match(/\bdebugger\b/g);
      assert(!debuggerMatches, `No debugger statements in ${relativePath}`);

      // Check for TODO, FIXME, XXX comments
      const forbiddenComments = content.match(/\b(TODO|FIXME|XXX)\b/ig);
      assert(!forbiddenComments, `No TODO, FIXME, or XXX markers in ${relativePath}`);
    }

    // 2. Programmatic Router Parity Audit
    console.log('\n--- 2. Programmatic Router Parity Audit ---');
    const memberLayer = router.stack.find(l => l.route && l.route.path === '/member/:memberId');
    const membersLayer = router.stack.find(l => l.route && l.route.path === '/members/:memberId');

    assert(memberLayer !== undefined, 'Route GET /member/:memberId exists in router');
    assert(membersLayer !== undefined, 'Route GET /members/:memberId exists in router');

    const handler1 = memberLayer.route.stack[0].handle;
    const handler2 = membersLayer.route.stack[0].handle;
    assert(handler1 === handler2, 'Both routing layers point to the exact same controller method reference');

    // 3. Seeding representative production-like data
    console.log('\nSeeding representative database records...');
    
    // Seed Users
    const createUser = async (username, role) => {
      const u = await prisma.user.create({
        data: { username, email: `${username}@test.com`, passwordHash: 'hash', role, isActive: true }
      });
      cleanUps.userIds.push(u.id);
      return u;
    };
    
    const admin = await createUser(`admin_13477_${Date.now()}`, UserRole.ADMIN);
    const member = await createUser(`member_13477_${Date.now()}`, UserRole.MEMBER);

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

        // 4. Regression & Response Contracts Tests
        console.log('\n--- 3. Regression & Response Contracts Tests ---');

        // Test GET /admin/dashboard/summary
        const { status: codeSum, body: bodySum } = await getRequest('admin/dashboard/summary');
        assert(codeSum === 200, 'GET /admin/dashboard/summary returns 200 OK');
        assert(bodySum.data.loans.active !== undefined, 'Dashboard Summary contains active loans count');

        // Test GET /admin/dashboard/reports/overdue
        const { status: codeOverdue } = await getRequest('admin/dashboard/reports/overdue');
        assert(codeOverdue === 200, 'GET /admin/dashboard/reports/overdue returns 200 OK');

        // Test GET /admin/dashboard/reports/inventory
        const { status: codeInv } = await getRequest('admin/dashboard/reports/inventory');
        assert(codeInv === 200, 'GET /admin/dashboard/reports/inventory returns 200 OK');

        // Test GET /admin/dashboard/reports/search/books
        const { status: codeSearchBooks } = await getRequest('admin/dashboard/reports/search/books');
        assert(codeSearchBooks === 200, 'GET /admin/dashboard/reports/search/books returns 200 OK');

        // Test GET /admin/dashboard/reports/search/members
        const { status: codeSearchMembers } = await getRequest('admin/dashboard/reports/search/members');
        assert(codeSearchMembers === 200, 'GET /admin/dashboard/reports/search/members returns 200 OK');

        // Test GET /admin/dashboard/reports/search/loans
        const { status: codeSearchLoans } = await getRequest('admin/dashboard/reports/search/loans');
        assert(codeSearchLoans === 200, 'GET /admin/dashboard/reports/search/loans returns 200 OK');

        // Test GET /admin/dashboard/reports/search/reservations
        const { status: codeSearchRes } = await getRequest('admin/dashboard/reports/search/reservations');
        assert(codeSearchRes === 200, 'GET /admin/dashboard/reports/search/reservations returns 200 OK');

        // Test GET /admin/dashboard/reports/search/orders
        const { status: codeSearchOrd } = await getRequest('admin/dashboard/reports/search/orders');
        assert(codeSearchOrd === 200, 'GET /admin/dashboard/reports/search/orders returns 200 OK');

        // Test GET /admin/dashboard/reports/member/:memberId (Route Parity Singular)
        const { status: codeSingular, body: bodySingular } = await getRequest(`admin/dashboard/reports/member/${member.id}`);
        assert(codeSingular === 200, 'GET /member/:memberId returns 200 OK');
        assert(bodySingular.data.activity !== undefined, 'GET /member/:memberId has nested activity');
        assert(bodySingular.data.activity.loans.length === 1, 'GET /member/:memberId contains active loan');

        // Test GET /admin/dashboard/reports/members/:memberId (Route Parity Plural)
        const { status: codePlural, body: bodyPlural } = await getRequest(`admin/dashboard/reports/members/${member.id}`);
        assert(codePlural === 200, 'GET /members/:memberId returns 200 OK');
        assert(bodyPlural.data.activity !== undefined, 'GET /members/:memberId has nested activity');

      } catch (err) {
        console.error('Test execution failed with error:', err);
      } finally {
        console.log('\nCleaning up database records...');
        try {
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
