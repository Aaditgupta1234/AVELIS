import bookRouter from '../src/routes/book.routes.js';
import { prisma } from '../src/lib/prisma.js';
import { ApiError } from '../src/utils/index.js';
import { generateToken } from '../src/utils/jwt.js';

console.log('Soft Delete Book Route Integration Testing Suite\n==============================================');

// Mock request / response helpers
const createMockReq = ({ headers = {}, params = {}, body = {} } = {}) => ({
  headers,
  params,
  body,
  method: 'DELETE'
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
      console.log('MOCK JSON CALLED WITH:', JSON.stringify(payload));
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

async function runTests() {
  // 1. Locate the route inside Express bookRouter
  const routeLayer = bookRouter.stack.find(
    layer => layer.route && layer.route.path === '/:id' && layer.route.methods.delete
  );

  if (!routeLayer) {
    console.log('FAIL: DELETE /:id route not found in bookRouter.');
    return;
  }
  console.log('PASS: DELETE /:id route is registered in bookRouter.');

  // Extract handlers in registration order
  const stack = routeLayer.route.stack.map(layer => layer.handle);
  
  // Verify middleware order
  const handlerNames = stack.map(h => h.name || 'anonymous');
  console.log('Registered handlers in order:', handlerNames);

  if (
    handlerNames[0] === 'authMiddleware' &&
    handlerNames[1] === 'adminMiddleware' &&
    handlerNames[2] === 'bookIdParamValidator' &&
    handlerNames[3] === 'softDeleteBook'
  ) {
    console.log('PASS: Middleware execution order matches the requirements precisely.');
  } else {
    console.log('FAIL: Middleware execution order does not match.', handlerNames);
  }

  let author, category, testBook;
  let adminToken, memberToken;

  try {
    // Setup test records
    author = await prisma.author.create({
      data: { fullName: 'Route SD Author', biography: 'Bio' }
    });
    category = await prisma.category.create({
      data: { name: 'Route SD Category ' + Date.now(), description: 'Description' }
    });

    testBook = await prisma.book.create({
      data: {
        title: 'Route SD Book Title',
        isbn: 'TEST-R-SD-ISBN-' + Date.now(),
        publisher: 'Test Publisher',
        publicationYear: 2026,
        language: 'English',
        sellingPrice: 19.99,
        stockQuantity: 10,
        authors: { create: [{ authorId: author.id }] },
        categories: { create: [{ categoryId: category.id }] }
      }
    });

    // Generate JWT tokens
    adminToken = generateToken({ id: 'admin-user-id', role: 'ADMIN' });
    memberToken = generateToken({ id: 'member-user-id', role: 'MEMBER' });

    // Test Case 1: Unauthenticated User gets 401 Unauthorized
    {
      const req = createMockReq({
        params: { id: testBook.id }
      });
      const res = createMockRes();

      try {
        await executeRouteStack(req, res, stack);
        console.log('FAIL: Test Case 1 (Expected Unauthenticated error, but succeeded)');
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 401 && error.message.includes('Authorization')) {
          console.log('PASS: Test Case 1: Unauthenticated request returned 401 Unauthorized.');
        } else {
          console.log('FAIL: Test Case 1', error);
        }
      }
    }

    // Test Case 2: Authenticated Member gets 403 Forbidden
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken}` },
        params: { id: testBook.id }
      });
      const res = createMockRes();

      try {
        await executeRouteStack(req, res, stack);
        console.log('FAIL: Test Case 2 (Expected Authenticated Member error, but succeeded)');
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 403) {
          console.log('PASS: Test Case 2: Authenticated member request returned 403 Forbidden.');
        } else {
          console.log('FAIL: Test Case 2', error);
        }
      }
    }

    // Test Case 3: Invalid Book ID gets 400 Bad Request (rejected by bookIdParamValidator)
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        params: { id: 'invalid-uuid-format' }
      });
      const res = createMockRes();

      try {
        const resultRes = await executeRouteStack(req, res, stack);
        if (resultRes.statusCode === 400 && resultRes.body && resultRes.body.success === false && resultRes.body.message === 'Invalid book ID.') {
          console.log('PASS: Test Case 3: Invalid UUID parameter rejected with 400 Bad Request by bookIdParamValidator.');
        } else {
          console.log('FAIL: Test Case 3', resultRes.statusCode, resultRes.body);
        }
      } catch (error) {
        console.log('FAIL: Test Case 3 with error', error);
      }
    }

    // Test Case 4: Authenticated Admin successfully soft deletes book and returns 200 OK
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        params: { id: testBook.id }
      });
      const res = createMockRes();

      try {
        const resultRes = await executeRouteStack(req, res, stack);
        if (
          resultRes.statusCode === 200 &&
          resultRes.body &&
          resultRes.body.success === true &&
          resultRes.body.message === 'Book deleted successfully.' &&
          resultRes.body.data.id === testBook.id &&
          resultRes.body.data.isDeleted === true
        ) {
          console.log('PASS: Test Case 4: Authenticated Admin successfully soft-deleted the book via route.');
        } else {
          console.log('FAIL: Test Case 4 - Status:', resultRes.statusCode, 'Body:', resultRes.body);
        }
      } catch (error) {
        console.log('FAIL: Test Case 4 with error', error);
      }
    }

  } catch (err) {
    console.error('Unexpected error in route integration tests:', err);
  } finally {
    // Cleanup
    if (testBook) {
      await prisma.book.delete({ where: { id: testBook.id } });
    }
    if (author) {
      await prisma.author.delete({ where: { id: author.id } });
    }
    if (category) {
      await prisma.category.delete({ where: { id: category.id } });
    }
    console.log('Cleanup completed. Test suite finished.');
  }
}

runTests();
