import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';

declare module App {
  interface Locals {
    cookies: Cookies;
  }
}

import type { Token } from '../types';

interface FileSystemError extends Error {
  code: string;
}

export async function createOAuthClient() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const credentialsPath = path.join(__dirname, '../../../../config/credentials.json');
  const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf-8'));
  
  if (!credentials.web) {
    throw new Error('Invalid credentials format - missing web property');
  }
  
  if (!credentials.web.redirect_uris || !credentials.web.redirect_uris.length) {
    throw new Error('No redirect URIs configured in credentials');
  }

  return new OAuth2Client({
    clientId: credentials.web.client_id,
    clientSecret: credentials.web.client_secret,
    redirectUri: credentials.web.redirect_uris[0]
  });
}

export async function getToken(): Promise<Token | null> {
  try {
    const tokenPath = path.join(process.cwd(), 'config', 'token.json');
    const token = await fs.readFile(tokenPath, 'utf-8');
    return JSON.parse(token);
  } catch (error: unknown) {
    if (error instanceof Error) {
      const fsError = error as FileSystemError;
      if (fsError.code !== 'ENOENT') {
        console.error('Error reading token:', error);
      }
    }
    return null;
  }
}

export async function saveToken(token: Token) {
  const tokenPath = path.join(process.cwd(), 'config', 'token.json');
  await fs.mkdir(path.dirname(tokenPath), { recursive: true });
  await fs.writeFile(tokenPath, JSON.stringify(token));
}

export function isTokenValid(token: Token | null): boolean {
  if (!token) return false;
  return token.expiry_date > Date.now();
}

export function needsTokenRefresh(token: Token | null): boolean {
  if (!token) return false;
  // Refresh token if it expires within 5 minutes
  return token.expiry_date < Date.now() + 5 * 60 * 1000;
}

export async function refreshToken(client: OAuth2Client, token: Token): Promise<Token> {
  client.setCredentials(token);
  const { credentials } = await client.refreshAccessToken();
  return {
    ...token,
    access_token: credentials.access_token || token.access_token,
    expiry_date: credentials.expiry_date || token.expiry_date
  };
}

export async function createYouTubeService(token: Token) {
  const client = await createOAuthClient();
  client.setCredentials(token);
  return google.youtube({
    version: 'v3',
    auth: client
  });
}

export async function revokeToken(token: Token) {
  const client = await createOAuthClient();
  client.setCredentials(token);
  await client.revokeToken(token.access_token);
  
  // Delete token file
  const tokenPath = path.join(process.cwd(), 'config', 'token.json');
  try {
    await fs.unlink(tokenPath);
  } catch (error: unknown) {
    if (error instanceof Error) {
      const fsError = error as FileSystemError;
      if (fsError.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}

export async function getAuthUrl(): Promise<string> {
  const client = await createOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.readonly'],
    prompt: 'consent'
  });
}

export async function exchangeCodeForToken(code: string): Promise<Token> {
  const client = await createOAuthClient();
  const { tokens } = await client.getToken(code);
  
  // Get user info to properly fetch email
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token || '',
    audience: process.env.GOOGLE_CLIENT_ID
  });
  
  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw new Error('Could not retrieve email from Google authentication');
  }

  if (!tokens.refresh_token) {
    throw new Error('Google OAuth response missing refresh token');
  }

  return {
    access_token: tokens.access_token ?? '',
    refresh_token: tokens.refresh_token,
    scope: tokens.scope || '',
    token_type: tokens.token_type || '',
    expiry_date: tokens.expiry_date || 0,
    email: payload.email
  };
}

export interface AuthStatus {
  authenticated: boolean;
  user?: {
    email: string;
  };
}

export async function checkAuthStatus(locals: App.Locals): Promise<AuthStatus> {
  // Get token from cookie or file
  const cookieToken = parseSessionCookie(locals.cookies);
  const token = cookieToken || await getToken();
  
  if (!token || !isTokenValid(token)) {
    return { authenticated: false };
  }

  // Refresh token if needed
  if (needsTokenRefresh(token)) {
    const client = await createOAuthClient();
    const refreshedToken = await refreshToken(client, token);
    await saveToken(refreshedToken);
    setSessionCookie(locals.cookies, refreshedToken);
  }

  return {
    authenticated: true,
    user: {
      email: token.email
    }
  };
}

// Cookie handling utilities
const COOKIE_NAME = 'session';
const CSRF_COOKIE_NAME = 'csrf_token';
const SESSION_MAX_AGE = 3600; // 1 hour

function setSessionCookie(cookies: Cookies, token: Token) {
  cookies.set(COOKIE_NAME, token.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE,
    path: '/'
  });
  
  // Set CSRF token as separate cookie
  const csrfToken = generateCsrfToken();
  cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE,
    path: '/'
  });
}

function parseSessionCookie(cookies: Cookies): Token | null {
  const accessToken = cookies.get(COOKIE_NAME);
  if (!accessToken) return null;

  return {
    access_token: accessToken,
    refresh_token: '', // Only stored in token.json
    expiry_date: Date.now() + SESSION_MAX_AGE * 1000,
    email: '',
    scope: '',
    token_type: 'Bearer'
  };
}

function generateCsrfToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function validateCsrfToken(cookies: Cookies, requestToken: string): boolean {
  const csrfToken = cookies.get(CSRF_COOKIE_NAME);
  return csrfToken === requestToken;
}
