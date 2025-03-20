import { PrismaClient } from '@prisma/client';
import type { Token } from '../types';

export const prisma = new PrismaClient();

export async function createUser(token: Token) {
  return prisma.user.create({
    data: {
      email: token.email,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      tokenExpiry: new Date(token.expiry_date)
    }
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email }
  });
}

export async function updateUserToken(email: string, token: Token) {
  return prisma.user.update({
    where: { email },
    data: {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      tokenExpiry: new Date(token.expiry_date)
    }
  });
}


