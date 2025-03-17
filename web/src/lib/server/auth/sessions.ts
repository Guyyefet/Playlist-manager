import crypto from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import type { Token } from '../../types';

const COOKIE_NAME = 'session';
const CSRF_COOKIE_NAME = 'csrf_token';
const SESSION_MAX_AGE = 3600;

export function setSessionCookies(cookies: Cookies, token: Token) {
  const sessionData = JSON.stringify(token);
  cookies.set(COOKIE_NAME, Buffer.from(sessionData).toString('base64'), {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
  });
  
  cookies.set(CSRF_COOKIE_NAME, generateCsrfToken(), {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE,
    path: '/'
  });
}

export function parseSessionCookie(cookies: Cookies): Token | null {
  const cookieValue = cookies.get(COOKIE_NAME);
  if (!cookieValue) return null;
  
  try {
    return JSON.parse(Buffer.from(cookieValue, 'base64').toString());
  } catch (error) {
    console.error('Failed to parse session cookie:', error);
    return null;
  }
}

export function validateCsrfToken(cookies: Cookies, requestToken: string): boolean {
  return cookies.get(CSRF_COOKIE_NAME) === requestToken;
}

function generateCsrfToken(): string {
  return crypto.randomBytes(16).toString('hex');
}
