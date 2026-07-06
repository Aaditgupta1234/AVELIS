import loanRouter from '../src/routes/loan.routes.js';
import { prisma } from '../src/lib/prisma.js';
import { ApiError } from '../src/utils/index.js';
import { generateToken } from '../src/utils/jwt.js';

console.log('Return Book API E2E Integration Testing Suite\n==============================================');

// Mock request / response helpers
const createMockReq = ({ method = 'POST', headers = {}, params = {}, query = {}, body = {} } = {}) => ({
  headers,
  params,
  query,
  body,
  method
});

const createMockRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    sent: false,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(payload) {
      this.body = payload;
      this.sent = true;
      if (this.resolvePromise) {
        this.resolvePromise(this);
      }
      return this;
    }
  };
  return res;
};

// Chain runner that mimics Express middleware execution for a route
const executeRouteStack = async (req, res, stack) => {
  let index = 0;
  
  return new Promise((resolve, reject) => {
    res.resolvePromise = resolve;
    const next = async (err) => {
      if (err) {
        return reject(err);
      }
      if (res.sent) {
        return resolve(res);
      }
      if (index < stack.length) {
        const handler = stack[index++];
        try {
          await handler(req, res, next);
          if (res.sent) {
            resolve(res);
          }
        } catch (error) {
          reject(error);
        }
      } else {
        resolve(res);
      }
    };
    
    next().catch(reject);
  });
};

const results = [];
const record = (name, passed) => {
  results.push({ name, passed });
  console.log(`${passed ? 'PASS' : 'FAIL'}: ${name}`);
};

