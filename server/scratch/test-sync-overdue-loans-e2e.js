import loanRouter from '../src/routes/loan.routes.js';
import { prisma } from '../src/lib/prisma.js';
import { ApiError } from '../src/utils/index.js';
import { generateToken } from '../src/utils/jwt.js';

console.log('Overdue Loan Detection & Status Management E2E Integration Testing Suite\n======================================================================');

// Mock request / response helpers
const createMockReq = ({ method = 'POST', headers = {}, params = {}, query = {}, body = {} } = {}) => ({
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

const results = [];
const record = (name, passed) => {
  results.push({ name, passed });
  console.log(`${passed ? 'PASS' : 'FAIL'}: ${name}`);
};

async function runTests() {
  const syncRoute = loanRouter.stack.find(
    layer => layer.route && layer.route.path === '/overdue/sync' && layer.route.methods.post
  );

  if (!syncRoute) {
    console.log('FAIL: POST /overdue/sync route layer not found in loanRouter.');
    return;
  }
  console.log('PASS: Resolved POST /overdue/sync route layer.');

  const syncStack = syncRoute.route.stack.map(layer => layer.handle);

  let author, category, testBook, memberUser, adminUser;
  let copy1, copy2, copy3, copy4, copy5, copy6;
  let loanPastBorrowed1, loanPastBorrowed2, loanFutureBorrowed, loanPastReturned, loanPastAlreadyOverdue;
  let adminToken, memberToken;

  try {
    // Setup DB records
    author = await prisma.author.create({
      data: { fullName: 'E2E Sync Overdue Author', biography: 'Bio' }
    });
    category = await prisma.category.create({
      data: { name: 'E2E Sync Overdue Category ' + Date.now(), description: 'Desc' }
    });

    testBook = await prisma.book.create({
      data: {
        title: 'E2E Sync Overdue Book',
        isbn: 'E2E-SO-ISBN-' + Date.now(),
        publisher: 'E2E Publisher',
        publicationYear: 2026,
        language: 'English',
        authors: { create: [{ authorId: author.id }] },
        categories: { create: [{ categoryId: category.id }] }
      }
    });

    // Create 5 copies
    const makeCopy = async (barcode) => {
      return await prisma.bookCopy.create({
        data: {
          bookId: testBook.id,
          barcode,
          shelfLocation: 'Shelf 1',
          status: 'BORROWED'
        }
      });
    };

    copy1 = await makeCopy('BC-SO-1-' + Date.now());
    copy2 = await makeCopy('BC-SO-2-' + Date.now());
    copy3 = await makeCopy('BC-SO-3-' + Date.now());
    copy4 = await makeCopy('BC-SO-4-' + Date.now());
    copy5 = await makeCopy('BC-SO-5-' + Date.now());

    memberUser = await prisma.user.create({
      data: {
        username: 'so_member_' + Date.now(),
        email: 'so_member_' + Date.now() + '@avelis.com',
        passwordHash: 'dummyhash',
        role: 'MEMBER'
      }
    });

    adminUser = await prisma.user.create({
      data: {
        username: 'so_admin_' + Date.now(),
        email: 'so_admin_' + Date.now() + '@avelis.com',
        passwordHash: 'dummyhash',
        role: 'ADMIN'
      }
    });

    adminToken = generateToken({ id: adminUser.id, role: 'ADMIN' });
    memberToken = generateToken({ id: memberUser.id, role: 'MEMBER' });

    // 1. Past due BORROWED loan (eligible for OVERDUE status)
    loanPastBorrowed1 = await prisma.loan.create({
      data: {
        userId: memberUser.id,
        copyId: copy1.id,
        issueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // due 6 days ago
        status: 'BORROWED'
      }
    });

    // 2. Another past due BORROWED loan
    loanPastBorrowed2 = await prisma.loan.create({
      data: {
        userId: memberUser.id,
        copyId: copy2.id,
        issueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // due 1 day ago
        status: 'BORROWED'
      }
    });

    // 3. Future due BORROWED loan (NOT eligible)
    loanFutureBorrowed = await prisma.loan.create({
      data: {
        userId: memberUser.id,
        copyId: copy3.id,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // due in 10 days
        status: 'BORROWED'
      }
    });

    // 4. Past due RETURNED loan (NOT eligible)
    loanPastReturned = await prisma.loan.create({
      data: {
        userId: memberUser.id,
        copyId: copy4.id,
        issueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
        status: 'RETURNED',
        returnDate: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000)
      }
    });

    // 5. Already OVERDUE loan (NOT eligible)
    loanPastAlreadyOverdue = await prisma.loan.create({
      data: {
        userId: memberUser.id,
        copyId: copy5.id,
        issueDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
        status: 'OVERDUE'
      }
    });

    // ── Test 1 & 5: Run Synchronization endpoint & Bulk updates ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, syncStack);

      const dbPastBorrowed1 = await prisma.loan.findUnique({ where: { id: loanPastBorrowed1.id } });
      const dbPastBorrowed2 = await prisma.loan.findUnique({ where: { id: loanPastBorrowed2.id } });

      const ok = resultRes.statusCode === 200 &&
        resultRes.body.success === true &&
        resultRes.body.message === 'Overdue loans synchronized successfully.' &&
        resultRes.body.data.updatedCount === 2 &&
        resultRes.body.data.checkedAt !== undefined &&
        dbPastBorrowed1.status === 'OVERDUE' &&
        dbPastBorrowed2.status === 'OVERDUE';

      record('Test 1 & 5: Pass due loans transition from BORROWED to OVERDUE in bulk', ok);
    }

    // ── Test 2: Future due loan remains BORROWED ──
    {
      const dbFuture = await prisma.loan.findUnique({ where: { id: loanFutureBorrowed.id } });
      const ok = dbFuture.status === 'BORROWED';
      record('Test 2: Future due loan remains BORROWED', ok);
    }

    // ── Test 3: Returned loan remains RETURNED ──
    {
      const dbReturned = await prisma.loan.findUnique({ where: { id: loanPastReturned.id } });
      const ok = dbReturned.status === 'RETURNED';
      record('Test 3: Returned loan remains RETURNED', ok);
    }

    // ── Test 4: Already overdue loan remains OVERDUE ──
    {
      const dbOverdue = await prisma.loan.findUnique({ where: { id: loanPastAlreadyOverdue.id } });
      const ok = dbOverdue.status === 'OVERDUE';
      record('Test 4: Already overdue loan remains OVERDUE', ok);
    }

    // ── Test 6: Idempotency (run again) ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, syncStack);

      const ok = resultRes.statusCode === 200 &&
        resultRes.body.success === true &&
        resultRes.body.data.updatedCount === 0;

      record('Test 6: Idempotency check returns 0 updates', ok);
    }

    // ── Test 7: Member receives 403 Forbidden ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${memberToken}` }
      });
      const res = createMockRes();
      try {
        await executeRouteStack(req, res, syncStack);
        record('Test 7: Member receives 403 Forbidden', false);
      } catch (error) {
        const ok = error.statusCode === 403 && error.message === 'Access denied. Administrator privileges required.';
        record('Test 7: Member receives 403 Forbidden', ok);
      }
    }

    // ── Test 8: Response validation matches standard AVELIS response contract ──
    {
      const req = createMockReq({
        headers: { authorization: `Bearer ${adminToken}` }
      });
      const res = createMockRes();
      const resultRes = await executeRouteStack(req, res, syncStack);

      const ok = resultRes.statusCode === 200 &&
        typeof resultRes.body.success === 'boolean' &&
        typeof resultRes.body.message === 'string' &&
        typeof resultRes.body.data === 'object' &&
        typeof resultRes.body.data.updatedCount === 'number' &&
        !isNaN(Date.parse(resultRes.body.data.checkedAt));

      record('Test 8: Response validation structure matches contract', ok);
    }

  } catch (err) {
    console.error('Unexpected error in E2E integration test suite:', err);
  } finally {
    // Cleanup
    if (loanPastBorrowed1) {
      await prisma.loan.delete({ where: { id: loanPastBorrowed1.id } }).catch(() => {});
    }
    if (loanPastBorrowed2) {
      await prisma.loan.delete({ where: { id: loanPastBorrowed2.id } }).catch(() => {});
    }
    if (loanFutureBorrowed) {
      await prisma.loan.delete({ where: { id: loanFutureBorrowed.id } }).catch(() => {});
    }
    if (loanPastReturned) {
      await prisma.loan.delete({ where: { id: loanPastReturned.id } }).catch(() => {});
    }
    if (loanPastAlreadyOverdue) {
      await prisma.loan.delete({ where: { id: loanPastAlreadyOverdue.id } }).catch(() => {});
    }
    if (memberUser) {
      await prisma.user.delete({ where: { id: memberUser.id } }).catch(() => {});
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
    if (copy3) {
      await prisma.bookCopy.delete({ where: { id: copy3.id } }).catch(() => {});
    }
    if (copy4) {
      await prisma.bookCopy.delete({ where: { id: copy4.id } }).catch(() => {});
    }
    if (copy5) {
      await prisma.bookCopy.delete({ where: { id: copy5.id } }).catch(() => {});
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
