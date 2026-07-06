import loanRouter from '../src/routes/loan.routes.js';
import { prisma } from '../src/lib/prisma.js';
import { ApiError } from '../src/utils/index.js';
import { generateToken } from '../src/utils/jwt.js';

console.log('Get Current User Loans API E2E Integration Testing Suite\n========================================================');

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
    layer => layer.route && layer.route.path === '/me' && layer.route.methods.get
  );

  if (!getRoute) {
    console.log('FAIL: Get Current User route layer not found in loanRouter.');
    return;
  }
  console.log('PASS: Resolved get route layer.');

  const getStack = getRoute.route.stack.map(layer => layer.handle);

  let author, category, testBook, testCopy1, testCopy2, memberUser1, memberUser2, loan1, loan2;
  let memberToken1, memberToken2;

  try {
    // Setup DB records
    author = await prisma.author.create({
      data: { fullName: 'E2E My Loans Author', biography: 'Bio' }
    });
    category = await prisma.category.create({
      data: { name: 'E2E My Loans Category ' + Date.now(), description: 'Desc' }
    });

    testBook = await prisma.book.create({
      data: {
        title: 'E2E My Loans Book',
        isbn: 'E2E-ML-ISBN-' + Date.now(),
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

    memberUser1 = await prisma.user.create({
      data: {
        username: 'ml_member1_' + Date.now(),
        email: 'ml_member1_' + Date.now() + '@avelis.com',
        passwordHash: 'dummyhash',
        role: 'MEMBER'
      }
    });

    memberUser2 = await prisma.user.create({
      data: {
        username: 'ml_member2_' + Date.now(),
        email: 'ml_member2_' + Date.now() + '@avelis.com',
        passwordHash: 'dummyhash',
        role: 'MEMBER'
      }
    });

    memberToken1 = generateToken({ id: memberUser1.id, role: 'MEMBER' });
    memberToken2 = generateToken({ id: memberUser2.id, role: 'MEMBER' });

    // Create active loans for memberUser1
    loan1 = await prisma.loan.create({
      data: {
        userId: memberUser1.id,
        copyId: testCopy1.id,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'BORROWED'
      }
    });

    loan2 = await prisma.loan.create({
      data: {
        userId: memberUser1.id,
        copyId: testCopy2.id,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: 'RETURNED',
        returnDate: new Date()
      }
    });

    // ── Test 1: Successful paginated retrieval (Member 1) ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
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
        resultRes.body.meta.totalResults === 2 &&
        resultRes.body.meta.totalPages === 2;

      record('Test 1: Successful retrieval & pagination metadata (Member 1)', ok);
    }

    // ── Test 2: Ownership Bypass Protection ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
        query: { userId: memberUser2.id } // Attempting to query Member 2's loans
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, getStack);

      // The response should ignore the query param and only return Member 1's loans
      const myLoans = resultRes.body.data;
      const ok = resultRes.statusCode === 200 &&
        myLoans.length === 2 &&
        myLoans.every(l => l.userId === memberUser1.id);

      record('Test 2: Ownership Bypass Protection (ignores query userId)', ok);
    }

    // ── Test 3: Empty Result Set ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken2}` } // Member 2 has no loans
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, getStack);

      const ok = resultRes.statusCode === 200 &&
        resultRes.body.success === true &&
        Array.isArray(resultRes.body.data) &&
        resultRes.body.data.length === 0 &&
        resultRes.body.meta &&
        resultRes.body.meta.totalResults === 0 &&
        resultRes.body.meta.totalPages === 0;

      record('Test 3: Empty Result Set (correct metadata and array)', ok);
    }

    // ── Test 4: Filtering (Filter by status RETURNED) ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
        query: { status: 'RETURNED' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, getStack);

      const returnedLoans = resultRes.body.data;
      const ok = resultRes.statusCode === 200 &&
        returnedLoans.length === 1 &&
        returnedLoans[0].id === loan2.id &&
        returnedLoans[0].status === 'RETURNED';

      record('Test 4: Filtering by status', ok);
    }

    // ── Test 5: Sorting (Sort by dueDate asc) ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
        query: { sortBy: 'dueDate', sortOrder: 'asc' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, getStack);

      const loans = resultRes.body.data;
      const ok = resultRes.statusCode === 200 &&
        loans.length === 2 &&
        loans[0].id === loan1.id &&
        loans[1].id === loan2.id;

      record('Test 5: Sorting by dueDate asc', ok);
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
    if (memberUser1) {
      await prisma.user.delete({ where: { id: memberUser1.id } }).catch(() => {});
    }
    if (memberUser2) {
      await prisma.user.delete({ where: { id: memberUser2.id } }).catch(() => {});
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
