import { handleExpiredReservations } from '../src/services/reservation.service.js';
import { prisma } from '../src/lib/prisma.js';

console.log('Reservation Expiration & Status Management E2E Testing Suite\n============================================================');

const results = [];
const record = (name, passed) => {
  results.push({ name, passed });
  console.log(`${passed ? 'PASS' : 'FAIL'}: ${name}`);
};

async function runTests() {
  let author, category, testBook, testCopy1, testCopy2;
  let member1, member2, member3;

  try {
    // Setup Database
    author = await prisma.author.create({
      data: { fullName: 'E2E Expire Author', biography: 'Bio' }
    });
    category = await prisma.category.create({
      data: { name: 'E2E Expire Category ' + Date.now(), description: 'Desc' }
    });

    testBook = await prisma.book.create({
      data: {
        title: 'E2E Expire Book',
        isbn: 'E2E-R-EXP-' + Date.now(),
        isBorrowable: true,
        authors: { create: [{ authorId: author.id }] },
        categories: { create: [{ categoryId: category.id }] }
      }
    });

    // Create physical copies
    testCopy1 = await prisma.bookCopy.create({
      data: { bookId: testBook.id, barcode: 'BC-E1-' + Date.now(), status: 'RESERVED' }
    });

    testCopy2 = await prisma.bookCopy.create({
      data: { bookId: testBook.id, barcode: 'BC-E2-' + Date.now(), status: 'RESERVED' }
    });

    member1 = await prisma.user.create({
      data: {
        username: 'exp_res_memb1_' + Date.now(),
        email: 'exp_res_memb1_' + Date.now() + '@avelis.com',
        passwordHash: 'hash',
        role: 'MEMBER'
      }
    });

    member2 = await prisma.user.create({
      data: {
        username: 'exp_res_memb2_' + Date.now(),
        email: 'exp_res_memb2_' + Date.now() + '@avelis.com',
        passwordHash: 'hash',
        role: 'MEMBER'
      }
    });

    member3 = await prisma.user.create({
      data: {
        username: 'exp_res_memb3_' + Date.now(),
        email: 'exp_res_memb3_' + Date.now() + '@avelis.com',
        passwordHash: 'hash',
        role: 'MEMBER'
      }
    });

    // Clean up previous reservations
    await prisma.reservation.deleteMany({});

    // Create reservations setup:
    // res1: member1, READY_FOR_PICKUP, holds copy1, expired! (expiresAt is lte now)
    const res1 = await prisma.reservation.create({
      data: {
        userId: member1.id,
        bookId: testBook.id,
        copyId: testCopy1.id,
        status: 'READY_FOR_PICKUP',
        expiresAt: new Date(Date.now() - 1000 * 60 * 60) // Expired 1 hour ago
      }
    });

    // res2: member2, PENDING, copyId null (oldest waiting queue hold)
    const res2 = await prisma.reservation.create({
      data: {
        userId: member2.id,
        bookId: testBook.id,
        copyId: null,
        status: 'PENDING',
        createdAt: new Date(Date.now() - 2000)
      }
    });

    // res3: member3, READY_FOR_PICKUP, holds copy2, active (not expired!)
    const res3 = await prisma.reservation.create({
      data: {
        userId: member3.id,
        bookId: testBook.id,
        copyId: testCopy2.id,
        status: 'READY_FOR_PICKUP',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) // Expires tomorrow
      }
    });

    // ── Test 1: Expiration triggers copy release & FIFO queue reallocation ──
    {
      const summary = await handleExpiredReservations();

      const dbRes1 = await prisma.reservation.findUnique({ where: { id: res1.id } });
      const dbRes2 = await prisma.reservation.findUnique({ where: { id: res2.id } });
      const dbRes3 = await prisma.reservation.findUnique({ where: { id: res3.id } });
      const copy1Db = await prisma.bookCopy.findUnique({ where: { id: testCopy1.id } });
      const copy2Db = await prisma.bookCopy.findUnique({ where: { id: testCopy2.id } });

      const ok = summary.processedReservations === 1 &&
                  summary.releasedCopies === 1 &&
                  summary.fulfilledReservations === 1 &&
                  dbRes1.status === 'EXPIRED' &&
                  dbRes2.status === 'READY_FOR_PICKUP' &&
                  dbRes2.copyId === testCopy1.id &&
                  dbRes2.fulfilledAt !== null &&
                  dbRes2.expiresAt !== null &&
                  copy1Db.status === 'RESERVED' && // Copy 1 should be immediately reallocated & remain RESERVED
                  dbRes3.status === 'READY_FOR_PICKUP' &&
                  copy2Db.status === 'RESERVED'; // Res 3 and Copy 2 remain active
      record('Test 1: Expired reservation triggers release and FIFO reallocation', ok);
    }

    // ── Test 2: Safe skip of READY_FOR_PICKUP holds with null copyId ──
    {
      // Create a corrupt READY_FOR_PICKUP hold with null copyId
      const resCorrupt = await prisma.reservation.create({
        data: {
          userId: member1.id,
          bookId: testBook.id,
          copyId: null, // Null copyId
          status: 'READY_FOR_PICKUP',
          expiresAt: new Date(Date.now() - 1000 * 60 * 60)
        }
      });

      const summary = await handleExpiredReservations();

      // The corrupt hold should be skipped during processing since copyId is null
      const dbResCorrupt = await prisma.reservation.findUnique({ where: { id: resCorrupt.id } });
      const ok = summary.processedReservations === 0 &&
                  summary.releasedCopies === 0 &&
                  dbResCorrupt.status === 'READY_FOR_PICKUP';
      record('Test 2: Reservation without allocated copy is skipped safely', ok);

      await prisma.reservation.delete({ where: { id: resCorrupt.id } }).catch(() => {});
    }

    // ── Test 3: Invariant checks (Non-READY_FOR_PICKUP statuses are ignored) ──
    {
      // Reset res1 (EXPIRED) expiresAt to past. Should not be processed again.
      await prisma.reservation.update({
        where: { id: res1.id },
        data: { expiresAt: new Date(Date.now() - 1000 * 60 * 60) }
      });

      const summary = await handleExpiredReservations();

      const ok = summary.processedReservations === 0 &&
                  summary.releasedCopies === 0;
      record('Test 3: Non-READY_FOR_PICKUP reservations are ignored during expiration', ok);
    }

    // ── Test 4: Transaction Rollback Integrity ──
    {
      // Setup a new expired reservation on copy1
      const resTemp = await prisma.reservation.create({
        data: {
          userId: member1.id,
          bookId: testBook.id,
          copyId: testCopy1.id,
          status: 'READY_FOR_PICKUP',
          expiresAt: new Date(Date.now() - 1000 * 60 * 60)
        }
      });
      // Copy1 back to RESERVED
      await prisma.bookCopy.update({
        where: { id: testCopy1.id },
        data: { status: 'RESERVED' }
      });

      let rollbackOk = false;
      try {
        await prisma.$transaction(async (tx) => {
          // 1. Expire the reservation
          await tx.reservation.update({
            where: { id: resTemp.id },
            data: { status: 'EXPIRED' }
          });

          // 2. Release copy1
          await tx.bookCopy.update({
            where: { id: testCopy1.id },
            data: { status: 'AVAILABLE' }
          });

          // 3. Force failure on non-existent copy
          await tx.bookCopy.update({
            where: { id: '00000000-0000-0000-0000-000000000000' },
            data: { status: 'RESERVED' }
          });
        });
      } catch (err) {
        rollbackOk = true;
      }

      // Assert rollback: resTemp is still READY_FOR_PICKUP, copy1 remains RESERVED
      const dbRes = await prisma.reservation.findUnique({ where: { id: resTemp.id } });
      const copy1Db = await prisma.bookCopy.findUnique({ where: { id: testCopy1.id } });

      const ok = rollbackOk && dbRes.status === 'READY_FOR_PICKUP' && copy1Db.status === 'RESERVED';
      record('Test 4: Expiration rollback preserves transactional integrity', ok);

      await prisma.reservation.delete({ where: { id: resTemp.id } }).catch(() => {});
    }

  } catch (err) {
    console.error('Unexpected error in E2E integration test suite:', err);
  } finally {
    // Cleanup
    await prisma.reservation.deleteMany({});
    if (member1) {
      await prisma.user.delete({ where: { id: member1.id } }).catch(() => {});
    }
    if (member2) {
      await prisma.user.delete({ where: { id: member2.id } }).catch(() => {});
    }
    if (member3) {
      await prisma.user.delete({ where: { id: member3.id } }).catch(() => {});
    }
    if (testCopy1) {
      await prisma.bookCopy.delete({ where: { id: testCopy1.id } }).catch(() => {});
    }
    if (testCopy2) {
      await prisma.bookCopy.delete({ where: { id: testCopy2.id } }).catch(() => {});
    }
    if (testBook) {
      await prisma.book.delete({ where: { id: testBook.id } }).catch(() => {});
    }
    if (author) {
      await prisma.author.delete({ where: { id: author.id } }).catch(() => {});
    }
    if (category) {
      await prisma.category.delete({ where: { id: category.id } }).catch(() => {});
    }
    console.log('Cleanup completed. Test suite finished.');
  }
}

runTests();
