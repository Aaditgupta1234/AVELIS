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
    { name: 'Fiction', description: 'Imaginative storytelling and narrative prose.' },
    { name: 'Non-Fiction', description: 'Factual accounts, essays, and educational writings.' },
    { name: 'Science', description: 'Scientific inquiry, physics, biology, and cosmos.' },
    { name: 'Technology', description: 'Software, hardware, engineering, and artificial intelligence.' },
    { name: 'Programming', description: 'Code architecture, algorithms, and software development.' },
    { name: 'Business', description: 'Economic strategy, entrepreneurship, and leadership.' },
    { name: 'Finance', description: 'Personal finance, markets, and investment principles.' },
    { name: 'Economics', description: 'Macro and microeconomic theory and global trade.' },
    { name: 'History', description: 'Historical chronicles, global events, and civilizations.' },
    { name: 'Philosophy', description: 'Ethics, metaphysics, logic, and existential inquiry.' },
    { name: 'Psychology', description: 'Human cognition, emotion, and behavioral science.' },
    { name: 'Literature', description: 'Masterworks of world literature and literary criticism.' },
    { name: 'Poetry', description: 'Verses, anthologies, and poetic compositions.' },
    { name: 'Biography', description: 'Life stories of influential thinkers and leaders.' },
    { name: 'Self Help', description: 'Personal growth, productivity, and mindfulness.' },
    { name: 'Mystery', description: 'Detective stories, investigative puzzles, and suspense.' },
    { name: 'Thriller', description: 'High-stakes suspense and psychological tension.' },
    { name: 'Crime', description: 'True crime, legal thrillers, and criminal justice.' },
    { name: 'Horror', description: 'Macabre narratives, supernatural tales, and dark fiction.' },
    { name: 'Romance', description: 'Relationships, passion, and emotional journeys.' },
    { name: 'Fantasy', description: 'Magical realms, mythical creatures, and epic quests.' },
    { name: 'Science Fiction', description: 'Futuristic technology, space exploration, and speculative worlds.' },
    { name: 'Dystopian', description: 'Totalitarian futures, societal collapses, and speculative dilemmas.' },
    { name: 'Adventure', description: 'Exploration, survival, and high-energy journeys.' },
    { name: 'Young Adult', description: 'Coming-of-age stories and adolescent fiction.' },
    { name: "Children's", description: 'Illustrated books and juvenile literature.' },
    { name: 'Comics & Graphic Novels', description: 'Visual narratives, comics, and manga.' },
    { name: 'Religion', description: 'Theology, spiritual traditions, and comparative belief.' },
    { name: 'Politics', description: 'Political theory, governance, and international relations.' },
    { name: 'Art', description: 'Visual arts, painting, sculpture, and art history.' },
    { name: 'Design', description: 'UI/UX design, typography, architecture, and aesthetics.' },
    { name: 'Education', description: 'Pedagogy, learning techniques, and academic theory.' },
    { name: 'Health', description: 'Nutrition, wellness, medicine, and human biology.' },
    { name: 'Travel', description: 'Travelogues, cultural guides, and global geography.' },
    { name: 'Classics', description: 'Time-tested literary masterpieces.' },
    { name: 'General Fiction', description: 'Contemporary and general fictional stories.' },
    { name: 'Sci-Fi', description: 'Speculative fiction exploring futuristic concepts.' },
  ];

  const categories = [];
  for (const catData of categoriesData) {
    const cat = await prisma.category.upsert({
      where: { name: catData.name },
      update: { description: catData.description, isSystem: true, isDeleted: false },
      create: { ...catData, isSystem: true },
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
