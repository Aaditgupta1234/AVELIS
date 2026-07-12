/**
 * Verification script for Phase 13.2.2 - Dashboard Summary Route & Controller Implementation.
 * Run with: node scratch/verify_phase_13.2.2.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { getDashboardSummary } from '../src/controllers/dashboard.controller.js';
import { UserRole } from '@prisma/client';

const PORT = 5559;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.2.2 Dashboard Summary Routing & Controller Verification...\n');
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
      username: `member_1322_${Date.now()}`,
      email: `member_1322_${Date.now()}@test.com`,
      passwordHash: 'hashed',
      role: UserRole.MEMBER,
      isActive: true
    }
  });

  const adminUser = await prisma.user.create({
    data: {
      username: `admin_1322_${Date.now()}`,
      email: `admin_1322_${Date.now()}@test.com`,
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
      assert(resEmpty.status === 501, 'Request with empty query parameters returns 501 Not Implemented');

      // 4. Valid range -> 501
      console.log('\n--- 4. Admin request: Valid range ---');
      const resValidRange = await fetch(`${BASE_URL}/admin/dashboard/summary?startDate=2026-07-01&endDate=2026-07-10`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resValidRange.status === 501, 'Valid date range query returns 501 Not Implemented');

      // 5. Invalid query input enforcement
      console.log('\n--- 5. Query validation enforcement check ---');
      const resInvalidCal = await fetch(`${BASE_URL}/admin/dashboard/summary?startDate=2026-02-30`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resInvalidCal.status === 400, 'Invalid calendar date returns 400 Bad Request');

      const resChrono = await fetch(`${BASE_URL}/admin/dashboard/summary?startDate=2026-07-10&endDate=2026-07-01`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resChrono.status === 400, 'startDate after endDate returns 400 Bad Request');

      // 6. No Regressions: Verify other dashboard endpoints
      console.log('\n--- 6. No Regressions check (analytics & reports) ---');
      const resAnalytics = await fetch(`${BASE_URL}/admin/dashboard/analytics`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resAnalytics.status === 501, 'GET /admin/dashboard/analytics returns 501 Not Implemented');

      const resReports = await fetch(`${BASE_URL}/admin/dashboard/reports`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resReports.status === 501, 'GET /admin/dashboard/reports returns 501 Not Implemented');

      // 7. Controller Parameter Forwarding & No Mutation (Unit Test)
      console.log('\n--- 7. Controller Unit Test: Parameter Forwarding & No Mutation ---');
      const mockReq = {
        query: {
          startDate: '2026-07-01',
          endDate: '2026-07-10'
        }
      };
      const originalQuery = { ...mockReq.query };
      const mockRes = {
        status: function(code) { this.statusCode = code; return this; },
        json: function(payload) { this.body = payload; return this; }
      };
      let errorPassed = null;
      const mockNext = (err) => { errorPassed = err; };

      await getDashboardSummary(mockReq, mockRes, mockNext);

      assert(errorPassed !== null, 'Controller catches error and passes it to next(error)');
      assert(errorPassed.statusCode === 501, 'Passed error has 501 status code');
      assert(errorPassed.message.includes('implemented yet'), 'Passed error is from the dashboard service placeholder');
      assert(mockReq.query.startDate === originalQuery.startDate, 'Controller does not mutate req.query.startDate');
      assert(mockReq.query.endDate === originalQuery.endDate, 'Controller does not mutate req.query.endDate');

    } catch (e) {
      console.error('Scaffolding tests failed with exception:', e);
    } finally {
      // Cleanup database records
      console.log('\nCleaning up database records...');
      await prisma.user.deleteMany({ where: { id: { in: [memberUser.id, adminUser.id] } } });

      // Close the server and end process
      server.close(() => {
        console.log('HTTP server closed.');
        console.log(`\nVerification finished: ${passedCount}/${totalCount} checks passed.`);
        if (passedCount === totalCount) {
          console.log('All Dashboard Summary Routing and Controller features verified successfully!');
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
