/**
 * Verification script for Phase 12.2.2 - Borrow Route.
 * Run with: node scratch/verify_phase_12.2.2.js
 */

import { generateToken } from '../src/utils/jwt.js';

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

const memberToken = generateToken({ id: '00000000-0000-0000-0000-000000000001', email: 'member@test.com', role: 'MEMBER' });
const adminToken = generateToken({ id: '00000000-0000-0000-0000-000000000002', email: 'admin@test.com', role: 'ADMIN' });

const endpoints = [
  // 1. POST /loans (Member Borrow)
  {
    name: 'POST /loans (No Auth)',
    url: `${BASE_URL}/loans`,
    method: 'POST',
    headers: {},
    body: {},
    expectedStatus: 401
  },
  {
    name: 'POST /loans (Member Auth - Invalid Payload)',
    url: `${BASE_URL}/loans`,
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}`, 'Content-Type': 'application/json' },
    body: { bookCopyId: 123 },
    expectedStatus: 400
  },
  {
    name: 'POST /loans (Member Auth - Unknown Fields)',
    url: `${BASE_URL}/loans`,
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}`, 'Content-Type': 'application/json' },
    body: { bookCopyId: '550e8400-e29b-41d4-a716-446655440000', extra: 'bad' },
    expectedStatus: 400
  },
  {
    name: 'POST /loans (Member Auth - Valid Payload)',
    url: `${BASE_URL}/loans`,
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}`, 'Content-Type': 'application/json' },
    body: { bookCopyId: '550e8400-e29b-41d4-a716-446655440000' },
    expectedStatus: 501
  },
  // 2. POST /admin/loans (Migrated Admin Borrow)
  {
    name: 'POST /admin/loans (No Auth)',
    url: `${BASE_URL}/admin/loans`,
    method: 'POST',
    headers: {},
    body: {},
    expectedStatus: 401
  },
  {
    name: 'POST /admin/loans (Member Auth - Denied)',
    url: `${BASE_URL}/admin/loans`,
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}`, 'Content-Type': 'application/json' },
    body: {},
    expectedStatus: 403
  },
  {
    name: 'POST /admin/loans (Admin Auth - Invalid Payload)',
    url: `${BASE_URL}/admin/loans`,
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: { copyId: 123 },
    expectedStatus: 400
  },
  // 3. GET /loans (Preserved Admin Loan List in loan.routes.js)
  {
    name: 'GET /loans (Admin Auth - Preserved)',
    url: `${BASE_URL}/loans`,
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
    expectedStatus: 200
  },
  // 4. GET /admin/loans (Admin Loan List in admin.routes.js)
  {
    name: 'GET /admin/loans (Admin Auth)',
    url: `${BASE_URL}/admin/loans`,
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
    expectedStatus: 200
  }
];

async function runVerification() {
  console.log('Starting Phase 12.2.2 verification...');
  let passedCount = 0;
  
  for (const ep of endpoints) {
    try {
      const response = await fetch(ep.url, {
        method: ep.method,
        headers: ep.headers,
        body: ep.body ? JSON.stringify(ep.body) : undefined
      });
      
      const status = response.status;
      const responseText = await response.text();
      let responseJson = {};
      try {
        responseJson = JSON.parse(responseText);
      } catch (err) {
        // Not JSON
      }

      const match = status === ep.expectedStatus;
      
      if (match) {
        console.log(`[PASS] ${ep.name}: Got status ${status} as expected.`);
        passedCount++;
      } else {
        console.error(`[FAIL] ${ep.name}: Expected ${ep.expectedStatus}, got ${status}`);
        console.error(`Response body:`, responseJson);
      }
    } catch (error) {
      console.error(`[ERROR] Failed to make request for ${ep.name}:`, error.message);
    }
  }

  console.log(`\nVerification finished: ${passedCount}/${endpoints.length} checks passed.`);
  if (passedCount === endpoints.length) {
    console.log('All routes and middlewares verified successfully!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVerification();
