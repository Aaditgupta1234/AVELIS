import loanRouter from '../src/routes/loan.routes.js';
import { prisma } from '../src/lib/prisma.js';
import { ApiError } from '../src/utils/index.js';
import { generateToken } from '../src/utils/jwt.js';

console.log('Get Loan by ID API E2E Integration Testing Suite\n==================================================');

// Mock request / response helpers
const createMockReq = ({ method = 'GET', headers = {}, params = {}, query = {}, body = {} } = {}) => ({
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
  const getRoute = loanRouter.stack.find(
    layer => layer.route && layer.route.path === '/:id' && layer.route.methods.get
  );

  if (!getRoute) {
    console.log('FAIL: Get route layer not found in loanRouter.');
    return;
  }
  console.log('PASS: Resolved get route layer.');

  const getStack = getRoute.route.stack.map(layer => layer.handle);

  let author, category, testBook, testCopy, memberUser1, memberUser2, adminUser, loanUser1;
  let adminToken, memberToken1, memberToken2;

  try {
    // Setup DB records
    author = await prisma.author.create({
      data: { fullName: 'E2E Get Loan Author', biography: 'Bio' }
    });
    category = await prisma.category.create({
      data: { name: 'E2E Get Loan Category ' + Date.now(), description: 'Desc' }
    });

    testBook = await prisma.book.create({
      data: {
        title: 'E2E Get Loan Book Title',
        isbn: 'E2E-G-ISBN-' + Date.now(),
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
        shelfLocation: 'Shelf Get',
        status: 'BORROWED'
      }
    });

    memberUser1 = await prisma.user.create({
      data: {
        username: 'get_member1_' + Date.now(),
        email: 'get_member1_' + Date.now() + '@avelis.com',
        passwordHash: 'dummyhash',
        role: 'MEMBER'
      }
    });

    memberUser2 = await prisma.user.create({
      data: {
        username: 'get_member2_' + Date.now(),
        email: 'get_member2_' + Date.now() + '@avelis.com',
        passwordHash: 'dummyhash',
        role: 'MEMBER'
      }
    });

    adminUser = await prisma.user.create({
      data: {
        username: 'get_admin_' + Date.now(),
        email: 'get_admin_' + Date.now() + '@avelis.com',
        passwordHash: 'dummyhash',
        role: 'ADMIN'
      }
    });

    adminToken = generateToken({ id: adminUser.id, role: 'ADMIN' });
    memberToken1 = generateToken({ id: memberUser1.id, role: 'MEMBER' });
    memberToken2 = generateToken({ id: memberUser2.id, role: 'MEMBER' });

    // Create a loan for memberUser1
    loanUser1 = await prisma.loan.create({
      data: {
        userId: memberUser1.id,
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
      const resultRes = await executeRouteStack(req, res, getStack);
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
        await executeRouteStack(req, res, getStack);
        record('Test 2: Loan not found error', false);
      } catch (error) {
        const ok = error instanceof ApiError && error.statusCode === 404 && error.message === 'Loan not found.';
        record('Test 2: Loan not found error', ok);
      }
    }

    // ── Test 3: Success retrieval (Admin retrieves memberUser1's loan) ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        params: { id: loanUser1.id }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, getStack);

      const ok = resultRes.statusCode === 200 &&
        resultRes.body.success === true &&
        resultRes.body.message === 'Loan retrieved successfully.' &&
        resultRes.body.data &&
        resultRes.body.data.id === loanUser1.id &&
        resultRes.body.data.user.username === memberUser1.username &&
        // Verify response shaping (select fields present and no extra fields like passwordHash)
        resultRes.body.data.user.passwordHash === undefined &&
        resultRes.body.data.bookCopy.book.title === 'E2E Get Loan Book Title';

      record('Test 3: Success retrieval (Admin)', ok);
    }

    // ── Test 4: Success retrieval (Member retrieves own loan) ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
        params: { id: loanUser1.id }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, getStack);

      const ok = resultRes.statusCode === 200 &&
        resultRes.body.success === true &&
        resultRes.body.message === 'Loan retrieved successfully.' &&
        resultRes.body.data &&
        resultRes.body.data.id === loanUser1.id;

      record('Test 4: Success retrieval (Member)', ok);
    }

    // ── Test 5: Access Control (Member retrieves another user's loan - returns 403) ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken2}` },
        params: { id: loanUser1.id }
      });
      const res = createMockRes();
      try {
        await executeRouteStack(req, res, getStack);
        record('Test 5: Member retrieves another user\'s loan returns 403 Forbidden', false);
      } catch (error) {
        const ok = error instanceof ApiError && error.statusCode === 403 && error.message === 'Access denied. You can only retrieve your own loans.';
        record('Test 5: Member retrieves another user\'s loan returns 403 Forbidden', ok);
      }
    }

  } catch (err) {
    console.error('Unexpected error in E2E integration test suite:', err);
  } finally {
    // Cleanup
    if (loanUser1) {
      await prisma.loan.delete({ where: { id: loanUser1.id } }).catch(() => {});
    }
    if (memberUser1) {
      await prisma.user.delete({ where: { id: memberUser1.id } }).catch(() => {});
    }
    if (memberUser2) {
      await prisma.user.delete({ where: { id: memberUser2.id } }).catch(() => {});
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
