import { prisma } from './index';
import { Prisma } from '@prisma/client';

export async function withTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(callback);
}

export function handleDbError(error: unknown): never {
  if (error instanceof Error) {
    throw new Error(`Database error: ${error.message}`);
  }
  throw new Error('Unknown database error occurred');
}

export async function executeInTransaction<T>(
  operations: Array<Prisma.PrismaPromise<any>>,
  options?: { isolationLevel?: Prisma.TransactionIsolationLevel }
): Promise<T[]> {
  return prisma.$transaction(operations, options);
}

export function createWhereClause<T>(params: Partial<T>): Prisma.Sql {
  const conditions = Object.entries(params)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => Prisma.sql`${Prisma.raw(key)} = ${value}`);
  
  return Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
}
