import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { promises as fs } from 'fs';
import path from 'path';

import type { Token } from '../types';

interface FileSystemError extends Error {
  code: string;
}

interface Credentials {
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
}

export async function createOAuthClient() {
  const credentialsPath = path.join(process.cwd(), 'config', 'credentials.json');
  const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf-8')) as Credentials;
  
  return new OAuth2Client({
    clientId: credentials.client_id,
    clientSecret: credentials.client_secret,
    redirectUri: credentials.redirect_uris[0]
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
  const token = await getToken();
  
  if (!token || !isTokenValid(token)) {
    return { authenticated: false };
  }

  // Refresh token if needed
  if (needsTokenRefresh(token)) {
    const client = await createOAuthClient();
    const refreshedToken = await refreshToken(client, token);
    await saveToken(refreshedToken);
  }

  return {
    authenticated: true,
    user: {
      email: token.email
    }
  };
}
