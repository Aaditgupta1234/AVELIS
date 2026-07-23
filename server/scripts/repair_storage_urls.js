import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { supabase } from '../src/lib/supabase.js';

const prisma = new PrismaClient();
const isDryRun = process.argv.includes('--dry-run');

console.log('====================================================');
console.log(` AVELIS Storage Maintenance & Repair Script ${isDryRun ? '(DRY RUN)' : ''}`);
console.log('====================================================');

const extractPathFromUrl = (fileUrl, bucket) => {
  if (!fileUrl || typeof fileUrl !== 'string') return null;
  try {
    const url = new URL(fileUrl);
    const marker = `/${bucket}/`;
    const index = url.pathname.indexOf(marker);
    if (index === -1) return null;
    return url.pathname.substring(index + marker.length).replace(/^\/+/, '').replace(/\\/g, '/');
  } catch (_) {
    const marker = `${bucket}/`;
    if (fileUrl.includes(marker)) {
      const index = fileUrl.indexOf(marker);
      return fileUrl.substring(index + marker.length).replace(/^\/+/, '');
    }
    return null;
  }
};

const runRepair = async () => {
  try {
    // 1. Verify Supabase Storage Connectivity & Buckets
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      console.error('[FATAL] Failed to list Supabase Storage buckets:', bucketError.message);
      process.exit(1);
    }

    const bucketNames = Array.isArray(buckets) ? buckets.map((b) => b.name || b.id) : [];
    console.log('[Info] Available Supabase Storage buckets:', bucketNames.join(', '));

    if (!bucketNames.includes('book-covers') || !bucketNames.includes('book-pdfs')) {
      console.error('[FATAL] Required buckets ("book-covers", "book-pdfs") do not exist in Supabase Storage.');
      process.exit(1);
    }

    // 2. Fetch all books from DB
    const books = await prisma.book.findMany({
      select: {
        id: true,
        title: true,
        coverImage: true,
        coverImagePath: true,
        pdfUrl: true,
        pdfPath: true,
      },
    });

    console.log(`[Info] Scanned ${books.length} book records in database.\n`);

    let repairedCount = 0;
    let missingStorageObjects = [];
    const validCoverPaths = new Set();
    const validPdfPaths = new Set();

    for (const book of books) {
      const updates = {};
      let needsUpdate = false;

      // --- Cover Image Processing ---
      let currentCoverPath = book.coverImagePath || extractPathFromUrl(book.coverImage, 'book-covers');
      if (currentCoverPath) {
        validCoverPaths.add(currentCoverPath);
        const { data: publicUrlData } = supabase.storage.from('book-covers').getPublicUrl(currentCoverPath);
        const canonicalUrl = publicUrlData?.publicUrl;

        if (book.coverImagePath !== currentCoverPath) {
          updates.coverImagePath = currentCoverPath;
          needsUpdate = true;
        }

        if (canonicalUrl && (book.coverImage !== canonicalUrl || book.coverImage.includes('localhost'))) {
          updates.coverImage = canonicalUrl;
          needsUpdate = true;
        }
      } else if (book.coverImage && book.coverImage.includes('localhost')) {
        // Obsolete local fallback with no path
        updates.coverImage = null;
        updates.coverImagePath = null;
        needsUpdate = true;
      }

      // --- PDF Document Processing ---
      let currentPdfPath = book.pdfPath || extractPathFromUrl(book.pdfUrl, 'book-pdfs');
      if (currentPdfPath) {
        validPdfPaths.add(currentPdfPath);
        const { data: publicUrlData } = supabase.storage.from('book-pdfs').getPublicUrl(currentPdfPath);
        const canonicalUrl = publicUrlData?.publicUrl;

        if (book.pdfPath !== currentPdfPath) {
          updates.pdfPath = currentPdfPath;
          needsUpdate = true;
        }

        if (canonicalUrl && (book.pdfUrl !== canonicalUrl || book.pdfUrl.includes('localhost'))) {
          updates.pdfUrl = canonicalUrl;
          needsUpdate = true;
        }
      } else if (book.pdfUrl && book.pdfUrl.includes('localhost')) {
        // Obsolete local fallback with no path
        updates.pdfUrl = null;
        updates.pdfPath = null;
        needsUpdate = true;
      }

      if (needsUpdate) {
        repairedCount++;
        console.log(`[Repair] Book "${book.title}" (${book.id}):`, JSON.stringify(updates, null, 2));
        if (!isDryRun) {
          await prisma.book.update({
            where: { id: book.id },
            data: updates,
          });
        }
      }
    }

    console.log(`\n[Summary] Total records needing URL/path repairs: ${repairedCount}`);
    if (isDryRun) {
      console.log('[Notice] Dry-run complete. No database mutations were performed.');
    } else {
      console.log('[Success] Database repair applied successfully.');
    }

    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[FATAL] Exception occurred during repair execution:', err.message);
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
};

runRepair();
