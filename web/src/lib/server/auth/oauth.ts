import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { promises as fs } from 'fs';
import path from 'path';
import type { Token } from './types';

export async function createOAuthClient() {
  const credentialsPath = path.join(process.cwd(), '..', 'config', 'credentials.json');
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
      'https://www.googleapis.com/auth/userinfo.email',
      'profile',
      'openid',
      'https://www.googleapis.com/auth/youtube.readonly'
    ],
    prompt: 'consent',
    include_granted_scopes: true,
    // Use standard authorization code flow
    response_type: 'code'
  });
}

export async function exchangeCodeForToken(client: OAuth2Client, code: string): Promise<Token> {
  const credentials = JSON.parse(await fs.readFile(path.join(process.cwd(), '..', 'config', 'credentials.json'), 'utf-8'));
  
  console.log('Exchanging code for token...');
  
  // Exchange the authorization code for tokens
  const tokenResponse = await client.getToken({
    code,
    redirect_uri: credentials.web.redirect_uris[0]
  });
  
  const tokens = tokenResponse.tokens;
  
  console.log('Token response received:', {
    hasAccessToken: !!tokens.access_token,
    hasRefreshToken: !!tokens.refresh_token,
    hasIdToken: !!tokens.id_token,
    expiryDate: tokens.expiry_date,
    expiresIn: (tokens as any).expires_in
  });
  
  // Create base token object with proper defaults
  const expiryDate = (tokens as any).expiry_date || 
    ((tokens as any).expires_in ? Date.now() + ((tokens as any).expires_in * 1000) : Date.now() + 3600 * 1000);
  
  const baseToken: Omit<Token, 'email'> = {
    access_token: (tokens.access_token as string) ?? '',
    refresh_token: (tokens.refresh_token as string) ?? '',
    scope: (tokens.scope as string) || '',
    token_type: (tokens.token_type as string) || '',
    expiry_date: expiryDate,
    expires_in: ((tokens as any).expires_in as number) || 3600
  };
  
  // Try to get email using multiple methods
  let email = '';
  let emailSource = '';
  
  // Method 1: Try to get email from ID token
  if (tokens.id_token) {
    try {
      console.log('Attempting to verify ID token...');
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: credentials.web.client_id
      });
      
      const payload = ticket.getPayload();
      if (payload?.email) {
        console.log('Successfully extracted email from ID token');
        email = payload.email;
        emailSource = 'id_token';
        
        if (!payload.email_verified) {
          console.warn('Email not verified in ID token');
        }
      } else {
        console.warn('ID token payload does not contain email');
      }
    } catch (error) {
      console.error('Error verifying ID token:', error instanceof Error ? error.message : String(error));
    }
  } else {
    console.warn('No ID token received from OAuth flow');
  }
  
  // Method 2: If no email from ID token, try userinfo API with the main client
  if (!email && tokens.access_token) {
    try {
      console.log('Attempting to get email from userinfo API with main client...');
      
      // Set the credentials on the client
      client.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: 'https://www.googleapis.com/auth/userinfo.email profile openid',
        token_type: tokens.token_type || 'Bearer'
      });
      
      const oauth2 = google.oauth2({
        version: 'v2',
        auth: client
      });
      
      const userinfo = await oauth2.userinfo.get();
      
      if (userinfo.data?.email) {
        console.log('Successfully got email from userinfo API with main client');
        email = userinfo.data.email;
        emailSource = 'userinfo_main';
      } else {
        console.warn('Userinfo API response with main client does not contain email');
      }
    } catch (error) {
      console.error('Error getting email from userinfo API with main client:', 
        error instanceof Error ? error.message : String(error));
    }
  }
  
  // Method 3: Try with a fresh client
  if (!email && tokens.access_token) {
    try {
      console.log('Attempting to get email from userinfo API with fresh client...');
      
      // Create a fresh client
      const userInfoClient = new OAuth2Client({
        clientId: credentials.web.client_id,
        clientSecret: credentials.web.client_secret
      });
      
      userInfoClient.setCredentials({
        access_token: tokens.access_token,
        token_type: 'Bearer'
      });
      
      const oauth2 = google.oauth2({
        version: 'v2',
        auth: userInfoClient
      });
      
      const userinfo = await oauth2.userinfo.get();
      
      if (userinfo.data?.email) {
        console.log('Successfully got email from userinfo API with fresh client');
        email = userinfo.data.email;
        emailSource = 'userinfo_fresh';
      } else {
        console.warn('Userinfo API response with fresh client does not contain email');
      }
    } catch (error) {
      console.error('Error getting email from userinfo API with fresh client:', 
        error instanceof Error ? error.message : String(error));
    }
  }
  
  // Method 4: Try direct HTTP request to userinfo endpoint
  if (!email && tokens.access_token) {
    try {
      console.log('Attempting direct HTTP request to userinfo endpoint...');
      
      // Use Node.js built-in https module for direct request
      const https = await import('https');
      
      const getUserInfo = () => {
        return new Promise<string>((resolve, reject) => {
          const options = {
            hostname: 'www.googleapis.com',
            path: '/oauth2/v2/userinfo',
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${tokens.access_token}`,
              'Accept': 'application/json'
            }
          };
          
          const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
              data += chunk;
            });
            
            res.on('end', () => {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                resolve(data);
              } else {
                reject(new Error(`HTTP error: ${res.statusCode} - ${data}`));
              }
            });
          });
          
          req.on('error', (error) => {
            reject(error);
          });
          
          req.end();
        });
      };
      
      const userInfoData = await getUserInfo();
      const userInfo = JSON.parse(userInfoData);
      
      if (userInfo.email) {
        console.log('Successfully got email from direct HTTP request');
        email = userInfo.email;
        emailSource = 'direct_http';
      } else {
        console.warn('Direct HTTP response does not contain email:', userInfoData);
      }
    } catch (error) {
      console.error('Error making direct HTTP request to userinfo endpoint:', 
        error instanceof Error ? error.message : String(error));
    }
  }
  
  // Development fallback if no email found
  if (!email && process.env.NODE_ENV === 'development') {
    console.warn('Using development fallback email');
    email = process.env.DEV_USER_EMAIL!;
    emailSource = 'dev_fallback';
  }
  
  // Final check
  if (!email) {
    console.error('Failed to get user email through any available method', {
      idToken: tokens.id_token ? 'present' : 'missing',
      accessToken: !!tokens.access_token,
      tokenResponse: {
        access_token: !!tokens.access_token,
        refresh_token: !!tokens.refresh_token,
        expiry_date: tokens.expiry_date
      }
    });
    throw new Error('Could not get email from ID token, using default email for development');
  }
  
  console.log(`Successfully obtained user email via ${emailSource}`);
  
  return {
    ...baseToken,
    email
  };
}

export function createYouTubeService(client: OAuth2Client) {
  return google.youtube({ version: 'v3', auth: client });
}
