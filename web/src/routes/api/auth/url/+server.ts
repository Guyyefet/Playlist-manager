import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ fetch }) => {
  console.log('Auth URL endpoint called');
  
  try {
    console.log('Fetching auth URL from backend...');
    const response = await fetch('http://localhost:8080/api/auth/url');
    console.log('Backend response status:', response.status);
    
    if (!response.ok) {
      console.error('Backend returned error:', response.status, response.statusText);
      return json({ error: 'Failed to get auth URL' }, { status: response.status });
    }
    
    const data = await response.json();
    console.log('Auth URL from backend:', data);
    
    // Ensure the URL is properly formatted
    if (!data.url || typeof data.url !== 'string' || !data.url.startsWith('https://')) {
      console.error('Invalid auth URL received from backend:', data);
      return json({ error: 'Invalid auth URL received from backend' }, { status: 500 });
    }
    
    return json(data);
  } catch (error) {
    console.error('Error fetching auth URL:', error);
    return json({ error: 'Failed to get auth URL' }, { status: 500 });
  }
};
