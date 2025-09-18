import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminCount = await prisma.admin.count();
  if (adminCount === 0) {
    const password = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'admin123', 10);
    await prisma.admin.create({
      data: {
        name: process.env.DEFAULT_ADMIN || 'Default Admin',
        email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@local.com',
        password,
        role: 'SUPER_ADMIN',
      },
    });
    console.log(`Seeded default admin: ${process.env.DEFAULT_ADMIN_EMAIL || 'admin@local.com'} / ${process.env.DEFAULT_ADMIN_PASSWORD || 'admin123'}`);
  } else {
    console.log('Admin table already has accounts, skipping seed.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
