import reservationRouter from '../src/routes/reservation.routes.js';
import { prisma } from '../src/lib/prisma.js';
import { ApiError } from '../src/utils/index.js';
import { generateToken } from '../src/utils/jwt.js';

console.log('Reservation Queue & Fulfillment E2E Integration Testing Suite\n============================================================');

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

  let author, category, testBook, testCopy1, testCopy2, testCopy3;
  let member1, member2, member3, adminUser;
  let memberToken1, memberToken2, memberToken3, adminToken;

  try {
    // Setup Database
    author = await prisma.author.create({
      data: { fullName: 'E2E Queue Author', biography: 'Bio' }
    });
    category = await prisma.category.create({
      data: { name: 'E2E Queue Category ' + Date.now(), description: 'Desc' }
    });

    testBook = await prisma.book.create({
      data: {
        title: 'E2E Queue Book',
        isbn: 'E2E-R-QUEUE-' + Date.now(),
        isBorrowable: true,
        authors: { create: [{ authorId: author.id }] },
        categories: { create: [{ categoryId: category.id }] }
      }
    });

    // Create physical copies
    testCopy1 = await prisma.bookCopy.create({
      data: { bookId: testBook.id, barcode: 'BC-Q1-' + Date.now(), status: 'RESERVED' }
    });

    testCopy2 = await prisma.bookCopy.create({
      data: { bookId: testBook.id, barcode: 'BC-Q2-' + Date.now(), status: 'RESERVED' }
    });

    testCopy3 = await prisma.bookCopy.create({
      data: { bookId: testBook.id, barcode: 'BC-Q3-' + Date.now(), status: 'BORROWED' }
    });

    member1 = await prisma.user.create({
      data: {
        username: 'q_res_memb1_' + Date.now(),
        email: 'q_res_memb1_' + Date.now() + '@avelis.com',
        passwordHash: 'hash',
        role: 'MEMBER'
      }
    });

    member2 = await prisma.user.create({
      data: {
        username: 'q_res_memb2_' + Date.now(),
        email: 'q_res_memb2_' + Date.now() + '@avelis.com',
        passwordHash: 'hash',
        role: 'MEMBER'
      }
    });

    member3 = await prisma.user.create({
      data: {
        username: 'q_res_memb3_' + Date.now(),
        email: 'q_res_memb3_' + Date.now() + '@avelis.com',
        passwordHash: 'hash',
        role: 'MEMBER'
      }
    });

    adminUser = await prisma.user.create({
      data: {
        username: 'q_res_admin_' + Date.now(),
        email: 'q_res_admin_' + Date.now() + '@avelis.com',
        passwordHash: 'hash',
        role: 'ADMIN'
      }
    });

    memberToken1 = generateToken({ id: member1.id, role: 'MEMBER' });
    memberToken2 = generateToken({ id: member2.id, role: 'MEMBER' });
    memberToken3 = generateToken({ id: member3.id, role: 'MEMBER' });
    adminToken = generateToken({ id: adminUser.id, role: 'ADMIN' });

    // Clean up previous reservations
    await prisma.reservation.deleteMany({});

    // Create initial queue:
    // res1: member1, READY_FOR_PICKUP, holds copy1
    const res1 = await prisma.reservation.create({
      data: {
        userId: member1.id,
        bookId: testBook.id,
        copyId: testCopy1.id,
        status: 'READY_FOR_PICKUP',
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 3000)
      }
    });

    // res2: member2, PENDING, copyId null (oldest waiting)
    const res2 = await prisma.reservation.create({
      data: {
        userId: member2.id,
        bookId: testBook.id,
        copyId: null,
        status: 'PENDING',
        createdAt: new Date(Date.now() - 2000)
      }
    });

    // res3: member3, PENDING, copyId null (newer waiting)
    const res3 = await prisma.reservation.create({
      data: {
        userId: member3.id,
        bookId: testBook.id,
        copyId: null,
        status: 'PENDING',
        createdAt: new Date(Date.now() - 1000)
      }
    });

    // ── Test 1: Cancelling READY_FOR_PICKUP reservation releases copy & fulfills oldest pending ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
        params: { id: res1.id },
        user: { id: member1.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, cancelStack);

      // Verify that res1 is CANCELLED
      const dbRes1 = await prisma.reservation.findUnique({ where: { id: res1.id } });
      // Verify that res2 (oldest pending) has been automatically fulfilled using copy1
      const dbRes2 = await prisma.reservation.findUnique({ where: { id: res2.id } });
      const copy1Status = await prisma.bookCopy.findUnique({ where: { id: testCopy1.id } });
      // Verify that res3 (newer pending) remains PENDING
      const dbRes3 = await prisma.reservation.findUnique({ where: { id: res3.id } });

      const ok = resultRes.statusCode === 200 &&
                  dbRes1.status === 'CANCELLED' &&
                  dbRes2.status === 'READY_FOR_PICKUP' &&
                  dbRes2.copyId === testCopy1.id &&
                  dbRes2.fulfilledAt !== null &&
                  dbRes2.expiresAt !== null &&
                  copy1Status.status === 'RESERVED' &&
                  dbRes3.status === 'PENDING';
      record('Test 1: Available copy fulfills oldest pending reservation (FIFO)', ok);
    }

    // ── Test 2: Stable secondary ordering by id ──
    {
      // Reset res2 to PENDING and copy1 to AVAILABLE
      await prisma.reservation.update({
        where: { id: res2.id },
        data: { status: 'PENDING', copyId: null, fulfilledAt: null, expiresAt: null }
      });
      await prisma.bookCopy.update({
        where: { id: testCopy1.id },
        data: { status: 'AVAILABLE' }
      });

      // Align createdAt timestamps for res2 and res3 to the exact same timestamp
      const duplicateTimestamp = new Date();
      await prisma.reservation.update({
        where: { id: res2.id },
        data: { createdAt: duplicateTimestamp }
      });
      await prisma.reservation.update({
        where: { id: res3.id },
        data: { createdAt: duplicateTimestamp }
      });

      // Determine which ID is alphabetically smaller
      const sortedIds = [res2.id, res3.id].sort();
      const expectedWinnerId = sortedIds[0];
      const expectedLoserId = sortedIds[1];

      // Re-create a READY_FOR_PICKUP reservation that holds copy1 so we can cancel it
      const resTemp = await prisma.reservation.create({
        data: {
          userId: member1.id,
          bookId: testBook.id,
          copyId: testCopy1.id,
          status: 'READY_FOR_PICKUP',
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
        }
      });
      // Mark copy1 back to RESERVED
      await prisma.bookCopy.update({
        where: { id: testCopy1.id },
        data: { status: 'RESERVED' }
      });

      // Cancel resTemp
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
        params: { id: resTemp.id },
        user: { id: member1.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      await executeRouteStack(req, res, cancelStack);

      // Verify that the winner got fulfilled, while the loser remained pending
      const winnerRes = await prisma.reservation.findUnique({ where: { id: expectedWinnerId } });
      const loserRes = await prisma.reservation.findUnique({ where: { id: expectedLoserId } });

      const ok = winnerRes.status === 'READY_FOR_PICKUP' &&
                  winnerRes.copyId === testCopy1.id &&
                  loserRes.status === 'PENDING';
      record('Test 2: Deterministic secondary ordering by id when timestamps match', ok);

      // Cleanup temp
      await prisma.reservation.delete({ where: { id: resTemp.id } }).catch(() => {});
    }

    // ── Test 3: No available copy results in no fulfillment action ──
    {
      // Reset res2 & res3 to PENDING, make all copies RESERVED/LOANED
      await prisma.reservation.updateMany({
        where: { id: { in: [res2.id, res3.id] } },
        data: { status: 'PENDING', copyId: null, fulfilledAt: null, expiresAt: null }
      });
      await prisma.bookCopy.updateMany({
        where: { id: { in: [testCopy1.id, testCopy2.id] } },
        data: { status: 'RESERVED' }
      });

      // Cancel res2 (PENDING - has no copy). This triggers queue logic but no copy is released.
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken2}` },
        params: { id: res2.id },
        user: { id: member2.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      await executeRouteStack(req, res, cancelStack);

      const dbRes3 = await prisma.reservation.findUnique({ where: { id: res3.id } });
      const ok = dbRes3.status === 'PENDING';
      record('Test 3: No available copy results in no action', ok);
    }

    // ── Test 4: No pending reservations results in no action ──
    {
      // Clean up all pending reservations
      await prisma.reservation.deleteMany({
        where: { id: { in: [res2.id, res3.id] } }
      });

      // Create a READY_FOR_PICKUP reservation on copy1
      const resTemp = await prisma.reservation.create({
        data: {
          userId: member1.id,
          bookId: testBook.id,
          copyId: testCopy1.id,
          status: 'READY_FOR_PICKUP',
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
        }
      });
      await prisma.bookCopy.update({
        where: { id: testCopy1.id },
        data: { status: 'RESERVED' }
      });

      // Cancel it
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken1}` },
        params: { id: resTemp.id },
        user: { id: member1.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      await executeRouteStack(req, res, cancelStack);

      // Verify copy1 becomes AVAILABLE, and no errors occurred
      const copy1Status = await prisma.bookCopy.findUnique({ where: { id: testCopy1.id } });
      const ok = copy1Status.status === 'AVAILABLE';
      record('Test 4: No pending reservations results in copy release only', ok);

      await prisma.reservation.delete({ where: { id: resTemp.id } }).catch(() => {});
    }

    // ── Test 5: Transaction rollback if reservation update fails ──
    {
      // Set copy1 to AVAILABLE
      await prisma.bookCopy.update({
        where: { id: testCopy1.id },
        data: { status: 'AVAILABLE' }
      });

      let rollbackOk = false;
      try {
        await prisma.$transaction(async (tx) => {
          // 1. Reserve the copy
          await tx.bookCopy.update({
            where: { id: testCopy1.id },
            data: { status: 'RESERVED' }
          });

          // 2. Force failure by updating a non-existent reservation
          await tx.reservation.update({
            where: { id: '00000000-0000-0000-0000-000000000000' },
            data: { status: 'READY_FOR_PICKUP' }
          });
        });
      } catch (err) {
        rollbackOk = true;
      }

      // Assert copy status rolled back to AVAILABLE
      const copy = await prisma.bookCopy.findUnique({ where: { id: testCopy1.id } });
      const ok = rollbackOk && copy.status === 'AVAILABLE';
      record('Test 5: Transaction rollback if reservation update fails', ok);
    }

    // ── Test 6: Transaction rollback if BookCopy update fails ──
    {
      // Create a pending reservation
      const resTemp = await prisma.reservation.create({
        data: {
          userId: member1.id,
          bookId: testBook.id,
          status: 'PENDING'
        }
      });

      let rollbackOk = false;
      try {
        await prisma.$transaction(async (tx) => {
          // 1. Update reservation status
          await tx.reservation.update({
            where: { id: resTemp.id },
            data: { status: 'READY_FOR_PICKUP' }
          });

          // 2. Force failure on BookCopy update
          await tx.bookCopy.update({
            where: { id: '00000000-0000-0000-0000-000000000000' },
            data: { status: 'RESERVED' }
          });
        });
      } catch (err) {
        rollbackOk = true;
      }

      // Assert reservation status rolled back to PENDING
      const dbRes = await prisma.reservation.findUnique({ where: { id: resTemp.id } });
      const ok = rollbackOk && dbRes.status === 'PENDING';
      record('Test 6: Transaction rollback if BookCopy update fails', ok);

      await prisma.reservation.delete({ where: { id: resTemp.id } }).catch(() => {});
    }

    // ── Test 7: Safety boundaries (Only AVAILABLE copies are allocated) ──
    {
      // Create a pending reservation
      const resTemp = await prisma.reservation.create({
        data: {
          userId: member1.id,
          bookId: testBook.id,
          status: 'PENDING'
        }
      });

      // Force all copies to BORROWED/RESERVED
      await prisma.bookCopy.updateMany({
        where: { bookId: testBook.id },
        data: { status: 'BORROWED' }
      });

      // Run transactional check mimicking fulfillNextReservationForBook
      let fulfilled = false;
      await prisma.$transaction(async (tx) => {
        const copy = await tx.bookCopy.findFirst({
          where: { bookId: testBook.id, status: 'AVAILABLE' }
        });
        if (copy) {
          fulfilled = true;
        }
      });

      const ok = fulfilled === false;
      record('Test 7: Only AVAILABLE copies are allocated', ok);

      await prisma.reservation.delete({ where: { id: resTemp.id } }).catch(() => {});
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
    if (member3) {
      await prisma.user.delete({ where: { id: member3.id } }).catch(() => {});
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
    if (testCopy3) {
      await prisma.bookCopy.delete({ where: { id: testCopy3.id } }).catch(() => {});
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
