/**
 * Verification script for Phase 12.2.1 - Borrow Request Validation.
 * Run with: node scratch/verify_phase_12.2.1.js
 */

import { borrowBookValidator } from '../src/validations/loan.validation.js';

const testCases = [
  {
    name: '1. Valid Payload',
    req: { body: { bookCopyId: '550e8400-e29b-41d4-a716-446655440000' } },
    expectNext: true,
    expectStatus: null,
    verifyReqBody: (req) => req.body.bookCopyId === '550e8400-e29b-41d4-a716-446655440000'
  },
  {
    name: '2. Missing bookCopyId',
    req: { body: {} },
    expectNext: false,
    expectStatus: 400,
    expectedErrorField: 'bookCopyId',
    expectedErrorMessage: 'bookCopyId is required.'
  },
  {
    name: '3. Null bookCopyId',
    req: { body: { bookCopyId: null } },
    expectNext: false,
    expectStatus: 400,
    expectedErrorField: 'bookCopyId',
    expectedErrorMessage: 'bookCopyId is required.'
  },
  {
    name: '4. Empty String bookCopyId',
    req: { body: { bookCopyId: '' } },
    expectNext: false,
    expectStatus: 400,
    expectedErrorField: 'bookCopyId',
    expectedErrorMessage: 'bookCopyId cannot be empty.'
  },
  {
    name: '5. Whitespace Only bookCopyId',
    req: { body: { bookCopyId: '   ' } },
    expectNext: false,
    expectStatus: 400,
    expectedErrorField: 'bookCopyId',
    expectedErrorMessage: 'bookCopyId cannot be empty.'
  },
  {
    name: '6. Number Value bookCopyId',
    req: { body: { bookCopyId: 123 } },
    expectNext: false,
    expectStatus: 400,
    expectedErrorField: 'bookCopyId',
    expectedErrorMessage: 'bookCopyId must be a string.'
  },
  {
    name: '7. Array Value bookCopyId',
    req: { body: { bookCopyId: [] } },
    expectNext: false,
    expectStatus: 400,
    expectedErrorField: 'bookCopyId',
    expectedErrorMessage: 'bookCopyId must be a string.'
  },
  {
    name: '8. Object Value bookCopyId',
    req: { body: { bookCopyId: {} } },
    expectNext: false,
    expectStatus: 400,
    expectedErrorField: 'bookCopyId',
    expectedErrorMessage: 'bookCopyId must be a string.'
  },
  {
    name: '9. Invalid UUID bookCopyId',
    req: { body: { bookCopyId: 'invalid-uuid-format' } },
    expectNext: false,
    expectStatus: 400,
    expectedErrorField: 'bookCopyId',
    expectedErrorMessage: 'bookCopyId must be a valid UUID.'
  },
  {
    name: '10. Unknown Fields',
    req: { body: { bookCopyId: '550e8400-e29b-41d4-a716-446655440000', extraField: 'hello' } },
    expectNext: false,
    expectStatus: 400,
    expectedErrorField: 'extraField',
    expectedErrorMessage: 'Unknown request fields are not allowed: extraField'
  },
  {
    name: '11. Null request body',
    req: { body: null },
    expectNext: false,
    expectStatus: 400,
    expectedErrorField: 'bookCopyId',
    expectedErrorMessage: 'bookCopyId is required.'
  },
  {
    name: '12. Array request body',
    req: { body: [] },
    expectNext: false,
    expectStatus: 400,
    expectedErrorField: 'bookCopyId',
    expectedErrorMessage: 'bookCopyId is required.'
  },
  {
    name: '13. Primitive request body',
    req: { body: 'invalid-body' },
    expectNext: false,
    expectStatus: 400,
    expectedErrorField: 'bookCopyId',
    expectedErrorMessage: 'bookCopyId is required.'
  }
];

function runTests() {
  console.log('Running Phase 12.2.1 validator unit tests...\n');
  let passedCount = 0;

  for (const tc of testCases) {
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    const res = {
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };

    // Deep clone request to avoid cross-test contamination
    const req = {
      body: tc.req.body !== undefined ? JSON.parse(JSON.stringify(tc.req.body)) : undefined
    };

    try {
      borrowBookValidator(req, res, next);

      let success = true;
      if (nextCalled !== tc.expectNext) {
        console.error(`[FAIL] ${tc.name}: nextCalled got ${nextCalled}, expected ${tc.expectNext}`);
        success = false;
      }

      if (res.statusCode !== tc.expectStatus) {
        console.error(`[FAIL] ${tc.name}: res.statusCode got ${res.statusCode}, expected ${tc.expectStatus}`);
        success = false;
      }

      if (tc.expectNext && tc.verifyReqBody) {
        if (!tc.verifyReqBody(req)) {
          console.error(`[FAIL] ${tc.name}: req.body mutation failed validation checks.`);
          success = false;
        }
      }

      if (!tc.expectNext && tc.expectedErrorField) {
        const errors = res.body?.errors || [];
        const hasError = errors.some(
          err => err.field === tc.expectedErrorField && err.message === tc.expectedErrorMessage
        );
        if (!hasError) {
          console.error(`[FAIL] ${tc.name}: Expected error on field "${tc.expectedErrorField}" with message "${tc.expectedErrorMessage}". Got:`, res.body);
          success = false;
        }
      }

      if (success) {
        console.log(`[PASS] ${tc.name}`);
        passedCount++;
      }
    } catch (err) {
      console.error(`[ERROR] ${tc.name}: Validator threw an unexpected exception:`, err);
    }
  }

  console.log(`\nVerification finished: ${passedCount}/${testCases.length} checks passed.`);
  if (passedCount === testCases.length) {
    console.log('All validator unit checks passed successfully!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
