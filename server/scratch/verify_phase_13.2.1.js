/**
 * Verification script for Phase 13.2.1 - Dashboard Summary Request Validation.
 * Run with: node scratch/verify_phase_13.2.1.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { validateDashboardSummary } from '../src/validations/dashboard.validation.js';
import { UserRole } from '@prisma/client';

const PORT = 5558;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.2.1 Dashboard Summary Query Validation Verification...\n');
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

  // 0. Setup test users
  console.log('Setting up database user records...');
  const memberUser = await prisma.user.create({
    data: {
      username: `member_1321_${Date.now()}`,
      email: `member_1321_${Date.now()}@test.com`,
      passwordHash: 'hashed',
      role: UserRole.MEMBER,
      isActive: true
    }
  });

  const adminUser = await prisma.user.create({
    data: {
      username: `admin_1321_${Date.now()}`,
      email: `admin_1321_${Date.now()}@test.com`,
      passwordHash: 'hashed',
      role: UserRole.ADMIN,
      isActive: true
    }
  });

  console.log('Generating JWT tokens...');
  const memberToken = generateToken({ id: memberUser.id, email: memberUser.email, role: memberUser.role });
  const adminToken = generateToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });

  // Start the server
  const server = app.listen(PORT, async () => {
    try {
      // 1. Unauthenticated request -> 401
      console.log('\n--- 1. Security check: Unauthenticated ---');
      const resUnauth = await fetch(`${BASE_URL}/admin/dashboard/summary`);
      assert(resUnauth.status === 401, 'Request without authorization header returns 401');

      // 2. Member request -> 403
      console.log('\n--- 2. Security check: Member Access ---');
      const resMember = await fetch(`${BASE_URL}/admin/dashboard/summary`, {
        headers: { Authorization: `Bearer ${memberToken}` }
      });
      assert(resMember.status === 403, 'Request with member token returns 403');

      // 3. Admin request (Empty query) -> 501
      console.log('\n--- 3. Admin request: Empty query ---');
      const resEmpty = await fetch(`${BASE_URL}/admin/dashboard/summary`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resEmpty.status === 501, 'Request with empty query parameters continues to 501');

      // 4. Valid startDate only -> 501
      console.log('\n--- 4. Admin request: Valid startDate only ---');
      const resValidStart = await fetch(`${BASE_URL}/admin/dashboard/summary?startDate=2026-07-01`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resValidStart.status === 501, 'Valid startDate query continues to 501');

      // 5. Valid endDate only -> 501
      console.log('\n--- 5. Admin request: Valid endDate only ---');
      const resValidEnd = await fetch(`${BASE_URL}/admin/dashboard/summary?endDate=2026-07-10`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resValidEnd.status === 501, 'Valid endDate query continues to 501');

      // 6. Valid date range -> 501
      console.log('\n--- 6. Admin request: Valid date range ---');
      const resValidRange = await fetch(`${BASE_URL}/admin/dashboard/summary?startDate=2026-07-01&endDate=2026-07-10`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resValidRange.status === 501, 'Valid date range query continues to 501');

      // 7. Empty parameters -> 400
      console.log('\n--- 7. Query validation: Empty parameters ---');
      const resEmptyParams = await fetch(`${BASE_URL}/admin/dashboard/summary?startDate=`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resEmptyParams.status === 400, 'Empty parameter returns 400 Bad Request');
      const bodyEmptyParams = await resEmptyParams.json();
      assert(bodyEmptyParams.success === false && bodyEmptyParams.errors[0].field === 'startDate', 'Error envelope contains correct field error details');

      // 8. Invalid calendar dates -> 400
      console.log('\n--- 8. Query validation: Invalid calendar date ---');
      const resInvalidCal = await fetch(`${BASE_URL}/admin/dashboard/summary?startDate=2026-02-30`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resInvalidCal.status === 400, 'Non-existent calendar date (2026-02-30) returns 400 Bad Request');
      const bodyInvalidCal = await resInvalidCal.json();
      assert(bodyInvalidCal.errors[0].message.includes('valid ISO-8601 date'), 'Returns correct calendar formatting error message');

      // 9. Invalid formats -> 400
      console.log('\n--- 9. Query validation: Invalid date formats ---');
      const resInvalidFormat = await fetch(`${BASE_URL}/admin/dashboard/summary?startDate=not-a-date`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resInvalidFormat.status === 400, 'Invalid format returns 400 Bad Request');

      // 10. Chronological order violation -> 400
      console.log('\n--- 10. Query validation: Chronological order violation ---');
      const resChrono = await fetch(`${BASE_URL}/admin/dashboard/summary?startDate=2026-07-10&endDate=2026-07-01`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resChrono.status === 400, 'startDate after endDate returns 400 Bad Request');
      const bodyChrono = await resChrono.json();
      assert(bodyChrono.errors[0].message.includes('cannot be after endDate'), 'Returns correct chronological error message');

      // 11. Query Parameter Sanitization (Unit Test)
      console.log('\n--- 11. Query Parameter Sanitization check ---');
      const mockReq = {
        query: {
          startDate: '2026-07-01',
          endDate: '2026-07-10',
          extraParam: 'hacked'
        }
      };
      const mockRes = {
        status: function(code) { this.statusCode = code; return this; },
        json: function(payload) { this.body = payload; return this; }
      };
      let nextCalled = false;
      const nextFn = () => { nextCalled = true; };

      validateDashboardSummary(mockReq, mockRes, nextFn);
      
      assert(nextCalled === true, 'validateDashboardSummary calls next() for valid inputs');
      assert(mockReq.query.startDate === '2026-07-01', 'Preserves valid startDate');
      assert(mockReq.query.endDate === '2026-07-10', 'Preserves valid endDate');
      assert(mockReq.query.extraParam === undefined, 'Sanitizes/removes other unknown query parameters completely');

    } catch (e) {
      console.error('Validation integration tests failed with exception:', e);
    } finally {
      // Cleanup database records
      console.log('\nCleaning up database records...');
      await prisma.user.deleteMany({ where: { id: { in: [memberUser.id, adminUser.id] } } });

      // Close the server and end process
      server.close(() => {
        console.log('HTTP server closed.');
        console.log(`\nVerification finished: ${passedCount}/${totalCount} checks passed.`);
        if (passedCount === totalCount) {
          console.log('All Dashboard Summary Query validation and sanitization features verified successfully!');
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
