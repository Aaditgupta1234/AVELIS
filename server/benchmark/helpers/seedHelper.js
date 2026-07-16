/**
 * @fileoverview Benchmark seed and teardown utility.
 *
 * Creates deterministic, repeatable benchmark fixtures with `bench_` prefixed
 * identifiers. All created records are tracked for guaranteed cleanup.
 *
 * Cleanup runs in reverse dependency order to avoid FK violations:
 *   reviews → loans → reservations → copies → books → users
 *
 * @module benchmark/helpers/seedHelper
 */

import bcrypt from 'bcrypt';
import { UserRole, CopyStatus, CopyCondition, LoanStatus, ReservationStatus } from '@prisma/client';

/**
 * @typedef {Object} SeedData
 * @property {string} adminUserId
 * @property {string} memberUserId
 * @property {string} memberEmail
 * @property {string} memberPassword      - Plaintext password (for auth-login benchmark)
 * @property {string} bookId              - Primary benchmark book
 * @property {string} bookId2             - Secondary benchmark book (for reviews pool)
 * @property {string} bookId3             - Tertiary benchmark book
 * @property {string} copyId              - AVAILABLE copy of bookId
 * @property {string} copyId2             - AVAILABLE copy of bookId2 (used for write benchmarks)
 * @property {string} loanId             - An ACTIVE loan on copyId2 (for read loan endpoints)
 * @property {string} reservationId      - A PENDING reservation on bookId3
 * @property {string} reviewId           - A review by memberUserId on bookId
 */

/**
 * @typedef {Object} SeedContext
 * @property {function(): Promise<SeedData>}  seed     - Create all benchmark fixtures
 * @property {function(): Promise<void>}      cleanup  - Delete all seeded records (FK-safe order)
 * @property {function(): SeedData}           getData  - Return currently seeded IDs without re-seeding
 */

/**
 * Create a new seed context bound to the given Prisma client.
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @returns {SeedContext}
 *
 * @example
 * const ctx = createSeedContext(prisma);
 * const data = await ctx.seed();
 * // ... run benchmarks ...
 * await ctx.cleanup();
 */
