import { prisma } from '../src/lib/prisma.js';

/**
 * Data Repair Script: Synchronize BookCopy records with Book.stockQuantity.
 *
 * Ensures the fundamental inventory invariant holds for all books:
 *   COUNT(BookCopy) == Book.stockQuantity
 */
async function syncBookCopies() {
  console.log('=== Starting BookCopy Inventory Data Synchronization ===\n');

  const books = await prisma.book.findMany({
    include: {
      copies: true,
    },
  });

  console.log(`Found ${books.length} book records in database.\n`);

  let repairedCount = 0;
  let newCopiesCreatedCount = 0;

  for (const book of books) {
    const existingCopiesCount = book.copies.length;
    const targetStock = Math.max(0, book.stockQuantity || 0);
    const missingCopies = targetStock - existingCopiesCount;

    if (missingCopies > 0) {
      console.log(
        `[SYNC] Book "${book.title}" (ID: ${book.id}):` +
          ` target stock=${targetStock}, existing copies=${existingCopiesCount}. Creating ${missingCopies} missing copies...`
      );

      const copiesData = Array.from({ length: missingCopies }, (_, i) => {
        const indexNumber = existingCopiesCount + i + 1;
        const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        return {
          bookId: book.id,
          barcode: `BC-${Date.now()}-${indexNumber}-${randomSuffix}`,
          condition: 'NEW',
          status: 'AVAILABLE',
        };
      });

      await prisma.bookCopy.createMany({
        data: copiesData,
      });

      repairedCount++;
      newCopiesCreatedCount += missingCopies;
    } else if (missingCopies < 0) {
      console.warn(
        `[WARN] Book "${book.title}" (ID: ${book.id}) has more copies (${existingCopiesCount}) than stockQuantity (${targetStock}). Updating stockQuantity...`
      );
      await prisma.book.update({
        where: { id: book.id },
        data: { stockQuantity: existingCopiesCount },
      });
      repairedCount++;
    } else {
      console.log(`[OK] Book "${book.title}" is fully synchronized (${existingCopiesCount}/${targetStock} copies).`);
    }
  }

  console.log('\n=== Inventory Data Synchronization Complete ===');
  console.log(`- Books Synchronized: ${repairedCount}`);
  console.log(`- Total New BookCopy Records Created: ${newCopiesCreatedCount}\n`);

  process.exit(0);
}

syncBookCopies().catch((err) => {
  console.error('❌ Data synchronization failed:', err);
  process.exit(1);
});
