import { adminMiddleware } from '../src/middleware/admin.middleware.js';
import { ApiError } from '../src/utils/index.js';
import { UserRole } from '@prisma/client';

console.log('RBAC Authorization Middleware Test Suite\n========================================');

const createMockReq = (userContext) => ({
  user: userContext,
  body: {},
  query: {},
  headers: {}
});

const createMockRes = () => ({
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(payload) {
    this.body = payload;
    return this;
  }
});

const runTest = (name, reqContext, expectSuccess) => {
  const req = createMockReq(reqContext);
  const res = createMockRes();
  let nextCalled = false;
  let errorPassed = null;

  const next = (err) => {
    nextCalled = true;
    errorPassed = err;
  };

  adminMiddleware(req, res, next);

  if (expectSuccess) {
    if (nextCalled && !errorPassed) {
      console.log(`PASS: ${name} -> Request correctly proceeded to controller.`);
    } else {
      console.log(`FAIL: ${name} -> Expected request to proceed, but got error:`, errorPassed);
    }
  } else {
    if (nextCalled && errorPassed instanceof ApiError && errorPassed.statusCode === 403) {
      console.log(`PASS: ${name} -> Correctly blocked with 403 Forbidden: "${errorPassed.message}"`);
    } else {
      console.log(`FAIL: ${name} -> Expected 403 Forbidden, but nextCalled=${nextCalled}, error=`, errorPassed);
    }
  }
};

// Test Case 1: Authenticated ADMIN user
runTest('Test Case 1: ADMIN user', { role: UserRole.ADMIN }, true);

// Test Case 2: Authenticated MEMBER user
runTest('Test Case 2: MEMBER user', { role: UserRole.MEMBER }, false);

// Test Case 3: Missing req.user (unauthenticated request)
runTest('Test Case 3: Missing req.user', null, false);

// Test Case 4: Malformed req.user (empty object)
runTest('Test Case 4: Empty user object', {}, false);

// Test Case 5: Missing req.user.role
runTest('Test Case 5: Missing user role', { id: 'some-id' }, false);

// Test Case 6: Role is null/undefined
runTest('Test Case 6a: User role is null', { role: null }, false);
runTest('Test Case 6b: User role is undefined', { role: undefined }, false);
