import reservationRouter from '../src/routes/reservation.routes.js';
import { prisma } from '../src/lib/prisma.js';
import { ApiError } from '../src/utils/index.js';
import { generateToken } from '../src/utils/jwt.js';

console.log('Get Current User Reservations API E2E Integration Testing Suite\n=============================================================');

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
  const meRoute = reservationRouter.stack.find(
    layer => layer.route && layer.route.path === '/me' && layer.route.methods.get
  );

  if (!meRoute) {
    console.log('FAIL: Get /me reservations route layer not found in reservationRouter.');
    return;
  }
  console.log('PASS: Resolved get /me reservations route layer.');

  const meStack = meRoute.route.stack.map(layer => layer.handle);

  let author, category, book1, book2, copy1, copy2;
  let member1, member2, adminUser;
  let memberToken1, memberToken2, adminToken;
  let res1, res2, res3;

  try {
    // Setup Database
    author = await prisma.author.create({
      data: { fullName: 'E2E My Reservation Author', biography: 'Bio' }
    });
    category = await prisma.category.create({
      data: { name: 'E2E My Category ' + Date.now(), description: 'Desc' }
    });

    book1 = await prisma.book.create({
      data: {
        title: 'E2E My Book 1',
        isbn: 'E2E-R-M1-' + Date.now(),
        isBorrowable: true,
        authors: { create: [{ authorId: author.id }] },
        categories: { create: [{ categoryId: category.id }] }
      }
    });

    book2 = await prisma.book.create({
      data: {
        title: 'E2E My Book 2',
        isbn: 'E2E-R-M2-' + Date.now(),
        isBorrowable: true,
        authors: { create: [{ authorId: author.id }] },
        categories: { create: [{ categoryId: category.id }] }
      }
    });

    copy1 = await prisma.bookCopy.create({
      data: { bookId: book1.id, barcode: 'BC-M1-' + Date.now(), status: 'AVAILABLE' }
    });

    copy2 = await prisma.bookCopy.create({
      data: { bookId: book2.id, barcode: 'BC-M2-' + Date.now(), status: 'AVAILABLE' }
    });

    member1 = await prisma.user.create({
      data: {
        username: 'my_res_memb1_' + Date.now(),
        email: 'my_res_memb1_' + Date.now() + '@avelis.com',
        passwordHash: 'hash',
        role: 'MEMBER'
      }
    });

    member2 = await prisma.user.create({
      data: {
        username: 'my_res_memb2_' + Date.now(),
        email: 'my_res_memb2_' + Date.now() + '@avelis.com',
        passwordHash: 'hash',
        role: 'MEMBER'
      }
    });

    adminUser = await prisma.user.create({
      data: {
        username: 'my_res_admin_' + Date.now(),
        email: 'my_res_admin_' + Date.now() + '@avelis.com',
        passwordHash: 'hash',
        role: 'ADMIN'
      }
    });

    memberToken1 = generateToken({ id: member1.id, role: 'MEMBER' });
    memberToken2 = generateToken({ id: member2.id, role: 'MEMBER' });
    adminToken = generateToken({ id: adminUser.id, role: 'ADMIN' });

    // Clean up any existing reservations to have clean test context
    await prisma.reservation.deleteMany({});

    // Create 3 specific reservations:
    // res1: member1, book1, READY_FOR_PICKUP
    res1 = await prisma.reservation.create({
      data: {
        userId: member1.id,
        bookId: book1.id,
        copyId: copy1.id,
        status: 'READY_FOR_PICKUP',
        createdAt: new Date(Date.now() - 3000)
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
        createdAt: new Date(Date.now() - 1000)
      }
    });

    // ── Test 1: Member retrieves only their own reservations ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
        user: { id: member1.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, meStack);
      
      const list = resultRes.body.data.reservations;
      const ok = resultRes.statusCode === 200 && 
                  resultRes.body.success === true && 
                  list.length === 2 &&
                  list.some(r => r.id === res1.id) &&
                  list.some(r => r.id === res3.id);
      record('Test 1: Member retrieves only their own reservations', ok);
    }

    // ── Test 2: Reservations belonging to other users are never returned ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
        user: { id: member1.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, meStack);
      
      const list = resultRes.body.data.reservations;
      const containsOther = list.some(r => r.id === res2.id);
      record('Test 2: Reservations belonging to other users are isolated', !containsOther);
    }

    // ── Test 3: Pagination metadata is correct ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
        query: { page: '1', limit: '1' },
        user: { id: member1.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, meStack);
      
      const ok = resultRes.statusCode === 200 && 
                  resultRes.body.data.reservations.length === 1 && 
                  resultRes.body.data.pagination.page === 1 && 
                  resultRes.body.data.pagination.limit === 1 && 
                  resultRes.body.data.pagination.totalResults === 2 && 
                  resultRes.body.data.pagination.totalPages === 2;
      record('Test 3: Pagination metadata is correct', ok);
    }

    // ── Test 4: Filter by reservation status ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
        query: { status: 'COMPLETED' },
        user: { id: member1.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, meStack);
      
      const list = resultRes.body.data.reservations;
      const ok = resultRes.statusCode === 200 && 
                  list.length === 1 && 
                  list[0].id === res3.id;
      record('Test 4: Filter by status works', ok);
    }

    // ── Test 5: Sort by createdAt DESC ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
        query: { sortBy: 'createdAt', sortOrder: 'desc' },
        user: { id: member1.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, meStack);
      
      const list = resultRes.body.data.reservations;
      // Ordered: res3 (newest), res1 (older)
      const ok = list[0].id === res3.id && list[1].id === res1.id;
      record('Test 5: Sort by createdAt DESC works', ok);
    }

    // ── Test 6: Deterministic secondary sorting works ──
    {
      // Set identical createdAt timestamps for res1 and res3
      const duplicateTimestamp = new Date();
      await prisma.reservation.update({
        where: { id: res1.id },
        data: { createdAt: duplicateTimestamp }
      });
      await prisma.reservation.update({
        where: { id: res3.id },
        data: { createdAt: duplicateTimestamp }
      });

      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
        query: { sortBy: 'createdAt', sortOrder: 'asc' },
        user: { id: member1.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, meStack);

      const list = resultRes.body.data.reservations;
      // Secondary sort: id ASC. Let's compare id values alphabetically:
      const sortedIds = [res1.id, res3.id].sort();
      const ok = list[0].id === sortedIds[0] && list[1].id === sortedIds[1];
      record('Test 6: Stable deterministic secondary sorting', ok);
    }

    // ── Test 7: Invalid page returns 400 ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
        query: { page: '0' },
        user: { id: member1.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, meStack);
      
      const ok = resultRes.statusCode === 400 && 
                  resultRes.body.success === false && 
                  JSON.stringify(resultRes.body).includes('Page must be a positive integer');
      record('Test 7: Invalid page returns 400', ok);
    }

    // ── Test 8: Invalid limit returns 400 ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
        query: { limit: '-10' },
        user: { id: member1.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, meStack);
      
      const ok = resultRes.statusCode === 400 && 
                  resultRes.body.success === false && 
                  JSON.stringify(resultRes.body).includes('Limit must be a positive integer');
      record('Test 8: Invalid limit returns 400', ok);
    }

    // ── Test 9: Invalid status returns 400 ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
        query: { status: 'INVALID_STATUS' },
        user: { id: member1.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, meStack);
      
      const ok = resultRes.statusCode === 400 && 
                  resultRes.body.success === false && 
                  JSON.stringify(resultRes.body).includes('status must be a valid ReservationStatus');
      record('Test 9: Invalid status returns 400', ok);
    }

    // ── Test 10: Invalid sort field returns 400 ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
        query: { sortBy: 'unsupported' },
        user: { id: member1.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, meStack);
      
      const ok = resultRes.statusCode === 400 && 
                  resultRes.body.success === false && 
                  JSON.stringify(resultRes.body).includes('sortBy must be one of');
      record('Test 10: Invalid sort field returns 400', ok);
    }

    // ── Test 11: Invalid sort order returns 400 ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
        query: { sortOrder: 'not-asc-or-desc' },
        user: { id: member1.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, meStack);
      
      const ok = resultRes.statusCode === 400 && 
                  resultRes.body.success === false && 
                  JSON.stringify(resultRes.body).includes("sortOrder must be 'asc' or 'desc'");
      record('Test 11: Invalid sort order returns 400', ok);
    }

    // ── Test 12: Administrator receives 403 Forbidden ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        user: { id: adminUser.id, role: 'ADMIN' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, meStack);
      
      const ok = resultRes.statusCode === 403 && 
                  resultRes.body.success === false && 
                  resultRes.body.message === 'Access denied. Member privileges required.';
      record('Test 12: Administrator receives 403 Forbidden', ok);
    }

    // ── Test 13: Guest receives 401 Unauthorized ──
    {
      const req = createMockReq({
        headers: {},
        user: null
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, meStack);
      
      const ok = resultRes.statusCode === 401 && 
                  resultRes.body.success === false && 
                  resultRes.body.message === 'Authorization header is missing';
      record('Test 13: Guest receives 401 Unauthorized', ok);
    }

    // ── Test 14: Response matches the RESERVATION_SELECT API contract ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
        user: { id: member1.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, meStack);
      
      const first = resultRes.body.data.reservations[0];
      const keysOk = 'id' in first && 'status' in first && 'createdAt' in first && 'user' in first && 'book' in first && 'bookCopy' in first;
      const dbKeysAbsent = !('userId' in first) && !('bookId' in first) && !('copyId' in first);
      
      const ok = keysOk && dbKeysAbsent;
      record('Test 14: Response conforms to RESERVATION_SELECT contract', ok);
    }

    // ── Test 15: Query parameter tampering protection ──
    {
      // Attempting to request other user's reservations via userId query parameter
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
        query: { userId: member2.id },
        user: { id: member1.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, meStack);
      
      const list = resultRes.body.data.reservations;
      // Even with ?userId=member2, only member1 reservations are returned (res1 and res3)
      const ok = resultRes.statusCode === 200 && 
                  list.length === 2 &&
                  list.every(r => r.user.id === member1.id);
      record('Test 15: Query parameter tampering protection (userId filter ignored)', ok);
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
