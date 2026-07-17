import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'qa_integrator@avelis.app';
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const updated = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    });
    console.log('Upgraded existing user to ADMIN:', updated.email);
  } else {
    const created = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        username: 'QA Integrator',
        role: 'ADMIN'
      }
    });
    console.log('Created new ADMIN user:', created.email);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
