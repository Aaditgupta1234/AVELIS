/**
 * Verification script for Phase 12.2.3 - Borrow Controller.
 * Run with: node scratch/verify_phase_12.2.3.js
 */

import { generateToken } from '../src/utils/jwt.js';

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

const memberToken = generateToken({ id: '00000000-0000-0000-0000-000000000001', email: 'member@test.com', role: 'MEMBER' });

const endpoints = [
  // 1. POST /loans (Member Borrow) - Unauthenticated
  {
    name: 'POST /loans (No Auth)',
    url: `${BASE_URL}/loans`,
    method: 'POST',
    headers: {},
    body: {},
    expectedStatus: 401,
    expectedErrorMsg: 'Authorization header is missing'
  },
  // 2. POST /loans (Member Borrow) - Invalid payload (caught by validation layer)
  {
    name: 'POST /loans (Member Auth - Invalid Payload)',
    url: `${BASE_URL}/loans`,
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}`, 'Content-Type': 'application/json' },
    body: { bookCopyId: 123 },
    expectedStatus: 400,
    expectedErrorMsg: 'bookCopyId must be a string.'
  },
  // 3. POST /loans (Member Borrow) - Valid payload (delegated to service and returns 501 specific error)
  {
    name: 'POST /loans (Member Auth - Valid Payload)',
    url: `${BASE_URL}/loans`,
    method: 'POST',
    headers: { Authorization: `Bearer ${memberToken}`, 'Content-Type': 'application/json' },
    body: { bookCopyId: '550e8400-e29b-41d4-a716-446655440000' },
    expectedStatus: 501,
    expectedErrorMsg: 'Member borrow service has not yet been implemented.'
  }
];

async function runVerification() {
  console.log('Starting Phase 12.2.3 verification...');
  let passedCount = 0;
  
  for (const ep of endpoints) {
    try {
      const response = await fetch(ep.url, {
        method: ep.method,
        headers: ep.headers,
        body: ep.body ? JSON.stringify(ep.body) : undefined
      });
      
      const status = response.status;
      const responseJson = await response.json();

      const matchStatus = status === ep.expectedStatus;
      
      let matchError = false;
      if (status === 401) {
        matchError = responseJson.message === ep.expectedErrorMsg;
      } else if (status === 400) {
        matchError = responseJson.errors?.some(err => err.message === ep.expectedErrorMsg);
      } else if (status === 501) {
        matchError = responseJson.message === ep.expectedErrorMsg;
      }

      if (matchStatus && matchError) {
        console.log(`[PASS] ${ep.name}: Got status ${status} and expected error message.`);
        passedCount++;
      } else {
        console.error(`[FAIL] ${ep.name}: Expected status ${ep.expectedStatus} and message "${ep.expectedErrorMsg}", but got status ${status} and response:`, responseJson);
      }
    } catch (error) {
      console.error(`[ERROR] Failed to make request for ${ep.name}:`, error.message);
    }
  }

  console.log(`\nVerification finished: ${passedCount}/${endpoints.length} checks passed.`);
  if (passedCount === endpoints.length) {
    console.log('All controller orchestration and delegation layers verified successfully!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVerification();
