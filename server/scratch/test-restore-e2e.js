import bookRouter from '../src/routes/book.routes.js';
import { prisma } from '../src/lib/prisma.js';
import { ApiError } from '../src/utils/index.js';
import { generateToken } from '../src/utils/jwt.js';
import { softDeleteBook } from '../src/services/book.service.js';

console.log('Restore Book E2E Integration Testing Suite\n=========================================');

// Mock request / response helpers
const createMockReq = ({ method = 'PATCH', headers = {}, params = {}, query = {}, body = {} } = {}) => ({
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
  // 1. Resolve router stacks for endpoints
  const getListRoute = bookRouter.stack.find(
    layer => layer.route && layer.route.path === '/' && layer.route.methods.get
  );
  const getDetailRoute = bookRouter.stack.find(
    layer => layer.route && layer.route.path === '/:id' && layer.route.methods.get
  );
  const restoreRoute = bookRouter.stack.find(
    layer => layer.route && layer.route.path === '/:id/restore' && layer.route.methods.patch
  );

  if (!getListRoute || !getDetailRoute || !restoreRoute) {
    console.log('FAIL: One or more route layers not found in bookRouter.');
    return;
  }
  console.log('PASS: All three route layers registered correctly.');

  const listStack = getListRoute.route.stack.map(layer => layer.handle);
  const detailStack = getDetailRoute.route.stack.map(layer => layer.handle);
  const restoreStack = restoreRoute.route.stack.map(layer => layer.handle);

  let author, category, testBook;
  let adminToken, memberToken;

  try {
    // Generate JWT tokens
    adminToken = generateToken({ id: 'admin-user-id', role: 'ADMIN' });
    memberToken = generateToken({ id: 'member-user-id', role: 'MEMBER' });

    // Setup DB records
    author = await prisma.author.create({
      data: { fullName: 'E2E Restore Author', biography: 'Bio' }
    });
    category = await prisma.category.create({
      data: { name: 'E2E Restore Category ' + Date.now(), description: 'Desc' }
    });

    // A. Query listing initially to get base totalItems
    const initialListReq = createMockReq({ method: 'GET', query: { page: 1, limit: 10 } });
    const initialListRes = createMockRes();
    await executeRouteStack(initialListReq, initialListRes, listStack);
    const baseCount = initialListRes.body.data.pagination.totalItems;
    console.log(`Initial active books count in database: ${baseCount}`);

    // B. Create a test book
    testBook = await prisma.book.create({
      data: {
        title: 'E2E Restore Title',
        isbn: 'E2E-R-ISBN-' + Date.now(),
        publisher: 'E2E Publisher',
        publicationYear: 2026,
        language: 'English',
        authors: { create: [{ authorId: author.id }] },
        categories: { create: [{ categoryId: category.id }] }
      }
    });

    // C. Soft delete the book
    await softDeleteBook(testBook.id);
    console.log('Book soft-deleted successfully.');

    // D. Verify unauthenticated PATCH /:id/restore returns 401
    {
      const req = createMockReq({ method: 'PATCH', params: { id: testBook.id } });
      const res = createMockRes();
      try {
        await executeRouteStack(req, res, restoreStack);
        console.log('FAIL: Unauthenticated RESTORE did not throw error');
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 401) {
          console.log('PASS: Unauthenticated RESTORE returned 401 Unauthorized.');
        } else {
          console.log('FAIL: Unauthenticated RESTORE', error);
        }
      }
    }

    // E. Verify member PATCH /:id/restore returns 403
    {
      const req = createMockReq({
        method: 'PATCH',
        headers: { authorization: `Bearer ${memberToken}` },
        params: { id: testBook.id }
      });
      const res = createMockRes();
      try {
        await executeRouteStack(req, res, restoreStack);
        console.log('FAIL: Member RESTORE did not throw error');
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 403) {
          console.log('PASS: Member RESTORE returned 403 Forbidden.');
        } else {
          console.log('FAIL: Member RESTORE', error);
        }
      }
    }

    // F. Verify invalid UUID parameter returns 400 Bad Request
    {
      const req = createMockReq({
        method: 'PATCH',
        headers: { authorization: `Bearer ${adminToken}` },
        params: { id: 'bad-uuid-format' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, restoreStack);
      if (resultRes.statusCode === 400 && resultRes.body.success === false && resultRes.body.message === 'Invalid book ID.') {
        console.log('PASS: Invalid UUID RESTORE returned 400 Bad Request.');
      } else {
        console.log('FAIL: Invalid UUID RESTORE', resultRes.statusCode, resultRes.body);
      }
    }

    // G. Verify non-existent ID returns 404 Not Found
    {
      const validButMissingId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
      const req = createMockReq({
        method: 'PATCH',
        headers: { authorization: `Bearer ${adminToken}` },
        params: { id: validButMissingId }
      });
      const res = createMockRes();
      try {
        await executeRouteStack(req, res, restoreStack);
        console.log('FAIL: Non-existent RESTORE did not throw error');
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 404 && error.message === 'Book not found.') {
          console.log('PASS: Non-existent ID RESTORE returned 404 Not Found.');
        } else {
          console.log('FAIL: Non-existent ID RESTORE', error);
        }
      }
    }

    // H. Verify valid Admin restores book and returns 200 OK
    {
      const req = createMockReq({
        method: 'PATCH',
        headers: { authorization: `Bearer ${adminToken}` },
        params: { id: testBook.id }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, restoreStack);
      if (
        resultRes.statusCode === 200 &&
        resultRes.body.success === true &&
        resultRes.body.message === 'Book restored successfully.' &&
        resultRes.body.data.isDeleted === false &&
        resultRes.body.data.deletedAt === null
      ) {
        console.log('PASS: Admin restore returned 200 OK with expected payload.');
      } else {
        console.log('FAIL: Admin restore', resultRes.statusCode, resultRes.body);
      }
    }

    // I. Verify duplicate RESTORE (restoring an active book) returns 400 Bad Request
    {
      const req = createMockReq({
        method: 'PATCH',
        headers: { authorization: `Bearer ${adminToken}` },
        params: { id: testBook.id }
      });
      const res = createMockRes();
      try {
        await executeRouteStack(req, res, restoreStack);
        console.log('FAIL: Duplicate RESTORE did not throw error');
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 400 && error.message === 'Book is not deleted.') {
          console.log('PASS: Duplicate restore returned 400 Bad Request with not deleted message.');
        } else {
          console.log('FAIL: Duplicate restore', error);
        }
      }
    }

    // J. Restore Visibility Integration Verification
    {
      // 1. Verify GET /api/books includes the restored book and totalItems increments
      const reqList = createMockReq({ method: 'GET', query: { page: 1, limit: 10 } });
      const resList = createMockRes();
      await executeRouteStack(reqList, resList, listStack);
      const newCount = resList.body.data.pagination.totalItems;
      const found = resList.body.data.books.find(b => b.id === testBook.id);

      if (found && newCount === baseCount + 1) {
        console.log('PASS: Restore Visibility: public listing includes restored book, and pagination counts updated.');
      } else {
        console.log('FAIL: Restore Visibility listing check', found, newCount);
      }

      // 2. Verify GET /api/books/:id successfully returns the restored book
      const reqDetail = createMockReq({ method: 'GET', params: { id: testBook.id } });
      const resDetail = createMockRes();
      await executeRouteStack(reqDetail, resDetail, detailStack);
      if (resDetail.body && resDetail.body.data && resDetail.body.data.id === testBook.id && resDetail.body.data.isDeleted === false) {
        console.log('PASS: Restore Visibility: public detail lookup successfully retrieves restored book.');
      } else {
        console.log('FAIL: Restore Visibility detail check', resDetail.body);
      }
    }

  } catch (err) {
    console.error('Unexpected error in E2E integration test suite:', err);
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
