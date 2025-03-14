import { promises as fs } from 'fs';
import path from 'path';
import type { Token } from '../../types';
import type { OAuth2Client } from 'google-auth-library';
import type { Cookies, Locals } from '@sveltejs/kit';
import { parseSessionCookie, setSessionCookies } from './sessions';

declare module '@sveltejs/kit' {
  interface Locals {
    cookies: Cookies;
  }
}
import { createOAuthClient } from './oauth';

interface FileSystemError extends Error {
  code: string;
}

export async function getToken(): Promise<Token | null> {
  try {
    const tokenPath = path.join(process.cwd(), 'config', 'token.json');
    return JSON.parse(await fs.readFile(tokenPath, 'utf-8'));
  } catch (error: unknown) {
    const fsError = error as FileSystemError;
    if (fsError.code === 'ENOENT') return null;
    throw error;
  }
}

export async function saveToken(token: Token) {
  const tokenPath = path.join(process.cwd(), 'config', 'token.json');
  await fs.mkdir(path.dirname(tokenPath), { recursive: true });
  await fs.writeFile(tokenPath, JSON.stringify(token));
}

export function isTokenValid(token: Token | null): boolean {
  return !!token && token.expiry_date > Date.now();
}

export function needsTokenRefresh(token: Token | null): boolean {
  return !!token && token.expiry_date < Date.now() + 300_000;
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

export async function revokeToken(client: OAuth2Client, token: Token) {
  await client.revokeToken(token.access_token);
  const tokenPath = path.join(process.cwd(), 'config', 'token.json');
  try {
    await fs.unlink(tokenPath);
  } catch (error: unknown) {
    const fsError = error as FileSystemError;
    if (fsError.code !== 'ENOENT') throw error;
  }
}

export interface AuthStatus {
  authenticated: boolean;
  user?: {
    email: string;
  };
}

export async function checkAuthStatus(locals: Locals): Promise<AuthStatus> {
  const { cookies } = locals;
  // Get token from cookie or file
  const cookieToken = parseSessionCookie(cookies);
  const token = cookieToken || await getToken();
  
  if (!token || !isTokenValid(token)) {
    return { authenticated: false };
  }

  // Refresh token if needed
  if (needsTokenRefresh(token)) {
    const client = await createOAuthClient();
    const refreshedToken = await refreshToken(client, token);
    await saveToken(refreshedToken);
    setSessionCookies(cookies, refreshedToken);
  }

  return {
    authenticated: true,
    user: {
      email: token.email
    }
  };
}
