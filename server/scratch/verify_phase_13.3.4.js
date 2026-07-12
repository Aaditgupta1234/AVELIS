/**
 * Verification script for Phase 13.3.4 - Rating Analytics API.
 * Run with: node scratch/verify_phase_13.3.4.js
 */

import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { generateToken } from '../src/utils/jwt.js';
import { UserRole } from '@prisma/client';

const PORT = 5567;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

async function runTests() {
  console.log('Running Phase 13.3.4 Rating Analytics Verification...\n');
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

  // Seed data holders for cleanup
  let adminUser, memberUser1, memberUser2, memberUser3;
  let book1, book2, book3, book4Deleted;
  const createdUserIds = [];
  const createdBookIds = [];
  const createdReviewIds = [];

  try {
    // 0. Setup test users
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

    adminUser = await createUser(`admin_1334_${Date.now()}`, UserRole.ADMIN);
    memberUser1 = await createUser(`member_u1_1334_${Date.now()}`, UserRole.MEMBER);
    memberUser2 = await createUser(`member_u2_1334_${Date.now()}`, UserRole.MEMBER);
    memberUser3 = await createUser(`member_u3_1334_${Date.now()}`, UserRole.MEMBER);

    const adminToken = generateToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });
    const memberToken = generateToken({ id: memberUser1.id, email: memberUser1.email, role: memberUser1.role });

    console.log('Setting up test books...');
    // Book 1: active, "Book 1"
    book1 = await prisma.book.create({ data: { title: 'Book 1', isbn: `isbn1_1334_${Date.now()}`, isDeleted: false } });
    createdBookIds.push(book1.id);
    // Book 2: active, "Book 2"
    book2 = await prisma.book.create({ data: { title: 'Book 2', isbn: `isbn2_1334_${Date.now()}`, isDeleted: false } });
    createdBookIds.push(book2.id);
    // Book 3: active, "Book 3"
    book3 = await prisma.book.create({ data: { title: 'Book 3', isbn: `isbn3_1334_${Date.now()}`, isDeleted: false } });
    createdBookIds.push(book3.id);
    // Book 4: soft-deleted, "Book 4 Deleted"
    book4Deleted = await prisma.book.create({ data: { title: 'Book 4 Deleted', isbn: `isbn4_1334_${Date.now()}`, isDeleted: true } });
    createdBookIds.push(book4Deleted.id);

    console.log('Seeding custom reviews with specific ratings and dates...');
    const createReview = async (userId, bookId, rating, createdAt) => {
      const review = await prisma.review.create({
        data: {
          userId,
          bookId,
          rating,
          createdAt: new Date(createdAt),
          comment: 'test comment'
        }
      });
      createdReviewIds.push(review.id);
      return review;
    };

    // User 1 on Book 1: rating 5, 2026-07-10T12:00:00Z
    await createReview(memberUser1.id, book1.id, 5, '2026-07-10T12:00:00.000Z');
    // User 2 on Book 1: rating 5, 2026-07-11T23:59:59.999Z (midnight UTC boundary check!)
    await createReview(memberUser2.id, book1.id, 5, '2026-07-11T23:59:59.999Z');
    // User 3 on Book 1: rating 2, 2026-07-12T00:00:00.001Z (midnight UTC boundary check!)
    await createReview(memberUser3.id, book1.id, 2, '2026-07-12T00:00:00.001Z');
    // User 1 on Book 2: rating 4, 2026-07-12T15:00:00Z
    await createReview(memberUser1.id, book2.id, 4, '2026-07-12T15:00:00.000Z');
    // User 1 on Book 3: rating 1, 2026-07-13T10:00:00Z
    await createReview(memberUser1.id, book3.id, 1, '2026-07-13T10:00:00.000Z');
    // User 1 on Book 4 (Deleted book!): rating 5, 2026-07-10T10:00:00Z (should be fully ignored)
    await createReview(memberUser1.id, book4Deleted.id, 5, '2026-07-10T10:00:00.000Z');

    console.log('Starting HTTP server...');
    const server = app.listen(PORT, async () => {
      try {
        // 1. Security check
        console.log('\n--- 1. Security Check ---');
        const resUnauth = await fetch(`${BASE_URL}/admin/dashboard/analytics/ratings`);
        assert(resUnauth.status === 401, 'Unauthenticated request returns 401');

        const resMember = await fetch(`${BASE_URL}/admin/dashboard/analytics/ratings`, {
          headers: { Authorization: `Bearer ${memberToken}` }
        });
        assert(resMember.status === 403, 'Member request returns 403 Forbidden');

        // 2. Fetch Rating Analytics with No Filters (verifying schema/types)
        console.log('\n--- 2. GET /ratings (All Data - Structure Check) ---');
        const resAll = await fetch(`${BASE_URL}/admin/dashboard/analytics/ratings`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert(resAll.status === 200, 'Admin request returns 200 OK');
        const bodyAll = await resAll.json();
        assert(bodyAll.success === true, 'Success field is true in response envelope');
        
        const rawAnalytics = bodyAll.data;
        assert(typeof rawAnalytics.overview.totalReviews === 'number', 'overview.totalReviews is numeric');
        assert(typeof rawAnalytics.overview.averageRating === 'number', 'overview.averageRating is numeric');
        assert(typeof rawAnalytics.overview.fiveStarReviews === 'number', 'overview.fiveStarReviews is numeric');
        assert(typeof rawAnalytics.overview.oneStarReviews === 'number', 'overview.oneStarReviews is numeric');
        assert(Array.isArray(rawAnalytics.highestRatedBooks), 'highestRatedBooks is an array');
        assert(Array.isArray(rawAnalytics.lowestRatedBooks), 'lowestRatedBooks is an array');
        assert(typeof rawAnalytics.ratingDistribution.fiveStar === 'number', 'ratingDistribution.fiveStar is numeric');
        assert(Array.isArray(rawAnalytics.reviewTrend), 'reviewTrend is an array');

        // 3. Mathematical correctness check using date filter 2026-07-10 to 2026-07-13
        console.log('\n--- 3. GET /ratings?startDate=2026-07-10&endDate=2026-07-13 (Precise Mathematics) ---');
        const resFiltered = await fetch(`${BASE_URL}/admin/dashboard/analytics/ratings?startDate=2026-07-10&endDate=2026-07-13`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert(resFiltered.status === 200, 'Filtered request returns 200 OK');
        const bodyFiltered = await resFiltered.json();
        const analytics = bodyFiltered.data;

        // Verify Overview (Excludes Deleted Book 4!)
        console.log('\n--- Verify Overview statistics ---');
        assert(analytics.overview.totalReviews === 5, `totalReviews is 5 (got ${analytics.overview.totalReviews})`);
        assert(analytics.overview.averageRating === 3.40, `averageRating is 3.40 (got ${analytics.overview.averageRating})`);
        assert(analytics.overview.fiveStarReviews === 2, `fiveStarReviews is 2 (got ${analytics.overview.fiveStarReviews})`);
        assert(analytics.overview.oneStarReviews === 1, `oneStarReviews is 1 (got ${analytics.overview.oneStarReviews})`);

        // Verify Privacy (No user information should be present in highest/lowest rated books)
        console.log('\n--- Verify Privacy Compliance ---');
        const firstBook = analytics.highestRatedBooks[0];
        assert(firstBook.bookId !== undefined, 'bookId is returned');
        assert(firstBook.title !== undefined, 'title is returned');
        assert(firstBook.userId === undefined, 'Privacy Check: userId is NOT exposed');
        assert(firstBook.username === undefined, 'Privacy Check: username is NOT exposed');

        // Verify Rankings (Excludes Book 4 Deleted!)
        console.log('\n--- Verify Highest/Lowest Book Rankings ---');
        // Highest rated:
        // Book 1: average 4.00, reviewCount 3
        // Book 2: average 4.00, reviewCount 1
        // Book 3: average 1.00, reviewCount 1
        assert(analytics.highestRatedBooks.length === 3, `highestRatedBooks has 3 items (got ${analytics.highestRatedBooks.length})`);
        assert(analytics.highestRatedBooks[0].bookId === book1.id, '1st Highest Rated is Book 1 (due to higher review count fallback)');
        assert(analytics.highestRatedBooks[0].averageRating === 4.00, 'Book 1 average rating is 4.00');
        assert(analytics.highestRatedBooks[0].reviewCount === 3, 'Book 1 review count is 3');
        assert(analytics.highestRatedBooks[1].bookId === book2.id, '2nd Highest Rated is Book 2');
        assert(analytics.highestRatedBooks[2].bookId === book3.id, '3rd Highest Rated is Book 3');

        // Lowest rated:
        // Book 3: average 1.00, reviewCount 1
        // Book 1: average 4.00, reviewCount 3
        // Book 2: average 4.00, reviewCount 1
        assert(analytics.lowestRatedBooks.length === 3, `lowestRatedBooks has 3 items (got ${analytics.lowestRatedBooks.length})`);
        assert(analytics.lowestRatedBooks[0].bookId === book3.id, '1st Lowest Rated is Book 3');
        assert(analytics.lowestRatedBooks[0].averageRating === 1.00, 'Book 3 average rating is 1.00');
        assert(analytics.lowestRatedBooks[1].bookId === book1.id, '2nd Lowest Rated is Book 1 (since 4.00 and higher review count: sorted desc by reviewCount)');
        assert(analytics.lowestRatedBooks[2].bookId === book2.id, '3rd Lowest Rated is Book 2');

        // Verify Rating Score Distribution
        console.log('\n--- Verify Rating Distribution ---');
        const dist = analytics.ratingDistribution;
        assert(dist.oneStar === 1, `oneStar count is 1 (got ${dist.oneStar})`);
        assert(dist.twoStar === 1, `twoStar count is 1 (got ${dist.twoStar})`);
        assert(dist.threeStar === 0, `threeStar count is 0 (got ${dist.threeStar})`);
        assert(dist.fourStar === 1, `fourStar count is 1 (got ${dist.fourStar})`);
        assert(dist.fiveStar === 2, `fiveStar count is 2 (got ${dist.fiveStar})`);

        // Verify Daily Grouping & UTC Midnight boundary
        console.log('\n--- Verify Review Trend & UTC Midnight Check ---');
        // Trend:
        // 2026-07-10: 1 review (Book 1. Book 4 Deleted review is excluded!)
        // 2026-07-11: 1 review (Book 1 - 23:59:59.999Z boundary)
        // 2026-07-12: 2 reviews (Book 1 - 00:00:00.001Z boundary + Book 2)
        // 2026-07-13: 1 review (Book 3)
        assert(analytics.reviewTrend.length === 4, `reviewTrend has 4 days (got ${analytics.reviewTrend.length})`);
        const trendMap = {};
        analytics.reviewTrend.forEach(t => trendMap[t.date] = t.reviews);
        assert(trendMap['2026-07-10'] === 1, `2026-07-10 has 1 review (got ${trendMap['2026-07-10']})`);
        assert(trendMap['2026-07-11'] === 1, `2026-07-11 has 1 review (got ${trendMap['2026-07-11']})`);
        assert(trendMap['2026-07-12'] === 2, `2026-07-12 has 2 reviews (got ${trendMap['2026-07-12']})`);
        assert(trendMap['2026-07-13'] === 1, `2026-07-13 has 1 review (got ${trendMap['2026-07-13']})`);

        // 4. Limit parameter check
        console.log('\n--- 4. Limit Parameter Check ---');
        const resLimit = await fetch(`${BASE_URL}/admin/dashboard/analytics/ratings?startDate=2026-07-10&endDate=2026-07-13&limit=1`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        const bodyLimit = await resLimit.json();
        assert(bodyLimit.data.highestRatedBooks.length === 1, 'limit restricts highestRatedBooks output');
        assert(bodyLimit.data.lowestRatedBooks.length === 1, 'limit restricts lowestRatedBooks output');

        // 5. Empty State Check
        console.log('\n--- 5. Empty State Check (Future Date Range) ---');
        const resEmpty = await fetch(`${BASE_URL}/admin/dashboard/analytics/ratings?startDate=2026-08-01&endDate=2026-08-31`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        const bodyEmpty = await resEmpty.json();
        const emptyData = bodyEmpty.data;
        assert(emptyData.overview.totalReviews === 0, 'Empty overview totalReviews is 0');
        assert(emptyData.overview.averageRating === 0, 'Empty overview averageRating is 0');
        assert(emptyData.overview.fiveStarReviews === 0, 'Empty overview fiveStarReviews is 0');
        assert(emptyData.overview.oneStarReviews === 0, 'Empty overview oneStarReviews is 0');
        assert(emptyData.highestRatedBooks.length === 0, 'Empty highestRatedBooks is empty array []');
        assert(emptyData.lowestRatedBooks.length === 0, 'Empty lowestRatedBooks is empty array []');
        assert(emptyData.ratingDistribution.fiveStar === 0, 'Empty ratingDistribution fiveStar is 0');
        assert(emptyData.reviewTrend.length === 0, 'Empty reviewTrend is empty array []');

        // 6. Validation Failure Check
        console.log('\n--- 6. Validation Failure Checks ---');
        const testInvalidParam = async (qs) => {
          const res = await fetch(`${BASE_URL}/admin/dashboard/analytics/ratings?${qs}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          assert(res.status === 400, `Query ?${qs} returns HTTP 400`);
        };
        await testInvalidParam('startDate=invalid');
        await testInvalidParam('startDate=2026-07-12&endDate=2026-07-10');
        await testInvalidParam('limit=0');
        await testInvalidParam('limit=-1');
        await testInvalidParam('limit=101');
        await testInvalidParam('limit=abc');

        // 7. Regression Check
        console.log('\n--- 7. Regression & Placeholders Check ---');
        const resSummary = await fetch(`${BASE_URL}/admin/dashboard/summary`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert(resSummary.status === 200, 'GET /admin/dashboard/summary continues to return 200 OK');

        const resBorrowing = await fetch(`${BASE_URL}/admin/dashboard/analytics/borrowing`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert(resBorrowing.status === 200, 'GET /admin/dashboard/analytics/borrowing continues to return 200 OK');

        const resMembers = await fetch(`${BASE_URL}/admin/dashboard/analytics/members`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert(resMembers.status === 200, 'GET /admin/dashboard/analytics/members continues to return 200 OK');

        const resTimeSeries = await fetch(`${BASE_URL}/admin/dashboard/analytics/timeseries`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert(resTimeSeries.status === 501, 'GET /analytics/timeseries placeholder still returns 501');

      } catch (err) {
        console.error('Test execution failed with error:', err);
      } finally {
        // Cleanup database records
        console.log('\nCleaning up database records...');
        try {
          await prisma.review.deleteMany({ where: { id: { in: createdReviewIds } } });
          await prisma.book.deleteMany({ where: { id: { in: createdBookIds } } });
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

        // Close server
        server.close(() => {
          console.log('HTTP server closed.');
          console.log(`\nVerification finished: ${passedCount}/${totalCount} checks passed.`);
          if (passedCount === totalCount) {
            console.log('All Rating Analytics checks verified successfully!');
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
