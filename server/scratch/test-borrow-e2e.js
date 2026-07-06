import loanRouter from '../src/routes/loan.routes.js';
import { prisma } from '../src/lib/prisma.js';
import { ApiError } from '../src/utils/index.js';
import { generateToken } from '../src/utils/jwt.js';

console.log('Borrow Book API E2E Integration Testing Suite\n==============================================');

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
  const borrowRoute = loanRouter.stack.find(
    layer => layer.route && layer.route.path === '/' && layer.route.methods.post
  );

  if (!borrowRoute) {
    console.log('FAIL: Borrow route layer not found in loanRouter.');
    return;
  }
  console.log('PASS: Resolved borrow route layer.');

  const borrowStack = borrowRoute.route.stack.map(layer => layer.handle);

  let author, category, testBook, testCopy, memberUser, adminUser;
  let adminToken;

  try {
    // Setup DB records
    author = await prisma.author.create({
      data: { fullName: 'E2E Borrow Author', biography: 'Bio' }
    });
    category = await prisma.category.create({
      data: { name: 'E2E Borrow Category ' + Date.now(), description: 'Desc' }
    });

    testBook = await prisma.book.create({
      data: {
        title: 'E2E Borrow Title',
        isbn: 'E2E-B-ISBN-' + Date.now(),
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
        shelfLocation: 'Shelf Borrow',
        status: 'AVAILABLE'
      }
    });

    memberUser = await prisma.user.create({
      data: {
        username: 'borrow_member_' + Date.now(),
        email: 'borrow_member_' + Date.now() + '@avelis.com',
        passwordHash: 'dummyhash',
        role: 'MEMBER'
      }
    });

    adminUser = await prisma.user.create({
      data: {
        username: 'borrow_admin_' + Date.now(),
        email: 'borrow_admin_' + Date.now() + '@avelis.com',
        passwordHash: 'dummyhash',
        role: 'ADMIN'
      }
    });

    adminToken = generateToken({ id: adminUser.id, role: 'ADMIN' });

    // ── Test 1: Validation failure - missing fields ──
    {
      const req = createMockReq({
        body: { userId: memberUser.id } // missing copyId
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, borrowStack);
      const ok = resultRes.statusCode === 400 && resultRes.body.success === false && resultRes.body.message === 'Validation failed.';
      record('Test 1: Missing copyId validator error', ok);
    }

    // ── Test 2: Validation failure - invalid UUID ──
    {
      const req = createMockReq({
        body: { userId: 'not-a-uuid', copyId: testCopy.id }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, borrowStack);
      const ok = resultRes.statusCode === 400 && resultRes.body.success === false && resultRes.body.message === 'Validation failed.';
      record('Test 2: Invalid UUID validator error', ok);
    }

    // ── Test 3: Business failure - user not found ──
    {
      const fakeUserId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        body: { userId: fakeUserId, copyId: testCopy.id }
      });
      const res = createMockRes();
      try {
        await executeRouteStack(req, res, borrowStack);
        record('Test 3: User not found error', false);
      } catch (error) {
        const ok = error instanceof ApiError && error.statusCode === 404 && error.message === 'User not found.';
        record('Test 3: User not found error', ok);
      }
    }

    // ── Test 4: Business failure - user is not MEMBER ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        body: { userId: adminUser.id, copyId: testCopy.id }
      });
      const res = createMockRes();
      try {
        await executeRouteStack(req, res, borrowStack);
        record('Test 4: User is not MEMBER error', false);
      } catch (error) {
        const ok = error instanceof ApiError && error.statusCode === 400 && error.message === 'Only members can borrow books.';
        record('Test 4: User is not MEMBER error', ok);
      }
    }

    // ── Test 5: Business failure - copy not found ──
    {
      const fakeCopyId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        body: { userId: memberUser.id, copyId: fakeCopyId }
      });
      const res = createMockRes();
      try {
        await executeRouteStack(req, res, borrowStack);
        record('Test 5: Copy not found error', false);
      } catch (error) {
        const ok = error instanceof ApiError && error.statusCode === 404 && error.message === 'Book copy not found.';
        record('Test 5: Copy not found error', ok);
      }
    }

    // ── Test 6: Business failure - book soft deleted ──
    {
      // Soft delete the book
      await prisma.book.update({
        where: { id: testBook.id },
        data: { isDeleted: true, deletedAt: new Date() }
      });

      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        body: { userId: memberUser.id, copyId: testCopy.id }
      });
      const res = createMockRes();
      try {
        await executeRouteStack(req, res, borrowStack);
        record('Test 6: Book soft deleted error', false);
      } catch (error) {
        const ok = error instanceof ApiError && error.statusCode === 400 && error.message === 'Book is soft deleted and cannot be borrowed.';
        record('Test 6: Book soft deleted error', ok);
      }

      // Restore the book
      await prisma.book.update({
        where: { id: testBook.id },
        data: { isDeleted: false, deletedAt: null }
      });
    }

    // ── Test 7: Successful borrow ──
    let createdLoanId;
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        body: { userId: memberUser.id, copyId: testCopy.id }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, borrowStack);
      
      const ok = resultRes.statusCode === 201 &&
        resultRes.body.success === true &&
        resultRes.body.message === 'Book borrowed successfully.' &&
        resultRes.body.data &&
        resultRes.body.data.userId === memberUser.id &&
        resultRes.body.data.copyId === testCopy.id &&
        resultRes.body.data.status === 'BORROWED';

      record('Test 7: Successful borrow response structure and data', ok);
      if (ok) {
        createdLoanId = resultRes.body.data.id;
      }
    }

    // Verify database state changes
    if (createdLoanId) {
      const dbCopy = await prisma.bookCopy.findUnique({
        where: { id: testCopy.id }
      });
      record('Test 8: Database BookCopy status updated to BORROWED', dbCopy.status === 'BORROWED');
    }

    // ── Test 9: Business failure - copy already borrowed ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        body: { userId: memberUser.id, copyId: testCopy.id }
      });
      const res = createMockRes();
      try {
        await executeRouteStack(req, res, borrowStack);
        record('Test 9: Copy already borrowed error', false);
      } catch (error) {
        const ok = error instanceof ApiError && error.statusCode === 409 && error.message === 'Book copy is unavailable.';
        record('Test 9: Copy already borrowed error', ok);
      }
    }

    // ── Test 10: Transaction rollback integrity ──
    {
      // Reset copy to AVAILABLE
      await prisma.bookCopy.update({
        where: { id: testCopy.id },
        data: { status: 'AVAILABLE' }
      });

      // We simulate a transactional failure inside a custom transaction execution
      let transactionRolledBack = false;
      try {
        await prisma.$transaction(async (tx) => {
          // 1. Create a dummy loan record
          await tx.loan.create({
            data: {
              userId: memberUser.id,
              copyId: testCopy.id,
              issueDate: new Date(),
              dueDate: new Date(),
              status: 'BORROWED'
            }
          });

          // 2. Force an error to trigger rollback
          throw new Error('Forced rollback error');
        });
      } catch (err) {
        if (err.message === 'Forced rollback error') {
          transactionRolledBack = true;
        }
      }

      // Check database to ensure no loan was created and copy status remains AVAILABLE
      const duplicateLoans = await prisma.loan.findMany({
        where: { userId: memberUser.id, copyId: testCopy.id }
      });
      // We already have 1 from Test 7, so there should only be 1 total loan, not 2.
      const dbCopy = await prisma.bookCopy.findUnique({
        where: { id: testCopy.id }
      });

      const integrityOk = transactionRolledBack && duplicateLoans.length === 1 && dbCopy.status === 'AVAILABLE';
      record('Test 10: Transaction rollback integrity verified', integrityOk);
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
