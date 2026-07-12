/**
 * Verification script for Phase 13.2.4 - Dashboard Statistics Aggregation.
 * Run with: node scratch/verify_phase_13.2.4.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole, CopyStatus } from '@prisma/client';

const PORT = 5561;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.2.4 Dashboard Aggregation Audit Verification...\n');
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

  const uniqueBarcode = () => `BARCODE-13.2.4-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // 0. Setup test records
  console.log('Setting up database records for soft-delete audit...');
  
  const adminUser = await prisma.user.create({
    data: {
      username: `admin_1324_${Date.now()}`,
      email: `admin_1324_${Date.now()}@test.com`,
      passwordHash: 'hashed',
      role: UserRole.ADMIN,
      isActive: true
    }
  });

  const activeBook = await prisma.book.create({
    data: {
      title: 'Active Book Audit',
      isbn: `ISBN-1324-A-${Date.now()}`,
      isBorrowable: true
    }
  });

  const activeCopy = await prisma.bookCopy.create({
    data: {
      bookId: activeBook.id,
      barcode: uniqueBarcode(),
      status: CopyStatus.AVAILABLE
    }
  });

  const softDeletedBook = await prisma.book.create({
    data: {
      title: 'Deleted Book Audit',
      isbn: `ISBN-1324-D-${Date.now()}`,
      isBorrowable: true,
      isDeleted: true,
      deletedAt: new Date()
    }
  });

  const softDeletedCopy = await prisma.bookCopy.create({
    data: {
      bookId: softDeletedBook.id,
      barcode: uniqueBarcode(),
      status: CopyStatus.AVAILABLE
    }
  });

  console.log('Generating JWT token...');
  const adminToken = generateToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });

  // Start the server
  const server = app.listen(PORT, async () => {
    try {
      // 1. Fetch Summary stats
      console.log('\n--- 1. Fetching Summary ---');
      const res = await fetch(`${BASE_URL}/admin/dashboard/summary`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(res.status === 200, 'HTTP 200 OK returned successfully');
      const body = await res.json();
      assert(body.success === true, 'Success flag is true');
      const data = body.data;

      // 2. Soft-Deleted Book Exclusion check
      console.log('\n--- 2. Soft-Deleted Book Exclusion Check ---');
      const directActiveBooksCount = await prisma.book.count({ where: { isDeleted: false } });
      assert(data.books.total === directActiveBooksCount, 'Dashboard books total excludes soft-deleted books');

      // 3. Soft-Deleted Book Copy Exclusion check
      console.log('\n--- 3. Soft-Deleted Book Copy Exclusion Check ---');
      const directActiveCopiesCount = await prisma.bookCopy.count({ where: { book: { isDeleted: false } } });
      assert(data.books.copies === directActiveCopiesCount, 'Dashboard book copies count excludes copies of soft-deleted books');

      const directAvailableCopiesCount = await prisma.bookCopy.count({
        where: {
          status: CopyStatus.AVAILABLE,
          book: { isDeleted: false }
        }
      });
      assert(data.books.availableCopies === directAvailableCopiesCount, 'Dashboard available copies count excludes copies of soft-deleted books');

      // 4. Stable Response Contract check
      console.log('\n--- 4. Response Structure Contract Check ---');
      assert(data.filter !== undefined, 'Contains filter object');
      assert(data.users !== undefined && typeof data.users.total === 'number' && typeof data.users.active === 'number', 'users shape is correct');
      assert(data.books !== undefined && typeof data.books.total === 'number' && typeof data.books.copies === 'number' && typeof data.books.availableCopies === 'number', 'books shape is correct');
      assert(data.loans !== undefined && typeof data.loans.total === 'number' && typeof data.loans.active === 'number' && typeof data.loans.overdue === 'number', 'loans shape is correct');
      assert(data.reservations !== undefined && typeof data.reservations.total === 'number' && typeof data.reservations.active === 'number', 'reservations shape is correct');
      assert(data.orders !== undefined && typeof data.orders.total === 'number' && typeof data.orders.pending === 'number', 'orders shape is correct');

      // 5. Aggregation Consistency check against database
      console.log('\n--- 5. Aggregation Database Consistency Check ---');
      const directUsers = await prisma.user.count();
      assert(data.users.total === directUsers, 'Users total matches direct database count');

      const directActiveUsers = await prisma.user.count({ where: { isActive: true } });
      assert(data.users.active === directActiveUsers, 'Active users matches direct database active count');

      // 6. Date filtering consistency check
      console.log('\n--- 6. Date Filtering Policy Check ---');
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const resFilterTomorrow = await fetch(`${BASE_URL}/admin/dashboard/summary?startDate=${tomorrow}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const bodyFilterTomorrow = await resFilterTomorrow.json();
      const filteredData = bodyFilterTomorrow.data;

      // Unfiltered inventory vs Filtered transactions
      assert(filteredData.books.total === data.books.total, 'Inventory books.total ignores date filter (cumulative)');
      assert(filteredData.users.total === data.users.total, 'Inventory users.total ignores date filter (cumulative)');
      assert(filteredData.loans.total === 0, 'Transactional loans.total respects date filter and returns 0 for future range');

      // 7. No Regressions check
      console.log('\n--- 7. No Regressions check (analytics & reports) ---');
      const resAnalytics = await fetch(`${BASE_URL}/admin/dashboard/analytics`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resAnalytics.status === 501, 'GET /admin/dashboard/analytics returns 501 Not Implemented');

    } catch (e) {
      console.error('Aggregation audit tests failed with exception:', e);
    } finally {
      // Cleanup database records
      console.log('\nCleaning up database records...');
      await prisma.bookCopy.deleteMany({ where: { id: { in: [activeCopy.id, softDeletedCopy.id] } } });
      await prisma.book.deleteMany({ where: { id: { in: [activeBook.id, softDeletedBook.id] } } });
      await prisma.user.deleteMany({ where: { id: adminUser.id } });

      // Close the server and end process
      server.close(() => {
        console.log('HTTP server closed.');
        console.log(`\nVerification finished: ${passedCount}/${totalCount} checks passed.`);
        if (passedCount === totalCount) {
          console.log('All Dashboard Summary Aggregation audit checks verified successfully!');
          process.exit(0);
        } else {
          process.exit(1);
        }
      });
    }
  });
}

runTests().catch((err) => {
  console.error('Fatal unhandled error:', err);
  process.exit(1);
});
