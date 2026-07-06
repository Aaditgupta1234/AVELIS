import { updateBook, createBook } from '../src/services/book.service.js';
import { prisma } from '../src/lib/prisma.js';
import { ApiError } from '../src/utils/index.js';

console.log('Update Book Service Testing Suite\n=================================');

async function runTests() {
  let author, category, originalBook, otherBook;
  
  try {
    // Setup test author and category
    author = await prisma.author.create({
      data: { fullName: 'Update Test Author', biography: 'Update Test Bio' }
    });
    category = await prisma.category.create({
      data: { name: 'Update Test Category ' + Date.now(), description: 'Update Test Cat Description' }
    });

    // Create a base book for testing updates
    const isbnVal1 = 'TEST-UPDATE-ISBN-1-' + Date.now();
    originalBook = await prisma.book.create({
      data: {
        title: 'Original Title',
        isbn: isbnVal1,
        publisher: 'Original Publisher',
        publicationYear: 2020,
        language: 'English',
        description: 'Original Description',
        coverImage: 'http://example.com/cover.jpg',
        sellingPrice: 19.99,
        stockQuantity: 5,
        isBorrowable: true,
        isForSale: true,
        authors: {
          create: [{ authorId: author.id }]
        },
        categories: {
          create: [{ categoryId: category.id }]
        }
      },
      include: {
        authors: { select: { author: { select: { id: true, fullName: true } } } },
        categories: { select: { category: { select: { id: true, name: true } } } }
      }
    });

    // Create another book to test ISBN conflicts
    const isbnVal2 = 'TEST-UPDATE-ISBN-2-' + Date.now();
    otherBook = await prisma.book.create({
      data: {
        title: 'Other Book Title',
        isbn: isbnVal2,
        publisher: 'Other Publisher',
        publicationYear: 2021,
        language: 'Spanish',
        sellingPrice: 29.99,
        stockQuantity: 2,
        isBorrowable: false,
        isForSale: false
      }
    });

    // Test Case 1: Successful Partial Update (Only title updated)
    {
      const result = await updateBook(originalBook.id, { title: 'Updated Title' });
      if (result && result.title === 'Updated Title' && result.publisher === 'Original Publisher' && result.isbn === originalBook.isbn) {
        console.log('PASS: Test Case 1: Successful partial update (only title updated, others remain unchanged).');
      } else {
        console.log('FAIL: Test Case 1', result);
      }
    }

    // Test Case 2: Non-existent Book ID returns 404
    {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      try {
        await updateBook(nonExistentId, { title: 'New Title' });
        console.log('FAIL: Test Case 2 (Did not throw error)');
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 404 && error.message === 'Book not found.') {
          console.log('PASS: Test Case 2: Non-existent Book ID returned 404 Book not found.');
        } else {
          console.log('FAIL: Test Case 2', error);
        }
      }
    }

    // Test Case 3: Duplicate ISBN check (update to otherBook's ISBN)
    {
      try {
        await updateBook(originalBook.id, { isbn: otherBook.isbn });
        console.log('FAIL: Test Case 3 (Did not throw error)');
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 409 && error.message === 'ISBN already exists.') {
          console.log('PASS: Test Case 3: Duplicate ISBN conflict lookup returned 409 ISBN already exists.');
        } else {
          console.log('FAIL: Test Case 3', error);
        }
      }
    }

    // Test Case 4: Unchanged ISBN should skip uniqueness lookup
    {
      // We will perform an update passing the same ISBN. It should succeed.
      try {
        const result = await updateBook(originalBook.id, { title: 'Another Title Update', isbn: originalBook.isbn });
        if (result && result.title === 'Another Title Update' && result.isbn === originalBook.isbn) {
          console.log('PASS: Test Case 4: Unchanged ISBN skipped lookup and succeeded.');
        } else {
          console.log('FAIL: Test Case 4', result);
        }
      } catch (error) {
        console.log('FAIL: Test Case 4 with error', error);
      }
    }

    // Test Case 5: Invalid Author ID returns 400
    {
      try {
        await updateBook(originalBook.id, { authorIds: ['00000000-0000-0000-0000-000000000000'] });
        console.log('FAIL: Test Case 5 (Did not throw error)');
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 400 && error.message === 'One or more author IDs are invalid.') {
          console.log('PASS: Test Case 5: Invalid author ID returned 400.');
        } else {
          console.log('FAIL: Test Case 5', error);
        }
      }
    }

    // Test Case 6: Invalid Category ID returns 400
    {
      try {
        await updateBook(originalBook.id, { categoryIds: ['00000000-0000-0000-0000-000000000000'] });
        console.log('FAIL: Test Case 6 (Did not throw error)');
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 400 && error.message === 'One or more category IDs are invalid.') {
          console.log('PASS: Test Case 6: Invalid category ID returned 400.');
        } else {
          console.log('FAIL: Test Case 6', error);
        }
      }
    }

    // Test Case 7: Transaction Rollback on failure
    {
      // Modify title and pass an invalid author ID. The title change should roll back.
      const originalTitleBeforeFailure = (await prisma.book.findUnique({ where: { id: originalBook.id } })).title;
      try {
        await updateBook(originalBook.id, {
          title: 'This Should Roll Back',
          authorIds: ['00000000-0000-0000-0000-000000000000']
        });
        console.log('FAIL: Test Case 7 (Did not throw error)');
      } catch (error) {
        const bookAfterFailure = await prisma.book.findUnique({ where: { id: originalBook.id } });
        if (bookAfterFailure.title === originalTitleBeforeFailure) {
          console.log('PASS: Test Case 7: Transaction rolled back successfully, keeping original title.');
        } else {
          console.log('FAIL: Test Case 7: Title was updated to "' + bookAfterFailure.title + '" despite error!');
        }
      }
    }

  } catch (err) {
    console.error('Unexpected error during test suite setup/run:', err);
  } finally {
    // Cleanup
    if (originalBook) {
      await prisma.book.deleteMany({
        where: { id: { in: [originalBook.id, otherBook ? otherBook.id : ''] } }
      });
    }
    if (author) {
      await prisma.author.delete({
        where: { id: author.id }
      });
    }
    if (category) {
      await prisma.category.delete({
        where: { id: category.id }
      });
    }
    console.log('Cleanup completed. Test suite finished.');
  }
}

runTests();
