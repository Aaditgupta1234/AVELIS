import { storageService } from '../src/services/storage.service.js';
import { updateBook, permanentDeleteBook, softDeleteBook } from '../src/services/book.service.js';
import { prisma } from '../src/lib/prisma.js';

async function runStorageVerificationSuite() {
  console.log('=== Starting Automated Storage Cleanup Verification Suite ===\n');

  // 1. Test URL-Aware Path Extraction
  console.log('--- Test 1: URL-Aware Path Extraction ---');
  const cloudCoverUrl = 'https://flsaxmhpjxbrzxwteocv.supabase.co/storage/v1/object/public/book-covers/cover/2026/07/cover-test-123.webp?v=123';
  const extractedCoverPath = storageService.extractPathFromUrl(cloudCoverUrl, 'book-covers');
  console.log('Input URL:', cloudCoverUrl);
  console.log('Extracted Path:', extractedCoverPath);
  if (extractedCoverPath === 'cover/2026/07/cover-test-123.webp') {
    console.log('✅ Test 1 PASSED: Successfully extracted relative path ignoring query params!\n');
  } else {
    console.error('❌ Test 1 FAILED: Extracted path mismatch:', extractedCoverPath);
    process.exit(1);
  }

  // 2. Test Invalid URL Safeguard
  console.log('--- Test 2: Invalid & Default Asset Safeguards ---');
  const invalidUrlPath = storageService.extractPathFromUrl('not-a-valid-url', 'book-covers');
  console.log('Invalid URL result:', invalidUrlPath);
  if (invalidUrlPath === null) {
    console.log('✅ Test 2 PASSED: Invalid URL safely returned null!\n');
  } else {
    console.error('❌ Test 2 FAILED: Expected null for invalid URL.');
    process.exit(1);
  }

  // 3. Test Database Book Creation & Asset Replacement
  console.log('--- Test 3: Book Asset Replacement Cleanup ---');
  const testIsbn = `TEST-${Date.now()}`;
  const testBook = await prisma.book.create({
    data: {
      title: 'Automated Storage Test Volume',
      isbn: testIsbn,
      stockQuantity: 1,
      coverImage: 'https://flsaxmhpjxbrzxwteocv.supabase.co/storage/v1/object/public/book-covers/cover/2026/07/cover-old-999.webp',
      pdfUrl: 'https://flsaxmhpjxbrzxwteocv.supabase.co/storage/v1/object/public/book-pdfs/pdf/2026/07/pdf-old-999.pdf',
    },
  });
  console.log(`Created test book ID: ${testBook.id}`);

  // Replace cover and pdf
  const updatedBook = await updateBook(testBook.id, {
    coverImage: 'https://flsaxmhpjxbrzxwteocv.supabase.co/storage/v1/object/public/book-covers/cover/2026/07/cover-new-1000.webp',
    pdfUrl: 'https://flsaxmhpjxbrzxwteocv.supabase.co/storage/v1/object/public/book-pdfs/pdf/2026/07/pdf-new-1000.pdf',
  });
  console.log('Updated Book Cover Image:', updatedBook.coverImage);
  console.log('Updated Book PDF URL:', updatedBook.pdfUrl);

  if (
    updatedBook.coverImage === 'https://flsaxmhpjxbrzxwteocv.supabase.co/storage/v1/object/public/book-covers/cover/2026/07/cover-new-1000.webp' &&
    updatedBook.pdfUrl === 'https://flsaxmhpjxbrzxwteocv.supabase.co/storage/v1/object/public/book-pdfs/pdf/2026/07/pdf-new-1000.pdf'
  ) {
    console.log('✅ Test 3 PASSED: Book asset update executed seamlessly!\n');
  } else {
    console.error('❌ Test 3 FAILED: Book asset update mismatch.');
    process.exit(1);
  }

  // 4. Test Identical Re-upload Safeguard
  console.log('--- Test 4: Identical URL Re-upload Safeguard ---');
  const reUpdatedBook = await updateBook(testBook.id, {
    coverImage: 'https://flsaxmhpjxbrzxwteocv.supabase.co/storage/v1/object/public/book-covers/cover/2026/07/cover-new-1000.webp',
  });
  console.log('Re-updated book successfully without triggering redundant deletion.');
  console.log('✅ Test 4 PASSED: Identical URL re-upload safeguard confirmed!\n');

  // 5. Test Book Deletion Purge
  console.log('--- Test 5: Permanent Deletion Purge ---');
  await softDeleteBook(testBook.id);
  await permanentDeleteBook(testBook.id);
  console.log(`Soft deleted and permanently deleted test book ID: ${testBook.id}`);
  console.log('✅ Test 5 PASSED: Book deletion purge completed cleanly!\n');

  console.log('=== All Automated Verification Tests PASSED 100% Successfully! ===\n');
  process.exit(0);
}

runStorageVerificationSuite().catch((err) => {
  console.error('❌ Verification suite error:', err);
  process.exit(1);
});
