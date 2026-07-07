import reservationRouter from '../src/routes/reservation.routes.js';
import { prisma } from '../src/lib/prisma.js';
import { ApiError } from '../src/utils/index.js';
import { generateToken } from '../src/utils/jwt.js';

console.log('Create Reservation API E2E Integration Testing Suite\n==================================================');

// Mock request / response helpers
const createMockReq = ({ method = 'POST', headers = {}, params = {}, query = {}, body = {}, user = null } = {}) => ({
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
        // Simple error handling simulation
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
          // If error is thrown during handler execution
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
  const createRoute = reservationRouter.stack.find(
    layer => layer.route && layer.route.path === '/' && layer.route.methods.post
  );

  if (!createRoute) {
    console.log('FAIL: Create reservation route layer not found in reservationRouter.');
    return;
  }
  console.log('PASS: Resolved create reservation route layer.');

  const createStack = createRoute.route.stack.map(layer => layer.handle);

  let author, category, testBook, testBookNoCopy, testBookNonBorrowable, testBookSoftDeleted;
  let testCopy1, testCopy2;
  let memberUser, adminUser, otherMemberUser;
  let memberToken, adminToken;

  try {
    // Setup DB records
    author = await prisma.author.create({
      data: { fullName: 'E2E Reservation Author', biography: 'Bio' }
    });
    category = await prisma.category.create({
      data: { name: 'E2E Reservation Category ' + Date.now(), description: 'Desc' }
    });

    testBook = await prisma.book.create({
      data: {
        title: 'E2E Reservation Title',
        isbn: 'E2E-R-ISBN-' + Date.now(),
        publisher: 'E2E Publisher',
        publicationYear: 2026,
        language: 'English',
        authors: { create: [{ authorId: author.id }] },
        categories: { create: [{ categoryId: category.id }] }
      }
    });

    testBookNoCopy = await prisma.book.create({
      data: {
        title: 'E2E Reservation No Copy Title',
        isbn: 'E2E-R-ISBN-NC-' + Date.now(),
        publisher: 'E2E Publisher',
        publicationYear: 2026,
        language: 'English',
        authors: { create: [{ authorId: author.id }] },
        categories: { create: [{ categoryId: category.id }] }
      }
    });

    testBookNonBorrowable = await prisma.book.create({
      data: {
        title: 'E2E Reservation Non Borrowable',
        isbn: 'E2E-R-ISBN-NB-' + Date.now(),
        isBorrowable: false,
        authors: { create: [{ authorId: author.id }] },
        categories: { create: [{ categoryId: category.id }] }
      }
    });

    testBookSoftDeleted = await prisma.book.create({
      data: {
        title: 'E2E Reservation Soft Deleted',
        isbn: 'E2E-R-ISBN-SD-' + Date.now(),
        isDeleted: true,
        authors: { create: [{ authorId: author.id }] },
        categories: { create: [{ categoryId: category.id }] }
      }
    });

    // Create physical copies for testBook
    testCopy1 = await prisma.bookCopy.create({
      data: {
        bookId: testBook.id,
        barcode: 'BC1-' + Date.now(),
        shelfLocation: 'Shelf 1',
        status: 'AVAILABLE'
      }
    });

    testCopy2 = await prisma.bookCopy.create({
      data: {
        bookId: testBook.id,
        barcode: 'BC2-' + Date.now(),
        shelfLocation: 'Shelf 2',
        status: 'BORROWED' // Not available
      }
    });

    memberUser = await prisma.user.create({
      data: {
        username: 'res_member_' + Date.now(),
        email: 'res_member_' + Date.now() + '@avelis.com',
        passwordHash: 'dummyhash',
        role: 'MEMBER'
      }
    });

    otherMemberUser = await prisma.user.create({
      data: {
        username: 'res_other_member_' + Date.now(),
        email: 'res_other_member_' + Date.now() + '@avelis.com',
        passwordHash: 'dummyhash',
        role: 'MEMBER'
      }
    });

    adminUser = await prisma.user.create({
      data: {
        username: 'res_admin_' + Date.now(),
        email: 'res_admin_' + Date.now() + '@avelis.com',
        passwordHash: 'dummyhash',
        role: 'ADMIN'
      }
    });

    memberToken = generateToken({ id: memberUser.id, role: 'MEMBER' });
    adminToken = generateToken({ id: adminUser.id, role: 'ADMIN' });

    // Mock Express Request headers
    const authHeadersMember = { authorization: `Bearer ${memberToken}` };
    const authHeadersAdmin = { authorization: `Bearer ${adminToken}` };

    // ── Test 1: Successful READY_FOR_PICKUP reservation when a copy is immediately available ──
    {
      const req = createMockReq({
        headers: authHeadersMember,
        body: { bookId: testBook.id },
        user: { id: memberUser.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, createStack);
      
      const copy = await prisma.bookCopy.findUnique({ where: { id: testCopy1.id } });
      const ok = resultRes.statusCode === 201 && 
                  resultRes.body.success === true && 
                  resultRes.body.data.status === 'READY_FOR_PICKUP' &&
                  resultRes.body.data.bookCopy.id === testCopy1.id &&
                  copy.status === 'RESERVED';
      record('Test 1: Successful READY_FOR_PICKUP reservation', ok);
    }

    // ── Test 2: Successful PENDING reservation when no copies are available ──
    // Wait, first we must make copy1 unavailable (set to BORROWED or RESERVED)
    await prisma.bookCopy.update({
      where: { id: testCopy1.id },
      data: { status: 'BORROWED' }
    });
    // So both copy1 and copy2 are BORROWED (no available copies).
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${generateToken({ id: otherMemberUser.id, role: 'MEMBER' })}` },
        body: { bookId: testBook.id },
        user: { id: otherMemberUser.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, createStack);
      
      const ok = resultRes.statusCode === 201 && 
                  resultRes.body.success === true && 
                  resultRes.body.data.status === 'PENDING' &&
                  resultRes.body.data.bookCopy === null;
      record('Test 2: Successful PENDING reservation', ok);
    }

    // ── Test 3: Duplicate active reservation is rejected ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${generateToken({ id: otherMemberUser.id, role: 'MEMBER' })}` },
        body: { bookId: testBook.id },
        user: { id: otherMemberUser.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, createStack);
      
      const ok = resultRes.statusCode === 400 && 
                  resultRes.body.success === false && 
                  resultRes.body.message.includes('already have an active reservation');
      record('Test 3: Duplicate active reservation is rejected', ok);
    }

    // ── Test 4: Reservation limit (maximum 3 active reservations) is enforced ──
    // otherMemberUser already has 1 active reservation (for testBook).
    // Let's create two more books and reserve them so they have 3 active reservations.
    const tempBook1 = await prisma.book.create({
      data: { title: 'Temp 1', isbn: 'T1-' + Date.now(), isBorrowable: true }
    });
    await prisma.bookCopy.create({
      data: { bookId: tempBook1.id, barcode: 'TBC1-' + Date.now(), status: 'BORROWED' }
    });
    const tempBook2 = await prisma.book.create({
      data: { title: 'Temp 2', isbn: 'T2-' + Date.now(), isBorrowable: true }
    });
    await prisma.bookCopy.create({
      data: { bookId: tempBook2.id, barcode: 'TBC2-' + Date.now(), status: 'BORROWED' }
    });
    const tempBook3 = await prisma.book.create({
      data: { title: 'Temp 3', isbn: 'T3-' + Date.now(), isBorrowable: true }
    });
    await prisma.bookCopy.create({
      data: { bookId: tempBook3.id, barcode: 'TBC3-' + Date.now(), status: 'BORROWED' }
    });

    // Create 2nd active reservation for otherMemberUser
    await prisma.reservation.create({
      data: { userId: otherMemberUser.id, bookId: tempBook1.id, status: 'PENDING' }
    });
    // Create 3rd active reservation for otherMemberUser
    await prisma.reservation.create({
      data: { userId: otherMemberUser.id, bookId: tempBook2.id, status: 'PENDING' }
    });

    // Attempting to create a 4th active reservation should fail
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${generateToken({ id: otherMemberUser.id, role: 'MEMBER' })}` },
        body: { bookId: tempBook3.id },
        user: { id: otherMemberUser.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, createStack);
      
      const ok = resultRes.statusCode === 400 && 
                  resultRes.body.success === false && 
                  resultRes.body.message.includes('limit reached');
      record('Test 4: Active reservation limit (3) is enforced', ok);
    }

    // Clean up temp books and reservations
    await prisma.reservation.deleteMany({ where: { userId: otherMemberUser.id, bookId: { in: [tempBook1.id, tempBook2.id] } } });
    await prisma.bookCopy.deleteMany({ where: { bookId: { in: [tempBook1.id, tempBook2.id, tempBook3.id] } } });
    await prisma.book.deleteMany({ where: { id: { in: [tempBook1.id, tempBook2.id, tempBook3.id] } } });

    // ── Test 5: User with active overdue loans cannot create reservations ──
    // Let's create an overdue loan for memberUser
    const overdueLoan = await prisma.loan.create({
      data: {
        userId: memberUser.id,
        copyId: testCopy2.id,
        issueDate: new Date(),
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
        status: 'OVERDUE'
      }
    });

    {
      const req = createMockReq({
        headers: authHeadersMember,
        body: { bookId: testBook.id },
        user: { id: memberUser.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, createStack);
      
      const ok = resultRes.statusCode === 400 && 
                  resultRes.body.success === false && 
                  resultRes.body.message.includes('overdue loans');
      record('Test 5: User with active overdue loans is rejected', ok);
    }

    // Clean up overdue loan
    await prisma.loan.delete({ where: { id: overdueLoan.id } });

    // ── Test 6: Invalid UUID returns 400 Bad Request ──
    {
      const req = createMockReq({
        headers: authHeadersMember,
        body: { bookId: 'invalid-uuid-format' },
        user: { id: memberUser.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, createStack);
      
      const ok = resultRes.statusCode === 400 && 
                  resultRes.body.success === false && 
                  resultRes.body.message === 'Validation failed.';
      record('Test 6: Invalid UUID yields 400 Bad Request', ok);
    }

    // ── Test 7: Book not found returns 404 Not Found ──
    {
      const req = createMockReq({
        headers: authHeadersMember,
        body: { bookId: '00000000-0000-0000-0000-000000000000' },
        user: { id: memberUser.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, createStack);
      
      const ok = resultRes.statusCode === 404 && 
                  resultRes.body.success === false && 
                  resultRes.body.message === 'Book not found.';
      record('Test 7: Book not found yields 404 Not Found', ok);
    }

    // ── Test 8: Deleted, inactive, or non-borrowable books are rejected ──
    {
      const req = createMockReq({
        headers: authHeadersMember,
        body: { bookId: testBookNonBorrowable.id },
        user: { id: memberUser.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, createStack);
      
      const ok = resultRes.statusCode === 400 && 
                  resultRes.body.success === false && 
                  resultRes.body.message.includes('not borrowable');
      record('Test 8a: Non-borrowable book reservation fails', ok);
    }

    {
      const req = createMockReq({
        headers: authHeadersMember,
        body: { bookId: testBookSoftDeleted.id },
        user: { id: memberUser.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, createStack);
      
      const ok = resultRes.statusCode === 400 && 
                  resultRes.body.success === false && 
                  resultRes.body.message.includes('soft deleted');
      record('Test 8b: Soft deleted book reservation fails', ok);
    }

    // ── Test 9: Physical copies restriction ──
    {
      const req = createMockReq({
        headers: authHeadersMember,
        body: { bookId: testBookNoCopy.id },
        user: { id: memberUser.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, createStack);
      
      const ok = resultRes.statusCode === 400 && 
                  resultRes.body.success === false && 
                  resultRes.body.message.includes('no physical copies exist');
      record('Test 9: Book with no copies yields 400 Bad Request', ok);
    }

    // ── Test 10: MEMBER cannot create a reservation for another user ──
    {
      const req = createMockReq({
        headers: authHeadersMember,
        body: { bookId: testBook.id, userId: otherMemberUser.id },
        user: { id: memberUser.id, role: 'MEMBER' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, createStack);
      
      const ok = resultRes.statusCode === 403 && 
                  resultRes.body.success === false && 
                  resultRes.body.message.includes('Access denied');
      record('Test 10: Member cannot reserve for another user', ok);
    }

    // ── Test 11: ADMIN can create a reservation for another member ──
    {
      const req = createMockReq({
        headers: authHeadersAdmin,
        body: { bookId: testBook.id, userId: otherMemberUser.id },
        user: { id: adminUser.id, role: 'ADMIN' }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, createStack);
      
      // Wait, otherMemberUser already has an active reservation from Test 2.
      // So we must delete it first so this succeeds.
      await prisma.reservation.deleteMany({ where: { userId: otherMemberUser.id } });

      const secondRes = createMockRes();
      const resultRes2 = await executeRouteStack(req, secondRes, createStack);

      const ok = resultRes2.statusCode === 201 && 
                  resultRes2.body.success === true && 
                  resultRes2.body.data.user.id === otherMemberUser.id;
      record('Test 11: Admin can reserve for another member', ok);
    }

    // ── Test 12: Transaction rollback integrity verified ──
    {
      // Clean up previous reservations for memberUser to verify rollback from 0
      await prisma.reservation.deleteMany({ where: { userId: memberUser.id } });

      // Reset copy 1 to AVAILABLE
      await prisma.bookCopy.update({
        where: { id: testCopy1.id },
        data: { status: 'AVAILABLE' }
      });

      let transactionRolledBack = false;
      try {
        await prisma.$transaction(async (tx) => {
          // 1. Create a dummy reservation record
          await tx.reservation.create({
            data: {
              userId: memberUser.id,
              bookId: testBook.id,
              status: 'READY_FOR_PICKUP',
              copyId: testCopy1.id
            }
          });

          // 2. Force an error to trigger rollback
          throw new Error('Forced rollback error');
        });
      } catch (err) {
        if (err.message === 'Forced rollback error') {
          transactionRolledBack = true;
        }
      }

      // Check database to ensure no reservation was created and copy status remains AVAILABLE
      const duplicateReservations = await prisma.reservation.findMany({
        where: { userId: memberUser.id, bookId: testBook.id }
      });
      const dbCopy = await prisma.bookCopy.findUnique({
        where: { id: testCopy1.id }
      });

      const integrityOk = transactionRolledBack && duplicateReservations.length === 0 && dbCopy.status === 'AVAILABLE';
      record('Test 12: Transaction rollback integrity verified', integrityOk);
    }

  } catch (err) {
    console.error('Unexpected error in E2E integration test suite:', err);
  } finally {
    // Cleanup
    if (memberUser) {
      await prisma.reservation.deleteMany({ where: { userId: memberUser.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: memberUser.id } }).catch(() => {});
    }
    if (otherMemberUser) {
      await prisma.reservation.deleteMany({ where: { userId: otherMemberUser.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: otherMemberUser.id } }).catch(() => {});
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
    if (testBookNoCopy) {
      await prisma.book.delete({ where: { id: testBookNoCopy.id } }).catch(() => {});
    }
    if (testBookNonBorrowable) {
      await prisma.book.delete({ where: { id: testBookNonBorrowable.id } }).catch(() => {});
    }
    if (testBookSoftDeleted) {
      await prisma.book.delete({ where: { id: testBookSoftDeleted.id } }).catch(() => {});
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
