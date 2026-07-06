import { softDeleteBook } from '../src/controllers/book.controller.js';
import { prisma } from '../src/lib/prisma.js';
import { ApiError } from '../src/utils/index.js';

console.log('Soft Delete Book Controller Testing Suite\n=========================================');

// Mock request / response helpers
const createMockReq = ({ params = {} } = {}) => ({
  params,
  body: {}
});

const createMockRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(payload) {
      this.body = payload;
      return this;
    }
  };
  return res;
};

const createMockNext = () => {
  const nextFn = (err) => {
    nextFn.error = err;
  };
  nextFn.error = null;
  return nextFn;
};

async function runTests() {
  let author, category, testBook;

  try {
    // Setup test author and category
    author = await prisma.author.create({
      data: { fullName: 'Controller SD Author', biography: 'Bio' }
    });
    category = await prisma.category.create({
      data: { name: 'Controller SD Category ' + Date.now(), description: 'Description' }
    });

    // Create a base book
    const isbnVal = 'TEST-CTRL-SD-' + Date.now();
    testBook = await prisma.book.create({
      data: {
        title: 'Original Title',
        isbn: isbnVal,
        publisher: 'Test Publisher',
        publicationYear: 2026,
        language: 'English',
        authors: { create: [{ authorId: author.id }] },
        categories: { create: [{ categoryId: category.id }] }
      }
    });

    // Test Case 1: Successful soft delete returns 200 OK and standardized JSON response
    {
      const req = createMockReq({ params: { id: testBook.id } });
      const res = createMockRes();
      const next = createMockNext();

      await softDeleteBook(req, res, next);

      if (
        res.statusCode === 200 &&
        res.body.success === true &&
        res.body.message === 'Book deleted successfully.' &&
        res.body.data.id === testBook.id &&
        res.body.data.isDeleted === true
      ) {
        console.log('PASS: Test Case 1: Controller successfully soft-deleted book and returned standard 200 response.');
      } else {
        console.log('FAIL: Test Case 1', res.statusCode, res.body, next.error);
      }
    }

    // Test Case 2: Service-layer 404 error forwarded unchanged via next(error)
    {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const req = createMockReq({ params: { id: nonExistentId } });
      const res = createMockRes();
      const next = createMockNext();

      await softDeleteBook(req, res, next);

      if (
        next.error instanceof ApiError &&
        next.error.statusCode === 404 &&
        next.error.message === 'Book not found.'
      ) {
        console.log('PASS: Test Case 2: Controller successfully forwarded service 404 error unchanged.');
      } else {
        console.log('FAIL: Test Case 2', res.statusCode, res.body, next.error);
      }
    }

    // Test Case 3: Service-layer already-deleted 400 error forwarded unchanged via next(error)
    {
      const req = createMockReq({ params: { id: testBook.id } });
      const res = createMockRes();
      const next = createMockNext();

      await softDeleteBook(req, res, next);

      if (
        next.error instanceof ApiError &&
        next.error.statusCode === 400 &&
        next.error.message === 'Book has already been deleted.'
      ) {
        console.log('PASS: Test Case 3: Controller successfully forwarded service 400 error (already deleted) unchanged.');
      } else {
        console.log('FAIL: Test Case 3', res.statusCode, res.body, next.error);
      }
    }

  } catch (err) {
    console.error('Unexpected error during controller tests:', err);
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
