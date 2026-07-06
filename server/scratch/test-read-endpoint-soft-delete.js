import { softDeleteBook, getBooks, getBookById } from '../src/services/book.service.js';
import { prisma } from '../src/lib/prisma.js';
import { ApiError } from '../src/utils/index.js';

console.log('Public Read Endpoint Integration Testing Suite\n==============================================');

async function runTests() {
  let author, category, testBook;

  try {
    // Setup test records
    author = await prisma.author.create({
      data: { fullName: 'Read SD Author', biography: 'Bio' }
    });
    category = await prisma.category.create({
      data: { name: 'Read SD Category ' + Date.now(), description: 'Description' }
    });

    // 1. Get initial total count of active books
    const initialQuery = await getBooks({ page: 1, limit: 10 });
    const initialCount = initialQuery.pagination.totalItems;
    console.log(`Initial active books count: ${initialCount}`);

    // 2. Create a test book
    const isbnVal = 'TEST-READ-SD-' + Date.now();
    testBook = await prisma.book.create({
      data: {
        title: 'Read SD Book Title',
        isbn: isbnVal,
        publisher: 'Test Publisher',
        publicationYear: 2026,
        language: 'English',
        authors: { create: [{ authorId: author.id }] },
        categories: { create: [{ categoryId: category.id }] }
      }
    });

    // 3. Verify it is visible via getBooks list
    {
      const queryResult = await getBooks({ page: 1, limit: 10 });
      const found = queryResult.books.find(b => b.id === testBook.id);
      const newCount = queryResult.pagination.totalItems;

      if (found && newCount === initialCount + 1) {
        console.log('PASS: Test Case 1: Created book is initially visible in the active books listing.');
      } else {
        console.log('FAIL: Test Case 1', found, newCount);
      }
    }

    // 4. Verify it is visible via getBookById
    {
      const bookDetail = await getBookById(testBook.id);
      if (bookDetail && bookDetail.title === 'Read SD Book Title') {
        console.log('PASS: Test Case 2: getBookById successfully retrieves active book details.');
      } else {
        console.log('FAIL: Test Case 2', bookDetail);
      }
    }

    // 5. Soft delete the book
    await softDeleteBook(testBook.id);
    console.log('Book soft-deleted successfully.');

    // 6. Verify getBookById throws 404 Not Found on soft-deleted book
    {
      try {
        await getBookById(testBook.id);
        console.log('FAIL: Test Case 3: getBookById did not throw 404 on soft-deleted book.');
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 404 && error.message === 'Book not found.') {
          console.log('PASS: Test Case 3: getBookById successfully throws 404 Not Found on soft-deleted book.');
        } else {
          console.log('FAIL: Test Case 3', error);
        }
      }
    }

    // 7. Verify getBooks excludes the soft-deleted book and pagination metadata decrements correctly
    {
      const queryResult = await getBooks({ page: 1, limit: 10 });
      const found = queryResult.books.find(b => b.id === testBook.id);
      const newCount = queryResult.pagination.totalItems;

      if (!found && newCount === initialCount) {
        console.log('PASS: Test Case 4: getBooks excludes soft-deleted books.');
        console.log('PASS: Test Case 5: Pagination metadata totalItems correctly decrements and is consistent.');
      } else {
        console.log('FAIL: Test Case 4/5', found, newCount);
      }
    }

  } catch (err) {
    console.error('Unexpected error in testing suite:', err);
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
