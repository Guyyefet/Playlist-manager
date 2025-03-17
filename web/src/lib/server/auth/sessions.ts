import { prisma } from '../db';
import { v4 as uuidv4 } from 'uuid';
import type { Cookies } from '@sveltejs/kit';
import type { User } from '../../types';
import { encrypt } from '../crypto';

const COOKIE_NAME = 'session_id';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 1 week

export async function createSession(cookies: Cookies, user: User, oauthToken?: string) {
  // Generate secure session token
  const sessionToken = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  // Create database session
  await prisma.session.create({
    data: {
      token: sessionToken,
      userId: user.id,
      expiresAt
    }
  });

  // Set session cookie
  cookies.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/'
  });
}

export async function validateSession(cookies: Cookies): Promise<User | null> {
  const sessionToken = cookies.get(COOKIE_NAME);
  if (!sessionToken) return null;

  // Get session from database
  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: { user: true }
  });

  // Check if session is valid
  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session.user;
}

export async function deleteSession(cookies: Cookies) {
  const sessionToken = cookies.get(COOKIE_NAME);
  if (!sessionToken) return;

  // Delete from database
  await prisma.session.deleteMany({
    where: { token: sessionToken }
  });

  // Clear cookie
  cookies.delete(COOKIE_NAME, { path: '/' });
}
