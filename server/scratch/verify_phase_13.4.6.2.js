/**
 * Verification script for Phase 13.4.6.2 - Inventory Report Route & Controller.
 * Run with: node scratch/verify_phase_13.4.6.2.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const PORT = 5576;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.4.6.2 Inventory Report Route & Controller Verification...\n');
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

    adminUser = await createUser(`admin_13462_${Date.now()}`, UserRole.ADMIN);
    memberUser = await createUser(`member_13462_${Date.now()}`, UserRole.MEMBER);

    const adminToken = generateToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });
    const memberToken = generateToken({ id: memberUser.id, email: memberUser.email, role: memberUser.role });
    const validUUID = '87654321-4321-4321-4321-123456789012';

    console.log('Starting HTTP server...');
    const server = app.listen(PORT, async () => {
      try {
        const getRequest = async (path, queryStr = '', token = adminToken) => {
          const res = await fetch(`${BASE_URL}/${path}${queryStr}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          const body = res.status === 204 ? null : await res.json();
          return { status: res.status, body };
        };

        const routePath = 'admin/dashboard/reports/inventory';

        // 1. Route Mapping and Security Middleware
        console.log('\n--- 1. Route Mapping and Security Middleware ---');
        
        // Unauthenticated -> 401
        const { status: statusUnauth } = await getRequest(routePath, '', null);
        assert(statusUnauth === 401, 'GET /inventory returns 401 when unauthenticated');

        // Non-admin member -> 403
        const { status: statusMember } = await getRequest(routePath, '', memberToken);
        assert(statusMember === 403, 'GET /inventory returns 403 Forbidden for non-admin member');

        // 2. Request Validation Rejection
        console.log('\n--- 2. Request Validation Rejection ---');
        const { status: statusInvalid } = await getRequest(routePath, '?page=invalid');
        assert(statusInvalid === 400, 'GET /inventory returns 400 Bad Request on invalid query params');

        // 3. Controller Delegation & Response
        console.log('\n--- 3. Controller Delegation & Response ---');

        const { status: statusValid, body: bodyValid } = await getRequest(
          routePath,
          `?page=2&limit=50&sortBy=availableCopies&sortOrder=desc&availability=maintenance&includeZeroAvailable=true&categoryId=${validUUID}&authorId=${validUUID}&publisher=Test%20Publisher&search=1984`
        );

        // 501 expected since service is still a placeholder returning 501
        assert(statusValid === 501, 'Valid request delegates and returns 501 Not Implemented');
        assert(bodyValid.success === false && bodyValid.message.includes('Inventory Report API not implemented yet'), 'Response forwards service placeholder message');

        // Static Code Analysis for delegation count and argument signature checks
        console.log('\n--- Static Code Analysis delegation checks ---');
        const controllerFilePath = path.resolve('src/modules/reporting/reporting.controller.js');
        const content = fs.readFileSync(controllerFilePath, 'utf8');

        const matches = content.match(/reportingService\.getInventoryReport\s*\(/g);
        assert(matches && matches.length === 1, 'Controller delegates to reportingService.getInventoryReport exactly once');

        // Verify that it passes req.query directly without transformation
        const hasDirectQueryArg = /reportingService\.getInventoryReport\s*\(\s*req\.query\s*\)/.test(content);
        assert(hasDirectQueryArg, 'Controller passes req.query directly without side-effects or transformations');

        // 4. Regression Checks
        console.log('\n--- 4. Regression Checks ---');
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
            console.log('All Inventory Report Route & Controller checks verified successfully!');
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
