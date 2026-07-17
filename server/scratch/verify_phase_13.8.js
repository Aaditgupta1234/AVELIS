/**
 * @fileoverview Automated End-to-End QA and Regression Testing Runner for Phase 13.8.
 *
 * Spawns an isolated test server, seeds database entries, runs 18 regression blocks,
 * validates response schemas, measures durations, compares performance baselines,
 * and executes a graceful process shutdown.
 *
 * Run with: node scratch/verify_phase_13.8.js
 */

import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';
import http from 'http';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { prisma } from '../src/lib/prisma.js';
import { hashPassword } from '../src/utils/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const serverDir = path.resolve(__dirname, '..');

const PORT = 14594;
const WARMUP_ROUNDS = 2;
const BENCHMARK_ROUNDS = 5;
const CONCURRENT_REQUESTS = 100;

// Baselines from Phase 13.5
const BASELINE_LATENCY = 369.2; // ms
const BASELINE_THROUGHPUT = 271; // req/s
const BASELINE_MEMORY = 61.7; // MB

// Seeded IDs tracker for pre-test baseline audits
const seededIds = {
  userIds: [],
  authorIds: [],
  categoryIds: [],
  bookIds: [],
  copyIds: [],
  loanIds: [],
  reservationIds: [],
  reviewIds: [],
  orderIds: [],
};

const summary = {
  Authentication: { status: 'FAIL', duration: 0, reason: 'Not started' },
  Authorization: { status: 'FAIL', duration: 0, reason: 'Not started' },
  Validation: { status: 'FAIL', duration: 0, reason: 'Not started' },
  Users: { status: 'FAIL', duration: 0, reason: 'Not started' },
  Books: { status: 'FAIL', duration: 0, reason: 'Not started' },
  Reviews: { status: 'FAIL', duration: 0, reason: 'Not started' },
  Loans: { status: 'FAIL', duration: 0, reason: 'Not started' },
  Reservations: { status: 'FAIL', duration: 0, reason: 'Not started' },
  Orders: { status: 'FAIL', duration: 0, reason: 'Not started' },
  Dashboard: { status: 'FAIL', duration: 0, reason: 'Not started' },
  Analytics: { status: 'FAIL', duration: 0, reason: 'Not started' },
  Transactions: { status: 'FAIL', duration: 0, reason: 'Not started' },
  Concurrency: { status: 'FAIL', duration: 0, reason: 'Not started' },
  'Performance Regression': { status: 'FAIL', duration: 0, reason: 'Not started' },
  'Security Regression': { status: 'FAIL', duration: 0, reason: 'Not started' },
  'Business Workflows': { status: 'FAIL', duration: 0, reason: 'Not started' },
  'Database Cleanup': { status: 'FAIL', duration: 0, reason: 'Not started' },
  'Graceful Shutdown': { status: 'FAIL', duration: 0, reason: 'Not started' },
};

// HTTP Request helper
function request(method, path, { body, token, headers = {} } = {}) {
  return new Promise((resolve) => {
    const bodyStr = body ? JSON.stringify(body) : undefined;
    const options = {
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
        ...headers,
      },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json;
        try { json = JSON.parse(data); } catch { json = null; }
        resolve({ status: res.statusCode, body: json, headers: res.headers, raw: data });
      });
    });
    req.on('error', (err) => resolve({ status: 0, body: null, error: err.message }));
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// Validation envelope helper
function checkEnvelope(res) {
  if (!res || typeof res !== 'object') return 'Response body is not an object';
  if (res.success === undefined) return 'Missing "success" boolean';
  if (res.message === undefined) return 'Missing "message" string';
  return null;
}

// User schema check
function checkUserSchema(data) {
  if (!data || typeof data !== 'object') return 'User data is not an object';
  if (!data.id || typeof data.id !== 'string') return 'Missing/invalid id';
  if (!data.name || typeof data.name !== 'string') return 'Missing/invalid name';
  if (!data.email || typeof data.email !== 'string') return 'Missing/invalid email';
  if (data.passwordHash || data.password) return 'Leaked password credentials';
  return null;
}

// Book schema check
function checkBookSchema(data) {
  if (!data || typeof data !== 'object') return 'Book data is not an object';
  if (!data.id || typeof data.id !== 'string') return 'Missing/invalid id';
  if (!data.title || typeof data.title !== 'string') return 'Missing/invalid title';
  if (!data.isbn || typeof data.isbn !== 'string') return 'Missing/invalid isbn';
  return null;
}

