import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const copies = await prisma.bookCopy.findMany({
    include: {
      book: {
        select: {
          title: true
        }
      }
    }
  });

  console.log(`Total copies in DB: ${copies.length}`);
  copies.forEach(c => {
    console.log(`Copy ID: ${c.id} | Book: ${c.book?.title} | Status: ${c.status}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
