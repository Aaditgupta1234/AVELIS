import { softDeleteBook, restoreBook, getBooks, getBookById } from '../src/services/book.service.js';
import { prisma } from '../src/lib/prisma.js';
import { ApiError } from '../src/utils/index.js';

console.log('Restore Book Service Testing Suite\n==================================');

async function runTests() {
  let author, category, testBook;

  try {
    // Setup test records
    author = await prisma.author.create({
      data: { fullName: 'Restore Service Author', biography: 'Bio' }
    });
    category = await prisma.category.create({
      data: { name: 'Restore Service Category ' + Date.now(), description: 'Description' }
    });

    // 1. Get initial total count of active books
    const initialQuery = await getBooks({ page: 1, limit: 10 });
    const baseActiveCount = initialQuery.pagination.totalItems;
    console.log(`Initial active books count in database: ${baseActiveCount}`);

    // 2. Create a test book
    const isbnVal = 'TEST-RESTORE-SRV-' + Date.now();
    testBook = await prisma.book.create({
      data: {
        title: 'Restore Test Title',
        isbn: isbnVal,
        publisher: 'Test Publisher',
        publicationYear: 2026,
        language: 'English',
        authors: { create: [{ authorId: author.id }] },
        categories: { create: [{ categoryId: category.id }] }
      }
    });

    // Verify it increases active count by 1
    const activeList = await getBooks({ page: 1, limit: 10 });
    if (activeList.pagination.totalItems !== baseActiveCount + 1) {
      console.log('Setup warning: active books listing count is off');
    }

    // 3. Soft delete the book so it becomes eligible for restore
    await softDeleteBook(testBook.id);
    console.log('Book soft-deleted to set up restore tests.');

    // 4. Test Case 1: Attempt to restore an active book (should fail since it is already active now, wait - it was soft deleted, so it's deleted. Let's create another book for testing active restore).
    const activeBookForCheck = await prisma.book.create({
      data: {
        title: 'Active Book for Check',
        isbn: isbnVal + '-active',
        publisher: 'Test Publisher',
        publicationYear: 2026,
        language: 'English'
      }
    });

    try {
      await restoreBook(activeBookForCheck.id);
      console.log('FAIL: Test Case 1: Restoring an active book did not throw 400.');
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 400 && error.message === 'Book is not deleted.') {
        console.log('PASS: Test Case 1: Attempting to restore an active book threw standard 400 Book is not deleted.');
      } else {
        console.log('FAIL: Test Case 1', error);
      }
    } finally {
      await prisma.book.delete({ where: { id: activeBookForCheck.id } });
    }

    // 5. Test Case 2: Attempt to restore a non-existent Book ID (should return 404)
    {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      try {
        await restoreBook(nonExistentId);
        console.log('FAIL: Test Case 2: Restoring non-existent book did not throw 404.');
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 404 && error.message === 'Book not found.') {
          console.log('PASS: Test Case 2: Attempting to restore non-existent book ID threw standard 404 Book not found.');
        } else {
          console.log('FAIL: Test Case 2', error);
        }
      }
    }

    // 6. Test Case 3: Successful restore sets fields correctly and returns relation payload
    let restoredBook;
    {
      restoredBook = await restoreBook(testBook.id);
      if (
        restoredBook &&
        restoredBook.isDeleted === false &&
        restoredBook.deletedAt === null
      ) {
        console.log('PASS: Test Case 3: Successful restore sets isDeleted = false and deletedAt = null.');
      } else {
        console.log('FAIL: Test Case 3', restoredBook);
      }
    }

    // 7. Test Case 4: Verify relationships remain attached and loaded
    {
      if (
        restoredBook.authors &&
        restoredBook.authors.length === 1 &&
        restoredBook.authors[0].author.fullName === 'Restore Service Author' &&
        restoredBook.categories &&
        restoredBook.categories.length === 1 &&
        restoredBook.categories[0].category.name.startsWith('Restore Service Category')
      ) {
        console.log('PASS: Test Case 4: Related authors and categories are returned and remain attached.');
      } else {
        console.log('FAIL: Test Case 4', restoredBook);
      }
    }

    // 8. Test Case 5: Public read detail visibility check (getBookById should succeed)
    {
      const retrieved = await getBookById(testBook.id);
      if (retrieved && retrieved.id === testBook.id && retrieved.isDeleted === false) {
        console.log('PASS: Test Case 5: getBookById successfully retrieves the restored book.');
      } else {
        console.log('FAIL: Test Case 5', retrieved);
      }
    }

    // 9. Test Case 6: Public read list visibility & pagination count check (getBooks listing)
    {
      const queryResult = await getBooks({ page: 1, limit: 10 });
      const found = queryResult.books.find(b => b.id === testBook.id);
      const activeCount = queryResult.pagination.totalItems;

      if (found && activeCount === baseActiveCount + 1) {
        console.log('PASS: Test Case 6: getBooks list includes the restored book, and pagination counts increment correctly.');
      } else {
        console.log('FAIL: Test Case 6', found, activeCount);
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
