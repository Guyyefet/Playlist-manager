import { prismaClient } from './index';
import { Prisma } from '@prisma/client';

export async function withTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prismaClient.$transaction(callback);
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
  return prismaClient.$transaction(operations, options);
}

export function createWhereClause<T extends Record<string, any>>(params: Partial<T>): Partial<T> {
  return Object.entries(params)
    .filter(([_, value]) => value !== undefined)
    .reduce((acc, [key, value]) => {
      acc[key as keyof T] = value;
      return acc;
    }, {} as Partial<T>);
}
