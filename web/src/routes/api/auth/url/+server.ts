import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getAuthUrl } from '$lib/server/auth';

export const GET: RequestHandler = async () => {
  console.log('Auth URL endpoint called');
  
  try {
    const url = await getAuthUrl();
    console.log('Generated auth URL:', url);
    
    if (!url || typeof url !== 'string' || !url.startsWith('https://')) {
      console.error('Invalid auth URL generated:', url);
      return json({ error: 'Failed to generate valid auth URL' }, { status: 500 });
    }
    
    return json({ url });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return json({ error: 'Failed to generate auth URL' }, { status: 500 });
  }
};
