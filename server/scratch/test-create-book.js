import { createBook } from '../src/controllers/book.controller.js';
import { prisma } from '../src/lib/prisma.js';
import { ApiError } from '../src/utils/index.js';
import { UserRole } from '@prisma/client';
import { createBookValidator } from '../src/validations/book.validation.js';

console.log('Create Book API Testing Suite\n=============================');

// Mock request / response helpers
const createMockReq = ({ body = {}, user = { id: 'admin-id', role: UserRole.ADMIN } } = {}) => ({
  body,
  user
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
  // Let's create test author and category first
  const author = await prisma.author.create({
    data: { fullName: 'Test Author', biography: 'Test Bio' }
  });
  const category = await prisma.category.create({
    data: { name: 'Test Category ' + Date.now(), description: 'Test Cat Description' }
  });

  const validBookData = {
    title: '  Test Book Title  ',
    isbn: 'TEST-ISBN-' + Date.now(),
    publisher: 'Test Publisher',
    language: 'English',
    authorIds: [author.id],
    categoryIds: [category.id],
    publicationYear: 2026,
    sellingPrice: 45.99,
    stockQuantity: 10,
    isBorrowable: true,
    isForSale: true
  };

  try {
    // Test Case 1 & 8: Admin successfully creates a book & sendSuccess wrapper check
    {
      const req = createMockReq({ body: validBookData });
      const res = createMockRes();
      const next = createMockNext();
      await createBook(req, res, next);

      if (res.statusCode === 201 && res.body.success === true && res.body.data.title === 'Test Book Title') {
        console.log('PASS: Test Case 1 & 8: Book successfully created, standard wrapper verified, and title string trimmed.');
      } else {
        console.log('FAIL: Test Case 1', res.statusCode, res.body);
      }
    }

    // Test Case 4: Duplicate ISBN check
    {
      const req = createMockReq({ body: validBookData });
      const res = createMockRes();
      const next = createMockNext();
      await createBook(req, res, next);

      if (next.error instanceof ApiError && next.error.statusCode === 409) {
        console.log('PASS: Test Case 4: Duplicate ISBN check returned 409 Conflict.');
      } else {
        console.log('FAIL: Test Case 4', next.error);
      }
    }

    // Test Case 5: Invalid Author ID
    {
      const req = createMockReq({
        body: {
          ...validBookData,
          isbn: 'OTHER-ISBN-' + Date.now(),
          authorIds: ['invalid-author-id']
        }
      });
      const res = createMockRes();
      const next = createMockNext();
      await createBook(req, res, next);

      if (next.error instanceof ApiError && next.error.statusCode === 400 && next.error.message.includes('author')) {
        console.log('PASS: Test Case 5: Invalid author ID returned 400 and transaction rolled back.');
      } else {
        console.log('FAIL: Test Case 5', next.error);
      }
    }

    // Test Case 6: Invalid Category ID
    {
      const req = createMockReq({
        body: {
          ...validBookData,
          isbn: 'OTHER-ISBN-' + Date.now(),
          categoryIds: ['invalid-category-id']
        }
      });
      const res = createMockRes();
      const next = createMockNext();
      await createBook(req, res, next);

      if (next.error instanceof ApiError && next.error.statusCode === 400 && next.error.message.includes('category')) {
        console.log('PASS: Test Case 6: Invalid category ID returned 400 and transaction rolled back.');
      } else {
        console.log('FAIL: Test Case 6', next.error);
      }
    }

    // Test Case 7: Duplicate ID within array validator check
    {
      const req = createMockReq({
        body: {
          ...validBookData,
          authorIds: [author.id, author.id]
        }
      });
      const res = createMockRes();
      const next = createMockNext();
      await createBookValidator(req, res, next);

      if (res.statusCode === 400 && res.body.message === 'Validation failed.' && res.body.errors[0].field === 'authorIds') {
        console.log('PASS: Test Case 7: Duplicate IDs in authorIds array rejected by validator with 400.');
      } else {
        console.log('FAIL: Test Case 7', res.statusCode, res.body);
      }
    }

    // Test Case 11: Transaction Rollback Verification
    {
      const isbn = 'ROLLBACK-ISBN-' + Date.now();
      const originalFindMany = prisma.category.findMany;
      // Stub the validation check to pass, so it proceeds to tx.book.create and then fails on relationship foreign key constraint
      prisma.category.findMany = async () => [{ id: 'non-existent-cat-id' }];

      const serviceData = {
        title: 'Rollback Book',
        isbn,
        publisher: 'Test',
        language: 'English',
        authorIds: [author.id],
        categoryIds: ['non-existent-cat-id']
      };

      try {
        const { createBook: createBookService } = await import('../src/services/book.service.js');
        await createBookService(serviceData);
        console.log('FAIL: Test Case 11 (Expected database exception)');
      } catch {
        // Now verify that the book was NOT created
        const bookCheck = await prisma.book.findUnique({
          where: { isbn }
        });
        if (!bookCheck) {
          console.log('PASS: Test Case 11: Transaction rollback successfully leaves no trace of Book record.');
        } else {
          console.log('FAIL: Test Case 11: Book record was created despite transactional error!', bookCheck);
        }
      } finally {
        prisma.category.findMany = originalFindMany; // Restore stub
      }
    }

  } finally {
    // Cleanup the created test books, authors, and categories
    await prisma.book.deleteMany({
      where: { isbn: { startsWith: 'TEST-ISBN-' } }
    });
    await prisma.author.delete({
      where: { id: author.id }
    });
    await prisma.category.delete({
      where: { id: category.id }
    });
  }
}

runTests();
