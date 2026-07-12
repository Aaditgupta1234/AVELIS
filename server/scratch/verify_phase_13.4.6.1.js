/**
 * Verification script for Phase 13.4.6.1 - Inventory Report Validation.
 * Run with: node scratch/verify_phase_13.4.6.1.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole } from '@prisma/client';

const PORT = 5575;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.4.6.1 Inventory Report Validation Verification...\n');
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

  let adminUser;
  const createdUserIds = [];

  try {
    console.log('Setting up database users...');
    adminUser = await prisma.user.create({
      data: {
        username: `admin_13461_${Date.now()}`,
        email: `admin_13461_${Date.now()}@test.com`,
        passwordHash: 'hashed',
        role: UserRole.ADMIN,
        isActive: true
      }
    });
    createdUserIds.push(adminUser.id);

    const adminToken = generateToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });
    const validUUID = '87654321-4321-4321-4321-123456789012';

    console.log('Starting HTTP server...');
    const server = app.listen(PORT, async () => {
      try {
        const getRequest = async (path, queryStr = '') => {
          const res = await fetch(`${BASE_URL}/${path}${queryStr}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          const body = res.status === 204 ? null : await res.json();
          return { status: res.status, body };
        };

        // 1. Valid Query Parameters -> Should pass validation layer and proceed to controller (returning 501 placeholder)
        console.log('\n--- 1. Valid Query Parameter Checks ---');
        
        const { status: statusEmpty } = await getRequest('admin/dashboard/reports/inventory');
        assert(statusEmpty === 501, 'Empty query passes validation (proceeds to controller returning 501)');

        const { status: statusValid } = await getRequest(
          'admin/dashboard/reports/inventory',
          `?page=2&limit=50&sortBy=availableCopies&sortOrder=desc&availability=maintenance&includeZeroAvailable=true&categoryId=${validUUID}&authorId=${validUUID}&publisher=Test%20Publisher&search=1984`
        );
        assert(statusValid === 501, 'Valid query parameters pass validation (returns 501)');

        // 2. Rejection Cases -> Should fail validation layer and return 400 Bad Request
        console.log('\n--- 2. Invalid Parameter Rejections ---');

        const assertFieldFailure = async (queryStr, expectedField, message) => {
          const { status, body } = await getRequest('admin/dashboard/reports/inventory', queryStr);
          assert(status === 400, `${message} returns 400 Bad Request`);
          const hasFieldError = body.errors && body.errors.some(e => e.field === expectedField);
          assert(hasFieldError, `Response error array lists field "${expectedField}"`);
        };

        await assertFieldFailure('?categoryId=invalid-uuid', 'categoryId', 'Malformed categoryId UUID');
        await assertFieldFailure('?authorId=invalid-uuid', 'authorId', 'Malformed authorId UUID');
        await assertFieldFailure('?availability=invalid-status', 'availability', 'Unsupported availability enum');
        await assertFieldFailure('?sortBy=invalid-field', 'sortBy', 'Unsupported sortBy field');
        await assertFieldFailure('?sortOrder=random', 'sortOrder', 'Unsupported sortOrder');
        await assertFieldFailure('?page=0', 'page', 'Invalid page number 0');
        await assertFieldFailure('?limit=101', 'limit', 'Invalid page limit 101');
        await assertFieldFailure('?search=', 'search', 'Empty search keyword');
        
        const longSearch = 'a'.repeat(101);
        await assertFieldFailure(`?search=${longSearch}`, 'search', 'Search keyword > 100 characters');

        await assertFieldFailure('?publisher=', 'publisher', 'Empty publisher name');
        
        const longPublisher = 'a'.repeat(101);
        await assertFieldFailure(`?publisher=${longPublisher}`, 'publisher', 'Publisher name > 100 characters');

        await assertFieldFailure('?includeZeroAvailable=invalid-bool', 'includeZeroAvailable', 'Malformed includeZeroAvailable boolean');

        // 3. Regression Checks
        console.log('\n--- 3. Regression Checks ---');
        const { status: overdueStatus } = await getRequest('admin/dashboard/reports/overdue');
        assert(overdueStatus === 200, 'GET /admin/dashboard/reports/overdue continues to work (returns 200)');

        const { status: sumStatus } = await getRequest('admin/dashboard/summary');
        assert(sumStatus === 200, 'GET /admin/dashboard/summary continues to work (returns 200)');

      } catch (err) {
        console.error('Test execution failed with error:', err);
      } finally {
        console.log('\nCleaning up database records...');
        try {
          await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
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
            console.log('All Inventory Report Validation checks verified successfully!');
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
