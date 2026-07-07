import reservationRouter from '../src/routes/reservation.routes.js';
import { prisma } from '../src/lib/prisma.js';
import { ApiError } from '../src/utils/index.js';
import { generateToken } from '../src/utils/jwt.js';

console.log('Cancel Reservation API E2E Integration Testing Suite\n===================================================');

// Mock request / response helpers
const createMockReq = ({ method = 'PATCH', headers = {}, params = {}, query = {}, body = {}, user = null } = {}) => ({
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
  const cancelRoute = reservationRouter.stack.find(
    layer => layer.route && layer.route.path === '/:id/cancel' && layer.route.methods.patch
  );

  if (!cancelRoute) {
    console.log('FAIL: Cancel reservation route layer not found in reservationRouter.');
    return;
  }
  console.log('PASS: Resolved cancel reservation route layer.');

  const cancelStack = cancelRoute.route.stack.map(layer => layer.handle);

  let author, category, testBook, testCopy1, testCopy2;
  let member1, member2, adminUser;
  let memberToken1, memberToken2, adminToken;
  let res1, res2, resCompleted, resExpired;

  try {
    // Setup Database
    author = await prisma.author.create({
      data: { fullName: 'E2E Cancel Reservation Author', biography: 'Bio' }
    });
    category = await prisma.category.create({
      data: { name: 'E2E Cancel Category ' + Date.now(), description: 'Desc' }
    });

    testBook = await prisma.book.create({
      data: {
        title: 'E2E Cancel Book',
        isbn: 'E2E-R-CANC-' + Date.now(),
        isBorrowable: true,
        authors: { create: [{ authorId: author.id }] },
        categories: { create: [{ categoryId: category.id }] }
      }
    });

    testCopy1 = await prisma.bookCopy.create({
      data: { bookId: testBook.id, barcode: 'BC-C1-' + Date.now(), status: 'RESERVED' }
    });

    testCopy2 = await prisma.bookCopy.create({
      data: { bookId: testBook.id, barcode: 'BC-C2-' + Date.now(), status: 'RESERVED' }
    });

    member1 = await prisma.user.create({
      data: {
        username: 'cancel_res_memb1_' + Date.now(),
        email: 'cancel_res_memb1_' + Date.now() + '@avelis.com',
        passwordHash: 'hash',
        role: 'MEMBER'
      }
    });

    member2 = await prisma.user.create({
      data: {
        username: 'cancel_res_memb2_' + Date.now(),
        email: 'cancel_res_memb2_' + Date.now() + '@avelis.com',
        passwordHash: 'hash',
        role: 'MEMBER'
      }
    });

    adminUser = await prisma.user.create({
      data: {
        username: 'cancel_res_admin_' + Date.now(),
        email: 'cancel_res_admin_' + Date.now() + '@avelis.com',
        passwordHash: 'hash',
        role: 'ADMIN'
      }
    });

    memberToken1 = generateToken({ id: member1.id, role: 'MEMBER' });
    memberToken2 = generateToken({ id: member2.id, role: 'MEMBER' });
    adminToken = generateToken({ id: adminUser.id, role: 'ADMIN' });

    // res1: member1, book1, READY_FOR_PICKUP, copy1
    res1 = await prisma.reservation.create({
      data: {
        userId: member1.id,
        bookId: testBook.id,
        copyId: testCopy1.id,
        status: 'READY_FOR_PICKUP',
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
      }
    });

    // res2: member1, book1, PENDING, copy null
    res2 = await prisma.reservation.create({
      data: {
        userId: member1.id,
        bookId: testBook.id,
        copyId: null,
        status: 'PENDING'
      }
    });

    // resCompleted: member2, book1, COMPLETED, copy2
    resCompleted = await prisma.reservation.create({
      data: {
        userId: member2.id,
        bookId: testBook.id,
        copyId: testCopy2.id,
        status: 'COMPLETED'
      }
    });

    // ── Test 1: Member successfully cancels their own reservation (READY_FOR_PICKUP) ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
        params: { id: res1.id },
        user: { id: member1.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, cancelStack);
      
      const copy = await prisma.bookCopy.findUnique({ where: { id: testCopy1.id } });
      
      const ok = resultRes.statusCode === 200 && 
                  resultRes.body.success === true && 
                  resultRes.body.data.status === 'CANCELLED' && 
                  resultRes.body.data.cancelledAt !== null &&
                  copy.status === 'AVAILABLE';
      record('Test 1: Member successfully cancels own READY_FOR_PICKUP reservation', ok);
    }

    // ── Test 2: Member successfully cancels their own reservation (PENDING) ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
        params: { id: res2.id },
        user: { id: member1.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, cancelStack);
      
      const ok = resultRes.statusCode === 200 && 
                  resultRes.body.success === true && 
                  resultRes.body.data.status === 'CANCELLED' && 
                  resultRes.body.data.cancelledAt !== null;
      record('Test 2: Member successfully cancels own PENDING reservation', ok);
    }

    // ── Test 3: Admin successfully cancels any reservation ──
    // Create new reservation for member1 first
    const adminTargetRes = await prisma.reservation.create({
      data: {
        userId: member1.id,
        bookId: testBook.id,
        copyId: null,
        status: 'PENDING'
      }
    });

    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        params: { id: adminTargetRes.id },
        user: { id: adminUser.id, role: 'ADMIN' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, cancelStack);
      
      const ok = resultRes.statusCode === 200 && 
                  resultRes.body.success === true && 
                  resultRes.body.data.status === 'CANCELLED';
      record('Test 3: Admin successfully cancels any reservation', ok);
      
      // Cleanup
      await prisma.reservation.delete({ where: { id: adminTargetRes.id } }).catch(() => {});
    }

    // ── Test 4: Member cannot cancel another member's reservation ──
    // We try to cancel resCompleted (belongs to member2) using member1 token
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
        params: { id: resCompleted.id },
        user: { id: member1.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, cancelStack);
      
      const ok = resultRes.statusCode === 403 && 
                  resultRes.body.success === false && 
                  resultRes.body.message.includes('Access denied');
      record('Test 4: Member cannot cancel another member\'s reservation', ok);
    }

    // ── Test 5: Invalid UUID returns 400 Bad Request ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
        params: { id: 'invalid-uuid-string' },
        user: { id: member1.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, cancelStack);
      
      const ok = resultRes.statusCode === 400 && 
                  resultRes.body.success === false && 
                  resultRes.body.message === 'Invalid reservation ID.';
      record('Test 5: Invalid UUID returns 400 Bad Request', ok);
    }

    // ── Test 6: Non-existent reservation returns 404 Not Found ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
        params: { id: '00000000-0000-0000-0000-000000000000' },
        user: { id: member1.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, cancelStack);
      
      const ok = resultRes.statusCode === 404 && 
                  resultRes.body.success === false && 
                  resultRes.body.message === 'Reservation not found.';
      record('Test 6: Non-existent reservation returns 404 Not Found', ok);
    }

    // ── Test 7: Already completed reservation fails with 400 ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken2}` },
        params: { id: resCompleted.id },
        user: { id: member2.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, cancelStack);
      
      const ok = resultRes.statusCode === 400 && 
                  resultRes.body.success === false && 
                  resultRes.body.message.includes('Reservation cannot be cancelled');
      record('Test 7: Already completed reservation fails with 400', ok);
    }

    // ── Test 8: BookCopy status check (fails if not RESERVED) ──
    // Create a new reservation and manually update the copy status to BORROWED (violating invariant status)
    const testCopyInconsistent = await prisma.bookCopy.create({
      data: { bookId: testBook.id, barcode: 'BC-INC-' + Date.now(), status: 'BORROWED' }
    });
    const resInconsistent = await prisma.reservation.create({
      data: {
        userId: member1.id,
        bookId: testBook.id,
        copyId: testCopyInconsistent.id,
        status: 'READY_FOR_PICKUP'
      }
    });

    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
        params: { id: resInconsistent.id },
        user: { id: member1.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, cancelStack);

      const reservationDb = await prisma.reservation.findUnique({ where: { id: resInconsistent.id } });
      const copyDb = await prisma.bookCopy.findUnique({ where: { id: testCopyInconsistent.id } });

      // The transaction must fail and roll back: status remains READY_FOR_PICKUP, copy remains BORROWED
      const ok = resultRes.statusCode === 400 && 
                  resultRes.body.success === false && 
                  resultRes.body.message.includes('Book copy is not in RESERVED status') &&
                  reservationDb.status === 'READY_FOR_PICKUP' &&
                  copyDb.status === 'BORROWED';
      record('Test 8: BookCopy status check fails and rolls back when not RESERVED', ok);

      // Cleanup inconsistent records
      await prisma.reservation.delete({ where: { id: resInconsistent.id } }).catch(() => {});
      await prisma.bookCopy.delete({ where: { id: testCopyInconsistent.id } }).catch(() => {});
    }

    // ── Test 9: Public API Contract conforms to RESERVATION_SELECT ──
    // Create another reservation to cancel
    const resContract = await prisma.reservation.create({
      data: {
        userId: member1.id,
        bookId: testBook.id,
        copyId: null,
        status: 'PENDING'
      }
    });

    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
        params: { id: resContract.id },
        user: { id: member1.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, cancelStack);

      const first = resultRes.body.data;
      const keysOk = 'id' in first && 'status' in first && 'createdAt' in first && 'user' in first && 'book' in first && 'bookCopy' in first;
      const dbKeysAbsent = !('userId' in first) && !('bookId' in first) && !('copyId' in first);
      
      const ok = resultRes.statusCode === 200 && keysOk && dbKeysAbsent;
      record('Test 9: Response conforms to RESERVATION_SELECT contract', ok);
      
      // Cleanup
      await prisma.reservation.delete({ where: { id: resContract.id } }).catch(() => {});
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
