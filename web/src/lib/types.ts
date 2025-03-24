import type { User as PrismaUser } from '@prisma/client';

export type User = PrismaUser;
export interface PageData {
  user?: PrismaUser;
}

export interface TestUser {
  id: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}
