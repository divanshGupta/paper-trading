// ESM import
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // optional, helps debug
});

// optional: graceful shutdown in Docker
if (process.env.NODE_ENV === 'production') {
  process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

