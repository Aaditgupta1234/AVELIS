import loanRouter from '../src/routes/loan.routes.js';
import { prisma } from '../src/lib/prisma.js';
import { ApiError } from '../src/utils/index.js';
import { generateToken } from '../src/utils/jwt.js';

console.log('Get All Loans API E2E Integration Testing Suite\n==================================================');

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
    layer => layer.route && layer.route.path === '/' && layer.route.methods.get
  );

  if (!getRoute) {
    console.log('FAIL: Get All route layer not found in loanRouter.');
    return;
  }
  console.log('PASS: Resolved get route layer.');

  const getStack = getRoute.route.stack.map(layer => layer.handle);

  let author, category, testBook, testCopy1, testCopy2, memberUser, adminUser, loan1, loan2;
  let adminToken, memberToken;

  try {
    // Setup DB records
    author = await prisma.author.create({
      data: { fullName: 'E2E Get Loans Author', biography: 'Bio' }
    });
    category = await prisma.category.create({
      data: { name: 'E2E Get Loans Category ' + Date.now(), description: 'Desc' }
    });

    testBook = await prisma.book.create({
      data: {
        title: 'E2E Get Loans Book',
        isbn: 'E2E-GL-ISBN-' + Date.now(),
        publisher: 'E2E Publisher',
        publicationYear: 2026,
        language: 'English',
        authors: { create: [{ authorId: author.id }] },
        categories: { create: [{ categoryId: category.id }] }
      }
    });

    testCopy1 = await prisma.bookCopy.create({
      data: {
        bookId: testBook.id,
        barcode: 'BARCODE1-' + Date.now(),
        shelfLocation: 'Shelf 1',
        status: 'BORROWED'
      }
    });

    testCopy2 = await prisma.bookCopy.create({
      data: {
        bookId: testBook.id,
        barcode: 'BARCODE2-' + Date.now(),
        shelfLocation: 'Shelf 2',
        status: 'BORROWED'
      }
    });

    memberUser = await prisma.user.create({
      data: {
        username: 'gl_member_' + Date.now(),
        email: 'gl_member_' + Date.now() + '@avelis.com',
        passwordHash: 'dummyhash',
        role: 'MEMBER'
      }
    });

    adminUser = await prisma.user.create({
      data: {
        username: 'gl_admin_' + Date.now(),
        email: 'gl_admin_' + Date.now() + '@avelis.com',
        passwordHash: 'dummyhash',
        role: 'ADMIN'
      }
    });

    adminToken = generateToken({ id: adminUser.id, role: 'ADMIN' });
    memberToken = generateToken({ id: memberUser.id, role: 'MEMBER' });

    // Create active loans
    loan1 = await prisma.loan.create({
      data: {
        userId: memberUser.id,
        copyId: testCopy1.id,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'BORROWED'
      }
    });

    loan2 = await prisma.loan.create({
      data: {
        userId: memberUser.id,
        copyId: testCopy2.id,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'RETURNED', // set one to returned
        returnDate: new Date()
      }
    });

    // ── Test 1: Successful paginated retrieval (Admin) ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        query: { page: '1', limit: '1' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, getStack);

      const ok = resultRes.statusCode === 200 &&
        resultRes.body.success === true &&
        resultRes.body.message === 'Loans retrieved successfully.' &&
        Array.isArray(resultRes.body.data) &&
        resultRes.body.data.length === 1 &&
        resultRes.body.meta &&
        resultRes.body.meta.page === 1 &&
        resultRes.body.meta.limit === 1 &&
        resultRes.body.meta.totalResults >= 2 &&
        resultRes.body.meta.totalPages >= 2;

      record('Test 1: Successful retrieval & pagination metadata (Admin)', ok);
    }

    // ── Test 2: Sorting (Sort by dueDate asc) ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        query: { sortBy: 'dueDate', sortOrder: 'asc' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, getStack);

      const loans = resultRes.body.data.filter(l => l.id === loan1.id || l.id === loan2.id);
      const ok = resultRes.statusCode === 200 &&
        loans.length === 2 &&
        loans[0].id === loan1.id &&
        loans[1].id === loan2.id;

      record('Test 2: Sorting results (dueDate asc)', ok);
    }

    // ── Test 3: Filtering by status ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        query: { status: 'RETURNED' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, getStack);

      const returnedLoans = resultRes.body.data.filter(l => l.id === loan1.id || l.id === loan2.id);
      const ok = resultRes.statusCode === 200 &&
        returnedLoans.length === 1 &&
        returnedLoans[0].id === loan2.id &&
        returnedLoans[0].status === 'RETURNED';

      record('Test 3: Filtering results by status', ok);
    }

    // ── Test 4: Filtering by userId ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        query: { userId: memberUser.id }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, getStack);

      const userLoans = resultRes.body.data.filter(l => l.id === loan1.id || l.id === loan2.id);
      const ok = resultRes.statusCode === 200 &&
        userLoans.length === 2 &&
        userLoans.every(l => l.userId === memberUser.id);

      record('Test 4: Filtering results by userId', ok);
    }

    // ── Test 5: Filtering by copyId ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        query: { copyId: testCopy1.id }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, getStack);

      const copyLoans = resultRes.body.data.filter(l => l.id === loan1.id || l.id === loan2.id);
      const ok = resultRes.statusCode === 200 &&
        copyLoans.length === 1 &&
        copyLoans[0].id === loan1.id &&
        copyLoans[0].copyId === testCopy1.id;

      record('Test 5: Filtering results by copyId', ok);
    }

    // ── Test 6: Access Control (Member gets 403 Forbidden) ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken}` }
      });
      const res = createMockRes();
      try {
        await executeRouteStack(req, res, getStack);
        record('Test 6: Member receives 403 Forbidden', false);
      } catch (error) {
        const ok = error.statusCode === 403 && error.message === 'Access denied. Administrator privileges required.';
        record('Test 6: Member receives 403 Forbidden', ok);
      }
    }

    // ── Test 7: Validation error - invalid page & limit ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        query: { page: '-5', limit: 'abc' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, getStack);

      const ok = resultRes.statusCode === 400 &&
        resultRes.body.success === false &&
        resultRes.body.message === 'Validation failed.' &&
        resultRes.body.errors.some(e => e.field === 'page') &&
        resultRes.body.errors.some(e => e.field === 'limit');

      record('Test 7: Validation errors for page & limit parameters', ok);
    }

    // ── Test 8: Validation error - invalid enum/UUID formats ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        query: { status: 'INVALID_STATUS', userId: 'bad-uuid', sortOrder: 'UPWARD' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, getStack);

      const ok = resultRes.statusCode === 400 &&
        resultRes.body.success === false &&
        resultRes.body.message === 'Validation failed.' &&
        resultRes.body.errors.some(e => e.field === 'status') &&
        resultRes.body.errors.some(e => e.field === 'userId') &&
        resultRes.body.errors.some(e => e.field === 'sortOrder');

      record('Test 8: Validation errors for status, userId, and sortOrder parameters', ok);
    }

  } catch (err) {
    console.error('Unexpected error in E2E integration test suite:', err);
  } finally {
    // Cleanup
    if (loan1) {
      await prisma.loan.delete({ where: { id: loan1.id } }).catch(() => {});
    }
    if (loan2) {
      await prisma.loan.delete({ where: { id: loan2.id } }).catch(() => {});
    }
    if (memberUser) {
      await prisma.user.delete({ where: { id: memberUser.id } }).catch(() => {});
    }
    if (adminUser) {
      await prisma.user.delete({ where: { id: adminUser.id } }).catch(() => {});
    }
    if (testCopy1) {
      await prisma.bookCopy.delete({ where: { id: testCopy1.id } }).catch(() => {});
    }
    if (testCopy2) {
      await prisma.bookCopy.delete({ where: { id: testCopy2.id } }).catch(() => {});
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
