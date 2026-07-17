import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const authors = await prisma.author.findMany({ select: { id: true, fullName: true } });
  const categories = await prisma.category.findMany({ select: { id: true, name: true } });
  console.log('=== DATABASE SEEDED AUTHORS ===');
  console.log(JSON.stringify(authors, null, 2));
  console.log('=== DATABASE SEEDED CATEGORIES ===');
  console.log(JSON.stringify(categories, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
