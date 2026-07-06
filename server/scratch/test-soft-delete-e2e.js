import bookRouter from '../src/routes/book.routes.js';
import { prisma } from '../src/lib/prisma.js';
import { ApiError } from '../src/utils/index.js';
import { generateToken } from '../src/utils/jwt.js';

console.log('Soft Delete Book E2E Integration Testing Suite\n==============================================');

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

async function runTests() {
  // 1. Resolve router stacks for endpoints
  const getListRoute = bookRouter.stack.find(
    layer => layer.route && layer.route.path === '/' && layer.route.methods.get
  );
  const getDetailRoute = bookRouter.stack.find(
    layer => layer.route && layer.route.path === '/:id' && layer.route.methods.get
  );
  const deleteRoute = bookRouter.stack.find(
    layer => layer.route && layer.route.path === '/:id' && layer.route.methods.delete
  );

  if (!getListRoute || !getDetailRoute || !deleteRoute) {
    console.log('FAIL: One or more route layers not found in bookRouter.');
    return;
  }
  console.log('PASS: All three route layers registered correctly.');

  const listStack = getListRoute.route.stack.map(layer => layer.handle);
  const detailStack = getDetailRoute.route.stack.map(layer => layer.handle);
  const deleteStack = deleteRoute.route.stack.map(layer => layer.handle);

  let author, category, testBook;
  let adminToken, memberToken;

  try {
    // Generate JWT tokens
    adminToken = generateToken({ id: 'admin-user-id', role: 'ADMIN' });
    memberToken = generateToken({ id: 'member-user-id', role: 'MEMBER' });

    // Setup DB records
    author = await prisma.author.create({
      data: { fullName: 'E2E Author', biography: 'Bio' }
    });
    category = await prisma.category.create({
      data: { name: 'E2E Category ' + Date.now(), description: 'Desc' }
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
        title: 'E2E Test Title',
        isbn: 'E2E-ISBN-' + Date.now(),
        publisher: 'E2E Publisher',
        publicationYear: 2026,
        language: 'English',
        authors: { create: [{ authorId: author.id }] },
        categories: { create: [{ categoryId: category.id }] }
      }
    });

    // C. Verify test book is returned in active listing
    {
      const req = createMockReq({ method: 'GET', query: { page: 1, limit: 10 } });
      const res = createMockRes();
      await executeRouteStack(req, res, listStack);
      const newCount = res.body.data.pagination.totalItems;
      const found = res.body.data.books.find(b => b.id === testBook.id);

      if (found && newCount === baseCount + 1) {
        console.log('PASS: Test book is visible in active list. Pagination count incremented.');
      } else {
        console.log('FAIL: Active list check', found, newCount);
      }
    }

    // D. Verify unauthenticated DELETE returns 401
    {
      const req = createMockReq({ method: 'DELETE', params: { id: testBook.id } });
      const res = createMockRes();
      try {
        await executeRouteStack(req, res, deleteStack);
        console.log('FAIL: Unauthenticated DELETE did not throw error');
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 401) {
          console.log('PASS: Unauthenticated DELETE returned 401 Unauthorized.');
        } else {
          console.log('FAIL: Unauthenticated DELETE', error);
        }
      }
    }

    // E. Verify member DELETE returns 403
    {
      const req = createMockReq({
        method: 'DELETE',
        headers: { authorization: `Bearer ${memberToken}` },
        params: { id: testBook.id }
      });
      const res = createMockRes();
      try {
        await executeRouteStack(req, res, deleteStack);
        console.log('FAIL: Member DELETE did not throw error');
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 403) {
          console.log('PASS: Member DELETE returned 403 Forbidden.');
        } else {
          console.log('FAIL: Member DELETE', error);
        }
      }
    }

    // F. Verify invalid UUID parameter returns 400 Bad Request
    {
      const req = createMockReq({
        method: 'DELETE',
        headers: { authorization: `Bearer ${adminToken}` },
        params: { id: 'bad-uuid-format' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, deleteStack);
      if (resultRes.statusCode === 400 && resultRes.body.success === false && resultRes.body.message === 'Invalid book ID.') {
        console.log('PASS: Invalid UUID DELETE returned 400 Bad Request.');
      } else {
        console.log('FAIL: Invalid UUID DELETE', resultRes.statusCode, resultRes.body);
      }
    }

    // G. Verify valid Admin soft deletes book and returns 200 OK
    {
      const req = createMockReq({
        method: 'DELETE',
        headers: { authorization: `Bearer ${adminToken}` },
        params: { id: testBook.id }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, deleteStack);
      if (
        resultRes.statusCode === 200 &&
        resultRes.body.success === true &&
        resultRes.body.message === 'Book deleted successfully.' &&
        resultRes.body.data.isDeleted === true
      ) {
        console.log('PASS: Admin soft delete returned 200 OK with expected payload.');
      } else {
        console.log('FAIL: Admin soft delete', resultRes.statusCode, resultRes.body);
      }
    }

    // H. Verify duplicate DELETE returns 400 Bad Request
    {
      const req = createMockReq({
        method: 'DELETE',
        headers: { authorization: `Bearer ${adminToken}` },
        params: { id: testBook.id }
      });
      const res = createMockRes();
      try {
        await executeRouteStack(req, res, deleteStack);
        console.log('FAIL: Duplicate DELETE did not throw error');
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 400 && error.message === 'Book has already been deleted.') {
          console.log('PASS: Duplicate soft delete returned 400 Bad Request with already deleted message.');
        } else {
          console.log('FAIL: Duplicate soft delete', error);
        }
      }
    }

    // I. Verify non-existent ID returns 404 Not Found
    {
      const validButMissingId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
      const req = createMockReq({
        method: 'DELETE',
        headers: { authorization: `Bearer ${adminToken}` },
        params: { id: validButMissingId }
      });
      const res = createMockRes();
      try {
        await executeRouteStack(req, res, deleteStack);
        console.log('FAIL: Non-existent DELETE did not throw error');
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 404 && error.message === 'Book not found.') {
          console.log('PASS: Non-existent ID DELETE returned 404 Not Found.');
        } else {
          console.log('FAIL: Non-existent ID DELETE', error);
        }
      }
    }

    // J. Verify public read listing excludes soft-deleted book & decrements count
    {
      const req = createMockReq({ method: 'GET', query: { page: 1, limit: 10 } });
      const res = createMockRes();
      await executeRouteStack(req, res, listStack);
      const newCount = res.body.data.pagination.totalItems;
      const found = res.body.data.books.find(b => b.id === testBook.id);

      if (!found && newCount === baseCount) {
        console.log('PASS: Active listing excludes soft-deleted book. Pagination count decremented back to base.');
      } else {
        console.log('FAIL: Active listing check post-delete', found, newCount);
      }
    }

    // K. Verify public read details returns 404 Not Found
    {
      const req = createMockReq({ method: 'GET', params: { id: testBook.id } });
      const res = createMockRes();
      try {
        await executeRouteStack(req, res, detailStack);
        console.log('FAIL: getBookById did not throw error on soft-deleted book');
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 404 && error.message === 'Book not found.') {
          console.log('PASS: getBookById returned standard 404 Not Found on soft-deleted book.');
        } else {
          console.log('FAIL: getBookById check post-delete', error);
        }
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
