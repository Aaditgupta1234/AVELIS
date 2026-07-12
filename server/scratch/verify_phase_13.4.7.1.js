/**
 * Verification script for Phase 13.4.7.1 - Member Report Validation.
 * Run with: node scratch/verify_phase_13.4.7.1.js
 */

import { validateMemberReport } from '../src/modules/reporting/reporting.validation.js';

async function runTests() {
  console.log('Running Phase 13.4.7.1 Member Report Validation Verification...\n');
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

  const testValidator = (reqMock) => {
    let nextCalled = false;
    let errorStatus = null;
    let errorBody = null;

    const resMock = {
      status(code) {
        errorStatus = code;
        return this;
      },
      json(data) {
        errorBody = data;
        return this;
      }
    };

    const nextMock = () => {
      nextCalled = true;
    };

    validateMemberReport(reqMock, resMock, nextMock);

    return { nextCalled, errorStatus, errorBody };
  };

  const validUUID = '12345678-1234-1234-1234-123456789012';

  // 1. Valid Query & Params Normalization Checks
  console.log('--- 1. Valid Query & Params Normalization Checks ---');
  
  const req1 = {
    params: { memberId: validUUID },
    query: {}
  };
  const res1 = testValidator(req1);
  assert(res1.nextCalled && !res1.errorStatus, 'Empty query passes validation');
  assert(req1.query.page === 1, 'Default page is 1');
  assert(req1.query.limit === 20, 'Default limit is 20');
  assert(req1.query.sortBy === 'createdAt', 'Default sortBy is "createdAt"');
  assert(req1.query.sortOrder === 'desc', 'Default sortOrder is "desc"');
  assert(req1.query.activityType === 'all', 'Default activityType is "all"');
  assert(req1.params.memberId === validUUID, 'memberId is preserved in params');

  const req2 = {
    params: { memberId: `  ${validUUID}  ` },
    query: {
      page: '3',
      limit: '50',
      sortBy: 'createdAt',
      sortOrder: 'asc',
      activityType: 'LOANS'
    }
  };
  const res2 = testValidator(req2);
  assert(res2.nextCalled && !res2.errorStatus, 'Valid custom parameters pass validation');
  assert(req2.query.page === 3, 'Page parsed as integer 3');
  assert(req2.query.limit === 50, 'Limit parsed as integer 50');
  assert(req2.query.sortBy === 'createdAt', 'sortBy is "createdAt"');
  assert(req2.query.sortOrder === 'asc', 'sortOrder is "asc"');
  assert(req2.query.activityType === 'loans', 'activityType normalized to lowercase "loans"');
  assert(req2.params.memberId === validUUID, 'memberId was trimmed');

  // 2. Invalid Parameters Rejections
  console.log('\n--- 2. Invalid Parameters Rejections ---');

  // Malformed UUID
  const req3 = { params: { memberId: 'invalid-uuid' }, query: {} };
  const res3 = testValidator(req3);
  assert(!res3.nextCalled && res3.errorStatus === 400, 'Malformed memberId UUID returns 400 Bad Request');
  assert(res3.errorBody.errors.some(e => e.field === 'memberId'), 'Error details list field "memberId"');

  // Out of bounds page
  const req4 = { params: { memberId: validUUID }, query: { page: '0' } };
  const res4 = testValidator(req4);
  assert(!res4.nextCalled && res4.errorStatus === 400, 'Page = 0 returns 400 Bad Request');
  assert(res4.errorBody.errors.some(e => e.field === 'page'), 'Error details list field "page"');

  // Out of bounds limit
  const req5 = { params: { memberId: validUUID }, query: { limit: '101' } };
  const res5 = testValidator(req5);
  assert(!res5.nextCalled && res5.errorStatus === 400, 'Limit = 101 returns 400 Bad Request');
  assert(res5.errorBody.errors.some(e => e.field === 'limit'), 'Error details list field "limit"');

  // Unsupported activityType
  const req6 = { params: { memberId: validUUID }, query: { activityType: 'invalid' } };
  const res6 = testValidator(req6);
  assert(!res6.nextCalled && res6.errorStatus === 400, 'Unsupported activityType returns 400 Bad Request');
  assert(res6.errorBody.errors.some(e => e.field === 'activityType'), 'Error details list field "activityType"');

  // Unsupported sortBy
  const req7 = { params: { memberId: validUUID }, query: { sortBy: 'invalid' } };
  const res7 = testValidator(req7);
  assert(!res7.nextCalled && res7.errorStatus === 400, 'Unsupported sortBy returns 400 Bad Request');
  assert(res7.errorBody.errors.some(e => e.field === 'sortBy'), 'Error details list field "sortBy"');

  // Unsupported sortOrder
  const req8 = { params: { memberId: validUUID }, query: { sortOrder: 'random' } };
  const res8 = testValidator(req8);
  assert(!res8.nextCalled && res8.errorStatus === 400, 'Unsupported sortOrder returns 400 Bad Request');
  assert(res8.errorBody.errors.some(e => e.field === 'sortOrder'), 'Error details list field "sortOrder"');

  // Discard unexpected path parameters
  console.log('\n--- 3. Path Parameters Sanitization ---');
  const req9 = {
    params: { memberId: validUUID, extraParam: 'hack' },
    query: {}
  };
  const res9 = testValidator(req9);
  assert(res9.nextCalled && !res9.errorStatus, 'Request with extra path parameters passes');
  assert(req9.params.memberId === validUUID, 'memberId is preserved');
  assert(req9.params.extraParam === undefined, 'Unexpected path parameter "extraParam" was discarded');

  console.log(`\nVerification finished: ${passedCount}/${totalCount} checks passed.`);
  if (passedCount === totalCount) {
    console.log('All Member Report Validation checks verified successfully!');
    process.exit(0);
  } else {
    console.log('Some checks failed.');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Unhandled fatal exception:', err);
  process.exit(1);
});
