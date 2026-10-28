import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

// Convert BigInt to number for JSON responses
BigInt.prototype.toJSON = function () {
  return Number(this);
};

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.databaseUrl,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export default prisma;
