import reservationRouter from '../src/routes/reservation.routes.js';
import { prisma } from '../src/lib/prisma.js';
import { ApiError } from '../src/utils/index.js';
import { generateToken } from '../src/utils/jwt.js';

console.log('Get All Reservations (Admin) API E2E Integration Testing Suite\n=============================================================');

// Mock request / response helpers
const createMockReq = ({ method = 'GET', headers = {}, params = {}, query = {}, body = {}, user = null } = {}) => ({
  headers,
  params,
  query,
  body,
  method,
  user
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
        if (err instanceof ApiError) {
          res.statusCode = err.statusCode;
          res.body = { success: false, message: err.message, errors: err.errors };
          res.sent = true;
          return resolve(res);
        }
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
          if (error instanceof ApiError) {
            res.statusCode = error.statusCode;
            res.body = { success: false, message: error.message, errors: error.errors };
            res.sent = true;
            return resolve(res);
          }
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
  const listRoute = reservationRouter.stack.find(
    layer => layer.route && layer.route.path === '/' && layer.route.methods.get
  );

  if (!listRoute) {
    console.log('FAIL: Get all reservations route layer not found in reservationRouter.');
    return;
  }
  console.log('PASS: Resolved list reservations route layer.');

  const listStack = listRoute.route.stack.map(layer => layer.handle);

  let author, category, book1, book2, copy1, copy2;
  let member1, member2, adminUser;
  let memberToken, adminToken;
  let res1, res2, res3;

  try {
    // Setup Database
    author = await prisma.author.create({
      data: { fullName: 'E2E List Reservation Author', biography: 'Bio' }
    });
    category = await prisma.category.create({
      data: { name: 'E2E List Category ' + Date.now(), description: 'Desc' }
    });

    book1 = await prisma.book.create({
      data: {
        title: 'E2E List Book 1',
        isbn: 'E2E-R-L1-' + Date.now(),
        isBorrowable: true,
        authors: { create: [{ authorId: author.id }] },
        categories: { create: [{ categoryId: category.id }] }
      }
    });

    book2 = await prisma.book.create({
      data: {
        title: 'E2E List Book 2',
        isbn: 'E2E-R-L2-' + Date.now(),
        isBorrowable: true,
        authors: { create: [{ authorId: author.id }] },
        categories: { create: [{ categoryId: category.id }] }
      }
    });

    copy1 = await prisma.bookCopy.create({
      data: { bookId: book1.id, barcode: 'BC-L1-' + Date.now(), status: 'AVAILABLE' }
    });

    copy2 = await prisma.bookCopy.create({
      data: { bookId: book2.id, barcode: 'BC-L2-' + Date.now(), status: 'AVAILABLE' }
    });

    member1 = await prisma.user.create({
      data: {
        username: 'list_res_memb1_' + Date.now(),
        email: 'list_res_memb1_' + Date.now() + '@avelis.com',
        passwordHash: 'hash',
        role: 'MEMBER'
      }
    });

    member2 = await prisma.user.create({
      data: {
        username: 'list_res_memb2_' + Date.now(),
        email: 'list_res_memb2_' + Date.now() + '@avelis.com',
        passwordHash: 'hash',
        role: 'MEMBER'
      }
    });

    adminUser = await prisma.user.create({
      data: {
        username: 'list_res_admin_' + Date.now(),
        email: 'list_res_admin_' + Date.now() + '@avelis.com',
        passwordHash: 'hash',
        role: 'ADMIN'
      }
    });

    memberToken = generateToken({ id: member1.id, role: 'MEMBER' });
    adminToken = generateToken({ id: adminUser.id, role: 'ADMIN' });

    // Clean up any existing active/pending reservations to have clean test context
    await prisma.reservation.deleteMany({});

    // Create 3 specific reservations:
    // res1: member1, book1, READY_FOR_PICKUP
    res1 = await prisma.reservation.create({
      data: {
        userId: member1.id,
        bookId: book1.id,
        copyId: copy1.id,
        status: 'READY_FOR_PICKUP',
        createdAt: new Date(Date.now() - 3000) // older
      }
    });

    // res2: member2, book1, PENDING
    res2 = await prisma.reservation.create({
      data: {
        userId: member2.id,
        bookId: book1.id,
        copyId: null,
        status: 'PENDING',
        createdAt: new Date(Date.now() - 2000)
      }
    });

    // res3: member1, book2, COMPLETED
    res3 = await prisma.reservation.create({
      data: {
        userId: member1.id,
        bookId: book2.id,
        copyId: copy2.id,
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 1000) // newest
      }
    });

    // ── Test 1: Admin retrieves all reservations successfully ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        user: { id: adminUser.id, role: 'ADMIN' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, listStack);
      
      const ok = resultRes.statusCode === 200 && 
                  resultRes.body.success === true && 
                  resultRes.body.data.reservations.length === 3;
      record('Test 1: Admin retrieves all reservations successfully', ok);
    }

    // ── Test 2: Pagination returns correct metadata ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        query: { page: '1', limit: '2' },
        user: { id: adminUser.id, role: 'ADMIN' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, listStack);
      
      const ok = resultRes.statusCode === 200 && 
                  resultRes.body.data.reservations.length === 2 && 
                  resultRes.body.data.pagination.page === 1 && 
                  resultRes.body.data.pagination.limit === 2 && 
                  resultRes.body.data.pagination.totalResults === 3 && 
                  resultRes.body.data.pagination.totalPages === 2;
      record('Test 2: Pagination returns correct metadata', ok);
    }

    // ── Test 3: Filter by reservation status ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        query: { status: 'PENDING' },
        user: { id: adminUser.id, role: 'ADMIN' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, listStack);
      
      const ok = resultRes.statusCode === 200 && 
                  resultRes.body.data.reservations.length === 1 && 
                  resultRes.body.data.reservations[0].id === res2.id;
      record('Test 3: Filter by reservation status works', ok);
    }

    // ── Test 4: Filter by user ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        query: { userId: member1.id },
        user: { id: adminUser.id, role: 'ADMIN' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, listStack);
      
      const ok = resultRes.statusCode === 200 && 
                  resultRes.body.data.reservations.length === 2 &&
                  resultRes.body.data.reservations.every(r => r.user.id === member1.id);
      record('Test 4: Filter by user works', ok);
    }

    // ── Test 5: Filter by book ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        query: { bookId: book1.id },
        user: { id: adminUser.id, role: 'ADMIN' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, listStack);
      
      const ok = resultRes.statusCode === 200 && 
                  resultRes.body.data.reservations.length === 2 &&
                  resultRes.body.data.reservations.every(r => r.book.id === book1.id);
      record('Test 5: Filter by book works', ok);
    }

    // ── Test 6: Sort by createdAt DESC (Default) ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        user: { id: adminUser.id, role: 'ADMIN' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, listStack);
      
      // Default: createdAt DESC. Order should be res3, res2, res1.
      const list = resultRes.body.data.reservations;
      const ok = list[0].id === res3.id && list[1].id === res2.id && list[2].id === res1.id;
      record('Test 6: Sort by createdAt DESC (Default)', ok);
    }

    // ── Test 7: Invalid page parameter returns 400 ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        query: { page: '-1' },
        user: { id: adminUser.id, role: 'ADMIN' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, listStack);
      
      const ok = resultRes.statusCode === 400 && 
                  resultRes.body.success === false && 
                  JSON.stringify(resultRes.body).includes('Page must be a positive integer');
      record('Test 7: Invalid page parameter returns 400', ok);
    }

    // ── Test 8: Invalid limit parameter returns 400 ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        query: { limit: 'abc' },
        user: { id: adminUser.id, role: 'ADMIN' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, listStack);
      
      const ok = resultRes.statusCode === 400 && 
                  resultRes.body.success === false && 
                  JSON.stringify(resultRes.body).includes('Limit must be a positive integer');
      record('Test 8: Invalid limit parameter returns 400', ok);
    }

    // ── Test 9: Invalid UUID parameters return 400 ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        query: { userId: 'not-a-uuid' },
        user: { id: adminUser.id, role: 'ADMIN' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, listStack);
      
      const ok = resultRes.statusCode === 400 && 
                  resultRes.body.success === false && 
                  JSON.stringify(resultRes.body).includes('userId must be a valid UUID');
      record('Test 9: Invalid UUID parameters return 400', ok);
    }

    // ── Test 10: Invalid status returns 400 ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        query: { status: 'UNKNOWN_STATUS' },
        user: { id: adminUser.id, role: 'ADMIN' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, listStack);
      
      const ok = resultRes.statusCode === 400 && 
                  resultRes.body.success === false && 
                  JSON.stringify(resultRes.body).includes('status must be a valid ReservationStatus');
      record('Test 10: Invalid status returns 400', ok);
    }

    // ── Test 11: Invalid sort field returns 400 ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        query: { sortBy: 'unsupportedField' },
        user: { id: adminUser.id, role: 'ADMIN' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, listStack);
      
      const ok = resultRes.statusCode === 400 && 
                  resultRes.body.success === false && 
                  JSON.stringify(resultRes.body).includes('sortBy must be one of');
      record('Test 11: Invalid sort field returns 400', ok);
    }

    // ── Test 12: Invalid sort order returns 400 ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        query: { sortOrder: 'not-asc-or-desc' },
        user: { id: adminUser.id, role: 'ADMIN' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, listStack);
      
      const ok = resultRes.statusCode === 400 && 
                  resultRes.body.success === false && 
                  JSON.stringify(resultRes.body).includes("sortOrder must be 'asc' or 'desc'");
      record('Test 12: Invalid sort order returns 400', ok);
    }

    // ── Test 13: Member receives 403 Forbidden ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken}` },
        user: { id: member1.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, listStack);
      
      const ok = resultRes.statusCode === 403 && 
                  resultRes.body.success === false && 
                  resultRes.body.message === 'Access denied. Administrator privileges required.';
      record('Test 13: Member receives 403 Forbidden', ok);
    }

    // ── Test 14: Guest receives 401 Unauthorized ──
    {
      // Mocking auth failure (authMiddleware will reject if headers lack Bearer token or invalid)
      // Since mock runner evaluates authMiddleware, let's pass a mock request with no token.
      const req = createMockReq({
        headers: {},
        user: null
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, listStack);
      
      const ok = resultRes.statusCode === 401 && 
                  resultRes.body.success === false && 
                  resultRes.body.message === 'Authorization header is missing';
      record('Test 14: Guest receives 401 Unauthorized', ok);
    }

    // ── Test 15: Returned reservations match the RESERVATION_SELECT API contract ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        user: { id: adminUser.id, role: 'ADMIN' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, listStack);
      
      const list = resultRes.body.data.reservations;
      const first = list[0];

      // Exposes only approved public properties
      const keysOk = 'id' in first && 'status' in first && 'createdAt' in first && 'user' in first && 'book' in first && 'bookCopy' in first;
      // Database specific fields are absent
      const dbKeysAbsent = !('userId' in first) && !('bookId' in first) && !('copyId' in first);
      // Nested objects
      const nestedUser = first.user && 'id' in first.user && 'username' in first.user && !('passwordHash' in first.user);
      const nestedBook = first.book && 'id' in first.book && 'title' in first.book && !('description' in first.book);
      
      const ok = keysOk && dbKeysAbsent && nestedUser && nestedBook;
      record('Test 15: Returned reservations match public API contract', ok);
    }

  } catch (err) {
    console.error('Unexpected error in E2E integration test suite:', err);
  } finally {
    // Cleanup
    await prisma.reservation.deleteMany({});
    if (member1) {
      await prisma.user.delete({ where: { id: member1.id } }).catch(() => {});
    }
    if (member2) {
      await prisma.user.delete({ where: { id: member2.id } }).catch(() => {});
    }
    if (adminUser) {
      await prisma.user.delete({ where: { id: adminUser.id } }).catch(() => {});
    }
    if (copy1) {
      await prisma.bookCopy.delete({ where: { id: copy1.id } }).catch(() => {});
    }
    if (copy2) {
      await prisma.bookCopy.delete({ where: { id: copy2.id } }).catch(() => {});
    }
    if (book1) {
      await prisma.book.delete({ where: { id: book1.id } }).catch(() => {});
    }
    if (book2) {
      await prisma.book.delete({ where: { id: book2.id } }).catch(() => {});
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