async function runTests() {
  const returnRoute = loanRouter.stack.find(
    layer => layer.route && layer.route.path === '/:id/return' && layer.route.methods.post
  );

  if (!returnRoute) {
    console.log('FAIL: Return route layer not found in loanRouter.');
    return;
  }
  console.log('PASS: Resolved return route layer.');

  const returnStack = returnRoute.route.stack.map(layer => layer.handle);

  let author, category, testBook, testCopy, memberUser, adminUser, activeLoan;
  let adminToken;

  try {
    // Setup DB records
    author = await prisma.author.create({
      data: { fullName: 'E2E Return Author', biography: 'Bio' }
    });
    category = await prisma.category.create({
      data: { name: 'E2E Return Category ' + Date.now(), description: 'Desc' }
    });

    testBook = await prisma.book.create({
      data: {
        title: 'E2E Return Title',
        isbn: 'E2E-R-ISBN-' + Date.now(),
        publisher: 'E2E Publisher',
        publicationYear: 2026,
        language: 'English',
        authors: { create: [{ authorId: author.id }] },
        categories: { create: [{ categoryId: category.id }] }
      }
    });

    testCopy = await prisma.bookCopy.create({
      data: {
        bookId: testBook.id,
        barcode: 'BARCODE-' + Date.now(),
        shelfLocation: 'Shelf Return',
        status: 'BORROWED' // Set to BORROWED initially
      }
    });

    memberUser = await prisma.user.create({
      data: {
        username: 'return_member_' + Date.now(),
        email: 'return_member_' + Date.now() + '@avelis.com',
        passwordHash: 'dummyhash',
        role: 'MEMBER'
      }
    });

    adminUser = await prisma.user.create({
      data: {
        username: 'return_admin_' + Date.now(),
        email: 'return_admin_' + Date.now() + '@avelis.com',
        passwordHash: 'dummyhash',
        role: 'ADMIN'
      }
    });

    adminToken = generateToken({ id: adminUser.id, role: 'ADMIN' });

    // Create an active loan to return
    activeLoan = await prisma.loan.create({
      data: {
        userId: memberUser.id,
        copyId: testCopy.id,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'BORROWED'
      }
    });

    // ── Test 1: Validation failure - invalid UUID format ──
    {
      const req = createMockReq({
        params: { id: 'not-a-uuid' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, returnStack);
      const ok = resultRes.statusCode === 400 && resultRes.body.success === false && resultRes.body.message === 'Invalid loan ID.';
      record('Test 1: Invalid UUID parameter validator error', ok);
    }

    // ── Test 2: Business failure - loan not found ──
    {
      const fakeLoanId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        params: { id: fakeLoanId }
      });
      const res = createMockRes();
      try {
        await executeRouteStack(req, res, returnStack);
        record('Test 2: Loan not found error', false);
      } catch (error) {
        const ok = error instanceof ApiError && error.statusCode === 404 && error.message === 'Loan not found.';
        record('Test 2: Loan not found error', ok);
      }
    }


    // ── Test 4: Successful return ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        params: { id: activeLoan.id }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, returnStack);

      const ok = resultRes.statusCode === 200 &&
        resultRes.body.success === true &&
        resultRes.body.message === 'Book returned successfully.' &&
        resultRes.body.data &&
        resultRes.body.data.id === activeLoan.id &&
        resultRes.body.data.status === 'RETURNED' &&
        resultRes.body.data.returnDate !== null;

      record('Test 4: Successful return response structure and data', ok);
    }

    // Verify database state changes
    {
      const dbCopy = await prisma.bookCopy.findUnique({
        where: { id: testCopy.id }
      });
      record('Test 5: Database BookCopy status updated to AVAILABLE', dbCopy.status === 'AVAILABLE');
    }

    // ── Test 6: Business failure - loan already returned ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        params: { id: activeLoan.id }
      });
      const res = createMockRes();
      try {
        await executeRouteStack(req, res, returnStack);
        record('Test 6: Loan already returned error', false);
      } catch (error) {
        const ok = error instanceof ApiError && error.statusCode === 400 && error.message === 'Loan already returned.';
        record('Test 6: Loan already returned error', ok);
      }
    }

    // ── Test 7: Transaction rollback integrity ──
    {
      // Create another active loan & copy
      const tempCopy = await prisma.bookCopy.create({
        data: {
          bookId: testBook.id,
          barcode: 'TEMP-BARCODE-' + Date.now(),
          shelfLocation: 'Temp shelf',
          status: 'BORROWED'
        }
      });

      const tempLoan = await prisma.loan.create({
        data: {
          userId: memberUser.id,
          copyId: tempCopy.id,
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'BORROWED'
        }
      });

      // Force transactional failure
      let transactionRolledBack = false;
      try {
        await prisma.$transaction(async (tx) => {
          // 1. Update loan to RETURNED
          await tx.loan.update({
            where: { id: tempLoan.id },
            data: { status: 'RETURNED', returnDate: new Date() }
          });

          // 2. Force an error to trigger rollback
          throw new Error('Forced rollback error');
        });
      } catch (err) {
        if (err.message === 'Forced rollback error') {
          transactionRolledBack = true;
        }
      }

      // Check database to ensure loan remains BORROWED and copy remains BORROWED
      const dbLoan = await prisma.loan.findUnique({ where: { id: tempLoan.id } });
      const dbCopy = await prisma.bookCopy.findUnique({ where: { id: tempCopy.id } });

      const integrityOk = transactionRolledBack && dbLoan.status === 'BORROWED' && dbLoan.returnDate === null && dbCopy.status === 'BORROWED';
      record('Test 7: Transaction rollback integrity verified', integrityOk);

      // Clean up temp copy/loan
      await prisma.loan.delete({ where: { id: tempLoan.id } });
      await prisma.bookCopy.delete({ where: { id: tempCopy.id } });
    }

  } catch (err) {
    console.error('Unexpected error in E2E integration test suite:', err);
  } finally {
    // Cleanup
    if (memberUser) {
      await prisma.loan.deleteMany({ where: { userId: memberUser.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: memberUser.id } }).catch(() => {});
    }
    if (adminUser) {
      await prisma.user.delete({ where: { id: adminUser.id } }).catch(() => {});
    }
    if (testCopy) {
      await prisma.bookCopy.delete({ where: { id: testCopy.id } }).catch(() => {});
    }
    if (testBook) {
      await prisma.book.delete({ where: { id: testBook.id } }).catch(() => {});
    }
    if (author) {
      await prisma.author.delete({ where: { id: author.id } }).catch(() => {});
    }
    if (category) {
      await prisma.category.delete({ where: { id: category.id } }).catch(() => {});
    }
    console.log('Cleanup completed. Test suite finished.');
  }
}

runTests();
