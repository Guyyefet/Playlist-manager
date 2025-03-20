import { encrypt, decrypt } from '../crypto';
import type { Token, AuthStatus } from '../../types';
import type { OAuth2Client } from 'google-auth-library';
import { createOAuthClient } from './oauth';
import { saveToken, getToken, deleteToken } from './db';

// Import Locals from App namespace
type Locals = App.Locals;

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

export async function revokeToken(client: OAuth2Client, userId: string, token: Token) {
  await client.revokeToken(token.access_token);
  await deleteToken(userId);
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
