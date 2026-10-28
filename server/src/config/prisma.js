import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

// Convert BigInt to number for JSON responses
BigInt.prototype.toJSON = function () {
  return Number(this);
};

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export default prisma;