export const createSeedContext = (prisma) => {
  /** @type {SeedData|null} */
  let seededData = null;

  // ---------------------------------------------------------------------------
  // seed
  // ---------------------------------------------------------------------------

  const seed = async () => {
    // Hash for the bench member password
    const memberPassword = 'BenchPass123!';
    const passwordHash = await bcrypt.hash(memberPassword, 10);

    // ── Admin user: find first active ADMIN (do not create one) ─────────────
    const admin = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN, isActive: true },
      select: { id: true },
    });
    if (!admin) throw new Error('[seedHelper] No ADMIN user found. Cannot seed benchmark data.');

    // ── Member user ───────────────────────────────────────────────────────────
    const member = await prisma.user.upsert({
      where: { email: 'bench_member@bench.local' },
      update: { isActive: true, passwordHash },
      create: {
        email: 'bench_member@bench.local',
        username: 'bench_member',
        passwordHash,
        role: UserRole.MEMBER,
        isActive: true,
      },
      select: { id: true },
    });

    // ── Books (3 for variety) ─────────────────────────────────────────────────
    const book1 = await prisma.book.create({
      data: {
        title: 'bench_Book Alpha',
        isbn: `bench-isbn-${Date.now()}-1`,
        publisher: 'Bench Publisher',
        language: 'English',
        description: 'Benchmark test book Alpha',
        isBorrowable: true,
        isForSale: false,
        stockQuantity: 10,
      },
      select: { id: true },
    });

    const book2 = await prisma.book.create({
      data: {
        title: 'bench_Book Beta',
        isbn: `bench-isbn-${Date.now()}-2`,
        publisher: 'Bench Publisher',
        language: 'English',
        description: 'Benchmark test book Beta',
        isBorrowable: true,
        isForSale: false,
        stockQuantity: 10,
      },
      select: { id: true },
    });

    const book3 = await prisma.book.create({
      data: {
        title: 'bench_Book Gamma',
        isbn: `bench-isbn-${Date.now()}-3`,
        publisher: 'Bench Publisher',
        language: 'English',
        description: 'Benchmark test book Gamma',
        isBorrowable: true,
        isForSale: false,
        stockQuantity: 10,
      },
      select: { id: true },
    });

    // ── Copies ────────────────────────────────────────────────────────────────
    const copy1 = await prisma.bookCopy.create({
      data: {
        bookId: book1.id,
        barcode: `bench-barcode-${Date.now()}-1`,
        condition: CopyCondition.GOOD,
        status: CopyStatus.AVAILABLE,
      },
      select: { id: true },
    });

    const copy2 = await prisma.bookCopy.create({
      data: {
        bookId: book2.id,
        barcode: `bench-barcode-${Date.now()}-2`,
        condition: CopyCondition.GOOD,
        status: CopyStatus.AVAILABLE,
      },
      select: { id: true },
    });

    // ── Loan on copy1 (returned, so the member can review book1) ─────────────
    await prisma.loan.create({
      data: {
        userId: member.id,
        copyId: copy1.id,
        issueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        returnDate: new Date(),
        status: LoanStatus.RETURNED,
        fineAmount: 0,
        renewCount: 0,
      },
    });

    // ── Loan (ACTIVE, on copy2 — for read loan endpoints) ────────────────────
    const issueDate = new Date();
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

    const loan = await prisma.loan.create({
      data: {
        userId: member.id,
        copyId: copy2.id,
        issueDate,
        dueDate,
        status: LoanStatus.BORROWED,
        fineAmount: 0,
        renewCount: 0,
      },
      select: { id: true },
    });

    // Mark copy2 as BORROWED
    await prisma.bookCopy.update({
      where: { id: copy2.id },
      data: { status: CopyStatus.BORROWED },
    });

    // ── Copy & Loan on book3 (returned, so the member can review book3) ───────
    const copy3 = await prisma.bookCopy.create({
      data: {
        bookId: book3.id,
        barcode: `bench-barcode-${Date.now()}-3`,
        condition: CopyCondition.GOOD,
        status: CopyStatus.AVAILABLE,
      },
      select: { id: true },
    });

    await prisma.loan.create({
      data: {
        userId: member.id,
        copyId: copy3.id,
        issueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        returnDate: new Date(),
        status: LoanStatus.RETURNED,
        fineAmount: 0,
        renewCount: 0,
      },
    });

    // ── Reservation (PENDING, on book3) ───────────────────────────────────────
    const reservation = await prisma.reservation.create({
      data: {
        userId: member.id,
        bookId: book3.id,
        status: ReservationStatus.PENDING,
      },
      select: { id: true },
    });

    // ── Review (on book1) ─────────────────────────────────────────────────────
    const review = await prisma.review.upsert({
      where: { userId_bookId: { userId: member.id, bookId: book1.id } },
      update: { rating: 4, comment: 'bench_review comment' },
      create: {
        userId: member.id,
        bookId: book1.id,
        rating: 4,
        comment: 'bench_review comment',
      },
      select: { id: true },
    });

    seededData = {
      adminUserId: admin.id,
      memberUserId: member.id,
      memberEmail: 'bench_member@bench.local',
      memberPassword,
      bookId: book1.id,
      bookId2: book2.id,
      bookId3: book3.id,
      copyId: copy1.id,
      copyId2: copy2.id,
      loanId: loan.id,
      reservationId: reservation.id,
      reviewId: review.id,
    };

    return seededData;
  };

  // ---------------------------------------------------------------------------
  // cleanup
  // ---------------------------------------------------------------------------

  const cleanup = async () => {
    // Get all user IDs of users with bench_ prefix in email or username
    const benchUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { startsWith: 'bench_' } },
          { username: { startsWith: 'bench_' } },
        ],
      },
      select: { id: true },
    });
    const benchUserIds = benchUsers.map((u) => u.id);

    // 1. Reviews
    await prisma.review.deleteMany({
      where: {
        OR: [
          { comment: { startsWith: 'bench_' } },
          { userId: { in: benchUserIds } },
        ],
      },
    });

    // 2. Reservations
    await prisma.reservation.deleteMany({
      where: {
        OR: [
          { book: { title: { startsWith: 'bench_' } } },
          { userId: { in: benchUserIds } },
        ],
      },
    });

    // 3. Loans (reset copy status first to avoid conflicts)
    const loansToDelete = await prisma.loan.findMany({
      where: {
        OR: [
          { bookCopy: { barcode: { startsWith: 'bench-' } } },
          { userId: { in: benchUserIds } },
        ],
      },
      select: { id: true, copyId: true },
    });
    if (loansToDelete.length > 0) {
      const copyIds = loansToDelete.map((l) => l.copyId).filter(Boolean);
      await prisma.bookCopy.updateMany({
        where: { id: { in: copyIds } },
        data: { status: CopyStatus.AVAILABLE },
      });
      await prisma.loan.deleteMany({
        where: { id: { in: loansToDelete.map((l) => l.id) } },
      });
    }

    // 4. Copies
    await prisma.bookCopy.deleteMany({
      where: {
        OR: [
          { barcode: { startsWith: 'bench-' } },
          { book: { title: { startsWith: 'bench_' } } },
        ],
      },
    });

    // 5. Books
    await prisma.book.deleteMany({
      where: { title: { startsWith: 'bench_' } },
    });

    // 6. Users
    await prisma.user.deleteMany({
      where: { id: { in: benchUserIds } },
    });

    seededData = null;
  };

  // ---------------------------------------------------------------------------
  // getData
  // ---------------------------------------------------------------------------

  const getData = () => {
    if (!seededData) throw new Error('[seedHelper] seed() has not been called yet.');
    return seededData;
  };

  return { seed, cleanup, getData };
};
