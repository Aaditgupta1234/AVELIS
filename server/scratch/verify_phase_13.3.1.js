/**
 * Verification script for Phase 13.3.1 - Analytics Module Scaffolding.
 * Run with: node scratch/verify_phase_13.3.1.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole } from '@prisma/client';

const PORT = 5564;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.3.1 Analytics Scaffolding Verification...\n');
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
  console.log('Setting up database users...');
  
  const memberUser = await prisma.user.create({
    data: {
      username: `member_1331_${Date.now()}`,
      email: `member_1331_${Date.now()}@test.com`,
      passwordHash: 'hashed',
      role: UserRole.MEMBER,
      isActive: true
    }
  });

  const adminUser = await prisma.user.create({
    data: {
      username: `admin_1331_${Date.now()}`,
      email: `admin_1331_${Date.now()}@test.com`,
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
      console.log('\n--- 1. Security Check: Unauthenticated ---');
      const resUnauth = await fetch(`${BASE_URL}/admin/dashboard/analytics`);
      assert(resUnauth.status === 401, 'Root analytics route returns 401 when unauthenticated');
      
      const resUnauthSub = await fetch(`${BASE_URL}/admin/dashboard/analytics/borrowing`);
      assert(resUnauthSub.status === 401, 'Sub-endpoint /borrowing returns 401 when unauthenticated');

      // 2. Member request -> 403
      console.log('\n--- 2. Security Check: Member Access ---');
      const resMember = await fetch(`${BASE_URL}/admin/dashboard/analytics/borrowing`, {
        headers: { Authorization: `Bearer ${memberToken}` }
      });
      assert(resMember.status === 403, 'Sub-endpoint /borrowing returns 403 for member role');

      // 3. Analytics Root Endpoint -> 501
      console.log('\n--- 3. Root Endpoint Verification ---');
      const resRoot = await fetch(`${BASE_URL}/admin/dashboard/analytics`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resRoot.status === 501, 'GET /admin/dashboard/analytics returns 501 Not Implemented');
      const bodyRoot = await resRoot.json();
      assert(bodyRoot.success === false, 'Error envelope has success: false');
      assert(bodyRoot.message === 'Analytics endpoint not implemented yet.', 'Root analytics message is correct');

      // 4. Placeholder Endpoints and Route Isolation Verification
      console.log('\n--- 4. Placeholders & Route Isolation Verification ---');
      
      const verifyPlaceholder = async (endpoint, expectedMsg) => {
        const res = await fetch(`${BASE_URL}/admin/dashboard/analytics/${endpoint}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert(res.status === 501, `GET /analytics/${endpoint} returns 501 Not Implemented`);
        const body = await res.json();
        assert(body.success === false, `Error envelope for /${endpoint} has success: false`);
        assert(body.message === expectedMsg, `Correct message returned: "${body.message}"`);
      };

      await verifyPlaceholder('borrowing', 'Borrowing Analytics endpoint not implemented yet.');
      await verifyPlaceholder('members', 'Member Analytics endpoint not implemented yet.');
      await verifyPlaceholder('ratings', 'Rating Analytics endpoint not implemented yet.');
      await verifyPlaceholder('timeseries', 'Time-Series Analytics endpoint not implemented yet.');

      // 5. HTTP Method Validation (POST to GET route -> 404)
      console.log('\n--- 5. HTTP Method Isolation Check ---');
      const resPost = await fetch(`${BASE_URL}/admin/dashboard/analytics/borrowing`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resPost.status === 404, 'POST to GET /analytics/borrowing returns HTTP 404 Not Found');

      // 6. Dashboard Summary Regression
      console.log('\n--- 6. Dashboard Summary Regression Check ---');
      const resSummary = await fetch(`${BASE_URL}/admin/dashboard/summary`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resSummary.status === 200, 'GET /admin/dashboard/summary still returns HTTP 200 OK');

    } catch (e) {
      console.error('Scaffolding tests failed with exception:', e);
    } finally {
      // Cleanup database records
      console.log('\nCleaning up database records...');
      try {
        await prisma.user.deleteMany({ where: { id: { in: [memberUser.id, adminUser.id] } } });
      } catch (cleanupErr) {
        console.error('Database record cleanup error:', cleanupErr);
      }
      try {
        await prisma.$disconnect();
      } catch (disconnectErr) {
        console.error('Prisma disconnect error:', disconnectErr);
      }

      // Close the server and end process
      server.close(() => {
        console.log('HTTP server closed.');
        console.log(`\nVerification finished: ${passedCount}/${totalCount} checks passed.`);
        if (passedCount === totalCount) {
          console.log('All Dashboard Analytics Scaffold checks verified successfully!');
          setTimeout(() => process.exit(0), 100);
        } else {
          setTimeout(() => process.exit(1), 100);
        }
      });
    }
  });
}

runTests().catch((err) => {
  console.error('Fatal unhandled error:', err);
  process.exit(1);
});
