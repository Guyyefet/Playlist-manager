import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { readFileSync } from 'fs';
import { join } from 'path';

const credentials = JSON.parse(
  readFileSync('/home/guy/Desktop/projects/playlist manager/config/credentials.json', 'utf-8')
);

const GOOGLE_CLIENT_ID = credentials.web.client_id;
const GOOGLE_REDIRECT_URI = 'http://localhost:5173/api/auth/callback';

export const GET: RequestHandler = async () => {
  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + 
    new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/youtube.readonly',
      access_type: 'offline',
      prompt: 'consent'
    });

  if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
    return json({ error: 'Missing required environment variables' }, { status: 500 });
  }

  return json({ url: authUrl });
};
