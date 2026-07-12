/**
 * Verification script for Phase 13.4.3 - Reporting Search Routes & Controllers.
 * Run with: node scratch/verify_phase_13.4.3.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole } from '@prisma/client';

const PORT = 5572;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.4.3 Reporting Search Routes & Controllers Verification...\n');
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

    adminUser = await createUser(`admin_1343_${Date.now()}`, UserRole.ADMIN);
    memberUser = await createUser(`member_1343_${Date.now()}`, UserRole.MEMBER);

    const adminToken = generateToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });
    const memberToken = generateToken({ id: memberUser.id, email: memberUser.email, role: memberUser.role });

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
          return { status: res.status, headers: res.headers, body };
        };

        const endpoints = [
          'admin/dashboard/reports/search/books',
          'admin/dashboard/reports/search/members',
          'admin/dashboard/reports/search/loans',
          'admin/dashboard/reports/search/reservations',
          'admin/dashboard/reports/search/orders',
          'admin/dashboard/reports/overdue',
          'admin/dashboard/reports/inventory',
          `admin/dashboard/reports/members/${validUUID}`
        ];

        // 2. Route Registration & Middleware Checks
        console.log('\n--- 2. Route Mappings and Security Middleware ---');
        for (const path of endpoints) {
          // Unauthenticated -> 401
          const { status: statusUnauth } = await getRequest(path, '', null);
          assert(statusUnauth === 401, `GET /${path} returns 401 when unauthenticated`);

          // Non-admin member -> 403
          const { status: statusMember } = await getRequest(path, '', memberToken);
          assert(statusMember === 403, `GET /${path} returns 403 Forbidden for non-admin member`);
        }

        // 3. Controller Delegation & 501 Responses
        console.log('\n--- 3. Controller Delegation to Service Layer (501 Checks) ---');
        for (const path of endpoints) {
          const { status, headers, body } = await getRequest(path);

          // Returns 501 Not Implemented because controller successfully delegates to service placeholders
          assert(status === 501, `GET /${path} successfully delegates and returns 501 Not Implemented`);

          // Headers content type
          const contentType = headers.get('content-type');
          assert(contentType && contentType.includes('application/json'), `GET /${path} responds with JSON Content-Type`);

          // Standard AVELIS error envelope
          assert(body.success === false, `GET /${path} returns standard error envelope (success: false)`);
          assert(typeof body.message === 'string' && body.message.trim().length > 0, `GET /${path} returns a non-empty descriptive error message`);
        }

        // 4. Validator Middleware Wiring Verification
        console.log('\n--- 4. Validator Middleware Wiring Checks ---');
        
        // Check GET /search/books accepts AVAILABLE, but rejects PLACED (status must match CopyStatus enum)
        const { status: bookValid } = await getRequest('admin/dashboard/reports/search/books', '?status=AVAILABLE');
        assert(bookValid === 501, 'GET /search/books accepts CopyStatus (AVAILABLE) -> passes validation');

        const { status: bookInvalid } = await getRequest('admin/dashboard/reports/search/books', '?status=PLACED');
        assert(bookInvalid === 400, 'GET /search/books rejects OrderStatus (PLACED) -> validation error');

        // Check GET /search/orders accepts PLACED, but rejects AVAILABLE (status must match OrderStatus enum)
        const { status: orderValid } = await getRequest('admin/dashboard/reports/search/orders', '?status=PLACED');
        assert(orderValid === 501, 'GET /search/orders accepts OrderStatus (PLACED) -> passes validation');

        const { status: orderInvalid } = await getRequest('admin/dashboard/reports/search/orders', '?status=AVAILABLE');
        assert(orderInvalid === 400, 'GET /search/orders rejects CopyStatus (AVAILABLE) -> validation error');

        // Check GET /overdue accepts severity=HIGH, but rejects severity=CRITICAL
        const { status: overdueValid } = await getRequest('admin/dashboard/reports/overdue', '?severity=HIGH');
        assert(overdueValid === 501, 'GET /overdue accepts severity (HIGH) -> passes validation');

        const { status: overdueInvalid } = await getRequest('admin/dashboard/reports/overdue', '?severity=CRITICAL');
        assert(overdueInvalid === 400, 'GET /overdue rejects invalid severity (CRITICAL) -> validation error');

        // 5. Regression Checks
        console.log('\n--- 5. Regression Checks ---');
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
            console.log('All Reporting Search Routes & Controllers checks verified successfully!');
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
