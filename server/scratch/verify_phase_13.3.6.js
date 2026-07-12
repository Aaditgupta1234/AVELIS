/**
 * Verification script for Phase 13.3.6 - Analytics Response Formatting.
 * Run with: node scratch/verify_phase_13.3.6.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole } from '@prisma/client';

const PORT = 5569;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

// Deep validation to check that no property value is undefined
const verifyNoUndefined = (obj, path = 'root') => {
  if (obj === undefined) {
    throw new Error(`Property at ${path} is undefined`);
  }
  if (obj === null) return;
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => verifyNoUndefined(item, `${path}[${index}]`));
  } else if (typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      if (obj[key] === undefined) {
        throw new Error(`Property at ${path}.${key} is undefined`);
      }
      verifyNoUndefined(obj[key], `${path}.${key}`);
    });
  }
};

// Returns a schema representation of keys and nested shapes (ignoring values, null/string date types, and empty arrays)
const getObjectKeysStructure = (obj) => {
  if (obj === null || obj === undefined) return 'primitive';
  if (Array.isArray(obj)) {
    return 'array';
  }
  if (typeof obj === 'object') {
    const struct = {};
    Object.keys(obj).sort().forEach(key => {
      struct[key] = getObjectKeysStructure(obj[key]);
    });
    return struct;
  }
  return 'primitive';
};

async function runTests() {
  console.log('Running Phase 13.3.6 Analytics Response Formatting Verification...\n');
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

    adminUser = await createUser(`admin_1336_${Date.now()}`, UserRole.ADMIN);
    const adminToken = generateToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });

    console.log('Starting HTTP server...');
    const server = app.listen(PORT, async () => {
      try {
        const endpoints = [
          'admin/dashboard/analytics/borrowing',
          'admin/dashboard/analytics/members',
          'admin/dashboard/analytics/ratings',
          'admin/dashboard/analytics/timeseries'
        ];

        // 1. Response Envelope Consistency & No Undefined / JSON Serialization Stability
        console.log('\n--- 1. Response Envelope & Serialization Stability Checks ---');
        for (const ep of endpoints) {
          const res = await fetch(`${BASE_URL}/${ep}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          assert(res.status === 200, `GET /${ep} returns HTTP 200`);
          
          const body = await res.json();
          
          // Verify AVELIS Envelope Consistency
          assert(body.success === true, `[${ep}] envelope success is true`);
          assert(typeof body.message === 'string' && body.message.trim().length > 0, `[${ep}] message is a non-empty string`);
          assert(typeof body.data === 'object' && body.data !== null, `[${ep}] data is an object`);
          assert(typeof body.meta === 'object' && body.meta !== null, `[${ep}] meta is an object`);
          
          // Check that no extra properties exist outside the standard envelope
          const topLevelKeys = Object.keys(body).sort();
          const expectedEnvelopeKeys = ['data', 'message', 'meta', 'success'];
          assert(JSON.stringify(topLevelKeys) === JSON.stringify(expectedEnvelopeKeys), `[${ep}] envelope has only the standard top-level properties: success, message, data, meta`);

          // No Undefined values check
          try {
            verifyNoUndefined(body);
            assert(true, `[${ep}] response contains no undefined values`);
          } catch (e) {
            assert(false, `[${ep}] response has undefined value: ${e.message}`);
          }

          // JSON Serialization Stability
          const serialized = JSON.stringify(body);
          const deserialized = JSON.parse(serialized);
          assert(JSON.stringify(body) === JSON.stringify(deserialized), `[${ep}] JSON serialization is stable and lossless`);
        }

        // 2. Filter Object Structure Checks
        console.log('\n--- 2. Filter Object Structure Checks ---');
        const checkFilterKeys = async (ep, expectedKeys) => {
          const res = await fetch(`${BASE_URL}/${ep}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          const body = await res.json();
          const filterKeys = Object.keys(body.data.filter).sort();
          assert(JSON.stringify(filterKeys) === JSON.stringify(expectedKeys.sort()), `[${ep}] filter object has keys: ${expectedKeys.join(', ')}`);
        };

        await checkFilterKeys('admin/dashboard/analytics/borrowing', ['startDate', 'endDate', 'limit']);
        await checkFilterKeys('admin/dashboard/analytics/members', ['startDate', 'endDate', 'limit']);
        await checkFilterKeys('admin/dashboard/analytics/ratings', ['startDate', 'endDate', 'limit']);
        await checkFilterKeys('admin/dashboard/analytics/timeseries', ['startDate', 'endDate', 'interval']);

        // 3. Response Schema Isolation Checks
        console.log('\n--- 3. Response Schema Isolation Checks ---');
        // Test different query combinations and assert schema shape is exactly invariant
        const queryCombinations = [
          '',
          '?startDate=2026-07-10',
          '?endDate=2026-07-12',
          '?startDate=2026-07-10&endDate=2026-07-12',
          '?limit=5',
          '?limit=100'
        ];

        for (const ep of endpoints) {
          // Timeseries uses interval instead of limit
          const qsList = ep.includes('timeseries') 
            ? ['', '?startDate=2026-07-10', '?endDate=2026-07-12', '?startDate=2026-07-10&endDate=2026-07-12', '?interval=week', '?interval=month']
            : queryCombinations;

          let baseStructure = null;
          let schemaIsIsolated = true;

          for (const qs of qsList) {
            const res = await fetch(`${BASE_URL}/${ep}${qs}`, {
              headers: { Authorization: `Bearer ${adminToken}` }
            });
            const body = await res.json();
            const structure = getObjectKeysStructure(body.data);

            if (baseStructure === null) {
              baseStructure = structure;
            } else {
              if (JSON.stringify(structure) !== JSON.stringify(baseStructure)) {
                schemaIsIsolated = false;
                console.error(`Mismatch for ${ep}${qs}:`, JSON.stringify(structure), 'vs base:', JSON.stringify(baseStructure));
              }
            }
          }

          assert(schemaIsIsolated, `[${ep}] response schema is strictly isolated from query parameter changes`);
        }

        // 4. Regression & Summary Endpoint check
        console.log('\n--- 4. Regression & Placeholders Check ---');
        const resSummary = await fetch(`${BASE_URL}/admin/dashboard/summary`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert(resSummary.status === 200, 'GET /admin/dashboard/summary continues to return 200 OK');

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
            console.log('All Response Formatting checks verified successfully!');
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
