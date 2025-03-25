import { PrismaClient, type Prisma } from '@prisma/client';

export const prismaClient = new PrismaClient();
export type { Prisma };

export * from './utils';
