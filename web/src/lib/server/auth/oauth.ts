import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Token } from './types';

export async function createOAuthClient() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const credentialsPath = path.join(__dirname, '../../../../../config/credentials.json');
  const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf-8'));
  
  if (!credentials.web) throw new Error('Invalid credentials format');
  
  return new OAuth2Client({
    clientId: credentials.web.client_id,
    clientSecret: credentials.web.client_secret,
    redirectUri: credentials.web.redirect_uris[0]
  });
}

export async function getAuthUrl(client: OAuth2Client): Promise<string> {
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/youtube.readonly',
      'email',
      'profile',
      'openid'
    ],
    prompt: 'consent'
  });
}

export async function exchangeCodeForToken(client: OAuth2Client, code: string): Promise<Token> {
  const { tokens } = await client.getToken(code);
  
  // Create base token object
  const baseToken: Omit<Token, 'email'> = {
    access_token: tokens.access_token ?? '',
    refresh_token: tokens.refresh_token ?? '',
    scope: tokens.scope || '',
    token_type: tokens.token_type || '',
    expiry_date: tokens.expiry_date || 0,
    expires_in: 3600 // Default expiration time
  };
  
  // Get email from ID token
  let email = '';
  
  try {
    // If we have an ID token, try to get the email from it
    if (tokens.id_token) {
      const credentials = JSON.parse(await fs.readFile(path.join(process.cwd(), 'config/credentials.json'), 'utf-8'));
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: credentials.web.client_id
      });
      
      const payload = ticket.getPayload();
      if (payload?.email) {
        email = payload.email;
      }
    }
    
    // If we still don't have an email, use a default one for development
    if (!email) {
      console.warn('Could not get email from ID token, using default email for development');
      email = 'user@example.com';
    }
  } catch (error) {
    console.error('Error getting user email:', error);
    // Use a default email for development
    console.warn('Using default email for development due to error');
    email = 'user@example.com';
  }
  
  return {
    ...baseToken,
    email
  };
}

export function createYouTubeService(client: OAuth2Client) {
  return google.youtube({ version: 'v3', auth: client });
}
