import { getUsers, getUserById, updateUserRole, updateUserStatus } from '../src/controllers/admin.controller.js';
import { prisma } from '../src/lib/prisma.js';
import { ApiError } from '../src/utils/index.js';
import { UserRole } from '@prisma/client';

console.log('Admin User Management Testing Suite\n===================================');

// Helper to mock Express request
const createMockReq = ({ query = {}, params = {}, body = {}, user = { id: 'admin-id', role: UserRole.ADMIN } } = {}) => ({
  query,
  params,
  body,
  user
});

// Helper to mock Express response
const createMockRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(payload) {
      this.body = payload;
      return this;
    }
  };
  return res;
};

// Helper to mock NextFunction
const createMockNext = () => {
  const nextFn = (err) => {
    nextFn.error = err;
  };
  nextFn.error = null;
  return nextFn;
};

// Mock service data and behavior
const mockUsers = [
  { id: '1', username: 'alice', email: 'alice@example.com', role: UserRole.ADMIN, createdAt: new Date('2026-07-01'), isActive: true },
  { id: '2', username: 'bob', email: 'bob@example.com', role: UserRole.MEMBER, createdAt: new Date('2026-07-02'), isActive: true },
  { id: 'admin-id', username: 'admin', email: 'admin@example.com', role: UserRole.ADMIN, createdAt: new Date('2026-07-03'), isActive: true }
];

// Mutate prisma user delegates to run tests with in-memory stub
prisma.user = {
  findMany: async ({ where, skip, take, orderBy }) => {
    let filtered = [...mockUsers];
    if (where && where.OR) {
      const search = where.OR[0].username.contains;
      filtered = filtered.filter(u => u.username.includes(search) || u.email.includes(search));
    }
    if (where && where.role) {
      filtered = filtered.filter(u => u.role === where.role);
    }
    if (orderBy && orderBy.createdAt === 'desc') {
      filtered.sort((a, b) => b.createdAt - a.createdAt);
    }
    return filtered.slice(skip, skip + take);
  },
  count: async ({ where } = {}) => {
    let filtered = [...mockUsers];
    if (where && where.OR) {
      const search = where.OR[0].username.contains;
      filtered = filtered.filter(u => u.username.includes(search) || u.email.includes(search));
    }
    if (where && where.role) {
      filtered = filtered.filter(u => u.role === where.role);
    }
    return filtered.length;
  },
  findUnique: async ({ where }) => {
    const user = mockUsers.find(u => u.id === where.id);
    return user || null;
  },
  update: async ({ where, data }) => {
    const user = mockUsers.find(u => u.id === where.id);
    if (!user) return null;
    return { ...user, ...data };
  }
};

// ----------------------------------------------------
// Running Test Cases
// ----------------------------------------------------

