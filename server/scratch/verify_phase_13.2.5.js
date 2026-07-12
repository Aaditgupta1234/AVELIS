/**
 * Verification script for Phase 13.2.5 - Dashboard Response Formatting.
 * Run with: node scratch/verify_phase_13.2.5.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole } from '@prisma/client';

const PORT = 5562;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.2.5 Dashboard Response Formatting Verification...\n');
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
      username: `admin_1325_${Date.now()}`,
      email: `admin_1325_${Date.now()}@test.com`,
      passwordHash: 'hashed',
      role: UserRole.ADMIN,
      isActive: true
    }
  });

  console.log('Generating JWT token...');
  const adminToken = generateToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });

  // Start the server
  const server = app.listen(PORT, async () => {
    try {
      // 1. Fetch Summary stats without filters
      console.log('\n--- 1. Fetching Summary (Unfiltered) ---');
      const res = await fetch(`${BASE_URL}/admin/dashboard/summary`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(res.status === 200, 'HTTP 200 OK returned successfully');
      
      const body = await res.json();
      
      // 2. Response Envelope stability checks
      console.log('\n--- 2. Response Envelope Checks ---');
      assert(body.success === true, 'Envelope success property is boolean true');
      assert(typeof body.message === 'string', 'Envelope message property is a string');
      assert(body.data !== null && typeof body.data === 'object', 'Envelope data is a valid object');

      const data = body.data;

      // 3. Correct Properties in Response Contract
      console.log('\n--- 3. Response Contract Shape Checks ---');
      assert(data.filter !== undefined, 'Contains filter block');
      assert(data.users !== undefined && typeof data.users.total === 'number' && typeof data.users.active === 'number', 'users contains total and active as numbers');
      assert(data.books !== undefined && typeof data.books.total === 'number' && typeof data.books.copies === 'number' && typeof data.books.availableCopies === 'number', 'books contains total, copies, availableCopies as numbers');
      assert(data.loans !== undefined && typeof data.loans.total === 'number' && typeof data.loans.active === 'number' && typeof data.loans.overdue === 'number', 'loans contains total, active, overdue as numbers');
      assert(data.reservations !== undefined && typeof data.reservations.total === 'number' && typeof data.reservations.pending === 'number' && typeof data.reservations.fulfilled === 'number', 'reservations contains total, pending, fulfilled as numbers');
      assert(data.orders !== undefined && typeof data.orders.total === 'number' && typeof data.orders.pending === 'number' && typeof data.orders.completed === 'number', 'orders contains total, pending, completed as numbers');

      // 4. Deprecated Keys Absence Check
      console.log('\n--- 4. Deprecated / Legacy Keys Check ---');
      assert(data.reservations.active === undefined, 'reservations.active legacy property is absent');
      assert(data.orders.active === undefined, 'orders.active legacy property is absent');

      // 5. Response Schema stability check (with optional filters)
      console.log('\n--- 5. Response Schema Stability Check (With Filters) ---');
      const resFiltered = await fetch(`${BASE_URL}/admin/dashboard/summary?startDate=2026-07-01&endDate=2026-07-10`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resFiltered.status === 200, 'Filtered query returns HTTP 200 OK');
      const bodyFiltered = await resFiltered.json();
      const dataFiltered = bodyFiltered.data;

      // Assert that filtered schema property structure is completely identical to unfiltered
      const keysUnfiltered = Object.keys(data).sort();
      const keysFiltered = Object.keys(dataFiltered).sort();
      assert(JSON.stringify(keysUnfiltered) === JSON.stringify(keysFiltered), 'Data keys structure matches exactly between filtered and unfiltered');

      const assertBlocksMatch = (blockName) => {
        const uKeys = Object.keys(data[blockName]).sort();
        const fKeys = Object.keys(dataFiltered[blockName]).sort();
        assert(JSON.stringify(uKeys) === JSON.stringify(fKeys), `Keys structure in '${blockName}' statistics block matches exactly`);
      };

      assertBlocksMatch('users');
      assertBlocksMatch('books');
      assertBlocksMatch('loans');
      assertBlocksMatch('reservations');
      assertBlocksMatch('orders');

      // 6. No Regressions check
      console.log('\n--- 6. No Regressions check (analytics & reports) ---');
      const resAnalytics = await fetch(`${BASE_URL}/admin/dashboard/analytics`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(resAnalytics.status === 501, 'GET /admin/dashboard/analytics returns 501 Not Implemented');

    } catch (e) {
      console.error('Response formatting tests failed with exception:', e);
    } finally {
      // Cleanup database records
      console.log('\nCleaning up database records...');
      try {
        await prisma.user.deleteMany({ where: { id: adminUser.id } });
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
          console.log('All Dashboard Summary Response Formatting checks verified successfully!');
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
