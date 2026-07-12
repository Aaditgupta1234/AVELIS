/**
 * Verification script for Phase 13.4.6.3 - Inventory Report Service.
 * Run with: node scratch/verify_phase_13.4.6.3.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole, CopyStatus, CopyCondition } from '@prisma/client';

const PORT = 5577;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.4.6.3 Inventory Report Service Verification...\n');
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
    
    const admin = await createUser(`admin_13463_${Date.now()}`, UserRole.ADMIN);

    // Seed Authors (Many-to-Many testing: Rowling & Orwell)
    const author1 = await prisma.author.create({ data: { fullName: 'J.K. Rowling' } });
    cleanUps.authorIds.push(author1.id);
    const author2 = await prisma.author.create({ data: { fullName: 'George Orwell' } });
    cleanUps.authorIds.push(author2.id);

    // Seed Categories (Many-to-Many testing: Fantasy & Dystopian)
    const category1 = await prisma.category.create({ data: { name: 'Fantasy' } });
    cleanUps.categoryIds.push(category1.id);
    const category2 = await prisma.category.create({ data: { name: 'Dystopian' } });
    cleanUps.categoryIds.push(category2.id);

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

    // Book 1: Rowling & Orwell, Fantasy & Dystopian
    const book1 = await createBook('Harry Potter and Orwellian Dystopia', `isbn1_${Date.now()}`, 'Bloomsbury', [author1.id, author2.id], [category1.id, category2.id]);
    // Book 2: Orwell, Dystopian
    const book2 = await createBook('1984', `isbn2_${Date.now()}`, 'Secker', [author2.id], [category2.id]);
    // Book 3: Orwell, Dystopian
    const book3 = await createBook('Animal Farm', `isbn3_${Date.now()}`, 'Secker', [author2.id], [category2.id]);
    // Book 4: Rowling, Fantasy (Zero copies book)
    const book4 = await createBook('Zero Copies Book', `isbn4_${Date.now()}`, 'None', [author1.id], [category1.id]);

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
    const validUUID = '87654321-4321-4321-4321-123456789012';

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

        // 1. Verify Default Retrieval (Zero Available Excluded)
        console.log('\n--- 1. Default Retrieval (includeZeroAvailable=false) ---');
        const { body: invDefault } = await getRequest(path);
        
        // Excludes Book 3 (only MAINTENANCE) and Book 4 (0 copies) because they have 0 AVAILABLE copies.
        const defaultIds = invDefault.data.items.map(i => i.id);
        assert(defaultIds.includes(book1.id) && defaultIds.includes(book2.id), 'Returns books with at least one AVAILABLE copy');
        assert(!defaultIds.includes(book3.id) && !defaultIds.includes(book4.id), 'Excludes books with 0 AVAILABLE copies by default');

        // Verify status counts and percentages
        const item1 = invDefault.data.items.find(i => i.id === book1.id);
        assert(item1.totalCopies === 3, 'Book 1 has 3 totalCopies');
        assert(item1.availableCopies === 1, 'Book 1 has 1 availableCopy');
        assert(item1.borrowedCopies === 1, 'Book 1 has 1 borrowedCopy');
        assert(item1.reservedCopies === 1, 'Book 1 has 1 reservedCopy');
        assert(item1.lostCopies === 0, 'Book 1 has 0 lostCopies');
        assert(item1.damagedCopies === 0, 'Book 1 has 0 damagedCopies');
        assert(item1.maintenanceCopies === 0, 'Book 1 has 0 maintenanceCopies');
        assert(item1.availabilityPercentage === 33.33, 'Book 1 availabilityPercentage is 33.33%');

        const item2 = invDefault.data.items.find(i => i.id === book2.id);
        assert(item2.totalCopies === 2, 'Book 2 has 2 totalCopies');
        assert(item2.lostCopies === 1, 'Book 2 has 1 lostCopy');
        assert(item2.damagedCopies === 1, 'Book 2 has 1 damagedCopy (condition DAMAGED)');
        assert(item2.availabilityPercentage === 50, 'Book 2 availabilityPercentage is 50.00%');

        // 2. Verify includeZeroAvailable=true
        console.log('\n--- 2. includeZeroAvailable=true ---');
        const { body: invAll } = await getRequest(path, '?includeZeroAvailable=true');
        const allIds = invAll.data.items.map(i => i.id);
        assert(allIds.includes(book3.id) && allIds.includes(book4.id), 'Includes books with 0 available copies when includeZeroAvailable=true');

        const item4 = invAll.data.items.find(i => i.id === book4.id);
        assert(item4.totalCopies === 0 && item4.availabilityPercentage === 0, 'Division-by-zero protection returns 0% for zero copies book');

        // 3. Verify Filters
        console.log('\n--- 3. Filter Parameters ---');
        
        // Search filter (keyword)
        const { body: fSearch } = await getRequest(path, '?search=orwellian');
        assert(fSearch.data.items.length === 1 && fSearch.data.items[0].id === book1.id, 'Search keyword filter works');

        // Category filter (Many-to-Many checks)
        const { body: fCat1 } = await getRequest(path, `?categoryId=${category1.id}`);
        assert(fCat1.data.items.some(i => i.id === book1.id), 'Book 1 matches Category 1 filter');

        const { body: fCat2 } = await getRequest(path, `?categoryId=${category2.id}`);
        assert(fCat2.data.items.some(i => i.id === book1.id), 'Book 1 matches Category 2 filter');

        // Author filter (Many-to-Many checks)
        const { body: fAuth1 } = await getRequest(path, `?authorId=${author1.id}`);
        assert(fAuth1.data.items.some(i => i.id === book1.id), 'Book 1 matches Author 1 filter');

        const { body: fAuth2 } = await getRequest(path, `?authorId=${author2.id}`);
        assert(fAuth2.data.items.some(i => i.id === book1.id), 'Book 1 matches Author 2 filter');

        // Publisher filter
        const { body: fPub } = await getRequest(path, '?publisher=Secker&includeZeroAvailable=true');
        assert(fPub.data.items.length === 2, 'Publisher contains filter works');

        // Availability status filter
        const { body: fAvail } = await getRequest(path, '?availability=maintenance&includeZeroAvailable=true');
        assert(fAvail.data.items.length === 1 && fAvail.data.items[0].id === book3.id, 'Availability=maintenance filter works');

        const { body: fDamaged } = await getRequest(path, '?availability=damaged&includeZeroAvailable=true');
        assert(fDamaged.data.items.length === 1 && fDamaged.data.items[0].id === book2.id, 'Availability=damaged condition filter works');

        // 4. Verify Sorting (Direct & Derived stable deterministic sorting)
        console.log('\n--- 4. Sorting Parameters ---');
        
        // Sort by direct field: title desc
        const { body: sTitle } = await getRequest(path, '?includeZeroAvailable=true&sortBy=title&sortOrder=desc');
        assert(sTitle.data.items[0].title === 'Zero Copies Book', 'Sort by title desc works');

        // Sort by derived field: totalCopies asc (deterministic fallback checking)
        const { body: sCopies } = await getRequest(path, '?includeZeroAvailable=true&sortBy=totalCopies&sortOrder=asc');
        const copiesValues = sCopies.data.items.map(i => i.totalCopies);
        assert(
          copiesValues[0] <= copiesValues[1] &&
          copiesValues[1] <= copiesValues[2] &&
          copiesValues[2] <= copiesValues[3],
          'Sort by totalCopies asc works'
        );

        // 5. Verify Pagination
        console.log('\n--- 5. Pagination Slices ---');
        const { body: pagSlice } = await getRequest(path, '?includeZeroAvailable=true&page=1&limit=2&sortBy=title&sortOrder=asc');
        assert(pagSlice.data.items.length === 2, 'Pagination limit returns exactly 2 items');
        assert(pagSlice.data.items[0].title === '1984' && pagSlice.data.items[1].title === 'Animal Farm', 'Pagination page slice matches alphabetically');

        // 6. Regression Checks
        console.log('\n--- 6. Regression Checks ---');
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
            console.log('All Inventory Report Service checks verified successfully!');
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
