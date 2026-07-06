import { softDeleteBook, permanentDeleteBook, getBookById } from '../src/services/book.service.js';
import { prisma } from '../src/lib/prisma.js';
import { ApiError } from '../src/utils/index.js';

console.log('Permanent Delete Book Service Testing Suite\n===========================================');

async function runTests() {
  let author, category, testBook, testBookId;

  try {
    // Setup test records
    author = await prisma.author.create({
      data: { fullName: 'Perm Delete Author', biography: 'Bio' }
    });
    category = await prisma.category.create({
      data: { name: 'Perm Delete Category ' + Date.now(), description: 'Description' }
    });

    // Create a test book (initially active)
    const isbnVal = 'TEST-PERM-DEL-' + Date.now();
    testBook = await prisma.book.create({
      data: {
        title: 'Perm Delete Test Book',
        isbn: isbnVal,
        publisher: 'Test Publisher',
        publicationYear: 2026,
        language: 'English',
        authors: { create: [{ authorId: author.id }] },
        categories: { create: [{ categoryId: category.id }] }
      }
    });
    testBookId = testBook.id;

    // 1. Test Case 1: Try to permanently delete an active book (should throw 400)
    try {
      await permanentDeleteBook(testBookId);
      console.log('FAIL: Test Case 1: Permanently deleting an active book did not throw 400.');
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 400 && error.message === 'Book must be soft deleted before permanent deletion.') {
        console.log('PASS: Test Case 1: Attempting to permanently delete active book threw 400 Bad Request.');
      } else {
        console.log('FAIL: Test Case 1', error);
      }
    }

    // 2. Test Case 2: Try to permanently delete a non-existent ID (should throw 404)
    {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      try {
        await permanentDeleteBook(nonExistentId);
        console.log('FAIL: Test Case 2: Permanently deleting non-existent book did not throw 404.');
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 404 && error.message === 'Book not found.') {
          console.log('PASS: Test Case 2: Attempting to permanently delete non-existent book threw 404 Not Found.');
        } else {
          console.log('FAIL: Test Case 2', error);
        }
      }
    }

    // Soft delete the book to make it eligible for permanent delete
    await softDeleteBook(testBookId);
    console.log('Book soft-deleted to set up permanent delete.');

    // 3. Test Case 3: Successful permanent deletion of soft-deleted book
    {
      const result = await permanentDeleteBook(testBookId);
      if (result && result.id === testBookId) {
        console.log('PASS: Test Case 3: Successfully permanently deleted soft-deleted book.');
        // Prevent cleanup block from trying to delete it again
        testBook = null;
      } else {
        console.log('FAIL: Test Case 3', result);
      }
    }

    // 4. Test Case 4: Deleted Book Retrieval Check (should throw 404)
    {
      let getByIdFailed = false;
      try {
        await getBookById(testBookId);
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 404 && error.message === 'Book not found.') {
          getByIdFailed = true;
        }
      }

      // Check database directly to verify physical deletion
      const dbRecord = await prisma.book.findUnique({
        where: { id: testBookId }
      });

      if (getByIdFailed && !dbRecord) {
        console.log('PASS: Test Case 4: Book is physically removed from the database (getBookById throws 404 and record is null).');
      } else {
        console.log('FAIL: Test Case 4', { getByIdFailed, dbRecordExists: !!dbRecord });
      }
    }

  } catch (err) {
    console.error('Unexpected error in testing suite:', err);
  } finally {
    // Cleanup
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
