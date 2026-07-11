/**
 * Verification script for Phase 13.1.1 - Dashboard Module Initialization.
 * Run with: node scratch/verify_phase_13.1.1.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole } from '@prisma/client';

const PORT = 5557;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.1.1 Dashboard Scaffolding Verification...\n');
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
      username: `member_1311_${Date.now()}`,
      email: `member_1311_${Date.now()}@test.com`,
      passwordHash: 'hashed',
      role: UserRole.MEMBER,
      isActive: true
    }
  });

  const adminUser = await prisma.user.create({
    data: {
      username: `admin_1311_${Date.now()}`,
      email: `admin_1311_${Date.now()}@test.com`,
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
      const bodyUnauth = await resUnauth.json();
      assert(bodyUnauth.success === false, 'success envelope flag is false');

      // 2. Member request -> 403
      console.log('\n--- 2. Security check: Member Access ---');
      const resMember = await fetch(`${BASE_URL}/admin/dashboard/summary`, {
        headers: { Authorization: `Bearer ${memberToken}` }
      });
      assert(resMember.status === 403, 'Request with member token returns 403');
      const bodyMember = await resMember.json();
      assert(bodyMember.message.includes('Administrator privileges required'), 'Error message returns missing privileges warning');

      // 3. Admin request to summary -> 501
      console.log('\n--- 3. Admin request to summary ---');
      const resSummary = await fetch(`${BASE_URL}/admin/dashboard/summary`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resSummary.status === 501, 'Request to /summary by Admin returns 501 Not Implemented');
      const bodySummary = await resSummary.json();
      assert(bodySummary.success === false && bodySummary.message === 'Dashboard summary endpoint not implemented yet.', 'Returns standard error envelope');

      // 4. Admin request to analytics -> 501
      console.log('\n--- 4. Admin request to analytics ---');
      const resAnalytics = await fetch(`${BASE_URL}/admin/dashboard/analytics`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resAnalytics.status === 501, 'Request to /analytics by Admin returns 501 Not Implemented');
      const bodyAnalytics = await resAnalytics.json();
      assert(bodyAnalytics.success === false && bodyAnalytics.message === 'Analytics endpoint not implemented yet.', 'Returns standard error envelope');

      // 5. Admin request to reports -> 501
      console.log('\n--- 5. Admin request to reports ---');
      const resReports = await fetch(`${BASE_URL}/admin/dashboard/reports`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resReports.status === 501, 'Request to /reports by Admin returns 501 Not Implemented');
      const bodyReports = await resReports.json();
      assert(bodyReports.success === false && bodyReports.message === 'Reports endpoint not implemented yet.', 'Returns standard error envelope');

      // 6. No Route Conflicts: Verify that GET /api/v1/admin/loans still behaves correctly
      console.log('\n--- 6. No Route Conflicts check ---');
      const resLoans = await fetch(`${BASE_URL}/admin/loans`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resLoans.status === 200, 'GET /admin/loans remains registered and functional (returns 200)');
      const bodyLoans = await resLoans.json();
      assert(bodyLoans.success === true, 'GET /admin/loans returns standard success envelope');

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
          console.log('All Dashboard Module scaffolding features verified successfully!');
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
