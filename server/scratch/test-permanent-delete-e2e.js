import bookRouter from '../src/routes/book.routes.js';
import { prisma } from '../src/lib/prisma.js';
import { ApiError } from '../src/utils/index.js';
import { generateToken } from '../src/utils/jwt.js';
import { softDeleteBook } from '../src/services/book.service.js';

console.log('Permanent Delete Book E2E Integration Testing Suite\n====================================================');

// Mock request / response helpers
const createMockReq = ({ method = 'DELETE', headers = {}, params = {}, query = {}, body = {} } = {}) => ({
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

async function runTests() {
  // Resolve router stacks
  const permanentDeleteRoute = bookRouter.stack.find(
    layer => layer.route && layer.route.path === '/:id/permanent' && layer.route.methods.delete
  );
  const getDetailRoute = bookRouter.stack.find(
    layer => layer.route && layer.route.path === '/:id' && layer.route.methods.get
  );

  if (!permanentDeleteRoute || !getDetailRoute) {
    console.log('FAIL: One or more route layers not found in bookRouter.');
    return;
  }
  console.log('PASS: Route layers resolved correctly.');

  const permanentDeleteStack = permanentDeleteRoute.route.stack.map(layer => layer.handle);
  const detailStack = getDetailRoute.route.stack.map(layer => layer.handle);

  let author, category, testBook, testBookId;
  let adminToken, memberToken;

  try {
    // Generate JWT tokens
    adminToken = generateToken({ id: 'admin-user-id', role: 'ADMIN' });
    memberToken = generateToken({ id: 'member-user-id', role: 'MEMBER' });

    // Setup DB records
    author = await prisma.author.create({
      data: { fullName: 'E2E PermDelete Author', biography: 'Bio' }
    });
    category = await prisma.category.create({
      data: { name: 'E2E PermDelete Category ' + Date.now(), description: 'Desc' }
    });

    testBook = await prisma.book.create({
      data: {
        title: 'E2E PermDelete Title',
        isbn: 'E2E-PD-ISBN-' + Date.now(),
        publisher: 'E2E Publisher',
        publicationYear: 2026,
        language: 'English',
        authors: { create: [{ authorId: author.id }] },
        categories: { create: [{ categoryId: category.id }] }
      }
    });
    testBookId = testBook.id;

    // ── Test 1: Unauthenticated request → 401 ──
    {
      const req = createMockReq({ params: { id: testBookId } });
      const res = createMockRes();
      try {
        await executeRouteStack(req, res, permanentDeleteStack);
        console.log('FAIL: Test 1: Unauthenticated request did not throw error.');
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 401) {
          console.log('PASS: Test 1: Unauthenticated request returned 401 Unauthorized.');
        } else {
          console.log('FAIL: Test 1:', error);
        }
      }
    }

    // ── Test 2: Non-admin (MEMBER) user → 403 ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken}` },
        params: { id: testBookId }
      });
      const res = createMockRes();
      try {
        await executeRouteStack(req, res, permanentDeleteStack);
        console.log('FAIL: Test 2: Member request did not throw error.');
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 403) {
          console.log('PASS: Test 2: Non-admin user returned 403 Forbidden.');
        } else {
          console.log('FAIL: Test 2:', error);
        }
      }
    }

    // ── Test 3: Invalid UUID → 400 ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        params: { id: 'bad-uuid-format' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, permanentDeleteStack);
      if (resultRes.statusCode === 400 && resultRes.body.success === false && resultRes.body.message === 'Invalid book ID.') {
        console.log('PASS: Test 3: Invalid UUID returned 400 Bad Request.');
      } else {
        console.log('FAIL: Test 3:', resultRes.statusCode, resultRes.body);
      }
    }

    // ── Test 4: Non-existent book (valid UUID) → 404 ──
    {
      const validButMissingId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        params: { id: validButMissingId }
      });
      const res = createMockRes();
      try {
        await executeRouteStack(req, res, permanentDeleteStack);
        console.log('FAIL: Test 4: Non-existent book did not throw error.');
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 404 && error.message === 'Book not found.') {
          console.log('PASS: Test 4: Non-existent book returned 404 Not Found.');
        } else {
          console.log('FAIL: Test 4:', error);
        }
      }
    }

    // ── Test 5: Active book protection → 400 ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        params: { id: testBookId }
      });
      const res = createMockRes();
      try {
        await executeRouteStack(req, res, permanentDeleteStack);
        console.log('FAIL: Test 5: Active book did not throw error.');
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 400 && error.message === 'Book must be soft deleted before permanent deletion.') {
          console.log('PASS: Test 5: Active book returned 400 Bad Request.');
        } else {
          console.log('FAIL: Test 5:', error);
        }
      }
    }

    // Soft delete the book to make it eligible for permanent deletion
    await softDeleteBook(testBookId);
    console.log('Book soft-deleted to set up permanent delete.');

    // ── Test 6: Successful permanent delete → 200 ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        params: { id: testBookId }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, permanentDeleteStack);
      if (
        resultRes.statusCode === 200 &&
        resultRes.body.success === true &&
        resultRes.body.message === 'Book permanently deleted successfully.' &&
        resultRes.body.data &&
        resultRes.body.data.id === testBookId
      ) {
        console.log('PASS: Test 6: Successful permanent delete returned 200 OK with deleted book data.');
        // Prevent cleanup from trying to delete it again
        testBook = null;
      } else {
        console.log('FAIL: Test 6:', resultRes.statusCode, resultRes.body);
      }
    }

    // ── Test 7: Post-deletion retrieval → 404 ──
    {
      const req = createMockReq({ method: 'GET', params: { id: testBookId } });
      const res = createMockRes();
      try {
        await executeRouteStack(req, res, detailStack);
        console.log('FAIL: Test 7: Post-deletion retrieval did not throw error.');
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 404 && error.message === 'Book not found.') {
          // Also verify physical removal from database
          const dbRecord = await prisma.book.findUnique({ where: { id: testBookId } });
          if (!dbRecord) {
            console.log('PASS: Test 7: Post-deletion retrieval returned 404 and record is physically removed from database.');
          } else {
            console.log('FAIL: Test 7: 404 returned but record still exists in database.');
          }
        } else {
          console.log('FAIL: Test 7:', error);
        }
      }
    }

  } catch (err) {
    console.error('Unexpected error in E2E integration test suite:', err);
  } finally {
    // Cleanup
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
