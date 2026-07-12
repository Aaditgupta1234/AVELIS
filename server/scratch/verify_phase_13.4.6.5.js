/**
 * Verification script for Phase 13.4.6.5 - Inventory Filtering, Sorting & Pagination Refinement.
 * Run with: node scratch/verify_phase_13.4.6.5.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole, CopyStatus, CopyCondition } from '@prisma/client';

const PORT = 5579;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.4.6.5 Inventory Filtering, Sorting & Pagination Refinement Verification...\n');
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
    
    const admin = await createUser(`admin_13465_${Date.now()}`, UserRole.ADMIN);

    // Seed Authors
    const author1 = await prisma.author.create({ data: { fullName: `Rowling_${Date.now()}` } });
    cleanUps.authorIds.push(author1.id);
    const author2 = await prisma.author.create({ data: { fullName: `Orwell_${Date.now()}` } });
    cleanUps.authorIds.push(author2.id);

    // Seed Categories
    const category1 = await prisma.category.create({ data: { name: `Fantasy_${Date.now()}` } });
    cleanUps.categoryIds.push(category1.id);
    const category2 = await prisma.category.create({ data: { name: `Dystopian_${Date.now()}` } });
    cleanUps.categoryIds.push(category2.id);
    // Shared isolation category to wrap all 5 test books
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

    // Seed 5 books
    // Book 1: D Dystopia, Bloomsbury, Category 1, Author 1 (3 copies AVAILABLE)
    const book1 = await createBook('D Dystopia', `isbn1_${Date.now()}`, 'Bloomsbury', [author1.id], [category1.id, testCategory.id]);
    // Book 2: A 1984, Secker, Category 2, Author 2 (2 copies BORROWED)
    const book2 = await createBook('A 1984', `isbn2_${Date.now()}`, 'Secker', [author2.id], [category2.id, testCategory.id]);
    // Book 3: C Animal Farm, Secker, Category 2, Author 2 (1 copy MAINTENANCE)
    const book3 = await createBook('C Animal Farm', `isbn3_${Date.now()}`, 'Secker', [author2.id], [category2.id, testCategory.id]);
    // Book 4: B Zero Copies Book, None, Category 1, Author 1 (0 copies)
    const book4 = await createBook('B Zero Copies Book', `isbn4_${Date.now()}`, 'None', [author1.id], [category1.id, testCategory.id]);
    // Book 5: A Duplicate Title, Bloomsbury, Category 1, Author 1 (2 copies AVAILABLE)
    const book5 = await createBook('A Duplicate Title', `isbn5_${Date.now()}`, 'Bloomsbury', [author1.id], [category1.id, testCategory.id]);

    // Seed Book Copies
    const createCopy = async (bookId, barcode, status, condition) => {
      const copy = await prisma.bookCopy.create({
        data: { bookId, barcode, status, condition }
      });
      cleanUps.bookCopyIds.push(copy.id);
      return copy;
    };

    // Book 1: 3 copies AVAILABLE
    await createCopy(book1.id, `bar1_${Date.now()}`, CopyStatus.AVAILABLE, CopyCondition.NEW);
    await createCopy(book1.id, `bar2_${Date.now()}`, CopyStatus.AVAILABLE, CopyCondition.GOOD);
    await createCopy(book1.id, `bar3_${Date.now()}`, CopyStatus.AVAILABLE, CopyCondition.GOOD);

    // Book 2: 2 copies BORROWED
    await createCopy(book2.id, `bar4_${Date.now()}`, CopyStatus.BORROWED, CopyCondition.GOOD);
    await createCopy(book2.id, `bar5_${Date.now()}`, CopyStatus.BORROWED, CopyCondition.GOOD);

    // Book 3: 1 copy MAINTENANCE
    await createCopy(book3.id, `bar6_${Date.now()}`, CopyStatus.MAINTENANCE, CopyCondition.FAIR);

    // Book 4 has 0 copies.

    // Book 5: 2 copies AVAILABLE
    await createCopy(book5.id, `bar7_${Date.now()}`, CopyStatus.AVAILABLE, CopyCondition.NEW);
    await createCopy(book5.id, `bar8_${Date.now()}`, CopyStatus.AVAILABLE, CopyCondition.NEW);

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

        // 1. Verify Refined Filtering Combinations (Logical AND)
        console.log('\n--- 1. Combined Filter Intersections ---');
        
        // search + categoryId -> Matches Book 1 only
        const { body: fSearchCat } = await getRequest(path, `?search=Dystopia&categoryId=${category1.id}`);
        assert(fSearchCat.data.items.length === 1 && fSearchCat.data.items[0].id === book1.id, 'Combined search + categoryId filter matches Book 1');

        // authorId + publisher -> Matches Book 2 & Book 3 (with includeZeroAvailable=true)
        const { body: fAuthPub } = await getRequest(path, `?authorId=${author2.id}&publisher=Secker&includeZeroAvailable=true&categoryId=${testCategory.id}`);
        const authPubIds = fAuthPub.data.items.map(i => i.id);
        assert(authPubIds.length === 2 && authPubIds.includes(book2.id) && authPubIds.includes(book3.id), 'Combined authorId + publisher matches Book 2 and Book 3');

        // availability + includeZeroAvailable -> availability='available' matches Book 1 and Book 5
        const { body: fAvailZero } = await getRequest(path, `?availability=available&includeZeroAvailable=true&categoryId=${testCategory.id}`);
        const availZeroIds = fAvailZero.data.items.map(i => i.id);
        assert(availZeroIds.length === 2 && availZeroIds.includes(book1.id) && availZeroIds.includes(book5.id), 'Combined availability + includeZeroAvailable matches Book 1 and Book 5');

        // 2. Verify Sorting Parity & Stable Ordering Fallback
        console.log('\n--- 2. Deterministic Sorting & Tie-breakers ---');
        
        // Sorting by derived totalCopies asc
        const { body: sCopies } = await getRequest(path, `?includeZeroAvailable=true&sortBy=totalCopies&sortOrder=asc&categoryId=${testCategory.id}`);
        const copiesItems = sCopies.data.items;
        
        // Sorted: Book 4 (0 copies) -> Book 3 (1 copy) -> Book 2 (2 copies) -> Book 5 (2 copies) -> Book 1 (3 copies)
        // Book 2 ('A 1984') and Book 5 ('A Duplicate Title') have equal totalCopies (2).
        // Book 2 title 'A 1984' comes before Book 5 'A Duplicate Title' alphabetically.
        assert(copiesItems[0].id === book4.id, 'First is Book 4 (0 copies)');
        assert(copiesItems[1].id === book3.id, 'Second is Book 3 (1 copy)');
        assert(copiesItems[2].id === book2.id, 'Third is Book 2 (2 copies, title "A 1984")');
        assert(copiesItems[3].id === book5.id, 'Fourth is Book 5 (2 copies, title "A Duplicate Title") - stable tie-breaker resolved');
        assert(copiesItems[4].id === book1.id, 'Fifth is Book 1 (3 copies)');

        // Sorting by persisted title asc
        const { body: sTitle } = await getRequest(path, `?includeZeroAvailable=true&sortBy=title&sortOrder=asc&categoryId=${testCategory.id}`);
        const titleItems = sTitle.data.items;
        // Alphabetical: A 1984 (Book 2) -> A Duplicate Title (Book 5) -> B Zero Copies Book (Book 4) -> C Animal Farm (Book 3) -> D Dystopia (Book 1)
        assert(titleItems[0].id === book2.id, 'First is Book 2 ("A 1984")');
        assert(titleItems[1].id === book5.id, 'Second is Book 5 ("A Duplicate Title")');
        assert(titleItems[2].id === book4.id, 'Third is Book 4 ("B Zero Copies Book")');
        assert(titleItems[3].id === book3.id, 'Fourth is Book 3 ("C Animal Farm")');
        assert(titleItems[4].id === book1.id, 'Fifth is Book 1 ("D Dystopia")');

        // 3. Verify Pagination Resiliency & Beyond Bounds
        console.log('\n--- 3. Pagination Resilience & Boundary Safeguards ---');
        
        // First Page (limit=2) -> Returns Book 2 and Book 5 (sorted by title asc)
        const { body: pag1 } = await getRequest(path, `?includeZeroAvailable=true&page=1&limit=2&sortBy=title&sortOrder=asc&categoryId=${testCategory.id}`);
        assert(pag1.data.items.length === 2 && pag1.data.items[0].id === book2.id && pag1.data.items[1].id === book5.id, 'Page 1 limit 2 returns first 2 books');

        // Middle Page (page=2, limit=2) -> Returns Book 4 and Book 3
        const { body: pag2 } = await getRequest(path, `?includeZeroAvailable=true&page=2&limit=2&sortBy=title&sortOrder=asc&categoryId=${testCategory.id}`);
        assert(pag2.data.items.length === 2 && pag2.data.items[0].id === book4.id && pag2.data.items[1].id === book3.id, 'Page 2 limit 2 returns middle 2 books');

        // Final Page (page=3, limit=2) -> Returns Book 1 (1 item left)
        const { body: pag3 } = await getRequest(path, `?includeZeroAvailable=true&page=3&limit=2&sortBy=title&sortOrder=asc&categoryId=${testCategory.id}`);
        assert(pag3.data.items.length === 1 && pag3.data.items[0].id === book1.id, 'Page 3 limit 2 returns final book');

        // Beyond Bounds check: limit=1, page=99 -> Returns items: [] and full correct summary stats
        const { body: pag99 } = await getRequest(path, `?includeZeroAvailable=true&page=99&limit=1&categoryId=${testCategory.id}`);
        assert(pag99.data.items.length === 0, 'Page beyond bounds returns empty items array []');
        assert(pag99.data.summary.totalBooks === 5, 'Summary totalBooks remains 5 (independent of page slice)');
        assert(pag99.data.summary.totalCopies === 8, 'Summary totalCopies remains 8 (independent of page slice)');

        // 4. Verify Regression Checks
        console.log('\n--- 4. Regression Checks ---');
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
            console.log('All Inventory Refinement checks verified successfully!');
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
