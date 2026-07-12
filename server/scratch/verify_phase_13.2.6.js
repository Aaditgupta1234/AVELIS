/**
 * Verification script for Phase 13.2.6 - Dashboard Production Refinement & Verification.
 * Run with: node scratch/verify_phase_13.2.6.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole } from '@prisma/client';

const PORT = 5563;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.2.6 Dashboard Production Audit Verification...\n');
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

  // 0. Setup test user
  console.log('Setting up database admin user...');
  const adminUser = await prisma.user.create({
    data: {
      username: `admin_1326_${Date.now()}`,
      email: `admin_1326_${Date.now()}@test.com`,
      passwordHash: 'hashed',
      role: UserRole.ADMIN,
      isActive: true
    }
  });

  const memberUser = await prisma.user.create({
    data: {
      username: `member_1326_${Date.now()}`,
      email: `member_1326_${Date.now()}@test.com`,
      passwordHash: 'hashed',
      role: UserRole.MEMBER,
      isActive: true
    }
  });

  console.log('Generating JWT tokens...');
  const adminToken = generateToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });
  const memberToken = generateToken({ id: memberUser.id, email: memberUser.email, role: memberUser.role });

  // Start the server
  const server = app.listen(PORT, async () => {
    try {
      // 1. Security check: Unauthenticated -> 401
      console.log('\n--- 1. Security check: Unauthenticated ---');
      const resUnauth = await fetch(`${BASE_URL}/admin/dashboard/summary`);
      assert(resUnauth.status === 401, 'Request without authorization header returns HTTP 401');
      const bodyUnauth = await resUnauth.json();
      assert(bodyUnauth.success === false, 'Error envelope has success: false');

      // 2. Security check: Member Access -> 403
      console.log('\n--- 2. Security check: Member Access ---');
      const resMember = await fetch(`${BASE_URL}/admin/dashboard/summary`, {
        headers: { Authorization: `Bearer ${memberToken}` }
      });
      assert(resMember.status === 403, 'Request with member token returns HTTP 403');
      const bodyMember = await resMember.json();
      assert(bodyMember.success === false, 'Error envelope has success: false');

      // 3. Validation path error -> 400 Bad Request
      console.log('\n--- 3. Validation Check: Invalid Date ---');
      const resInvalidDate = await fetch(`${BASE_URL}/admin/dashboard/summary?startDate=2026-02-30`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resInvalidDate.status === 400, 'Querying invalid calendar date 2026-02-30 returns HTTP 400');
      const bodyInvalidDate = await resInvalidDate.json();
      assert(bodyInvalidDate.success === false, 'Error envelope has success: false');
      assert(Array.isArray(bodyInvalidDate.errors), 'Response contains structured error array');

      // 4. Successful E2E Pipeline query -> 200 OK
      console.log('\n--- 4. Success Pipeline Check (E2E) ---');
      const resSuccess = await fetch(`${BASE_URL}/admin/dashboard/summary?startDate=2026-07-01&endDate=2026-07-10`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resSuccess.status === 200, 'Valid admin query returns HTTP 200 OK');
      const bodySuccess = await resSuccess.json();
      assert(bodySuccess.success === true, 'Success envelope has success: true');
      assert(bodySuccess.data !== null && typeof bodySuccess.data === 'object', 'Success data is present object');

      const data = bodySuccess.data;
      assert(data.filter.startDate === '2026-07-01', 'startDate matches input');
      assert(data.filter.endDate === '2026-07-10', 'endDate matches input');
      assert(typeof data.users.total === 'number', 'users total is numeric');
      assert(typeof data.books.total === 'number', 'books total is numeric');
      assert(typeof data.loans.total === 'number', 'loans total is numeric');
      assert(typeof data.reservations.total === 'number', 'reservations total is numeric');
      assert(typeof data.orders.total === 'number', 'orders total is numeric');

      // 5. Deprecated Keys Absence Check
      console.log('\n--- 5. Deprecated Keys Check ---');
      assert(data.reservations.active === undefined, 'reservations.active legacy property is absent');
      assert(data.orders.active === undefined, 'orders.active legacy property is absent');

      // 6. Centralized Error handling check -> 501 Not Implemented
      console.log('\n--- 6. Centralized Error Handling Check ---');
      const res501 = await fetch(`${BASE_URL}/admin/dashboard/analytics`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(res501.status === 501, 'Analytics endpoint correctly returns HTTP 501 Not Implemented');
      const body501 = await res501.json();
      assert(body501.success === false, 'Error envelope has success: false');
      assert(body501.message === 'Analytics endpoint not implemented yet.', 'Centralized handler formats the correct error message');

    } catch (e) {
      console.error('Production audit tests failed with exception:', e);
    } finally {
      // Cleanup database records
      console.log('\nCleaning up database records...');
      try {
        await prisma.user.deleteMany({ where: { id: { in: [adminUser.id, memberUser.id] } } });
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
          console.log('All Dashboard Summary Production Refinement checks verified successfully!');
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
