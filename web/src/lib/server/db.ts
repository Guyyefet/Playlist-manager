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

export async function getUserPlaylists(userId: string) {
  return prisma.playlist.findMany({
    where: { userId },
    include: { videos: true }
  });
}

export async function getVideosByStatus(status: string) {
  return prisma.video.findMany({
    where: { status }
  });
}

const VALID_STATUSES = ['pending', 'processing', 'completed', 'failed'];

export async function updateVideoStatus(videoId: string, status: string) {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  return prisma.video.update({
    where: { id: videoId },
    data: { status }
  });
}
