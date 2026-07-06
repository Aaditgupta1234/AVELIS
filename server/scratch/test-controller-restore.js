import { restoreBookController } from '../src/controllers/book.controller.js';
import { softDeleteBook } from '../src/services/book.service.js';
import { prisma } from '../src/lib/prisma.js';
import { ApiError } from '../src/utils/index.js';

console.log('Restore Book Controller Testing Suite\n=====================================');

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
      data: { fullName: 'Controller Restore Author', biography: 'Bio' }
    });
    category = await prisma.category.create({
      data: { name: 'Controller Restore Category ' + Date.now(), description: 'Description' }
    });

    // Create a base book
    const isbnVal = 'TEST-CTRL-RESTORE-' + Date.now();
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

    // Soft delete to make it eligible for restore
    await softDeleteBook(testBook.id);

    // Test Case 1: Successful restore returns 200 OK and standardized JSON response
    {
      const req = createMockReq({ params: { id: testBook.id } });
      const res = createMockRes();
      const next = createMockNext();

      await restoreBookController(req, res, next);

      if (
        res.statusCode === 200 &&
        res.body.success === true &&
        res.body.message === 'Book restored successfully.' &&
        res.body.data.id === testBook.id &&
        res.body.data.isDeleted === false
      ) {
        console.log('PASS: Test Case 1: Controller successfully restored book and returned standard 200 response.');
      } else {
        console.log('FAIL: Test Case 1', res.statusCode, res.body, next.error);
      }
    }

    // Test Case 2: Service-layer 400 error (already active) forwarded unchanged via next(error)
    {
      const req = createMockReq({ params: { id: testBook.id } });
      const res = createMockRes();
      const next = createMockNext();

      await restoreBookController(req, res, next);

      if (
        next.error instanceof ApiError &&
        next.error.statusCode === 400 &&
        next.error.message === 'Book is not deleted.'
      ) {
        console.log('PASS: Test Case 2: Controller successfully forwarded service 400 error (already active) unchanged.');
      } else {
        console.log('FAIL: Test Case 2', res.statusCode, res.body, next.error);
      }
    }

    // Test Case 3: Service-layer 404 error forwarded unchanged via next(error)
    {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const req = createMockReq({ params: { id: nonExistentId } });
      const res = createMockRes();
      const next = createMockNext();

      await restoreBookController(req, res, next);

      if (
        next.error instanceof ApiError &&
        next.error.statusCode === 404 &&
        next.error.message === 'Book not found.'
      ) {
        console.log('PASS: Test Case 3: Controller successfully forwarded service 404 error unchanged.');
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
