import { prisma } from '../db';
import { encrypt, decrypt } from '../crypto';
import type { Token, AuthStatus } from '../../types';
import type { OAuth2Client } from 'google-auth-library';
import type { Cookies } from '@sveltejs/kit';
import { createOAuthClient } from './oauth';
import { promises as fs } from 'fs';
import path from 'path';

// Import Locals from App namespace
type Locals = App.Locals;

export async function saveToken(userId: string, token: Token): Promise<void> {
  // Instead of creating a new OAuthToken record, update the User record
  await prisma.user.update({
    where: { id: userId },
    data: {
      accessToken: token.access_token,
      refreshToken: token.refresh_token || '',
      tokenExpiry: new Date(token.expiry_date)
    }
  });
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
    // Handle file not found error
    if ((error as any).code !== 'ENOENT') throw error;
  }
}

export async function checkAuthStatus(locals: Locals): Promise<AuthStatus> {
  const { user } = locals;
  
  if (!user) {
    return { authenticated: false };
  }
  
  // Get token from database using user ID
  const token = await getToken(user.id);
  
  if (!token || !isTokenValid(token)) {
    return { authenticated: false };
  }

  // Refresh token if needed
  if (needsTokenRefresh(token)) {
    try {
      const client = await createOAuthClient();
      const refreshedToken = await refreshToken(client, token);
      
      // Update the user record with the refreshed token
      await saveToken(user.id, refreshedToken);
    } catch (error) {
      console.error('Error refreshing token:', error);
      // Continue with the existing token
    }
  }

  return {
    authenticated: true,
    user: {
      email: user.email
    }
  };
}
