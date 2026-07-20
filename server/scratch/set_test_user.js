import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'qa_integrator@avelis.app' },
    update: {
      role: UserRole.MEMBER,
      passwordHash,
      isActive: true
    },
    create: {
      email: 'qa_integrator@avelis.app',
      username: 'QA Integrator',
      role: UserRole.MEMBER,
      passwordHash,
      isActive: true
    }
  });
  
  console.log('Test user configured successfully:', user);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
