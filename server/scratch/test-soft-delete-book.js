import { softDeleteBook } from '../src/services/book.service.js';
import { getBooks } from '../src/services/book.service.js';
import { prisma } from '../src/lib/prisma.js';
import { ApiError } from '../src/utils/index.js';

console.log('Soft Delete Book Service Testing Suite\n======================================');

async function runTests() {
  let author, category, testBook;

  try {
    // Setup test author and category
    author = await prisma.author.create({
      data: { fullName: 'Soft Delete Author', biography: 'Bio' }
    });
    category = await prisma.category.create({
      data: { name: 'Soft Delete Category ' + Date.now(), description: 'Cat Description' }
    });

    // Create a base book
    const isbnVal = 'TEST-SD-ISBN-' + Date.now();
    testBook = await prisma.book.create({
      data: {
        title: 'Soft Delete Book Title',
        isbn: isbnVal,
        publisher: 'Publisher',
        publicationYear: 2026,
        language: 'English',
        authors: {
          create: [{ authorId: author.id }]
        },
        categories: {
          create: [{ categoryId: category.id }]
        }
      }
    });

    // Test Case 1: Successful soft delete
    let deletedBook;
    {
      deletedBook = await softDeleteBook(testBook.id);
      if (
        deletedBook &&
        deletedBook.isDeleted === true &&
        deletedBook.deletedAt instanceof Date
      ) {
        console.log('PASS: Test Case 1: Successful soft delete sets isDeleted = true and deletedAt to a valid timestamp.');
      } else {
        console.log('FAIL: Test Case 1', deletedBook);
      }
    }

    // Test Case 2: Database record still exists after soft delete
    {
      const record = await prisma.book.findUnique({
        where: { id: testBook.id }
      });
      if (record && record.isDeleted === true) {
        console.log('PASS: Test Case 2: Book record still exists in the database after soft delete.');
      } else {
        console.log('FAIL: Test Case 2', record);
      }
    }

    // Test Case 3: Related authors and categories remain attached
    {
      if (
        deletedBook.authors &&
        deletedBook.authors.length === 1 &&
        deletedBook.authors[0].author.fullName === 'Soft Delete Author' &&
        deletedBook.categories &&
        deletedBook.categories.length === 1 &&
        deletedBook.categories[0].category.name.startsWith('Soft Delete Category')
      ) {
        console.log('PASS: Test Case 3: Related authors and categories are returned and remain attached.');
      } else {
        console.log('FAIL: Test Case 3', deletedBook);
      }
    }

    // Test Case 4: Non-existent ID returns 404 Not Found
    {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      try {
        await softDeleteBook(nonExistentId);
        console.log('FAIL: Test Case 4 (Did not throw 404)');
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 404 && error.message === 'Book not found.') {
          console.log('PASS: Test Case 4: Non-existent ID threw standard 404 Book not found.');
        } else {
          console.log('FAIL: Test Case 4', error);
        }
      }
    }

    // Test Case 5: Already deleted book throws 400 Bad Request
    {
      try {
        await softDeleteBook(testBook.id);
        console.log('FAIL: Test Case 5 (Did not throw 400)');
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 400 && error.message === 'Book has already been deleted.') {
          console.log('PASS: Test Case 5: Duplicate soft delete attempt threw standard 400 Book has already been deleted.');
        } else {
          console.log('FAIL: Test Case 5', error);
        }
      }
    }

    // Test Case 6: Post-implementation Sanity Check on read endpoints
    {
      console.log('\n--- Post-Implementation Sanity Check ---');
      
      // Let's call getBooks query to see if it currently includes or hides soft deleted books.
      const queryResult = await getBooks({ page: 1, limit: 10 });
      const foundDeletedBook = queryResult.books.find(b => b.id === testBook.id);
      
      if (foundDeletedBook) {
        console.log('OBSERVATION: GET /api/books (getBooks service) CURRENTLY INCLUDES soft-deleted books because it has not been modified to filter them yet.');
      } else {
        console.log('OBSERVATION: GET /api/books (getBooks service) HIDES soft-deleted books.');
      }
    }

  } catch (err) {
    console.error('Unexpected error in test suite:', err);
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
