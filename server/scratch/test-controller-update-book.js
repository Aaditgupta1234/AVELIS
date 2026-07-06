import { updateBook } from '../src/controllers/book.controller.js';
import { prisma } from '../src/lib/prisma.js';
import { ApiError } from '../src/utils/index.js';

console.log('Update Book Controller Testing Suite\n====================================');

// Mock request / response helpers
const createMockReq = ({ params = {}, body = {} } = {}) => ({
  params,
  body
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
      data: { fullName: 'Controller Test Author', biography: 'Bio' }
    });
    category = await prisma.category.create({
      data: { name: 'Controller Test Category ' + Date.now(), description: 'Cat Description' }
    });

    // Create a base book
    const isbnVal = 'TEST-CTRL-ISBN-' + Date.now();
    testBook = await prisma.book.create({
      data: {
        title: 'Original Title',
        isbn: isbnVal,
        publisher: 'Test Publisher',
        publicationYear: 2026,
        language: 'English',
        sellingPrice: 19.99,
        stockQuantity: 10,
        authors: {
          create: [{ authorId: author.id }]
        },
        categories: {
          create: [{ categoryId: category.id }]
        }
      }
    });

    // Test Case 1: Controller successfully updates a book & returns 200 with standard response
    {
      const req = createMockReq({
        params: { id: testBook.id },
        body: { title: 'Updated Title Via Controller' }
      });
      const res = createMockRes();
      const next = createMockNext();

      await updateBook(req, res, next);

      if (
        res.statusCode === 200 &&
        res.body.success === true &&
        res.body.message === 'Book updated successfully.' &&
        res.body.data.title === 'Updated Title Via Controller' &&
        res.body.data.isbn === testBook.isbn
      ) {
        console.log('PASS: Test Case 1: Controller successfully updated book and returned standard 200 response.');
      } else {
        console.log('FAIL: Test Case 1', res.statusCode, res.body, next.error);
      }
    }

    // Test Case 2: Controller handles and forwards errors (like duplicate ISBN)
    {
      // Create another book to generate duplicate ISBN
      const otherBook = await prisma.book.create({
        data: {
          title: 'Other Book',
          isbn: 'TEST-CTRL-OTHER-' + Date.now(),
          publisher: 'Publisher'
        }
      });

      try {
        const req = createMockReq({
          params: { id: testBook.id },
          body: { isbn: otherBook.isbn }
        });
        const res = createMockRes();
        const next = createMockNext();

        await updateBook(req, res, next);

        if (next.error instanceof ApiError && next.error.statusCode === 409 && next.error.message === 'ISBN already exists.') {
          console.log('PASS: Test Case 2: Controller successfully forwarded service conflict error (409).');
        } else {
          console.log('FAIL: Test Case 2', res.statusCode, res.body, next.error);
        }
      } finally {
        await prisma.book.delete({ where: { id: otherBook.id } });
      }
    }

    // Test Case 3: Controller handles and forwards missing book (404)
    {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const req = createMockReq({
        params: { id: nonExistentId },
        body: { title: 'No Book' }
      });
      const res = createMockRes();
      const next = createMockNext();

      await updateBook(req, res, next);

      if (next.error instanceof ApiError && next.error.statusCode === 404 && next.error.message === 'Book not found.') {
        console.log('PASS: Test Case 3: Controller successfully forwarded service 404 error.');
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
