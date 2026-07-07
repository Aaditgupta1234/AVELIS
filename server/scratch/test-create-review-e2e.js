import reviewRouter from '../src/modules/review/review.routes.js';
import { prisma } from '../src/lib/prisma.js';
import { ApiError } from '../src/utils/index.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole, CopyStatus, LoanStatus } from '@prisma/client';

console.log('Create Review API E2E Integration Testing Suite\n==============================================');

const createMockReq = ({ method = 'POST', headers = {}, body = {} } = {}) => ({
  headers,
  body,
  method,
  params: {},
  query: {}
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
  const createRoute = reviewRouter.stack.find(
    layer => layer.route && layer.route.path === '/' && layer.route.methods.post
  );

  if (!createRoute) {
    console.log('FAIL: Create review route layer not found in reviewRouter.');
    return;
  }
  console.log('PASS: Resolved create review route layer.');

  const createStack = createRoute.route.stack.map(layer => layer.handle);

  let author, category, testBook, testCopy, memberUser, memberToken, adminUser, adminToken, anotherMember, anotherMemberToken;
  let loan;

  try {
    // 1. Setup DB records
    author = await prisma.author.create({
      data: { fullName: 'Review Test Author', biography: 'Bio' }
    });
    category = await prisma.category.create({
      data: { name: 'Review Test Category ' + Date.now(), description: 'Desc' }
    });

    testBook = await prisma.book.create({
      data: {
        title: 'Review E2E Book',
        isbn: 'ISBN-REV-' + Date.now(),
        sellingPrice: 15.00,
        stockQuantity: 5,
        isBorrowable: true,
        isForSale: true,
        authors: {
          create: { authorId: author.id }
        },
        categories: {
          create: { categoryId: category.id }
        }
      }
    });

    testCopy = await prisma.bookCopy.create({
      data: {
        bookId: testBook.id,
        barcode: 'BAR-REV-' + Date.now(),
        status: CopyStatus.AVAILABLE
      }
    });

    memberUser = await prisma.user.create({
      data: {
        username: 'reviewmember_' + Date.now(),
        email: 'revmember_' + Date.now() + '@test.com',
        passwordHash: 'dummy',
        role: UserRole.MEMBER
      }
    });
    memberToken = 'Bearer ' + generateToken({ id: memberUser.id, role: memberUser.role });

    anotherMember = await prisma.user.create({
      data: {
        username: 'reviewmember2_' + Date.now(),
        email: 'revmember2_' + Date.now() + '@test.com',
        passwordHash: 'dummy',
        role: UserRole.MEMBER
      }
    });
    anotherMemberToken = 'Bearer ' + generateToken({ id: anotherMember.id, role: anotherMember.role });

    adminUser = await prisma.user.create({
      data: {
        username: 'reviewadmin_' + Date.now(),
        email: 'revadmin_' + Date.now() + '@test.com',
        passwordHash: 'dummy',
        role: UserRole.ADMIN
      }
    });
    adminToken = 'Bearer ' + generateToken({ id: adminUser.id, role: adminUser.role });

    // Create a loan record to establish borrow eligibility for memberUser
    loan = await prisma.loan.create({
      data: {
        userId: memberUser.id,
        copyId: testCopy.id,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
        status: LoanStatus.BORROWED
      }
    });

    console.log('Setup finished. Beginning test cases...\n');

    // ----------------------------------------------------
    // Test Case 1: Validation - Missing all fields
    // ----------------------------------------------------
    try {
      const req = createMockReq({ body: {} });
      const res = createMockRes();
      await executeRouteStack(req, res, createStack);
      record('Test Case 1: Validation - Missing all fields', res.statusCode === 400 && res.body.success === false);
    } catch (e) {
      record('Test Case 1: Validation - Missing all fields (Error: ' + e.message + ')', false);
    }

    // ----------------------------------------------------
    // Test Case 2: Validation - Invalid rating (too high)
    // ----------------------------------------------------
    try {
      const req = createMockReq({
        body: {
          bookId: testBook.id,
          rating: 6,
          comment: 'This is a test comment that exceeds 10 chars.'
        }
      });
      const res = createMockRes();
      await executeRouteStack(req, res, createStack);
      record('Test Case 2: Validation - Invalid rating', res.statusCode === 400 && res.body.success === false && res.body.errors.some(err => err.field === 'rating'));
    } catch (e) {
      record('Test Case 2: Validation - Invalid rating (Error: ' + e.message + ')', false);
    }

    // ----------------------------------------------------
    // Test Case 3: Validation - Comment too short
    // ----------------------------------------------------
    try {
      const req = createMockReq({
        body: {
          bookId: testBook.id,
          rating: 4,
          comment: 'Short'
        }
      });
      const res = createMockRes();
      await executeRouteStack(req, res, createStack);
      record('Test Case 3: Validation - Comment too short', res.statusCode === 400 && res.body.success === false && res.body.errors.some(err => err.field === 'comment'));
    } catch (e) {
      record('Test Case 3: Validation - Comment too short (Error: ' + e.message + ')', false);
    }

    // ----------------------------------------------------
    // Test Case 4: Authentication - Missing auth header
    // ----------------------------------------------------
    try {
      const req = createMockReq({
        headers: {},
        body: {
          bookId: testBook.id,
          rating: 4,
          comment: 'This is a valid test comment.'
        }
      });
      const res = createMockRes();
      await executeRouteStack(req, res, createStack);
      record('Test Case 4: Authentication - Missing header', false); // should have thrown or returned error
    } catch (e) {
      record('Test Case 4: Authentication - Missing header', e instanceof ApiError && e.statusCode === 401);
    }

    // ----------------------------------------------------
    // Test Case 5: Authorization - ADMIN role is blocked
    // ----------------------------------------------------
    try {
      const req = createMockReq({
        headers: { authorization: adminToken },
        body: {
          bookId: testBook.id,
          rating: 4,
          comment: 'This is a valid test comment.'
        }
      });
      const res = createMockRes();
      await executeRouteStack(req, res, createStack);
      record('Test Case 5: Authorization - ADMIN role blocked', false);
    } catch (e) {
      record('Test Case 5: Authorization - ADMIN role blocked', e instanceof ApiError && e.statusCode === 403);
    }

    // ----------------------------------------------------
    // Test Case 6: Business - Nonexistent Book ID
    // ----------------------------------------------------
    try {
      const req = createMockReq({
        headers: { authorization: memberToken },
        body: {
          bookId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
          rating: 4,
          comment: 'This is a valid test comment.'
        }
      });
      const res = createMockRes();
      await executeRouteStack(req, res, createStack);
      record('Test Case 6: Business - Nonexistent Book ID', false);
    } catch (e) {
      record('Test Case 6: Business - Nonexistent Book ID', e instanceof ApiError && e.statusCode === 404);
    }

    // ----------------------------------------------------
    // Test Case 7: Business - No Borrow History
    // ----------------------------------------------------
    try {
      const req = createMockReq({
        headers: { authorization: anotherMemberToken },
        body: {
          bookId: testBook.id,
          rating: 4,
          comment: 'This user has never borrowed the book.'
        }
      });
      const res = createMockRes();
      await executeRouteStack(req, res, createStack);
      record('Test Case 7: Business - No Borrow History', false);
    } catch (e) {
      record('Test Case 7: Business - No Borrow History', e instanceof ApiError && e.statusCode === 400 && e.message.includes('borrow'));
    }

    // ----------------------------------------------------
    // Test Case 8: Business - Successful Creation
    // ----------------------------------------------------
    let createdReviewId;
    try {
      const req = createMockReq({
        headers: { authorization: memberToken },
        body: {
          bookId: testBook.id,
          rating: 5,
          comment: 'This book is absolutely amazing! Highly recommend.'
        }
      });
      const res = createMockRes();
      await executeRouteStack(req, res, createStack);
      const passes = res.statusCode === 201 && 
                     res.body.success === true && 
                     res.body.data.rating === 5 && 
                     res.body.data.comment === 'This book is absolutely amazing! Highly recommend.' &&
                     res.body.data.user.username === memberUser.username &&
                     res.body.data.book.title === testBook.title &&
                     res.body.data.id !== undefined &&
                     res.body.data.userId === undefined; // check REVIEW_SELECT works and doesn't leak userId
      if (passes) {
        createdReviewId = res.body.data.id;
      }
      record('Test Case 8: Business - Successful Creation', passes);
    } catch (e) {
      record('Test Case 8: Business - Successful Creation (Error: ' + e.message + ')', false);
    }

    // ----------------------------------------------------
    // Test Case 9: Business - Duplicate Review Prevention
    // ----------------------------------------------------
    try {
      const req = createMockReq({
        headers: { authorization: memberToken },
        body: {
          bookId: testBook.id,
          rating: 3,
          comment: 'Trying to write another review for the same book.'
        }
      });
      const res = createMockRes();
      await executeRouteStack(req, res, createStack);
      record('Test Case 9: Business - Duplicate Review Prevention', false);
    } catch (e) {
      record('Test Case 9: Business - Duplicate Review Prevention', e instanceof ApiError && e.statusCode === 409);
    }

  } catch (e) {
    console.error('Fatal testing error:', e);
  } finally {
    // Cleanup DB records
    console.log('\nCleaning up database records...');
    try {
      if (loan) {
        await prisma.loan.deleteMany({ where: { userId: { in: [memberUser.id, anotherMember.id] } } });
      }
      await prisma.review.deleteMany({ where: { bookId: testBook.id } });
      if (testCopy) {
        await prisma.bookCopy.delete({ where: { id: testCopy.id } });
      }
      if (testBook) {
        await prisma.bookAuthor.deleteMany({ where: { bookId: testBook.id } });
        await prisma.bookCategory.deleteMany({ where: { bookId: testBook.id } });
        await prisma.book.delete({ where: { id: testBook.id } });
      }
      if (author) {
        await prisma.author.delete({ where: { id: author.id } });
      }
      if (category) {
        await prisma.category.delete({ where: { id: category.id } });
      }
      if (memberUser) {
        await prisma.user.delete({ where: { id: memberUser.id } });
      }
      if (anotherMember) {
        await prisma.user.delete({ where: { id: anotherMember.id } });
      }
      if (adminUser) {
        await prisma.user.delete({ where: { id: adminUser.id } });
      }
      console.log('Cleanup finished.');
    } catch (e) {
      console.error('Error during cleanup:', e);
    }
  }

  // Print summary
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  console.log(`\n==============================================\nSummary: ${passed} / ${total} tests passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