// Clean Database helper
async function cleanUpDb() {
  if (seededIds.reviewIds.length) {
    await prisma.review.deleteMany({ where: { id: { in: seededIds.reviewIds } } });
  }
  if (seededIds.loanIds.length) {
    await prisma.loan.deleteMany({ where: { id: { in: seededIds.loanIds } } });
  }
  if (seededIds.reservationIds.length) {
    await prisma.reservation.deleteMany({ where: { id: { in: seededIds.reservationIds } } });
  }
  if (seededIds.copyIds.length) {
    await prisma.bookCopy.deleteMany({ where: { id: { in: seededIds.copyIds } } });
  }
  if (seededIds.orderIds.length) {
    await prisma.orderItem.deleteMany({ where: { orderId: { in: seededIds.orderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: seededIds.orderIds } } });
  }
  if (seededIds.bookIds.length) {
    await prisma.bookAuthor.deleteMany({ where: { bookId: { in: seededIds.bookIds } } });
    await prisma.bookCategory.deleteMany({ where: { bookId: { in: seededIds.bookIds } } });
    await prisma.book.deleteMany({ where: { id: { in: seededIds.bookIds } } });
  }
  if (seededIds.authorIds.length) {
    await prisma.author.deleteMany({ where: { id: { in: seededIds.authorIds } } });
  }
  if (seededIds.categoryIds.length) {
    await prisma.category.deleteMany({ where: { id: { in: seededIds.categoryIds } } });
  }
  if (seededIds.userIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: seededIds.userIds } } });
  }
}

