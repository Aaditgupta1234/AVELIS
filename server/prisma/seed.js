import { PrismaClient, UserRole, CopyStatus, CopyCondition } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Password Hashing
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);
  const memberPasswordHash = await bcrypt.hash('Member123!', 10);

  // 2. Seed Users
  console.log('  -> Seeding Users...');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@avelis.com' },
    update: {
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
    create: {
      username: 'admin',
      email: 'admin@avelis.com',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const memberUser = await prisma.user.upsert({
    where: { email: 'member@avelis.com' },
    update: {
      passwordHash: memberPasswordHash,
      role: UserRole.MEMBER,
      isActive: true,
    },
    create: {
      username: 'john_doe',
      email: 'member@avelis.com',
      passwordHash: memberPasswordHash,
      role: UserRole.MEMBER,
      isActive: true,
    },
  });

  // 3. Seed Authors
  console.log('  -> Seeding Authors...');
  const authorsData = [
    { fullName: 'J.K. Rowling', biography: 'British author best known for the Harry Potter fantasy series.' },
    { fullName: 'George Orwell', biography: 'English novelist and essayist famous for 1984 and Animal Farm.' },
    { fullName: 'J.R.R. Tolkien', biography: 'English writer, poet, philologist, and academic best known for The Lord of the Rings.' },
    { fullName: 'Jane Austen', biography: 'English novelist known primarily for her six major novels analyzing the British landed gentry.' },
    { fullName: 'F. Scott Fitzgerald', biography: 'American novelist famous for depicting the Jazz Age in The Great Gatsby.' },
  ];

  const authors = [];
  for (const authorData of authorsData) {
    const existing = await prisma.author.findFirst({ where: { fullName: authorData.fullName } });
    if (existing) {
      authors.push(existing);
    } else {
      const created = await prisma.author.create({ data: authorData });
      authors.push(created);
    }
  }

  // 4. Seed Categories
  console.log('  -> Seeding Categories...');
  const categoriesData = [
    { name: 'Fantasy', description: 'Magical and mythical worlds and characters.' },
    { name: 'Dystopian', description: 'Explorations of dark, totalitarian future societies.' },
    { name: 'Classics', description: 'Time-tested literary masterpieces.' },
    { name: 'General Fiction', description: 'Contemporary and general fictional stories.' },
    { name: 'Sci-Fi', description: 'Speculative fiction exploring futuristic concepts.' },
  ];

  const categories = [];
  for (const catData of categoriesData) {
    const cat = await prisma.category.upsert({
      where: { name: catData.name },
      update: { description: catData.description },
      create: catData,
    });
    categories.push(cat);
  }

  // Map author & category helper lookup by name
  const authorByName = (name) => authors.find((a) => a.fullName === name)?.id;
  const categoryByName = (name) => categories.find((c) => c.name === name)?.id;

  // 5. Seed Books
  console.log('  -> Seeding Books & Relations...');
  const sampleBooks = [
    {
      title: '1984',
      isbn: '978-0451524935',
      publisher: 'Secker & Warburg',
      publicationYear: 1949,
      language: 'English',
      description: 'A chilling dystopian novel depicting totalitarian government surveillance and thought control.',
      coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80',
      pdfUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
      sellingPrice: 19.99,
      stockQuantity: 15,
      authorName: 'George Orwell',
      categoryName: 'Dystopian',
    },
    {
      title: 'The Hobbit',
      isbn: '978-0547928227',
      publisher: 'George Allen & Unwin',
      publicationYear: 1937,
      language: 'English',
      description: 'The prelude to Lord of the Rings following Bilbo Baggins on an epic quest for dragon gold.',
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      pdfUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
      sellingPrice: 24.99,
      stockQuantity: 10,
      authorName: 'J.R.R. Tolkien',
      categoryName: 'Fantasy',
    },
    {
      title: 'Pride and Prejudice',
      isbn: '978-0141439518',
      publisher: 'T. Egerton',
      publicationYear: 1813,
      language: 'English',
      description: 'A classic romantic novel following Elizabeth Bennet and Fitzwilliam Darcy.',
      coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
      pdfUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
      sellingPrice: 14.99,
      stockQuantity: 8,
      authorName: 'Jane Austen',
      categoryName: 'Classics',
    },
    {
      title: 'The Great Gatsby',
      isbn: '978-0743273565',
      publisher: 'Charles Scribner Sons',
      publicationYear: 1925,
      language: 'English',
      description: 'A story of ambition, love, and tragedy in the Roaring Twenties.',
      coverImage: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=600&q=80',
      pdfUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
      sellingPrice: 16.50,
      stockQuantity: 12,
      authorName: 'F. Scott Fitzgerald',
      categoryName: 'Classics',
    },
  ];

  for (const b of sampleBooks) {
    const authorId = authorByName(b.authorName);
    const categoryId = categoryByName(b.categoryName);

    const existingBook = await prisma.book.findUnique({ where: { isbn: b.isbn } });
    if (!existingBook) {
      const createdBook = await prisma.book.create({
        data: {
          title: b.title,
          isbn: b.isbn,
          publisher: b.publisher,
          publicationYear: b.publicationYear,
          language: b.language,
          description: b.description,
          coverImage: b.coverImage,
          pdfUrl: b.pdfUrl,
          sellingPrice: b.sellingPrice,
          stockQuantity: b.stockQuantity,
          isBorrowable: true,
          isForSale: true,
          ...(authorId && {
            authors: { create: [{ authorId }] },
          }),
          ...(categoryId && {
            categories: { create: [{ categoryId }] },
          }),
        },
      });

      // Create Physical Book Copies matching stockQuantity
      const copiesData = Array.from({ length: b.stockQuantity }, (_, i) => ({
        bookId: createdBook.id,
        barcode: `BC-${b.title.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10)}-${String(i + 1).padStart(3, '0')}`,
        shelfLocation: 'Shelf A-1',
        condition: CopyCondition.NEW,
        status: CopyStatus.AVAILABLE,
      }));

      await prisma.bookCopy.createMany({
        data: copiesData,
      });
    }
  }

  console.log('✅ Seeding completed successfully!');
  console.log('------------------------------------------------');
  console.log('🔑 Admin Credentials : admin@avelis.com / Admin123!');
  console.log('🔑 Member Credentials: member@avelis.com / Member123!');
  console.log('------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
