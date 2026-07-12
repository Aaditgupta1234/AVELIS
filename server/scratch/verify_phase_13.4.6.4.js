/**
 * Verification script for Phase 13.4.6.4 - Inventory Statistics.
 * Run with: node scratch/verify_phase_13.4.6.4.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole, CopyStatus, CopyCondition } from '@prisma/client';

const PORT = 5578;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.4.6.4 Inventory Statistics Verification...\n');
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
    
    const admin = await createUser(`admin_13464_${Date.now()}`, UserRole.ADMIN);

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
    // Shared isolation category to wrap all 4 test books
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

    const book1 = await createBook('Harry Potter and Orwellian Dystopia', `isbn1_${Date.now()}`, 'Bloomsbury', [author1.id, author2.id], [category1.id, category2.id, testCategory.id]);
    const book2 = await createBook('1984', `isbn2_${Date.now()}`, 'Secker', [author2.id], [category2.id, testCategory.id]);
    const book3 = await createBook('Animal Farm', `isbn3_${Date.now()}`, 'Secker', [author2.id], [category2.id, testCategory.id]);
    const book4 = await createBook('Zero Copies Book', `isbn4_${Date.now()}`, 'None', [author1.id], [category1.id, testCategory.id]);

    // Seed Book Copies
    const createCopy = async (bookId, barcode, status, condition) => {
      const copy = await prisma.bookCopy.create({
        data: { bookId, barcode, status, condition }
      });
      cleanUps.bookCopyIds.push(copy.id);
      return copy;
    };

    // Book 1: 3 copies (1 AVAILABLE, 1 BORROWED, 1 RESERVED)
    await createCopy(book1.id, `bar1_${Date.now()}`, CopyStatus.AVAILABLE, CopyCondition.NEW);
    await createCopy(book1.id, `bar2_${Date.now()}`, CopyStatus.BORROWED, CopyCondition.GOOD);
    await createCopy(book1.id, `bar3_${Date.now()}`, CopyStatus.RESERVED, CopyCondition.GOOD);

    // Book 2: 2 copies (1 AVAILABLE, 1 LOST - condition DAMAGED)
    await createCopy(book2.id, `bar4_${Date.now()}`, CopyStatus.AVAILABLE, CopyCondition.GOOD);
    await createCopy(book2.id, `bar5_${Date.now()}`, CopyStatus.LOST, CopyCondition.DAMAGED);

    // Book 3: 1 copy (MAINTENANCE)
    await createCopy(book3.id, `bar6_${Date.now()}`, CopyStatus.MAINTENANCE, CopyCondition.FAIR);

    // Book 4 has 0 copies.

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

        // 1. Verify Empty Inventory Statistics (filtering by non-existing category returns 0 books)
        console.log('\n--- 1. Empty Inventory Statistics ---');
        const invalidUUID = '00000000-0000-0000-0000-000000000000';
        const { body: emptyRes } = await getRequest(path, `?categoryId=${invalidUUID}`);
        const emptySum = emptyRes.data.summary;
        assert(emptySum.totalBooks === 0, 'totalBooks is 0 for empty query');
        assert(emptySum.totalCopies === 0, 'totalCopies is 0');
        assert(emptySum.availableCopies === 0, 'availableCopies is 0');
        assert(emptySum.borrowedCopies === 0, 'borrowedCopies is 0');
        assert(emptySum.reservedCopies === 0, 'reservedCopies is 0');
        assert(emptySum.lostCopies === 0, 'lostCopies is 0');
        assert(emptySum.damagedCopies === 0, 'damagedCopies is 0');
        assert(emptySum.maintenanceCopies === 0, 'maintenanceCopies is 0');
        assert(emptySum.zeroAvailabilityBooks === 0, 'zeroAvailabilityBooks is 0');
        assert(emptySum.averageAvailabilityPercentage === 0, 'averageAvailabilityPercentage is 0');

        // 2. Verify Statistics Over Multiple Books
        console.log('\n--- 2. Multiple Books Statistics (includeZeroAvailable=true) ---');
        const { body: multiRes } = await getRequest(path, `?includeZeroAvailable=true&categoryId=${testCategory.id}`);
        const sum = multiRes.data.summary;
        
        assert(sum.totalBooks === 4, 'totalBooks is 4');
        assert(sum.totalCopies === 6, 'totalCopies is 6');
        assert(sum.availableCopies === 2, 'availableCopies is 2');
        assert(sum.borrowedCopies === 1, 'borrowedCopies is 1');
        assert(sum.reservedCopies === 1, 'reservedCopies is 1');
        assert(sum.lostCopies === 1, 'lostCopies is 1');
        assert(sum.damagedCopies === 1, 'damagedCopies is 1');
        assert(sum.maintenanceCopies === 1, 'maintenanceCopies is 1');
        assert(sum.zeroAvailabilityBooks === 2, 'zeroAvailabilityBooks is 2 (Book 3 & Book 4)');
        // (33.33 + 50.00 + 0 + 0) / 4 = 20.83%
        assert(sum.averageAvailabilityPercentage === 20.83, `averageAvailabilityPercentage is 20.83% (actual: ${sum.averageAvailabilityPercentage}%)`);

        // 3. Verify Filters Apply to Statistics
        console.log('\n--- 3. Filtered Statistics (publisher=Secker) ---');
        const { body: filteredRes } = await getRequest(path, `?publisher=Secker&includeZeroAvailable=true&categoryId=${testCategory.id}`);
        const filtSum = filteredRes.data.summary;
        
        assert(filtSum.totalBooks === 2, 'totalBooks reflects only matching books (2)');
        assert(filtSum.totalCopies === 3, 'totalCopies is 3 (Book 2 + Book 3)');
        assert(filtSum.availableCopies === 1, 'availableCopies is 1 (Book 2 AVAILABLE, Book 3 MAINTENANCE)');
        assert(filtSum.zeroAvailabilityBooks === 1, 'zeroAvailabilityBooks is 1 (Book 3 only)');

        // 4. Verify Pagination Does NOT Affect Statistics
        console.log('\n--- 4. Pagination Statistics Bounds ---');
        const { body: pagRes } = await getRequest(path, `?includeZeroAvailable=true&page=1&limit=1&categoryId=${testCategory.id}`);
        const pagSum = pagRes.data.summary;
        
        assert(pagRes.data.items.length === 1, 'Items returned is limited to 1 page item');
        assert(pagSum.totalBooks === 4, 'Summary totalBooks is still calculated over all 4 matching books');
        assert(pagSum.totalCopies === 6, 'Summary totalCopies is still calculated over all 6 matching book copies');

        // 5. Verify Regression Checks
        console.log('\n--- 5. Regression Checks ---');
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
            console.log('All Inventory Statistics checks verified successfully!');
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
