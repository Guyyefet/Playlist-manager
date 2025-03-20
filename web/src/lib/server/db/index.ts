import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Export shared utilities
export * from './utils';