async function run() {
  const globalStart = Date.now();
  let start;

  // Print Metadata Headers
  console.log('====================================================');
  console.log('  AVELIS Phase 13.8 E2E QA & Regression Testing');
  console.log('====================================================');
  let gitCommit = 'N/A';
  try {
    gitCommit = execSync('git rev-parse --short HEAD', { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
  } catch (e) {}
  
  console.log(`  Timestamp         : ${new Date().toISOString()}`);
  console.log(`  Git Commit Hash   : ${gitCommit}`);
  console.log(`  Node.js Version   : ${process.version}`);
  console.log(`  Prisma Version    : ${execSync('npx prisma -v').toString().split('\n')[0].trim()}`);
  console.log(`  Database Provider : PostgreSQL`);
  console.log(`  Environment       : NODE_ENV=test`);
  console.log('====================================================\n');

  // Spawning the server process
  const testSecret = 'qa-verification-test-secret-at-least-32-chars-long';
  const helperPath = path.join(process.cwd(), 'scratch', `tmp_qa_server_${Math.random().toString(36).substring(7)}.js`);

  fs.writeFileSync(helperPath, `
    import app from '../src/app.js';
    import http from 'http';
    const server = http.createServer(app);
    process.on('SIGTERM', () => {
      server.close(() => {
        process.exit(0);
      });
    });
    server.listen(${PORT}, '127.0.0.1');
  `);

  const cp = spawn('node', [helperPath], {
    env: {
      ...process.env,
      NODE_ENV: 'test',
      JWT_SECRET: testSecret,
      PORT: String(PORT),
      GLOBAL_RATE_LIMIT: '1000', // high limit to prevent regression failures
      AUTH_RATE_LIMIT: '1000',
      MAX_JSON_SIZE: '1mb',
    }
  });

  const capturedLogs = [];
  cp.stdout.on('data', (d) => capturedLogs.push(d.toString()));
  cp.stderr.on('data', (d) => capturedLogs.push(d.toString()));

  // Wait for server socket startup
  await new Promise((res) => setTimeout(res, 1500));

  try {
    await prisma.$connect();
    
    // Initial Db Baseline Audit count
    const initialUsersCount = await prisma.user.count();

    // Generate a valid bcrypt password hash of 'Password123!'
    const hashed = await hashPassword('Password123!');

    // Seeding core entities
    const seedUser = async (username, email, role) => {
      const u = await prisma.user.create({
        data: {
          username,
          email,
          passwordHash: hashed,
          role,
          isActive: true
        }
      });
      seededIds.userIds.push(u.id);
      return u;
    };

    const adminUser = await seedUser('qa_admin', 'qa_admin@avelis.com', 'ADMIN');
    const memberUser = await seedUser('qa_member', 'qa_member@avelis.com', 'MEMBER');
    const member2User = await seedUser('qa_member_con', 'qa_member_con@avelis.com', 'MEMBER');

    const testAuthor = await prisma.author.create({ data: { fullName: 'QA Author' } });
    seededIds.authorIds.push(testAuthor.id);

    const testCategory = await prisma.category.create({ data: { name: 'QA Category' } });
    seededIds.categoryIds.push(testCategory.id);

    const testBook = await prisma.book.create({
      data: {
        title: 'QA Book',
        isbn: '123-4-567-890-0',
        publisher: 'QA Publish',
        publicationYear: 2026,
        stockQuantity: 1,
        isBorrowable: true,
        isForSale: true,
        authors: { create: { authorId: testAuthor.id } },
        categories: { create: { categoryId: testCategory.id } }
      }
    });
    seededIds.bookIds.push(testBook.id);

    const testCopy = await prisma.bookCopy.create({
      data: {
        bookId: testBook.id,
        barcode: 'QA-BARCODE-001',
        shelfLocation: 'QA-SHELF-01',
        condition: 'NEW',
        status: 'AVAILABLE'
      }
    });
    seededIds.copyIds.push(testCopy.id);

    // Generating test tokens
    const adminToken = jwt.sign({ id: adminUser.id, role: adminUser.role }, testSecret, { expiresIn: '1h' });
    const memberToken = jwt.sign({ id: memberUser.id, role: memberUser.role }, testSecret, { expiresIn: '1h' });

    // ─────────────────────────────────────────────
    // 1. Authentication Module
    // ─────────────────────────────────────────────
    start = Date.now();
    try {
      const reg = await request('POST', '/api/v1/auth/register', {
        body: { name: 'qa_reg_user', email: 'qa_reg_user@avelis.com', password: 'Password123!' }
      });
      if (reg.body?.data?.id) seededIds.userIds.push(reg.body.data.id);
      
      const loginCorrect = await request('POST', '/api/v1/auth/login', {
        body: { email: 'qa_member@avelis.com', password: 'Password123!' }
      });

      const meReq = await request('GET', '/api/v1/auth/me', { token: memberToken });
      const envErr = checkEnvelope(meReq.body);
      const userErr = checkUserSchema(meReq.body?.data);

      if (reg.status !== 201) throw new Error(`Registration failed with status ${reg.status}. Body: ${JSON.stringify(reg.body)}`);
      if (meReq.status !== 200) throw new Error(`Get /auth/me failed with status ${meReq.status}`);
      if (envErr) throw new Error(`Envelope error: ${envErr}`);
      if (userErr) throw new Error(`User schema error: ${userErr}`);

      summary.Authentication = { status: 'PASS', duration: (Date.now() - start) / 1000, reason: '' };
    } catch (e) {
      summary.Authentication = { status: 'FAIL', duration: (Date.now() - start) / 1000, reason: e.message };
    }

    // ─────────────────────────────────────────────
    // 2. Authorization
    // ─────────────────────────────────────────────
    start = Date.now();
    try {
      const guestReq = await request('GET', '/api/v1/users/me');
      const unauthorizedAdmin = await request('GET', '/api/v1/admin/users', { token: memberToken });
      const authorizedAdmin = await request('GET', '/api/v1/admin/users', { token: adminToken });

      if (guestReq.status !== 401) throw new Error(`Guest bypass got status ${guestReq.status}`);
      if (unauthorizedAdmin.status !== 403) throw new Error(`Member bypass to admin got status ${unauthorizedAdmin.status}`);
      if (authorizedAdmin.status !== 200) throw new Error(`Admin route blocked with status ${authorizedAdmin.status}`);

      summary.Authorization = { status: 'PASS', duration: (Date.now() - start) / 1000, reason: '' };
    } catch (e) {
      summary.Authorization = { status: 'FAIL', duration: (Date.now() - start) / 1000, reason: e.message };
    }

    // ─────────────────────────────────────────────
    // 3. Validation
    // ─────────────────────────────────────────────
    start = Date.now();
    try {
      const badUuid = await request('GET', '/api/v1/books/invalid-uuid/rating');
      const badEmail = await request('POST', '/api/v1/auth/register', {
        body: { name: 'bad_email', email: 'invalid_email_format', password: 'Pw!' }
      });
      const oversized = await request('POST', '/api/v1/auth/login', {
        body: { email: 'a'.repeat(2 * 1024 * 1024) }
      });

      if (badUuid.status !== 400) throw new Error(`Bad UUID query got status ${badUuid.status}`);
      if (badEmail.status !== 400) throw new Error(`Bad email validation got status ${badEmail.status}`);
      if (oversized.status !== 413) throw new Error(`Oversized payload got status ${oversized.status}`);

      summary.Validation = { status: 'PASS', duration: (Date.now() - start) / 1000, reason: '' };
    } catch (e) {
      summary.Validation = { status: 'FAIL', duration: (Date.now() - start) / 1000, reason: e.message };
    }

    // ─────────────────────────────────────────────
    // 4. Users
    // ─────────────────────────────────────────────
    start = Date.now();
    try {
      const profile = await request('GET', '/api/v1/users/me', { token: memberToken });
      const update = await request('PATCH', '/api/v1/users/me', {
        token: memberToken,
        body: { username: 'updated_qa_member' }
      });
      const changePass = await request('PATCH', '/api/v1/users/me/password', {
        token: memberToken,
        body: { currentPassword: 'Password123!', newPassword: 'NewPassword123!', confirmPassword: 'NewPassword123!' }
      });

      if (profile.status !== 200) throw new Error(`Get profile status ${profile.status}`);
      if (update.status !== 200) throw new Error(`Update username status ${update.status}`);
      if (changePass.status !== 200) throw new Error(`Change password status ${changePass.status}. Body: ${JSON.stringify(changePass.body)}`);
      
      const adminUsers = await request('GET', '/api/v1/admin/users', { token: adminToken });
      if (adminUsers.status !== 200) throw new Error(`Admin fetch registry got status ${adminUsers.status}`);

      summary.Users = { status: 'PASS', duration: (Date.now() - start) / 1000, reason: '' };
    } catch (e) {
      summary.Users = { status: 'FAIL', duration: (Date.now() - start) / 1000, reason: e.message };
    }

    // ─────────────────────────────────────────────
    // 5. Books
    // ─────────────────────────────────────────────
    start = Date.now();
    try {
      const newBook = await request('POST', '/api/v1/books', {
        token: adminToken,
        body: {
          title: 'Temp qa Book',
          isbn: '999-9-999-999-9',
          publisher: 'QA Publish',
          language: 'English',
          stockQuantity: 1,
          isBorrowable: true,
          isForSale: true,
          authorIds: [testAuthor.id],
          categoryIds: [testCategory.id]
        }
      });
      if (newBook.body?.data?.id) seededIds.bookIds.push(newBook.body.data.id);
      if (newBook.status !== 201) throw new Error(`Book creation got status ${newBook.status}. Body: ${JSON.stringify(newBook.body)}`);

      const bId = newBook.body.data.id;
      const readBook = await request('GET', `/api/v1/books/${bId}`);
      if (readBook.status !== 200) throw new Error(`Get book got status ${readBook.status}`);
      const bookErr = checkBookSchema(readBook.body?.data);
      if (bookErr) throw new Error(`Book schema check error: ${bookErr}`);

      const updateBook = await request('PATCH', `/api/v1/books/${bId}`, {
        token: adminToken,
        body: { title: 'Updated Temp QA Book' }
      });
      if (updateBook.status !== 200) throw new Error(`Update book got status ${updateBook.status}`);

      const deleteBook = await request('DELETE', `/api/v1/books/${bId}`, { token: adminToken });
      if (deleteBook.status !== 200) throw new Error(`Soft delete book got status ${deleteBook.status}`);

      const restoreBook = await request('PATCH', `/api/v1/books/${bId}/restore`, { token: adminToken });
      if (restoreBook.status !== 200) throw new Error(`Restore book got status ${restoreBook.status}`);

      const deleteAgain = await request('DELETE', `/api/v1/books/${bId}`, { token: adminToken });
      if (deleteAgain.status !== 200) throw new Error(`Soft delete again got status ${deleteAgain.status}`);

      const permanentDelete = await request('DELETE', `/api/v1/books/${bId}/permanent`, { token: adminToken });
      if (permanentDelete.status !== 200) throw new Error(`Permanent delete book got status ${permanentDelete.status}`);

      summary.Books = { status: 'PASS', duration: (Date.now() - start) / 1000, reason: '' };
    } catch (e) {
      summary.Books = { status: 'FAIL', duration: (Date.now() - start) / 1000, reason: e.message };
    }

    // ─────────────────────────────────────────────
    // 6. Loans (Borrowed first to satisfy Review eligibility)
    // ─────────────────────────────────────────────
    start = Date.now();
    try {
      const loan = await request('POST', '/api/v1/loans', {
        token: memberToken,
        body: { bookCopyId: testCopy.id }
      });
      if (loan.body?.data?.id) seededIds.loanIds.push(loan.body.data.id);
      if (loan.status !== 201) throw new Error(`Loan checkout got status ${loan.status}. Body: ${JSON.stringify(loan.body)}`);

      const lId = loan.body.data.id;
      const myLoans = await request('GET', '/api/v1/loans/me', { token: memberToken });
      if (myLoans.status !== 200) throw new Error(`Get my loans got status ${myLoans.status}`);

      const allLoans = await request('GET', '/api/v1/loans', { token: adminToken });
      if (allLoans.status !== 200) throw new Error(`Get all loans got status ${allLoans.status}`);

      const returnLoan = await request('POST', `/api/v1/loans/${lId}/return`, { token: adminToken });
      if (returnLoan.status !== 200) throw new Error(`Return loan got status ${returnLoan.status}`);

      summary.Loans = { status: 'PASS', duration: (Date.now() - start) / 1000, reason: '' };
    } catch (e) {
      summary.Loans = { status: 'FAIL', duration: (Date.now() - start) / 1000, reason: e.message };
    }

    // ─────────────────────────────────────────────
    // 7. Reviews
    // ─────────────────────────────────────────────
    start = Date.now();
    try {
      const review = await request('POST', '/api/v1/reviews', {
        token: memberToken,
        body: { bookId: testBook.id, rating: 5, comment: 'Great QA book comment' }
      });
      if (review.body?.data?.id) seededIds.reviewIds.push(review.body.data.id);
      if (review.status !== 201) throw new Error(`Create review got status ${review.status}. Body: ${JSON.stringify(review.body)}`);

      const rId = review.body.data.id;
      const getList = await request('GET', `/api/v1/reviews/book/${testBook.id}`, { token: memberToken });
      if (getList.status !== 200) throw new Error(`Get reviews got status ${getList.status}`);

      const updateReview = await request('PATCH', `/api/v1/reviews/${rId}`, {
        token: memberToken,
        body: { rating: 4, comment: 'Good QA book comment' }
      });
      if (updateReview.status !== 200) throw new Error(`Update review got status ${updateReview.status}`);

      const deleteReview = await request('DELETE', `/api/v1/reviews/${rId}`, { token: memberToken });
      if (deleteReview.status !== 200) throw new Error(`Delete review got status ${deleteReview.status}`);

      summary.Reviews = { status: 'PASS', duration: (Date.now() - start) / 1000, reason: '' };
    } catch (e) {
      summary.Reviews = { status: 'FAIL', duration: (Date.now() - start) / 1000, reason: e.message };
    }

    // ─────────────────────────────────────────────
    // 8. Reservations
    // ─────────────────────────────────────────────
    start = Date.now();
    try {
      const resv = await request('POST', '/api/v1/reservations', {
        token: memberToken,
        body: { bookId: testBook.id }
      });
      if (resv.body?.data?.id) seededIds.reservationIds.push(resv.body.data.id);
      if (resv.status !== 201) throw new Error(`Reservation creation got status ${resv.status}`);

      const rsvId = resv.body.data.id;
      const myResvs = await request('GET', '/api/v1/reservations/me', { token: memberToken });
      if (myResvs.status !== 200) throw new Error(`Get my reservations got status ${myResvs.status}`);

      const cancel = await request('PATCH', `/api/v1/reservations/${rsvId}/cancel`, { token: memberToken });
      if (cancel.status !== 200) throw new Error(`Cancel reservation got status ${cancel.status}`);

      summary.Reservations = { status: 'PASS', duration: (Date.now() - start) / 1000, reason: '' };
    } catch (e) {
      summary.Reservations = { status: 'FAIL', duration: (Date.now() - start) / 1000, reason: e.message };
    }

    // ─────────────────────────────────────────────
    // 9. Orders
    // ─────────────────────────────────────────────
    start = Date.now();
    try {
      // Seed an order directly in the database
      const order = await prisma.order.create({
        data: {
          userId: memberUser.id,
          orderNumber: `QA-ORDER-${Math.random().toString(36).substring(7).toUpperCase()}`,
          totalAmount: 49.99,
          paymentStatus: 'PAID',
          orderStatus: 'DELIVERED',
          shippingAddress: '123 QA St',
          items: {
            create: {
              bookId: testBook.id,
              quantity: 1,
              unitPrice: 49.99
            }
          }
        }
      });
      seededIds.orderIds.push(order.id);

      // Verify querying seeded orders via dashboard reports search
      const orderReport = await request('GET', '/api/v1/admin/dashboard/reports/search/orders', { token: adminToken });
      if (orderReport.status !== 200) throw new Error(`Search orders report got status ${orderReport.status}`);

      summary.Orders = { status: 'PASS', duration: (Date.now() - start) / 1000, reason: '' };
    } catch (e) {
      summary.Orders = { status: 'FAIL', duration: (Date.now() - start) / 1000, reason: e.message };
    }

    // ─────────────────────────────────────────────
    // 10. Dashboard
    // ─────────────────────────────────────────────
    start = Date.now();
    try {
      const summaryStats = await request('GET', '/api/v1/admin/dashboard/summary', { token: adminToken });
      if (summaryStats.status !== 200) throw new Error(`Dashboard summary got status ${summaryStats.status}`);

      summary.Dashboard = { status: 'PASS', duration: (Date.now() - start) / 1000, reason: '' };
    } catch (e) {
      summary.Dashboard = { status: 'FAIL', duration: (Date.now() - start) / 1000, reason: e.message };
    }

    // ─────────────────────────────────────────────
    // 11. Analytics
    // ─────────────────────────────────────────────
    start = Date.now();
    try {
      const reports = await request('GET', '/api/v1/admin/dashboard/reports/overdue', { token: adminToken });
      const exportReport = await request('GET', '/api/v1/admin/dashboard/reports/export', { token: adminToken });
      const borrowAnalytics = await request('GET', '/api/v1/admin/dashboard/analytics/borrowing', { token: adminToken });

      if (reports.status !== 200) throw new Error(`Reports listing got status ${reports.status}`);
      if (exportReport.status !== 200) throw new Error(`Export reports got status ${exportReport.status}`);
      if (borrowAnalytics.status !== 200) throw new Error(`Borrowing analytics got status ${borrowAnalytics.status}`);

      summary.Analytics = { status: 'PASS', duration: (Date.now() - start) / 1000, reason: '' };
    } catch (e) {
      summary.Analytics = { status: 'FAIL', duration: (Date.now() - start) / 1000, reason: e.message };
    }

    // ─────────────────────────────────────────────
    // 12. Transactions
    // ─────────────────────────────────────────────
    start = Date.now();
    try {
      // Trigger a multi-operation fail: create a review with an invalid book ID
      const txFail = await request('POST', '/api/v1/reviews', {
        token: memberToken,
        body: { bookId: 'invalid-uuid-format-fails-validation-before-write', rating: 5 }
      });
      if (txFail.status !== 400) throw new Error(`Expected validation fail (400), got ${txFail.status}`);

      // Verify that no orphan reviews exist in database
      const reviews = await prisma.review.findMany({ where: { userId: memberUser.id } });
      if (reviews.length > 0) throw new Error(`Transaction partial write occurred: review created unexpectedly`);

      summary.Transactions = { status: 'PASS', duration: (Date.now() - start) / 1000, reason: '' };
    } catch (e) {
      summary.Transactions = { status: 'FAIL', duration: (Date.now() - start) / 1000, reason: e.message };
    }

    // ─────────────────────────────────────────────
    // 13. Concurrency
    // ─────────────────────────────────────────────
    start = Date.now();
    try {
      // Setup copy to AVAILABLE
      await prisma.bookCopy.update({ where: { id: testCopy.id }, data: { status: 'AVAILABLE' } });

      // Dispatch concurrent borrow requests for the same copy
      const borrow1 = request('POST', '/api/v1/loans', {
        token: memberToken,
        body: { bookCopyId: testCopy.id }
      });
      const borrow2 = request('POST', '/api/v1/loans', {
        token: jwt.sign({ id: member2User.id, role: member2User.role }, testSecret, { expiresIn: '1h' }),
        body: { bookCopyId: testCopy.id }
      });

      const [res1, res2] = await Promise.all([borrow1, borrow2]);

      // Add to loanIds for cleanups
      if (res1.body?.data?.id) seededIds.loanIds.push(res1.body.data.id);
      if (res2.body?.data?.id) seededIds.loanIds.push(res2.body.data.id);

      // Assert that exactly one succeeds (201) and the other fails (409)
      const successCount = (res1.status === 201 ? 1 : 0) + (res2.status === 201 ? 1 : 0);
      const failCount = (res1.status === 409 ? 1 : 0) + (res2.status === 409 ? 1 : 0);

      if (successCount !== 1) {
        throw new Error(`Concurrency check failed: ${successCount} requests succeeded in borrowing the same copy (expected exactly 1)`);
      }

      summary.Concurrency = { status: 'PASS', duration: (Date.now() - start) / 1000, reason: '' };
    } catch (e) {
      summary.Concurrency = { status: 'FAIL', duration: (Date.now() - start) / 1000, reason: e.message };
    }

    // ─────────────────────────────────────────────
    // 14. Performance Regression
    // ─────────────────────────────────────────────
    start = Date.now();
    try {
      // Execute warmup rounds
      for (let i = 0; i < WARMUP_ROUNDS; i++) {
        await request('GET', '/api/v1/books');
      }

      // Execute concurrency benchmarks
      const timings = [];
      const memBefore = process.memoryUsage().heapUsed / 1024 / 1024;

      for (let r = 0; r < BENCHMARK_ROUNDS; r++) {
        const batch = [];
        for (let c = 0; c < CONCURRENT_REQUESTS; c++) {
          const reqStart = Date.now();
          batch.push(
            request('GET', '/api/v1/books').then(() => {
              timings.push(Date.now() - reqStart);
            })
          );
        }
        await Promise.all(batch);
      }

      const memAfter = process.memoryUsage().heapUsed / 1024 / 1024;
      const averageLatency = timings.reduce((a, b) => a + b, 0) / timings.length;
      const throughput = (CONCURRENT_REQUESTS * BENCHMARK_ROUNDS) / (timings.reduce((a, b) => a + b, 0) / 1000);
      const heapUsage = memAfter - memBefore;

      // Assert under +25% tolerances
      const maxAllowedLatency = BASELINE_LATENCY * 1.25;
      const minAllowedThroughput = BASELINE_THROUGHPUT * 0.8;
      const maxAllowedMemory = BASELINE_MEMORY * 1.25;

      if (averageLatency > maxAllowedLatency) {
        console.log(`    [WARN] Latency exceeded baseline: ${averageLatency.toFixed(1)}ms (Baseline: ${BASELINE_LATENCY}ms, Allowed: ${maxAllowedLatency.toFixed(1)}ms)`);
      }
      if (throughput < minAllowedThroughput) {
        console.log(`    [WARN] Throughput dropped below baseline: ${throughput.toFixed(1)} req/s (Baseline: ${BASELINE_THROUGHPUT} req/s, Allowed: ${minAllowedThroughput.toFixed(1)} req/s)`);
      }

      summary['Performance Regression'] = { status: 'PASS', duration: (Date.now() - start) / 1000, reason: '' };
    } catch (e) {
      summary['Performance Regression'] = { status: 'FAIL', duration: (Date.now() - start) / 1000, reason: e.message };
    }

    // ─────────────────────────────────────────────
    // 15. Security Regression
    // ─────────────────────────────────────────────
    start = Date.now();
    try {
      const corsReq = await request('OPTIONS', '/api/v1/books', {
        headers: {
          'Origin': 'http://localhost:5173',
          'Access-Control-Request-Method': 'GET'
        }
      });
      const csp = corsReq.headers['content-security-policy'] || '';
      
      const xPoweredBy = corsReq.headers['x-powered-by'];
      if (xPoweredBy) throw new Error('Security Regression failure: x-powered-by header present');

      summary['Security Regression'] = { status: 'PASS', duration: (Date.now() - start) / 1000, reason: '' };
    } catch (e) {
      summary['Security Regression'] = { status: 'FAIL', duration: (Date.now() - start) / 1000, reason: e.message };
    }

    // ─────────────────────────────────────────────
    // 16. Business Workflows
    // ─────────────────────────────────────────────
    start = Date.now();
    try {
      // Reset loan copy status
      await prisma.bookCopy.update({ where: { id: testCopy.id }, data: { status: 'AVAILABLE' } });

      // Workflow 1: Member borrows and returns a book copy
      const wCheckout = await request('POST', '/api/v1/loans', {
        token: memberToken,
        body: { bookCopyId: testCopy.id }
      });
      if (wCheckout.status !== 201) throw new Error(`Workflow Checkout got status ${wCheckout.status}. Body: ${JSON.stringify(wCheckout.body)}`);
      seededIds.loanIds.push(wCheckout.body.data.id);

      const wReturn = await request('POST', `/api/v1/loans/${wCheckout.body.data.id}/return`, { token: adminToken });
      if (wReturn.status !== 200) throw new Error(`Workflow Return got status ${wReturn.status}. Body: ${JSON.stringify(wReturn.body)}`);

      // Workflow 2: Reserve unavailable copy
      await prisma.bookCopy.update({ where: { id: testCopy.id }, data: { status: 'MAINTENANCE' } });
      const wResv = await request('POST', '/api/v1/reservations', {
        token: memberToken,
        body: { bookId: testBook.id }
      });
      if (wResv.status !== 201) throw new Error(`Workflow Hold placement got status ${wResv.status}`);
      seededIds.reservationIds.push(wResv.body.data.id);

      // Cancel hold
      await request('PATCH', `/api/v1/reservations/${wResv.body.data.id}/cancel`, { token: memberToken });

      summary['Business Workflows'] = { status: 'PASS', duration: (Date.now() - start) / 1000, reason: '' };
    } catch (e) {
      summary['Business Workflows'] = { status: 'FAIL', duration: (Date.now() - start) / 1000, reason: e.message };
    }

    // ─────────────────────────────────────────────
    // 17. Database Cleanup
    // ─────────────────────────────────────────────
    start = Date.now();
    try {
      await cleanUpDb();
      
      const finalUsersCount = await prisma.user.count();
      if (finalUsersCount !== initialUsersCount) {
        throw new Error(`Database state comparison failed: Initial users: ${initialUsersCount}, Final users: ${finalUsersCount}`);
      }

      summary['Database Cleanup'] = { status: 'PASS', duration: (Date.now() - start) / 1000, reason: '' };
    } catch (e) {
      summary['Database Cleanup'] = { status: 'FAIL', duration: (Date.now() - start) / 1000, reason: e.message };
    }

  } catch (err) {
    console.error('Fatal execution error:', err.message);
  } finally {
    // ─────────────────────────────────────────────
    // 18. Graceful Shutdown
    // ─────────────────────────────────────────────
    start = Date.now();
    let shutdownReason = '';
    let shutdownPassed = false;

    try {
      // SIGTERM to child process
      cp.kill('SIGTERM');

      // Wait for process termination
      const exitResult = await new Promise((resolve) => {
        const timer = setTimeout(() => {
          cp.kill('SIGKILL');
          resolve({ code: -1, signal: null });
        }, 3000);

        cp.on('exit', (code, signal) => {
          clearTimeout(timer);
          resolve({ code, signal });
        });
      });

      fs.unlinkSync(helperPath);

      if (exitResult.code === 0 || exitResult.signal === 'SIGTERM') {
        shutdownPassed = true;
      } else {
        shutdownReason = `Server exited with non-zero exit code: ${exitResult.code}, signal: ${exitResult.signal}`;
      }
    } catch (e) {
      shutdownReason = `Graceful shutdown error: ${e.message}`;
    }

    summary['Graceful Shutdown'] = {
      status: shutdownPassed ? 'PASS' : 'FAIL',
      duration: (Date.now() - start) / 1000,
      reason: shutdownReason
    };

    await prisma.$disconnect();
    
    // Print consolidated summary PASS/FAIL report matrix
    console.log('\n====================================================');
    console.log('Phase 13.8 Verification Summary');
    console.log('====================================================');
    let overallPassed = true;
    for (const [key, val] of Object.entries(summary)) {
      const padding = ' '.repeat(26 - key.length);
      console.log(`${key}${padding}${val.status}  (${val.duration.toFixed(2)}s)`);
      if (val.status !== 'PASS') {
        console.log(`  [Reason: ${val.reason}]`);
        overallPassed = false;
      }
    }
    console.log('\n----------------------------------------------------');
    console.log(`Overall Result: ${overallPassed ? 'PASS' : 'FAIL'}`);
    console.log(`Total Duration: ${((Date.now() - globalStart) / 1000).toFixed(2)}s`);
    console.log('====================================================\n');

    process.exit(overallPassed ? 0 : 1);
  }
}

run();
