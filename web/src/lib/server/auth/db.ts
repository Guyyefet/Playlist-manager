import { prisma } from '../db';
import { withTransaction, handleDbError, createWhereClause } from '../db/utils';
import type { Token } from '../../types';

export async function saveToken(userId: string, token: Token): Promise<void> {
  try {
    await withTransaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          accessToken: token.access_token,
          refreshToken: token.refresh_token || '',
          tokenExpiry: new Date(token.expiry_date)
        }
      });
    });
  } catch (error) {
    handleDbError(error);
  }
}

export async function getToken(userId: string): Promise<Token | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) return null;

  return {
    access_token: user.accessToken,
    refresh_token: user.refreshToken,
    expiry_date: user.tokenExpiry.getTime(),
    email: user.email,
    expires_in: 3600, // Default value
    scope: 'https://www.googleapis.com/auth/youtube.readonly email profile openid',
    token_type: 'Bearer'
  };
}

export async function createUser(token: Token) {
  try {
    return await withTransaction(async (tx) => {
      return tx.user.create({
        data: {
          email: token.email,
          accessToken: token.access_token,
          refreshToken: token.refresh_token,
          tokenExpiry: new Date(token.expiry_date)
        }
      });
    });
  } catch (error) {
    handleDbError(error);
  }
}

export async function getUserByEmail(email: string) {
  try {
    return await prisma.user.findUnique({
      where: { email }
    });
  } catch (error) {
    handleDbError(error);
  }
}

export async function getUserById(id: string) {
  try {
    return await prisma.user.findUnique({
      where: { id }
    });
  } catch (error) {
    handleDbError(error);
  }
}

export async function updateUserToken(userId: string, token: Token) {
  try {
    return await withTransaction(async (tx) => {
      return tx.user.update({
        where: { id: userId },
        data: {
          accessToken: token.access_token,
          refreshToken: token.refresh_token,
          tokenExpiry: new Date(token.expiry_date)
        }
      });
    });
  } catch (error) {
    handleDbError(error);
  }
}

export async function deleteToken(userId: string) {
  try {
    return await withTransaction(async (tx) => {
      return tx.user.update({
        where: { id: userId },
        data: {
          accessToken: '',
          refreshToken: '',
          tokenExpiry: new Date(0) // Set to Unix epoch
        }
      });
    });
  } catch (error) {
    handleDbError(error);
  }
}
