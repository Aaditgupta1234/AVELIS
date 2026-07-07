import reservationRouter from '../src/routes/reservation.routes.js';
import { prisma } from '../src/lib/prisma.js';
import { ApiError } from '../src/utils/index.js';
import { generateToken } from '../src/utils/jwt.js';

console.log('Get Reservation by ID API E2E Integration Testing Suite\n======================================================');

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
  const getRoute = reservationRouter.stack.find(
    layer => layer.route && layer.route.path === '/:id' && layer.route.methods.get
  );

  if (!getRoute) {
    console.log('FAIL: Get reservation by ID route layer not found in reservationRouter.');
    return;
  }
  console.log('PASS: Resolved get reservation route layer.');

  const getStack = getRoute.route.stack.map(layer => layer.handle);

  let author, category, testBook, testCopy;
  let memberUser, otherMemberUser, adminUser;
  let memberToken, otherMemberToken, adminToken;
  let testReservation;

  try {
    // Setup DB records
    author = await prisma.author.create({
      data: { fullName: 'E2E Get Reservation Author', biography: 'Bio' }
    });
    category = await prisma.category.create({
      data: { name: 'E2E Get Reservation Category ' + Date.now(), description: 'Desc' }
    });

    testBook = await prisma.book.create({
      data: {
        title: 'E2E Get Reservation Book',
        isbn: 'E2E-R-GET-' + Date.now(),
        isBorrowable: true,
        authors: { create: [{ authorId: author.id }] },
        categories: { create: [{ categoryId: category.id }] }
      }
    });

    testCopy = await prisma.bookCopy.create({
      data: {
        bookId: testBook.id,
        barcode: 'BC-GET-' + Date.now(),
        status: 'AVAILABLE'
      }
    });

    memberUser = await prisma.user.create({
      data: {
        username: 'get_res_member_' + Date.now(),
        email: 'get_res_member_' + Date.now() + '@avelis.com',
        passwordHash: 'dummyhash',
        role: 'MEMBER'
      }
    });

    otherMemberUser = await prisma.user.create({
      data: {
        username: 'get_res_other_member_' + Date.now(),
        email: 'get_res_other_member_' + Date.now() + '@avelis.com',
        passwordHash: 'dummyhash',
        role: 'MEMBER'
      }
    });

    adminUser = await prisma.user.create({
      data: {
        username: 'get_res_admin_' + Date.now(),
        email: 'get_res_admin_' + Date.now() + '@avelis.com',
        passwordHash: 'dummyhash',
        role: 'ADMIN'
      }
    });

    memberToken = generateToken({ id: memberUser.id, role: 'MEMBER' });
    otherMemberToken = generateToken({ id: otherMemberUser.id, role: 'MEMBER' });
    adminToken = generateToken({ id: adminUser.id, role: 'ADMIN' });

    // Create a test reservation belonging to memberUser
    testReservation = await prisma.reservation.create({
      data: {
        userId: memberUser.id,
        bookId: testBook.id,
        copyId: testCopy.id,
        status: 'READY_FOR_PICKUP',
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
      }
    });

    // ── Test 1: Admin can retrieve any reservation successfully ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` },
        params: { id: testReservation.id },
        user: { id: adminUser.id, role: 'ADMIN' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, getStack);
      
      const ok = resultRes.statusCode === 200 && 
                  resultRes.body.success === true && 
                  resultRes.body.data.id === testReservation.id;
      record('Test 1: Admin retrieves any reservation', ok);
    }

    // ── Test 2: Member retrieves their own reservation successfully ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken}` },
        params: { id: testReservation.id },
        user: { id: memberUser.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, getStack);
      
      const ok = resultRes.statusCode === 200 && 
                  resultRes.body.success === true && 
                  resultRes.body.data.id === testReservation.id;
      record('Test 2: Member retrieves own reservation', ok);
    }

    // ── Test 3: Member attempts to retrieve another user's reservation ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${otherMemberToken}` },
        params: { id: testReservation.id },
        user: { id: otherMemberUser.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, getStack);
      
      const ok = resultRes.statusCode === 403 && 
                  resultRes.body.success === false && 
                  resultRes.body.message.includes('Access denied');
      record('Test 3: Member accessing other member\'s reservation yields 403 Forbidden', ok);
    }

    // ── Test 4: Invalid UUID returns 400 Bad Request ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken}` },
        params: { id: 'invalid-uuid-string' },
        user: { id: memberUser.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, getStack);
      
      const ok = resultRes.statusCode === 400 && 
                  resultRes.body.success === false && 
                  resultRes.body.message === 'Invalid reservation ID.';
      record('Test 4: Invalid UUID yields 400 Bad Request', ok);
    }

    // ── Test 5: Non-existent reservation returns 404 Not Found ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken}` },
        params: { id: '00000000-0000-0000-0000-000000000000' },
        user: { id: memberUser.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, getStack);
      
      const ok = resultRes.statusCode === 404 && 
                  resultRes.body.success === false && 
                  resultRes.body.message === 'Reservation not found.';
      record('Test 5: Non-existent reservation yields 404 Not Found', ok);
    }

    // ── Test 6: Verify response contains only approved public fields (Public API Verification) ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken}` },
        params: { id: testReservation.id },
        user: { id: memberUser.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, getStack);
      
      const data = resultRes.body.data;
      
      // Expected root fields
      const hasExpectedRoot = 'id' in data && 'status' in data && 'createdAt' in data && 'user' in data && 'book' in data && 'bookCopy' in data;
      
      // Unexpected/internal root fields must be absent
      const hasInternalRoot = 'userId' in data || 'bookId' in data || 'copyId' in data;
      
      // Nested objects verification
      const userOk = data.user && 'id' in data.user && 'username' in data.user && !('passwordHash' in data.user);
      const bookOk = data.book && 'id' in data.book && 'title' in data.book && !('description' in data.book);
      const copyOk = data.bookCopy && 'id' in data.bookCopy && 'barcode' in data.bookCopy && !('createdAt' in data.bookCopy);

      const ok = hasExpectedRoot && !hasInternalRoot && userOk && bookOk && copyOk;
      record('Test 6: Public API contract fields structure verification', ok);
    }

  } catch (err) {
    console.error('Unexpected error in E2E integration test suite:', err);
  } finally {
    // Cleanup
    if (testReservation) {
      await prisma.reservation.delete({ where: { id: testReservation.id } }).catch(() => {});
    }
    if (memberUser) {
      await prisma.user.delete({ where: { id: memberUser.id } }).catch(() => {});
    }
    if (otherMemberUser) {
      await prisma.user.delete({ where: { id: otherMemberUser.id } }).catch(() => {});
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
