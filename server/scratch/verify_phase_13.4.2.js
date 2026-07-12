/**
 * Verification script for Phase 13.4.2 - Reporting Search Validation.
 * Run with: node scratch/verify_phase_13.4.2.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole } from '@prisma/client';

const PORT = 5571;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.4.2 Reporting Search Validation Verification...\n');
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
    const createUser = async (username, role) => {
      const user = await prisma.user.create({
        data: {
          username,
          email: `${username}@test.com`,
          passwordHash: 'hashed',
          role,
          isActive: true
        }
      });
      createdUserIds.push(user.id);
      return user;
    };

    adminUser = await createUser(`admin_1342_${Date.now()}`, UserRole.ADMIN);
    const adminToken = generateToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });

    console.log('Starting HTTP server...');
    const server = app.listen(PORT, async () => {
      try {
        const validUUID = '87654321-4321-4321-4321-123456789012';

        // Helper to perform a GET request
        const getRequest = async (path, queryStr = '', token = adminToken) => {
          const res = await fetch(`${BASE_URL}/${path}${queryStr}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          const body = await res.status === 204 ? null : await res.json();
          return { status: res.status, body };
        };

        // 1. Check Valid Requests pass validation (reaching the 501 controller)
        console.log('--- 1. Valid Requests Verification ---');
        
        const testValid = async (path, query) => {
          const { status } = await getRequest(path, query);
          assert(status === 501, `Valid request to ${path}${query} passes validation (returns 501)`);
        };

        await testValid('admin/dashboard/reports/search/books', `?page=2&limit=25&sortBy=title&sortOrder=desc&search=harry&title=Harry&author=Rowling&isbn=9783161484100&categoryId=${validUUID}&status=AVAILABLE&fromDate=2026-07-01&toDate=2026-07-12`);
        await testValid('admin/dashboard/reports/search/members', `?username=alice&email=alice@test.com&role=MEMBER&isActive=false`);
        await testValid('admin/dashboard/reports/search/loans', `?memberId=${validUUID}&bookId=${validUUID}&copyId=${validUUID}&status=BORROWED`);
        await testValid('admin/dashboard/reports/search/reservations', `?memberId=${validUUID}&bookId=${validUUID}&status=PENDING`);
        await testValid('admin/dashboard/reports/search/orders', `?memberId=${validUUID}&status=PLACED&paymentStatus=PAID`);
        await testValid('admin/dashboard/reports/overdue', `?memberId=${validUUID}&bookId=${validUUID}&severity=HIGH`);
        await testValid('admin/dashboard/reports/inventory', `?status=LOST&categoryId=${validUUID}&authorId=${validUUID}`);
        await testValid(`admin/dashboard/reports/members/${validUUID}`, `?fromDate=2026-07-10&toDate=2026-07-12`);

        // 2. Check Invalid Inputs return HTTP 400 Standard Error Envelope
        console.log('\n--- 2. Invalid Inputs & Validation Edge Cases ---');

        const testInvalid = async (path, query, expectedField, messageDetail) => {
          const { status, body } = await getRequest(path, query);
          assert(status === 400, `Invalid ${expectedField} (${messageDetail}) returns 400 Bad Request`);
          assert(body.success === false, `[${path}] response has success: false`);
          assert(body.message === 'Validation failed.', `[${path}] message is 'Validation failed.'`);
          
          const hasFieldErr = body.errors.some(err => err.field === expectedField);
          assert(hasFieldErr, `[${path}] error list correctly reports field: '${expectedField}'`);
        };

        // Pagination page edge cases
        await testInvalid('admin/dashboard/reports/search/books', '?page=abc', 'page', 'string-non-integer');
        await testInvalid('admin/dashboard/reports/search/books', '?page=0', 'page', 'zero-integer');
        await testInvalid('admin/dashboard/reports/search/books', '?page=-1', 'page', 'negative-integer');
        await testInvalid('admin/dashboard/reports/search/books', '?page=1.5', 'page', 'decimal-float');
        await testInvalid('admin/dashboard/reports/search/books', '?page=', 'page', 'empty-string');

        // Pagination limit edge cases
        await testInvalid('admin/dashboard/reports/search/books', '?limit=abc', 'limit', 'string-non-integer');
        await testInvalid('admin/dashboard/reports/search/books', '?limit=0', 'limit', 'zero-integer');
        await testInvalid('admin/dashboard/reports/search/books', '?limit=-5', 'limit', 'negative-integer');
        await testInvalid('admin/dashboard/reports/search/books', '?limit=101', 'limit', 'above-max-100');
        await testInvalid('admin/dashboard/reports/search/books', '?limit=1.2', 'limit', 'decimal-float');
        await testInvalid('admin/dashboard/reports/search/books', '?limit=', 'limit', 'empty-string');

        // SortOrder edge case
        await testInvalid('admin/dashboard/reports/search/books', '?sortOrder=invalid', 'sortOrder', 'invalid-order-string');

        // Search edge cases
        await testInvalid('admin/dashboard/reports/search/books', '?search=', 'search', 'empty-search-string');
        const longSearch = 'a'.repeat(101);
        await testInvalid('admin/dashboard/reports/search/books', `?search=${longSearch}`, 'search', 'above-max-length-100');

        // Date range edge cases
        await testInvalid('admin/dashboard/reports/search/books', '?fromDate=invalid-date', 'fromDate', 'invalid-format');
        await testInvalid('admin/dashboard/reports/search/books', '?fromDate=2026-02-30', 'fromDate', 'calendar-overflow-day-30');
        await testInvalid('admin/dashboard/reports/search/books', '?fromDate=2026-07-12&toDate=2026-07-10', 'fromDate', 'fromDate-after-toDate');

        // UUID edge cases
        await testInvalid('admin/dashboard/reports/search/books', '?categoryId=abc', 'categoryId', 'invalid-uuid-string');
        await testInvalid('admin/dashboard/reports/search/books', '?categoryId=', 'categoryId', 'empty-uuid-string');

        // Email edge cases
        await testInvalid('admin/dashboard/reports/search/members', '?email=invalid-email', 'email', 'invalid-email-format');

        // Role enum edge cases
        await testInvalid('admin/dashboard/reports/search/members', '?role=SUPERADMIN', 'role', 'non-existent-user-role');

        // isActive boolean edge cases
        await testInvalid('admin/dashboard/reports/search/members', '?isActive=maybe', 'isActive', 'non-boolean-string');

        // Overdue severity edge case
        await testInvalid('admin/dashboard/reports/overdue', '?severity=CRITICAL', 'severity', 'non-matching-severity-enum');

        // Required route parameters edge cases
        await testInvalid('admin/dashboard/reports/members/invalid-uuid', '', 'memberId', 'invalid-route-uuid');

        // 3. Check Error Aggregation (Multiple failures returned at once)
        console.log('\n--- 3. Error Aggregation (Multi-errors) Verification ---');
        const { body: aggBody } = await getRequest('admin/dashboard/reports/search/books', '?page=-1&limit=105&sortOrder=invalid');
        assert(aggBody.errors && aggBody.errors.length === 3, 'Returns all 3 validation errors simultaneously (no early abort)');
        assert(aggBody.errors.some(e => e.field === 'page'), 'Aggregated errors contain: page');
        assert(aggBody.errors.some(e => e.field === 'limit'), 'Aggregated errors contain: limit');
        assert(aggBody.errors.some(e => e.field === 'sortOrder'), 'Aggregated errors contain: sortOrder');

        // 4. Regression Checks (Dashboard Summary and Analytics work perfectly)
        console.log('\n--- 4. Dashboard Summary & Analytics Regression Checks ---');
        const { status: sumStatus } = await getRequest('admin/dashboard/summary');
        assert(sumStatus === 200, 'GET admin/dashboard/summary continues to work (HTTP 200)');

        const { status: borrowingStatus } = await getRequest('admin/dashboard/analytics/borrowing');
        assert(borrowingStatus === 200, 'GET admin/dashboard/analytics/borrowing continues to work (HTTP 200)');

        const { status: membersStatus } = await getRequest('admin/dashboard/analytics/members');
        assert(membersStatus === 200, 'GET admin/dashboard/analytics/members continues to work (HTTP 200)');

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
            console.log('All Reporting Search Validation checks verified successfully!');
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
