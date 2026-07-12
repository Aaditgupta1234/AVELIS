/**
 * Verification script for Phase 13.4.1 - Reporting Module Initialization.
 * Run with: node scratch/verify_phase_13.4.1.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole } from '@prisma/client';

const PORT = 5570;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.4.1 Reporting Module Initialization Verification...\n');
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

  let adminUser, memberUser;
  const createdUserIds = [];

  try {
    // 1. Server Startup Regression
    console.log('--- 1. Server Startup Regression ---');
    assert(app !== undefined && typeof app.listen === 'function', 'Express app starts and resolves correctly');

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

    adminUser = await createUser(`admin_1341_${Date.now()}`, UserRole.ADMIN);
    memberUser = await createUser(`member_1341_${Date.now()}`, UserRole.MEMBER);

    const adminToken = generateToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });
    const memberToken = generateToken({ id: memberUser.id, email: memberUser.email, role: memberUser.role });

    console.log('Starting HTTP server...');
    const server = app.listen(PORT, async () => {
      try {
        const endpoints = [
          { path: 'admin/dashboard/reports/search/books', method: 'GET' },
          { path: 'admin/dashboard/reports/search/members', method: 'GET' },
          { path: 'admin/dashboard/reports/search/loans', method: 'GET' },
          { path: 'admin/dashboard/reports/search/reservations', method: 'GET' },
          { path: 'admin/dashboard/reports/search/orders', method: 'GET' },
          { path: 'admin/dashboard/reports/overdue', method: 'GET' },
          { path: 'admin/dashboard/reports/inventory', method: 'GET' },
          { path: 'admin/dashboard/reports/members/some-member-id', method: 'GET' }
        ];

        // 2. Authentication & Authorization Checks
        console.log('\n--- 2. Security Middleware Checks ---');
        for (const ep of endpoints) {
          // Unauthenticated -> 401
          const resUnauth = await fetch(`${BASE_URL}/${ep.path}`, { method: ep.method });
          assert(resUnauth.status === 401, `Unauthenticated request to ${ep.method} /${ep.path} returns 401`);

          // Member -> 403
          const resMember = await fetch(`${BASE_URL}/${ep.path}`, {
            method: ep.method,
            headers: { Authorization: `Bearer ${memberToken}` }
          });
          assert(resMember.status === 403, `Member request to ${ep.method} /${ep.path} returns 403 Forbidden`);
        }

        // 3. Endpoint Integration & 501 Placeholder Checks
        console.log('\n--- 3. Placeholder API Integration (501 Checks) ---');
        for (const ep of endpoints) {
          const res = await fetch(`${BASE_URL}/${ep.path}`, {
            method: ep.method,
            headers: { Authorization: `Bearer ${adminToken}` }
          });

          // Route exists & HTTP method is correct -> returns 501 Not Implemented
          assert(res.status === 501, `Admin request to ${ep.method} /${ep.path} returns 501 Not Implemented`);

          // Content type is application/json
          const contentType = res.headers.get('content-type');
          assert(contentType && contentType.includes('application/json'), `[${ep.path}] returns JSON content-type`);

          const body = await res.json();

          // Standard AVELIS error envelope
          assert(body.success === false, `[${ep.path}] error envelope has success: false`);
          assert(typeof body.message === 'string' && body.message.trim().length > 0, `[${ep.path}] error envelope contains a non-empty descriptive message`);
          assert(Array.isArray(body.errors), `[${ep.path}] error envelope has errors list array`);
        }

        // 4. Regression Checks
        console.log('\n--- 4. Dashboard summary & Analytics Regression ---');
        const checkRoute200 = async (path) => {
          const res = await fetch(`${BASE_URL}/${path}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          assert(res.status === 200, `GET /${path} continues to return HTTP 200`);
        };

        await checkRoute200('admin/dashboard/summary');
        await checkRoute200('admin/dashboard/analytics/borrowing');
        await checkRoute200('admin/dashboard/analytics/members');
        await checkRoute200('admin/dashboard/analytics/ratings');
        await checkRoute200('admin/dashboard/analytics/timeseries');

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
            console.log('All Reporting Module Initialization checks verified successfully!');
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
