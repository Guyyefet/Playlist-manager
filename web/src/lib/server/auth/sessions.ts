import crypto from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import type { Token } from '../../types';

const COOKIE_NAME = 'session';
const CSRF_COOKIE_NAME = 'csrf_token';
const SESSION_MAX_AGE = 3600;

export function setSessionCookies(cookies: Cookies, token: Token) {
  cookies.set(COOKIE_NAME, token.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE,
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
  const accessToken = cookies.get(COOKIE_NAME);
  return accessToken ? {
    access_token: accessToken,
    refresh_token: '',
    expiry_date: Date.now() + SESSION_MAX_AGE * 1000,
    email: '',
    scope: '',
    token_type: 'Bearer'
  } : null;
}

export function validateCsrfToken(cookies: Cookies, requestToken: string): boolean {
  return cookies.get(CSRF_COOKIE_NAME) === requestToken;
}

function generateCsrfToken(): string {
  return crypto.randomBytes(16).toString('hex');
}
