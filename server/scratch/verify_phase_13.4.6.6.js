/**
 * Verification script for Phase 13.4.6.6 - Inventory Report Response Formatting.
 * Run with: node scratch/verify_phase_13.4.6.6.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole, CopyStatus, CopyCondition } from '@prisma/client';

const PORT = 5580;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.4.6.6 Inventory Report Response Formatting Verification...\n');
  let passedCount = 0;
  let totalCount = 0;

  const assert = (condition, message) => {
    totalCount++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${message}`);
    }
  };

  const cleanUps = {
    userIds: [],
    bookIds: [],
    authorIds: [],
    categoryIds: [],
    bookCopyIds: []
  };

  try {
    console.log('Seeding test database records...');
    
    // Seed Users (Admin)
    const createUser = async (username, role) => {
      const u = await prisma.user.create({
        data: { username, email: `${username}@test.com`, passwordHash: 'hash', role, isActive: true }
      });
      cleanUps.userIds.push(u.id);
      return u;
    };
    
    const admin = await createUser(`admin_13466_${Date.now()}`, UserRole.ADMIN);

    // Seed Authors
    const author1 = await prisma.author.create({ data: { fullName: `Rowling_${Date.now()}` } });
    cleanUps.authorIds.push(author1.id);

    // Seed Categories
    const category1 = await prisma.category.create({ data: { name: `Fantasy_${Date.now()}` } });
    cleanUps.categoryIds.push(category1.id);
    const testCategory = await prisma.category.create({ data: { name: `TestCat_${Date.now()}` } });
    cleanUps.categoryIds.push(testCategory.id);

    // Seed Books
    const createBook = async (title, isbn, publisher, authorIds, categoryIds) => {
      const book = await prisma.book.create({
        data: {
          title,
          isbn,
          publisher,
          sellingPrice: 15.99,
          stockQuantity: 10,
          isBorrowable: true,
          isForSale: true,
          authors: {
            create: authorIds.map(authorId => ({ authorId }))
          },
          categories: {
            create: categoryIds.map(categoryId => ({ categoryId }))
          }
        }
      });
      cleanUps.bookIds.push(book.id);
      return book;
    };

    const book1 = await createBook('D Dystopia', `isbn1_${Date.now()}`, 'Bloomsbury', [author1.id], [category1.id, testCategory.id]);
    const book2 = await createBook('A 1984', `isbn2_${Date.now()}`, 'Secker', [author1.id], [category1.id, testCategory.id]);
    const book3 = await createBook('C Animal Farm', `isbn3_${Date.now()}`, 'Secker', [author1.id], [category1.id, testCategory.id]);
    const book4 = await createBook('B Zero Copies Book', `isbn4_${Date.now()}`, 'None', [author1.id], [category1.id, testCategory.id]);

    // Seed Book Copies
    const createCopy = async (bookId, barcode, status, condition) => {
      const copy = await prisma.bookCopy.create({
        data: { bookId, barcode, status, condition }
      });
      cleanUps.bookCopyIds.push(copy.id);
      return copy;
    };

    await createCopy(book1.id, `bar1_${Date.now()}`, CopyStatus.AVAILABLE, CopyCondition.NEW);
    await createCopy(book2.id, `bar2_${Date.now()}`, CopyStatus.BORROWED, CopyCondition.GOOD);
    await createCopy(book3.id, `bar3_${Date.now()}`, CopyStatus.MAINTENANCE, CopyCondition.FAIR);

    const adminToken = generateToken({ id: admin.id, email: admin.email, role: admin.role });

    console.log('Starting HTTP server...');
    const server = app.listen(PORT, async () => {
      try {
        const getRequest = async (path, queryStr = '') => {
          const res = await fetch(`${BASE_URL}/${path}${queryStr}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          const body = await res.json();
          return { status: res.status, body };
        };

        const path = 'admin/dashboard/reports/inventory';

        // 1. Verify Empty Inventory Response Formatting
        console.log('\n--- 1. Empty Inventory Response Contract ---');
        const invalidUUID = '00000000-0000-0000-0000-000000000000';
        const { body: emptyRes } = await getRequest(path, `?categoryId=${invalidUUID}`);
        const emptyPag = emptyRes.data.pagination;
        
        assert(emptyRes.data.summary !== undefined, 'summary object is present');
        assert(emptyRes.data.items.length === 0, 'items array is empty');
        assert(emptyPag !== undefined, 'pagination object is present');
        assert(emptyPag.page === 1, 'pagination page defaults to 1');
        assert(emptyPag.limit === 20, 'pagination limit defaults to 20');
        assert(emptyPag.totalItems === 0, 'totalItems is 0');
        assert(emptyPag.totalPages === 0, 'totalPages is 0');
        assert(emptyPag.hasNextPage === false, 'hasNextPage is false');
        assert(emptyPag.hasPreviousPage === false, 'hasPreviousPage is false');

        // 2. Verify Single Page Response Formatting
        console.log('\n--- 2. Single Page Metadata ---');
        const { body: singlePage } = await getRequest(path, `?includeZeroAvailable=true&page=1&limit=10&categoryId=${testCategory.id}`);
        const singlePag = singlePage.data.pagination;
        
        assert(singlePage.data.items.length === 4, 'items count matches totalBooks (4)');
        assert(singlePag.page === 1, 'page is 1');
        assert(singlePag.limit === 10, 'limit is 10');
        assert(singlePag.totalItems === 4, 'totalItems is 4');
        assert(singlePag.totalPages === 1, 'totalPages is 1');
        assert(singlePag.hasNextPage === false, 'hasNextPage is false (since totalPages = 1)');
        assert(singlePag.hasPreviousPage === false, 'hasPreviousPage is false');

        // 3. Verify Multi-Page Response Formatting
        console.log('\n--- 3. Multi-Page Metadata ---');
        
        // Page 1 of 4 (limit=1)
        const { body: pag1 } = await getRequest(path, `?includeZeroAvailable=true&page=1&limit=1&categoryId=${testCategory.id}`);
        const pag1Meta = pag1.data.pagination;
        assert(pag1Meta.page === 1 && pag1Meta.totalPages === 4, 'Page 1 limit 1 is registered');
        assert(pag1Meta.hasNextPage === true, 'hasNextPage is true on page 1');
        assert(pag1Meta.hasPreviousPage === false, 'hasPreviousPage is false on page 1');

        // Page 2 of 4 (limit=1)
        const { body: pag2 } = await getRequest(path, `?includeZeroAvailable=true&page=2&limit=1&categoryId=${testCategory.id}`);
        const pag2Meta = pag2.data.pagination;
        assert(pag2Meta.page === 2 && pag2Meta.totalPages === 4, 'Page 2 limit 1 is registered');
        assert(pag2Meta.hasNextPage === true, 'hasNextPage is true on page 2');
        assert(pag2Meta.hasPreviousPage === true, 'hasPreviousPage is true on page 2');

        // Page 4 of 4 (limit=1)
        const { body: pag4 } = await getRequest(path, `?includeZeroAvailable=true&page=4&limit=1&categoryId=${testCategory.id}`);
        const pag4Meta = pag4.data.pagination;
        assert(pag4Meta.page === 4 && pag4Meta.totalPages === 4, 'Page 4 limit 1 is registered');
        assert(pag4Meta.hasNextPage === false, 'hasNextPage is false on last page');
        assert(pag4Meta.hasPreviousPage === true, 'hasPreviousPage is true on last page');

        // Beyond Bounds Page 99 of 4 (limit=1)
        const { body: pag99 } = await getRequest(path, `?includeZeroAvailable=true&page=99&limit=1&categoryId=${testCategory.id}`);
        const pag99Meta = pag99.data.pagination;
        assert(pag99.data.items.length === 0, 'Page beyond bounds returns empty list');
        assert(pag99Meta.page === 99 && pag99Meta.totalPages === 4, 'Page 99 limit 1 is registered');
        assert(pag99Meta.hasNextPage === false, 'hasNextPage is false beyond bounds');
        assert(pag99Meta.hasPreviousPage === true, 'hasPreviousPage is true beyond bounds (since totalItems > 0)');

        // 4. Verify Regression Checks (Search endpoints should return their pagination with hasNextPage enriched)
        console.log('\n--- 4. Regression & Centralized Helper Checks ---');
        const { body: bookSearch } = await getRequest('admin/dashboard/reports/search/books');
        assert(bookSearch.data.pagination.hasNextPage !== undefined, 'Centralized pagination metadata update enriches Search Books response');

        const { status: overdueStatus } = await getRequest('admin/dashboard/reports/overdue');
        assert(overdueStatus === 200, 'GET /admin/dashboard/reports/overdue continues to work (returns 200)');

        const { status: sumStatus } = await getRequest('admin/dashboard/summary');
        assert(sumStatus === 200, 'GET /admin/dashboard/summary continues to work (returns 200)');

      } catch (err) {
        console.error('Test execution failed with error:', err);
      } finally {
        console.log('\nCleaning up seeded database records...');
        try {
          await prisma.bookCopy.deleteMany({ where: { id: { in: cleanUps.bookCopyIds } } });
          await prisma.bookAuthor.deleteMany({ where: { bookId: { in: cleanUps.bookIds } } });
          await prisma.bookCategory.deleteMany({ where: { bookId: { in: cleanUps.bookIds } } });
          await prisma.book.deleteMany({ where: { id: { in: cleanUps.bookIds } } });
          await prisma.author.deleteMany({ where: { id: { in: cleanUps.authorIds } } });
          await prisma.category.deleteMany({ where: { id: { in: cleanUps.categoryIds } } });
          await prisma.user.deleteMany({ where: { id: { in: cleanUps.userIds } } });
          console.log('Cleanup successful.');
        } catch (cleanupErr) {
          console.error('Database cleanup error:', cleanupErr);
        }

        try {
          await prisma.$disconnect();
        } catch (disconnectErr) {
          console.error('Prisma disconnect error:', disconnectErr);
        }

        server.close(() => {
          console.log('HTTP server closed.');
          console.log(`\nVerification finished: ${passedCount}/${totalCount} checks passed.`);
          if (passedCount === totalCount) {
            console.log('All Response Formatting checks verified successfully!');
            setTimeout(() => process.exit(0), 100);
          } else {
            console.log('Some checks failed.');
            setTimeout(() => process.exit(1), 100);
          }
        });
      }
    });

  } catch (e) {
    console.error('Fatal initialization error:', e);
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Unhandled fatal exception:', err);
  process.exit(1);
});