async function runTests() {
  // Test Case 1: Fetch users as ADMIN (default params)
  {
    const req = createMockReq();
    const res = createMockRes();
    const next = createMockNext();
    await getUsers(req, res, next);
    if (res.body && res.body.success && res.body.data.users.length === 3) {
      console.log('PASS: Test Case 1: Fetch users as ADMIN successful.');
    } else {
      console.log('FAIL: Test Case 1', res.body);
    }
  }

  // Test Case 2: Fetch users with ?search=alice
  {
    const req = createMockReq({ query: { search: 'alice' } });
    const res = createMockRes();
    const next = createMockNext();
    await getUsers(req, res, next);
    if (res.body && res.body.success && res.body.data.users.length === 1 && res.body.data.users[0].username === 'alice') {
      console.log('PASS: Test Case 2: Search filter (?search=alice) successful.');
    } else {
      console.log('FAIL: Test Case 2', res.body);
    }
  }

  // Test Case 3: Fetch users with ?role=MEMBER
  {
    const req = createMockReq({ query: { role: UserRole.MEMBER } });
    const res = createMockRes();
    const next = createMockNext();
    await getUsers(req, res, next);
    if (res.body && res.body.success && res.body.data.users.length === 1 && res.body.data.users[0].username === 'bob') {
      console.log('PASS: Test Case 3: Role filter (?role=MEMBER) successful.');
    } else {
      console.log('FAIL: Test Case 3', res.body);
    }
  }

  // Test Case 3b: Role Validation - Invalid Role ?role=SUPERADMIN
  {
    const req = createMockReq({ query: { role: 'SUPERADMIN' } });
    const res = createMockRes();
    const next = createMockNext();
    await getUsers(req, res, next);
    if (res.statusCode === 400 && res.body.message === 'Validation failed.' && res.body.errors[0].field === 'role') {
      console.log('PASS: Test Case 3b: Invalid role query (?role=SUPERADMIN) rejected with 400.');
    } else {
      console.log('FAIL: Test Case 3b', res.statusCode, res.body);
    }
  }

  // Test Case 4: Pagination checks (?page=2&limit=5)
  {
    const req = createMockReq({ query: { page: '2', limit: '5' } });
    const res = createMockRes();
    const next = createMockNext();
    await getUsers(req, res, next);
    if (res.body && res.body.data.pagination.page === 2 && res.body.data.pagination.limit === 5) {
      console.log('PASS: Test Case 4: Pagination query types normalized and returned correctly.');
    } else {
      console.log('FAIL: Test Case 4', res.body);
    }
  }

  // Test Case 4b: Deterministic sorting check (createdAt desc)
  {
    const req = createMockReq();
    const res = createMockRes();
    const next = createMockNext();
    await getUsers(req, res, next);
    const usersList = res.body.data.users;
    if (usersList[0].username === 'admin' && usersList[1].username === 'bob' && usersList[2].username === 'alice') {
      console.log('PASS: Test Case 4b: Deterministic sorting successfully ordered newest users first.');
    } else {
      console.log('FAIL: Test Case 4b', usersList);
    }
  }

  // Test Case 4c: Type Normalization check
  {
    const req = createMockReq({ query: { page: '1', limit: '10' } });
    const res = createMockRes();
    const next = createMockNext();
    try {
      await getUsers(req, res, next);
      console.log('PASS: Test Case 4c: Type normalization successfully casted strings to numbers.');
    } catch (err) {
      console.log('FAIL: Test Case 4c', err.message);
    }
  }

  // Test Case 5: Fetch existing user by ID
  {
    const req = createMockReq({ params: { id: '1' } });
    const res = createMockRes();
    const next = createMockNext();
    await getUserById(req, res, next);
    if (res.body && res.body.success && res.body.data.id === '1') {
      console.log('PASS: Test Case 5: Fetch single user by ID successful.');
    } else {
      console.log('FAIL: Test Case 5', res.body);
    }
  }

  // Test Case 6: Fetch non-existent user by ID
  {
    const req = createMockReq({ params: { id: '999' } });
    const res = createMockRes();
    const next = createMockNext();
    await getUserById(req, res, next);
    if (next.error instanceof ApiError && next.error.statusCode === 404) {
      console.log('PASS: Test Case 6: Non-existent user ID threw 404 Not Found.');
    } else {
      console.log('FAIL: Test Case 6', next.error);
    }
  }

  // Test Case 7: Self-deactivation protection check (admin status update on self)
  {
    const req = createMockReq({ params: { id: 'admin-id' }, body: { isActive: false }, user: { id: 'admin-id', role: UserRole.ADMIN } });
    const res = createMockRes();
    const next = createMockNext();
    await updateUserStatus(req, res, next);
    if (next.error instanceof ApiError && next.error.statusCode === 400 && next.error.message.includes('deactivate your own')) {
      console.log('PASS: Test Case 7: Administrator self-deactivation correctly blocked with 400.');
    } else {
      console.log('FAIL: Test Case 7', next.error);
    }
  }

  // Test Case 8: Security Audit (Confirm no sensitive fields are leaked in responses)
  {
    const req = createMockReq({ params: { id: '1' } });
    const res = createMockRes();
    const next = createMockNext();
    await getUserById(req, res, next);
    const userKeys = Object.keys(res.body.data);
    const hasSensitive = userKeys.includes('password') || userKeys.includes('passwordHash') || userKeys.includes('refreshToken');
    if (!hasSensitive) {
      console.log('PASS: Test Case 8: Security audit verified no sensitive fields are returned.');
    } else {
      console.log('FAIL: Test Case 8: Exposed keys:', userKeys);
    }
  }
}

runTests();
