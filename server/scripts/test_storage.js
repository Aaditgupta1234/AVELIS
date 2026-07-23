import 'dotenv/config';
import { storageService, initializeStorageService } from '../src/services/storage.service.js';
import { ApiError } from '../src/utils/ApiError.js';

const runTests = async () => {
  console.log('====================================================');
  console.log(' AVELIS Supabase Storage Integration Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(`✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${title}`);
      failed++;
    }
  };

  // Test 1: Read-Only Startup Verification
  try {
    await initializeStorageService();
    assert(true, 'Test 1: Read-only startup verification succeeded.');
  } catch (err) {
    assert(false, `Test 1: Startup verification failed: ${err.message}`);
  }

  // Test 2: Valid Image Upload to Supabase Storage
  let uploadResult = null;
  try {
    const dummyImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    uploadResult = await storageService.upload(
      'book-covers',
      dummyImageBuffer,
      'image/png',
      'test-cover.png'
    );

    assert(
      uploadResult &&
        uploadResult.fileUrl.startsWith('https://') &&
        uploadResult.coverImagePath.includes('book-covers/'),
      'Test 2: Valid image upload returned valid Supabase CDN URL & storage path.'
    );
  } catch (err) {
    assert(false, `Test 2: Upload failed: ${err.message}`);
  }

  // Test 3: Rejection of Invalid MIME Type
  try {
    await storageService.upload(
      'book-covers',
      Buffer.from('executable content'),
      'application/x-msdownload',
      'malicious.exe'
    );
    assert(false, 'Test 3: Invalid MIME type should have been rejected.');
  } catch (err) {
    assert(
      err instanceof ApiError && err.statusCode === 400,
      `Test 3: Invalid MIME type rejected correctly with 400 Bad Request (${err.message}).`
    );
  }

  // Test 4: Rejection of Invalid Extension
  try {
    await storageService.upload(
      'book-covers',
      Buffer.from('script content'),
      'image/png',
      'script.js'
    );
    assert(false, 'Test 4: Invalid file extension should have been rejected.');
  } catch (err) {
    assert(
      err instanceof ApiError && err.statusCode === 400,
      `Test 4: Invalid file extension rejected correctly (${err.message}).`
    );
  }

  // Test 5: Rejection of Oversized File
  try {
    const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024); // 6 MB (Max is 5 MB)
    await storageService.upload('book-covers', oversizedBuffer, 'image/jpeg', 'large.jpg');
    assert(false, 'Test 5: Oversized cover image should have been rejected.');
  } catch (err) {
    assert(
      err instanceof ApiError && err.statusCode === 400,
      `Test 5: Oversized file rejected correctly (${err.message}).`
    );
  }

  // Test 6: Delete Object from Supabase Storage
  if (uploadResult && uploadResult.path) {
    try {
      const deleteResult = await storageService.delete('book-covers', uploadResult.path);
      assert(deleteResult.success, 'Test 6: Storage object deletion succeeded cleanly.');
    } catch (err) {
      assert(false, `Test 6: Storage deletion failed: ${err.message}`);
    }
  } else {
    assert(false, 'Test 6: Skipped because upload test failed.');
  }

  // Test 7: Public URL Extraction Helper
  const sampleCdnUrl =
    'https://flsaxmhpjxbrzxwteocv.supabase.co/storage/v1/object/public/book-covers/book-covers/2026/07/cover-uuid-123.png';
  const extractedPath = storageService.extractPathFromUrl(sampleCdnUrl, 'book-covers');
  assert(
    extractedPath === 'book-covers/2026/07/cover-uuid-123.png',
    `Test 7: URL path extraction extracted path correctly (${extractedPath}).`
  );

  console.log('\n====================================================');
  console.log(` Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  process.exit(failed === 0 ? 0 : 1);
};

runTests();
